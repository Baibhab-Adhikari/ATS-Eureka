from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import json
import uuid
import pdfplumber as pdf
import docx
from motor.motor_asyncio import AsyncIOMotorClient
import google.generativeai as genai
from google.ai.generativelanguage_v1beta.types import content
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Setup MongoDB connection
MONGO_URI = "mongodb+srv://root:%40J=a.Gu8(1a4@jd-cv-test-atlas.etm4z.mongodb.net/ATS_Test?retryWrites=true&w=majority"
client = AsyncIOMotorClient(MONGO_URI)  # type: ignore
db = client.ATS_Test

# Google Gemini LLM setup
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_schema": content.Schema(
        type=content.Type.OBJECT,
        properties={
            "JD-Match": content.Schema(type=content.Type.NUMBER),
            "Missing Skills": content.Schema(
                type=content.Type.ARRAY,
                items=content.Schema(type=content.Type.STRING),
            ),
            "Profile Summary": content.Schema(type=content.Type.STRING),
            "Position": content.Schema(type=content.Type.INTEGER),
        },
    ),
    "response_mime_type": "application/json",
}
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash-8b", generation_config=generation_config)  # type: ignore

# Helper functions


def extract_pdf_text(file):
    """Extracts text from a PDF file object."""
    temp_file_path = f"temp_{uuid.uuid4()}.pdf"
    try:
        # Save uploaded file to a temporary location
        with open(temp_file_path, "wb") as temp_file:
            contents = file.read()
            temp_file.write(contents)
            file.seek(0)  # Reset file pointer for potential reuse

        # Extract text from the saved file
        text = ""
        with pdf.open(temp_file_path) as pdf_file:
            for page in pdf_file.pages:
                text += page.extract_text() or ""
        return text
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def extract_docx_text(file):
    """Extracts text from a DOCX file object."""
    temp_file_path = f"temp_{uuid.uuid4()}.docx"
    try:
        # Save uploaded file to a temporary location
        with open(temp_file_path, "wb") as temp_file:
            contents = file.read()
            temp_file.write(contents)
            file.seek(0)  # Reset file pointer for potential reuse

        # Extract text from the saved file
        doc = docx.Document(temp_file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def get_llm_response(prompt):
    """Gets response from LLM."""
    response = model.generate_content(prompt)
    return response.text


def parse_llm_response(llm_response):
    """Parses LLM response into structured JSON."""
    try:
        response_json = json.loads(llm_response)
        return {
            "JD-Match": response_json.get("JD-Match", 0),
            "Missing Skills": response_json.get("Missing Skills", []),
            "Profile Summary": response_json.get("Profile Summary", ""),
        }
    except json.JSONDecodeError:
        # Handle case where LLM response is not valid JSON
        return {
            "JD-Match": 0,
            "Missing Skills": ["Error parsing LLM response"],
            "Profile Summary": "Could not generate profile summary due to parsing error.",
        }


def extract_text_from_file(file, file_type=None):
    """Extracts text from a file based on its extension."""
    if not file_type:
        file_type = file.filename.lower()

    if file_type.endswith(".pdf"):
        return extract_pdf_text(file.file)
    elif file_type.endswith(".docx"):
        return extract_docx_text(file.file)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PDF or DOCX files."
        )

# API Routes


@app.post("/api/employee", response_class=JSONResponse)
async def process_employee(
    file: UploadFile = File(...),
    jd_text: str = Form(None),
    jd_file: UploadFile = File(None)
):
    """API endpoint for CV evaluation based on the given JD."""
    # Validate inputs
    if not jd_text and not jd_file:
        raise HTTPException(
            status_code=400,
            detail="No JD provided. Please provide JD text or JD file."
        )

    try:
        # Extract text from uploaded CV
        cv_text = extract_text_from_file(file)

        # Extract text from JD file if provided
        jd_text_final = jd_text
        if not jd_text and jd_file:
            jd_text_final = extract_text_from_file(jd_file)

        # Construct LLM prompt
        prompt = f"""Compare the CV with the JD and return a structured JSON response:
        CV:
        {cv_text}

        JD:
        {jd_text_final}
        """

        # Generate LLM response
        llm_response = get_llm_response(prompt)
        parsed_llm_response = parse_llm_response(llm_response)

        # Store data in MongoDB
        record = {
            "employer_id": str(uuid.uuid4()),
            "cv_filename": file.filename,
            "jd_filename": jd_file.filename if jd_file else None,
            "jd_text": jd_text_final,
            "cv_text": cv_text,
            "analysis_result": parsed_llm_response
        }

        try:
            await db.employees.insert_one(record)
        except Exception as e:
            # Log the database error but continue to return the analysis
            print(f"Database error: {str(e)}")

        return JSONResponse(
            status_code=200,
            content=parsed_llm_response
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )


@app.post("/api/employer", response_class=JSONResponse)
async def process_employer(
    jd_text: str = Form(None),
    jd_file: UploadFile = File(None),
    candidates: List[UploadFile] = File(...)
):
    """API endpoint for evaluating multiple CVs against a JD."""
    # Validate inputs
    if not jd_text and not jd_file:
        raise HTTPException(
            status_code=400,
            detail="No JD provided. Please provide JD text or JD file."
        )

    if not candidates or len(candidates) == 0:
        raise HTTPException(
            status_code=400,
            detail="No candidate CVs provided."
        )

    try:
        # Extract JD text
        jd_text_final = jd_text
        if not jd_text and jd_file:
            jd_text_final = extract_text_from_file(jd_file)

        # Process candidates
        candidate_results = []
        employer_id = str(uuid.uuid4())  # Same employer ID for all candidates

        for cv_file in candidates:
            try:
                # Extract CV text
                cv_text = extract_text_from_file(cv_file)

                # Construct LLM prompt
                prompt = f"""Compare the CV with the JD and return a structured JSON response:
                CV:
                {cv_text}

                JD:
                {jd_text_final}
                """

                # Generate LLM response
                llm_response = get_llm_response(prompt)
                parsed_response = parse_llm_response(llm_response)

                # Add to results
                candidate_result = {
                    "filename": cv_file.filename,
                    **parsed_response
                }
                candidate_results.append(candidate_result)

                # Store in MongoDB
                record = {
                    "employer_id": employer_id,
                    "cv_filename": cv_file.filename,
                    "jd_text": jd_text_final,
                    "cv_text": cv_text,
                    "analysis_result": parsed_response
                }

                try:
                    await db.employees.insert_one(record)
                except Exception as e:
                    # Log the database error but continue processing
                    print(f"Database error for {cv_file.filename}: {str(e)}")

            except Exception as e:
                # Log the error but continue with other candidates
                print(f"Error processing {cv_file.filename}: {str(e)}")
                continue

        # Sort candidates by match score
        candidate_results.sort(
            key=lambda x: (-x["JD-Match"], len(x["Missing Skills"]))
        )

        # Assign positions
        for index, result in enumerate(candidate_results):
            result["Position"] = index + 1

        return JSONResponse(
            status_code=200,
            content={
                "employer_id": employer_id,
                "candidates_count": len(candidate_results),
                "candidates_results": candidate_results
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )
