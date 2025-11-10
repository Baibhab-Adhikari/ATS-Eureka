import asyncio
from datetime import datetime
from typing import List

from fastapi import (Depends, FastAPI, File, Form, HTTPException, Request,
                     UploadFile)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from auth import add_auth_routes, get_current_user
from db import get_db  # type: ignore
from helpers import (MAX_REQUESTS, MAX_REQUESTS_FREE, check_rate_limit_demo,
                     check_rate_limit_free_users, extract_text_from_file,
                     get_client_identifier, get_llm_response,
                     parse_llm_response)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Custom Exception Handler for Validation Errors


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # For simplicity, we'll format the first error message.
    first_error = exc.errors()[0]

    # Get the internal name of the field that failed validation
    field_name = str(first_error['loc'][-1])

    # Map internal field names to user-friendly descriptions
    field_map = {
        "file": "Candidate CV",
        "jd_file": "Job Description file",
        "candidates": "at least one Candidate CV"
    }

    user_friendly_name = field_map.get(field_name, f"the '{field_name}' field")

    # Create a more specific error message
    if first_error['type'] == 'missing':
        error_message = f"Missing required input: Please provide the {user_friendly_name}."
    else:
        # A fallback for other types of validation errors (e.g., wrong data type)
        error_message = f"Invalid input for {user_friendly_name}. {first_error['msg']}"

    return JSONResponse(
        status_code=422,
        content={"detail": error_message},
    )


# Adding auth routes
add_auth_routes(app)

# API Routes


@app.get("/")
def home():
    return {"message": "Hello, FastAPI on AWS!"}


@app.post("/api/employee", response_class=JSONResponse)
async def process_employee(
    file: UploadFile = File(...),
    jd_text: str = Form(None),
    jd_file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
    remaining_requests: int = Depends(check_rate_limit_free_users)
):
    """API endpoint for CV evaluation based on the given JD."""
    # Validate inputs
    if not jd_text and not jd_file:
        raise HTTPException(
            status_code=400,
            detail="No JD provided. Please provide JD text or JD file."
        )

    if not file:
        raise HTTPException(
            status_code=400,
            detail="No CV Provided. Please upload CV file (Docx or PDF)."
        )

    try:
        # Asynchronously extract text from files
        cv_text = await extract_text_from_file(file)
        jd_text_final = ""
        if jd_file:
            jd_text_final = await extract_text_from_file(jd_file)
        elif jd_text:
            jd_text_final = jd_text

        if not jd_text_final:
            raise HTTPException(
                status_code=400, detail="No job description provided.")

        # Construct the consistent, chain-of-thought LLM prompt
        prompt = f"""
You are a highly precise and analytical AI recruitment assistant. Your task is to evaluate a candidate's CV against a job description (JD) with methodical accuracy.

Follow these steps exactly:
1.  First, break down the JD into a list of 5 to 8 of the most critical, distinct requirements. These can be skills, years of experience, or educational qualifications.
2.  For each requirement, check the CV for evidence.
3.  Calculate the "JD-Match" score as an integer percentage based on this formula: (Number of requirements met / Total number of requirements) * 100.
4.  List the key requirements from your list in step 1 that are clearly missing from the CV.
5.  Write a brief, objective "Profile Summary" of the candidate's suitability.

Return your response strictly as a valid JSON object with these exact keys: "JD-Match", "Missing Skills", "Profile Summary".

CV:
{cv_text}

JD:
{jd_text_final}
"""

        # Await the asynchronous LLM call
        llm_response = await get_llm_response(prompt)
        parsed_llm_response = parse_llm_response(llm_response)

        # Store data in MongoDB
        db = get_db()
        result_data = {
            "user_id": current_user["_id"],
            "user_type": "employee",
            "cv_filename": file.filename,
            "jd_text": jd_text_final,
            "analysis_result": parsed_llm_response,
            "created_at": datetime.now(),
        }
        await db.history.insert_one(result_data)

        # Add rate limit information to response
        parsed_llm_response["rate_limit"] = {
            "remaining_requests": remaining_requests,
            "max_requests": MAX_REQUESTS_FREE,
            "reset_after_hours": 24
        }

        return JSONResponse(content=parsed_llm_response)

    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"An unexpected error occurred: {str(e)}"})


@app.post("/api/employer", response_class=JSONResponse)
async def process_employer(
    jd_text: str = Form(None),
    jd_file: UploadFile = File(None),
    candidates: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    remaining_requests: int = Depends(check_rate_limit_free_users)
):
    """
    Process a batch of CVs against a single JD for an authenticated employer.
    """
    try:
        # Asynchronously extract text from JD file
        jd_text_final = ""
        if jd_file:
            jd_text_final = await extract_text_from_file(jd_file)
        elif jd_text:
            jd_text_final = jd_text

        if not jd_text_final:
            raise HTTPException(
                status_code=400, detail="No job description provided.")

        # Helper coroutine to process a single CV
        async def analyze_candidate(cv_file: UploadFile):
            try:
                cv_text = await extract_text_from_file(cv_file)
                prompt = f"""
You are a highly precise and analytical AI recruitment assistant. Your task is to evaluate a candidate's CV against a job description (JD) with methodical accuracy.

Follow these steps exactly:
1.  First, break down the JD into a list of 5 to 8 of the most critical, distinct requirements. These can be skills, years of experience, or educational qualifications.
2.  For each requirement, check the CV for evidence.
3.  Calculate the "JD-Match" score as an integer percentage based on this formula: (Number of requirements met / Total number of requirements) * 100.
4.  List the key requirements from your list in step 1 that are clearly missing from the CV.
5.  Write a brief, objective "Profile Summary" of the candidate's suitability.

Return your response strictly as a valid JSON object with these exact keys: "JD-Match", "Missing Skills", "Profile Summary".

CV:
{cv_text}

JD:
{jd_text_final}
"""
                llm_response = await get_llm_response(prompt)
                parsed_response = parse_llm_response(llm_response)
                return {
                    "cv_filename": cv_file.filename,
                    "analysis": parsed_response
                }
            except Exception as e:
                print(f"Failed to process {cv_file.filename}: {e}")
                return {
                    "cv_filename": cv_file.filename,
                    "analysis": {"error": f"Failed to process this CV: {str(e)}"}
                }

        # Create a list of analysis tasks and run them concurrently
        tasks = [analyze_candidate(cv_file) for cv_file in candidates]
        all_results = await asyncio.gather(*tasks)

        # Sort results by JD-Match score in descending order
        all_results.sort(
            key=lambda x: x.get("analysis", {}).get("JD-Match", 0), reverse=True)

        # Store data in MongoDB
        db = get_db()
        result_data = {
            "user_id": current_user["_id"],
            "user_type": "employer",
            "jd_text": jd_text_final,
            "batch_results": all_results,
            "created_at": datetime.now(),
        }
        await db.history.insert_one(result_data)

        # Add rate limit information to response
        final_response = {
            "ranked_candidates": all_results,
            "rate_limit": {
                "remaining_requests": remaining_requests,
                "max_requests": MAX_REQUESTS_FREE,
                "reset_after_hours": 24
            }
        }

        return JSONResponse(content=final_response)

    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"An unexpected error occurred: {str(e)}"})


@app.post("/api/demo", response_class=JSONResponse)
async def demo(
    file: UploadFile = File(...),
    jd_file: UploadFile = File(...),
    remaining_requests: int = Depends(check_rate_limit_demo)
):
    """Demo API for JD-CV matching with rate limiting"""
    # validation of uploaded files
    if not jd_file:
        raise HTTPException(
            status_code=400,
            detail="No JD Provided. Please upload JD file (Docx or PDF)."
        )
    if not file:
        raise HTTPException(
            status_code=400,
            detail="No CV Provided. Please upload CV file (Docx or PDF)."
        )

    try:
        # Extract text from uploaded CV (Async)
        cv_text = await extract_text_from_file(file)

        # Extract text from JD file

        jd_text_final = await extract_text_from_file(jd_file)

        # Construct LLM prompt
        prompt = f"""
You are a highly precise and analytical AI recruitment assistant. Your task is to evaluate a candidate's CV against a job description (JD) with methodical accuracy.

Follow these steps exactly:
1.  First, break down the JD into a list of 5 to 8 of the most critical, distinct requirements. These can be skills, years of experience, or educational qualifications.
2.  For each requirement, check the CV for evidence.
3.  Calculate the "JD-Match" score as an integer percentage based on this formula: (Number of requirements met / Total number of requirements) * 100.
4.  List the key requirements from your list in step 1 that are clearly missing from the CV.
5.  Write a brief, objective "Profile Summary" of the candidate's suitability.

Return your response strictly as a valid JSON object with these exact keys: "JD-Match", "Missing Skills", "Profile Summary".

CV:
{cv_text}

JD:
{jd_text_final}
"""

        # Generate LLM response
        llm_response = await get_llm_response(prompt)
        parsed_llm_response = parse_llm_response(llm_response)

        # Add rate limit information to response
        response_content = parsed_llm_response.copy()
        response_content["rate_limit"] = {
            "remaining_requests": remaining_requests,
            "max_requests": MAX_REQUESTS,
            "reset_after_hours": 24
        }

        return JSONResponse(
            status_code=200,
            content=response_content
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )


# Profile API endpoints

@app.get("/api/profile", response_class=JSONResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the profile details of the currently authenticated user (employee or employer).
    Returns different fields based on the user type.
    """
    try:
        # Get the user type and create a sanitized response
        user_type = current_user.get("user_type")

        if user_type == "employee":
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": str(current_user.get("_id", "")),
                    "full_name": current_user.get("full_name", ""),
                    "email": current_user.get("email", ""),
                    "user_type": "employee",
                    "created_at": current_user.get("created_at", "").isoformat() if isinstance(current_user.get("created_at"), datetime) else str(current_user.get("created_at", "")),
                    "is_active": current_user.get("is_active", True)
                }
            )
        elif user_type == "employer":
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": str(current_user.get("_id", "")),
                    "company_name": current_user.get("company_name", ""),
                    "email": current_user.get("email", ""),
                    "user_type": "employer",
                    "created_at": current_user.get("created_at", "").isoformat() if isinstance(current_user.get("created_at"), datetime) else str(current_user.get("created_at", "")),
                    "is_active": current_user.get("is_active", True)
                }
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid user type")

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving profile: {str(e)}")


@app.get("/api/profile/history", response_class=JSONResponse)
async def get_user_history(current_user: dict = Depends(get_current_user)):
    """
    Get the upload history for the currently authenticated user.
    Returns different collections based on user type.
    """
    try:
        db = get_db()
        user_type = current_user.get("user_type")
        user_id = str(current_user.get("_id", ""))

        if user_type == "employee":
            # Get employee's CV upload history
            uploads = await db.history.find(
                {"user_id": current_user["_id"]}
            ).sort("created_at", -1).to_list(length=20)

            # Convert ObjectId to string for JSON serialization
            formatted_uploads = []
            for upload in uploads:
                formatted_uploads.append({
                    "_id": str(upload["_id"]),
                    "cv_filename": upload.get("cv_filename", ""),
                    "jd_text": upload.get("jd_text", "")[:100] + "..." if len(upload.get("jd_text", "")) > 100 else upload.get("jd_text", ""),
                    "analysis_result": upload.get("analysis_result", {}),
                    "created_at": upload["created_at"].isoformat()
                })

            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "user_type": "employee",
                    "history": formatted_uploads
                }
            )

        elif user_type == "employer":
            employer_jobs = await db.history.find(
                {"user_id": current_user["_id"]}  # Use the ObjectId directly
            ).sort("created_at", -1).to_list(length=20)

            # Format the results
            formatted_jobs = []
            for job in employer_jobs:
                batch_results = job.get("batch_results", [])
                candidate_count = len(batch_results)

                # Create a summary list of candidates with their scores
                candidates_summary = []
                for candidate in batch_results:
                    # Check if 'analysis' exists and is a dictionary before accessing 'JD-Match'
                    analysis = candidate.get("analysis", {})
                    if isinstance(analysis, dict):
                        score = analysis.get("JD-Match")
                    else:
                        score = None  # Or some other default value for errors

                    candidates_summary.append({
                        "cv_filename": candidate.get("cv_filename"),
                        "score": score
                    })

                formatted_jobs.append({
                    "job_id": str(job["_id"]),
                    "jd_text": job.get("jd_text", "")[:100] + "..." if len(job.get("jd_text", "")) > 100 else job.get("jd_text", ""),
                    "candidate_count": candidate_count,
                    "created_at": job["created_at"].isoformat(),
                    "candidates": candidates_summary  # Added the candidate summary to the response
                })

            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "user_type": "employer",
                    "history": formatted_jobs
                }
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid user type")

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving history: {str(e)}")
