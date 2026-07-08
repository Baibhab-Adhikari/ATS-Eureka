from helpers import (MAX_REQUESTS, MAX_REQUESTS_FREE, check_rate_limit_demo,
                     check_rate_limit_free_users, extract_text_from_file,
                     get_client_identifier, get_llm_response,
                     parse_llm_response)
from models import ResumeModel, ApplicationModel, EmployeeProfileUpdateModel, EmployerProfileUpdateModel, TailorResumeRequest, ExportRequest, InterviewPrepRequest
from services import process_resume_tailoring, interview_service, dashboard_service
from services.export_service import markdown_to_pdf, markdown_to_docx
from services.storage_service import LocalStorageProvider
from db import get_db  # type: ignore
from auth import add_auth_routes, get_current_user
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi import (Depends, FastAPI, File, Form, HTTPException, Request,
                     UploadFile)
import asyncio
import logging
import time
from datetime import datetime
from typing import List

from services.storage_service import LocalStorageProvider
from services.resume_service import ResumeService
from services.application_service import ApplicationService
from services.jd_service import JdService
from services.employer_analysis_service import EmployerAnalysisService
from services.ranking_service import RankingService
from services.summary_service import SummaryService
from services.hr_dashboard_service import HrDashboardService

# Configure logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Initialize FastAPI app
app = FastAPI()

# Initialize services
storage_provider = LocalStorageProvider()
resume_service = ResumeService(storage_provider)
application_service = ApplicationService()
jd_service = JdService()
employer_analysis_service = EmployerAnalysisService()
ranking_service = RankingService()
summary_service = SummaryService()
hr_dashboard_service = HrDashboardService()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = '{0:.2f}'.format(process_time)
    logger.info(
        f"{request.method} {request.url.path} - Status: {response.status_code} - {formatted_process_time}ms")
    return response

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

# Resume Routes
@app.post("/api/resumes")
async def create_resume(
    title: str = Form(...),
    tags: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    tag_list = [t.strip() for t in tags.split(',')] if tags else []
    return await resume_service.create_resume(str(current_user["_id"]), file, title, tag_list)

@app.get("/api/resumes")
async def get_resumes(current_user: dict = Depends(get_current_user)):
    return await resume_service.get_resumes_by_user(str(current_user["_id"]))

@app.get("/api/resumes/{resume_id}")
async def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    return await resume_service.get_resume(resume_id, str(current_user["_id"]))

@app.get("/api/resumes/{resume_id}/download")
async def download_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    resume = await resume_service.get_resume(resume_id, str(current_user["_id"]))
    return FileResponse(path=resume.file_path, filename=resume.file_name, media_type=resume.mime_type)

@app.delete("/api/resumes/{resume_id}")
async def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    await resume_service.delete_resume(resume_id, str(current_user["_id"]))
    return {"message": "Resume deleted successfully"}

@app.put("/api/resumes/{resume_id}")
async def update_resume(resume_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    return await resume_service.update_resume(resume_id, str(current_user["_id"]), update_data)

# Application Routes
@app.post("/api/applications")
async def create_application(app_data: dict, current_user: dict = Depends(get_current_user)):
    return await application_service.create_application(str(current_user["_id"]), app_data)

@app.get("/api/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    try:
        return await dashboard_service.get_dashboard_data(str(current_user["_id"]))
    except Exception as e:
        logger.error(f"Dashboard API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications")
async def get_applications(current_user: dict = Depends(get_current_user)):
    return await application_service.get_applications_by_user(str(current_user["_id"]))

@app.get("/api/applications/{app_id}")
async def get_application(app_id: str, current_user: dict = Depends(get_current_user)):
    return await application_service.get_application(app_id, str(current_user["_id"]))

@app.put("/api/applications/{app_id}")
async def update_application(app_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    return await application_service.update_application(app_id, str(current_user["_id"]), update_data)

@app.delete("/api/applications/{app_id}")
async def delete_application(app_id: str, current_user: dict = Depends(get_current_user)):
    await application_service.delete_application(app_id, str(current_user["_id"]))
    return {"message": "Application deleted successfully"}


@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/employee", response_class=JSONResponse)
async def process_employee(
    file: UploadFile = File(None),
    resume_id: str = Form(None),
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

    if not file and not resume_id:
        raise HTTPException(
            status_code=400,
            detail="No CV Provided. Please upload CV file or select an existing resume."
        )

    try:
        cv_text = ""
        cv_filename = ""
        if resume_id:
            # Fetch resume text from DB
            resume = await resume_service.get_resume(resume_id, str(current_user["_id"]))
            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            cv_text = resume.resume_text
            cv_filename = getattr(resume, "title", "Existing Resume")
        else:
            # Asynchronously extract text from files
            cv_text = await extract_text_from_file(file)
            cv_filename = file.filename
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
1. First, perform a semantic compatibility check. If the candidate's CV has 0% overlap with the core requirements of the JD (e.g., completely different industry and skills), set `is_compatible` to false and provide a concise `compatibility_warning`. Otherwise, set `is_compatible` to true.
2. Break down the JD into a list of 5 to 8 critical distinct requirements (skills, years of experience, or educational qualifications).
3. For each requirement, determine if it is a "critical" requirement (must-have) or an "optional" requirement (nice-to-have).
4. Check the CV for evidence of each requirement.
5. Score each requirement from 0 to 5 (0 = completely missing, 5 = perfect match).
6. List the key requirements that are clearly missing from the CV.
7. Write a brief, objective "Profile Summary" of the candidate's suitability.

Return your response STRICTLY as a valid JSON object with these exact keys:
- "is_compatible": A boolean.
- "compatibility_warning": A string (empty if compatible).
- "Evaluation": A list of objects, each with keys "requirement" (string), "critical" (boolean), "score" (integer 0-5).
- "Missing Skills": A list of strings.
- "Profile Summary": A string.

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
            "cv_filename": cv_filename,
            "jd_text": jd_text_final,
            "analysis_result": parsed_llm_response,
            "created_at": datetime.now(),
        }
        if resume_id:
            from bson import ObjectId
            result_data["resume_id"] = ObjectId(resume_id)
            
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
        logger.error(f"Error in process_employee: {str(e)}", exc_info=True)
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
1. First, perform a semantic compatibility check. If the candidate's CV has 0% overlap with the core requirements of the JD (e.g., completely different industry and skills), set `is_compatible` to false and provide a concise `compatibility_warning`. Otherwise, set `is_compatible` to true.
2. Break down the JD into a list of 5 to 8 critical distinct requirements (skills, years of experience, or educational qualifications).
3. For each requirement, determine if it is a "critical" requirement (must-have) or an "optional" requirement (nice-to-have).
4. Check the CV for evidence of each requirement.
5. Score each requirement from 0 to 5 (0 = completely missing, 5 = perfect match).
6. List the key requirements that are clearly missing from the CV.
7. Write a brief, objective "Profile Summary" of the candidate's suitability.

Return your response STRICTLY as a valid JSON object with these exact keys:
- "is_compatible": A boolean.
- "compatibility_warning": A string (empty if compatible).
- "Evaluation": A list of objects, each with keys "requirement" (string), "critical" (boolean), "score" (integer 0-5).
- "Missing Skills": A list of strings.
- "Profile Summary": A string.

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
                logger.error(
                    f"Failed to process {cv_file.filename}: {e}", exc_info=True)
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
1. Break down the JD into a list of 5 to 8 critical distinct requirements (skills, years of experience, or educational qualifications).
2. For each requirement, determine if it is a "critical" requirement (must-have) or an "optional" requirement (nice-to-have).
3. Check the CV for evidence of each requirement.
4. Score each requirement from 0 to 5 (0 = completely missing, 5 = perfect match).
5. List the key requirements that are clearly missing from the CV.
6. Write a brief, objective "Profile Summary" of the candidate's suitability.

Return your response STRICTLY as a valid JSON object with these exact keys:
- "Evaluation": A list of objects, each with keys "requirement" (string), "critical" (boolean), "score" (integer 0-5).
- "Missing Skills": A list of strings.
- "Profile Summary": A string.

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

@app.get("/api/employee/profile", response_class=JSONResponse)
async def get_employee_profile(current_user: dict = Depends(get_current_user)):
    """Get the profile details of the employee."""
    try:
        if current_user.get("user_type") != "employee":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        return JSONResponse(
            status_code=200,
            content={
                "user_id": str(current_user.get("_id", "")),
                "full_name": current_user.get("full_name", ""),
                "email": current_user.get("email", ""),
                "user_type": "employee",
                "created_at": current_user.get("created_at", "").isoformat() if isinstance(current_user.get("created_at"), datetime) else str(current_user.get("created_at", "")),
                "is_active": current_user.get("is_active", True),
                "skills": current_user.get("skills", ""),
                "employment_status": current_user.get("employment_status", "")
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving profile: {str(e)}")

@app.get("/api/employer/profile", response_class=JSONResponse)
async def get_employer_profile(current_user: dict = Depends(get_current_user)):
    """Get the profile details of the employer."""
    try:
        if current_user.get("user_type") != "employer":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        return JSONResponse(
            status_code=200,
            content={
                "user_id": str(current_user.get("_id", "")),
                "full_name": current_user.get("full_name", ""),
                "company_name": current_user.get("company_name", ""),
                "company_address": current_user.get("company_address", ""),
                "about_company": current_user.get("about_company", ""),
                "email": current_user.get("email", ""),
                "user_type": "employer",
                "created_at": current_user.get("created_at", "").isoformat() if isinstance(current_user.get("created_at"), datetime) else str(current_user.get("created_at", "")),
                "is_active": current_user.get("is_active", True)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving profile: {str(e)}")

@app.post("/api/resume/tailor")
async def tailor_resume_api(
    resume_id: str = Form(...),
    jd_text: str = Form(None),
    jd_file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    jd_content = jd_text
    if jd_file:
        jd_content = await extract_text_from_file(jd_file)
        
    request = TailorResumeRequest(resume_id=resume_id, job_description=jd_content or "")
    return await process_resume_tailoring(request, str(current_user["_id"]), resume_service)


@app.put("/api/employee/profile")
async def update_employee_profile(
    update_data: EmployeeProfileUpdateModel,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user.get("user_type") != "employee":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        db = get_db()
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if not update_dict:
            return {"message": "No data to update"}
            
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_dict}
        )
        return {"message": "Employee profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


@app.put("/api/employer/profile")
async def update_employer_profile(
    update_data: EmployerProfileUpdateModel,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user.get("user_type") != "employer":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        db = get_db()
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if not update_dict:
            return {"message": "No data to update"}
            
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_dict}
        )
        return {"message": "Employer profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")



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

@app.post("/api/resume/export")
async def export_resume(request: ExportRequest, user_id: str = Depends(get_current_user)):
    """Export tailored resume to PDF or DOCX."""
    try:
        if request.format == 'pdf':
            pdf_io = markdown_to_pdf(request.markdown_text)
            return StreamingResponse(
                pdf_io, 
                media_type="application/pdf", 
                headers={"Content-Disposition": "attachment; filename=tailored_resume.pdf"}
            )
        elif request.format == 'docx':
            docx_io = markdown_to_docx(request.markdown_text)
            return StreamingResponse(
                docx_io,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": "attachment; filename=tailored_resume.docx"}
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")
    except Exception as e:
        logger.error(f"Error exporting resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export resume")

@app.post("/api/interview/prep")
async def generate_interview_prep(
    resume_id: str = Form(...),
    jd_text: str = Form(None),
    jd_file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Generate tailored interview questions based on Resume and Job Description."""
    try:
        # 1. Fetch the user's resume text
        resume = await resume_service.get_resume(resume_id, str(current_user["_id"]))
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # 2. Get JD text
        if jd_file:
            jd_text = await extract_text_from_file(jd_file)
            
        if not jd_text:
            raise HTTPException(status_code=400, detail="Either JD text or JD file is required")
            
        # 3. Call the interview service
        return await interview_service.process_interview_prep(resume.resume_text, jd_text)
    except Exception as e:
        logger.error(f"Error generating interview prep: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Employer Module Routes

@app.post("/api/employer/jds")
async def create_jd(jd_data: dict, current_user: dict = Depends(get_current_user)):
    return await jd_service.create_jd(str(current_user["_id"]), jd_data)

@app.get("/api/employer/jds")
async def get_jds(current_user: dict = Depends(get_current_user)):
    return await jd_service.get_jds_by_user(str(current_user["_id"]))

@app.get("/api/employer/jds/{jd_id}")
async def get_jd(jd_id: str, current_user: dict = Depends(get_current_user)):
    return await jd_service.get_jd(jd_id, str(current_user["_id"]))

@app.put("/api/employer/jds/{jd_id}")
async def update_employer_jd(jd_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_type") != "employer":
        raise HTTPException(status_code=403, detail="Forbidden")
    return await jd_service.update_jd(jd_id, str(current_user["_id"]), update_data)

@app.post("/api/employer/jds/parse")
async def parse_employer_jd_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("user_type") != "employer":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    extracted_text = await extract_text_from_file(file)
    parsed_data = await jd_service.parse_jd_from_text(extracted_text)
    
    # Save the JD file to local storage permanently
    try:
        jd_storage = LocalStorageProvider(base_dir="uploads/jds")
        await file.seek(0)
        import uuid
        ext = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = await jd_storage.save(file.file, unique_filename)
        # We can add this file path to the parsed data so the frontend can store it
        parsed_data["file_path"] = file_path
    except Exception as e:
        logger.error(f"Failed to save JD file: {str(e)}")

    return parsed_data


@app.delete("/api/employer/jds/{jd_id}")
async def delete_jd(jd_id: str, current_user: dict = Depends(get_current_user)):
    return await jd_service.delete_jd(jd_id, str(current_user["_id"]))

@app.post("/api/employer/analyze-batch")
async def batch_analyze_files(
    jd_id: str = Form(...),
    cv_files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("user_type") != "employer":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    user_id = str(current_user["_id"])
    
    # 1. Save all CV files permanently
    resume_ids = []
    for file in cv_files:
        try:
            # We pass file, title=filename, tags=["Employer Upload"]
            resume = await resume_service.create_resume(user_id, file, file.filename, ["Employer Upload"])
            resume_ids.append(resume.id)
        except Exception as e:
            logger.error(f"Failed to save CV {file.filename}: {str(e)}")
            continue
            
    if not resume_ids:
        raise HTTPException(status_code=400, detail="Failed to upload any CVs")
        
    # 2. Run batch analysis
    results = await employer_analysis_service.analyze_batch(user_id, jd_id, resume_ids)
    
    # Return rankings
    return await ranking_service.get_candidates_for_jd(jd_id, user_id)

@app.post("/api/employer/analyze")
async def batch_analyze(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    jd_id = payload.get("jd_id")
    resume_ids = payload.get("resume_ids", [])
    if not jd_id or not resume_ids:
        raise HTTPException(status_code=400, detail="jd_id and resume_ids are required")
    return await employer_analysis_service.analyze_batch(str(current_user["_id"]), jd_id, resume_ids)

@app.get("/api/employer/analysis/{jd_id}")
async def get_ranked_candidates(jd_id: str, current_user: dict = Depends(get_current_user)):
    return await ranking_service.get_candidates_for_jd(jd_id, str(current_user["_id"]))

@app.put("/api/employer/analysis/{analysis_id}/status")
async def update_analysis_status(
    analysis_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("user_type") != "employer":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status is required")
        
    db = get_db()
    from bson import ObjectId
    try:
        result = await db.employer_analyses.update_one(
            {"_id": ObjectId(analysis_id), "user_id": str(current_user["_id"])},
            {"$set": {"status": new_status, "updated_at": __import__("datetime").datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        logger.info(f"Updated status of analysis {analysis_id} to {new_status}")
        return {"success": True, "status": new_status}
    except Exception as e:
        logger.error(f"Error updating analysis status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update status")

@app.get("/api/employer/candidate/{candidate_id}/summary")
async def get_candidate_summary(candidate_id: str, current_user: dict = Depends(get_current_user)):
    return await summary_service.generate_resume_summary(candidate_id, str(current_user["_id"]))

@app.get("/api/employer/dashboard")
async def get_employer_dashboard(current_user: dict = Depends(get_current_user)):
    return await hr_dashboard_service.get_dashboard_data(str(current_user["_id"]))
