from fastapi import HTTPException
import json
import os
import uuid
import pdfplumber as pdf
import docx
import google.generativeai as genai
from google.ai.generativelanguage_v1beta.types import content


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
