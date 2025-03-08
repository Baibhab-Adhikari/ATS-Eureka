from flask import Flask, request, jsonify, render_template, url_for, redirect
import os
import json
import uuid
import pdfplumber as pdf  # type: ignore
import docx
from flask_pymongo import PyMongo
import google.generativeai as genai
from google.ai.generativelanguage_v1beta.types import content
from dotenv import load_dotenv

load_dotenv()


# init flask app with configs
app = Flask(__name__, template_folder="templates")


# mongoDB Atlas setup
app.config["MONGO_URI"] = "mongodb+srv://root:%40J=a.Gu8(1a4@jd-cv-test-atlas.etm4z.mongodb.net/ATS_Test?retryWrites=true&w=majority"
mongo = PyMongo(app)

# google gemini LLM setup
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Model configs with JSON response schema
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_schema": content.Schema(
        type=content.Type.OBJECT,
        properties={
            "JD-Match": content.Schema(
                type=content.Type.NUMBER,
            ),
            "Missing Skills": content.Schema(
                type=content.Type.ARRAY,
                items=content.Schema(
                    type=content.Type.STRING,
                ),
            ),
            "Profile Summary": content.Schema(
                type=content.Type.STRING,
            ),
            "Position": content.Schema(
                type=content.Type.INTEGER,
            ),
        },
    ),
    "response_mime_type": "application/json",
}
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash-8b",
    generation_config=generation_config,  # type: ignore
)


# helper functions


def extract_pdf_text(filepath):
    """Extracts the text if the uploaded file is of type PDF"""
    text = ""
    try:
        with pdf.open(filepath) as file:
            for page in file.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        raise ValueError(f"Error extracting text from PDF: {str(e)}")


def extract_docx_text(filepath):
    """Extracts the text if the uploaded file is of type DOCX"""
    try:
        doc = docx.Document(filepath)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        raise ValueError(f"Error extracting text from DOCX: {str(e)}")


def get_llm_response(prompt):
    """Inputs the prompt into the LLM and generates response."""
    response = model.generate_content(prompt)
    return response.text


def parse_llm_response(llm_response):
    try:
        # Assuming the response is in JSON format, parse it
        # Convert string response to JSON
        response_json = json.loads(llm_response)

        # Ensure the response contains the necessary keys
        parsed_response = {
            # Default to 0 if not present
            "JD-Match": response_json.get("JD-Match", 0),
            # Default to empty array
            "Missing Skills": response_json.get("Missing Skills", []),
            # Default to empty string
            "Profile Summary": response_json.get("Profile Summary", ""),
        }

        # Validate JD-Match is a number between 0 and 100
        try:
            match_score = float(parsed_response["JD-Match"])
            if not (0 <= match_score <= 100):
                # Clamp value
                parsed_response["JD-Match"] = max(0, min(match_score, 100))
        except (ValueError, TypeError):
            parsed_response["JD-Match"] = 0

        return parsed_response
    except Exception as e:
        raise ValueError(f"Error parsing LLM response: {str(e)}")

# routes


@app.route('/')
def index():
    return redirect(url_for("employee"))


@app.route('/employee', methods=['GET', 'POST'])
def employee():
    """Route for candidates to evaluate their CV based on their given JD"""

    if request.method == "POST":
        # get the CV
        if "file" not in request.files:
            return jsonify({"error": "No file provided."}), 400

        cv_file = request.files["file"]

        if cv_file.filename == "":
            return jsonify({"error": "No selected CV file."}), 400

        # get the JD text or file
        jd_text = request.form.get("jd_text")
        jd_file = request.files.get("jd_file")

        # Enforce only one method of JD submission
        if jd_text and jd_file and jd_file.filename != "":
            return jsonify({"error": "Provide either JD text or JD file, not both."}), 400

        if not jd_text and (not jd_file or jd_file.filename == ""):
            return jsonify({"error": "No JD provided. Please provide JD text or JD file."}), 400

        # extracting cv text from memory:
        cv_text = None
        if cv_file.filename.lower().endswith(".pdf"):
            cv_text = extract_pdf_text(cv_file)
        elif cv_file.filename.lower().endswith(".docx"):
            cv_text = extract_docx_text(cv_file)
        else:
            return jsonify({"error": "Unsupported CV file type."}), 400

        # process JD input: either file or text:
        if jd_file and jd_file.filename != "":
            jd_text_final = None

            # extract jd text based on file type
            if jd_file.filename.lower().endswith(".pdf"):
                jd_extracted_text = extract_pdf_text(jd_file)
            elif jd_file.filename.lower().endswith(".docx"):
                jd_extracted_text = extract_docx_text(jd_file)
            else:
                return jsonify({"error": "Unsupported JD file type."}), 400

            jd_text_final = jd_extracted_text
        else:
            # else use direct jd text
            jd_text_final = jd_text

        # Construct the prompt for the LLM (individual jD-CV Match)
        prompt = f"""
You are an expert HR consultant with extensive experience evaluating resumes in both technical (e.g., software engineering, data science) and non-technical (e.g., accounting, business analysis) domains. Please analyze the following candidate's CV and job description (JD) and complete these tasks:

1. Compare the CV with the JD and determine how well the candidate meets the job requirements.
2. Calculate a matching score as a percentage (0 to 100), where 100 means a perfect match.
3. Identify any missing skills or areas for improvement, and list them as an array of concise strings.
4. Provide a concise profile summary in no more than 30 words.
5. Return your answer strictly as a valid JSON object with exactly these keys:
   - "JD-Match": a number (the match percentage; use 0 if no match).
   - "Missing Skills": an array of strings (empty array if none).
   - "Profile Summary": a string (maximum 30 words summarizing strengths and overall profile).

Here is the information to analyze:

CV:
{cv_text}

JD:
{jd_text_final}
"""

        # store data to mongo
        record = {
            "employer_id": str(uuid.uuid4()),
            "cv_filename": cv_file.filename,
            "jd_filename": jd_file.filename if jd_file else None,
            "jd_text": jd_text_final,
            "cv_text": cv_text,
        }
        try:
            mongo.db.employees.insert_one(record)
        except Exception as e:
            return jsonify({"error": f"MongoDB error: {str(e)}"}), 500

        # Get the LLM response from the prompt and parse it
        try:
            llm_response = get_llm_response(prompt)
            parsed_llm_response = parse_llm_response(llm_response)
        except Exception as e:
            return jsonify({"error": f"Error from LLM: {str(e)}"}), 500

        return parsed_llm_response

    # GET
    return render_template("employee.html")


@app.route('/employer', methods=['GET', 'POST'])
def employer():
    # POST
    if request.method == "POST":
        # get the JD text or file
        jd_text = request.form.get("jd_text")
        jd_file = request.files.get("jd_file")

        # Enforce only one method of JD submission
        if jd_text and jd_file and jd_file.filename != "":
            return jsonify({"error": "Provide either JD text or JD file, not both."}), 400

        if not jd_text and (not jd_file or jd_file.filename == ""):
            return jsonify({"error": "No JD provided. Please provide JD text or JD file."}), 400

        # Extract the JD text from the file or use the provided JD text
        jd_text_final = ""
        if jd_file and jd_file.filename != "":
            # Extract JD text based on file type
            if jd_file.filename.lower().endswith(".pdf"):
                jd_text_final = extract_pdf_text(jd_file)
            elif jd_file.filename.lower().endswith(".docx"):
                jd_text_final = extract_docx_text(jd_file)
            else:
                return jsonify({"error": "Unsupported JD file type."}), 400
        else:
            jd_text_final = jd_text  # Use JD text directly

        # getting multiple CVs
        cv_multiple_candidates = request.files.getlist("candidates[]")

        if not cv_multiple_candidates:
            return jsonify({"error": "No CV(s) provided."}), 400

        # Limit to maximum 5 files as mentioned in the form
        if len(cv_multiple_candidates) > 5:
            return jsonify({"error": "Maximum 5 candidate files allowed."}), 400

        # processing each candidate cv
        candidate_results = []
        for cv_file in cv_multiple_candidates:
            if cv_file.filename == "":
                continue  # skipping empty files

            cv_text = None
            if cv_file.filename.lower().endswith(".pdf"):
                cv_text = extract_pdf_text(cv_file)
            elif cv_file.filename.lower().endswith(".docx"):
                cv_text = extract_docx_text(cv_file)
            else:
                continue  # skipping unsupported file types

            # LLM prompt
            prompt = f"""
You are an expert HR consultant with extensive experience evaluating resumes in both technical (e.g., software engineering, data science) and non-technical (e.g., accounting, business analysis) domains. Please analyze the following candidate's CV and job description (JD) and complete these tasks:

1. Compare the CV with the JD and determine how well the candidate meets the job requirements.
2. Calculate a matching score as a percentage (0 to 100), where 100 means a perfect match.
3. Identify any missing skills or areas for improvement, and list them as an array of concise strings.
4. Provide a concise profile summary in no more than 30 words.
5. Return your answer strictly as a valid JSON object with exactly these keys:
   - "JD-Match": a number (the match percentage; use 0 if no match).
   - "Missing Skills": an array of strings (empty array if none).
   - "Profile Summary": a string (maximum 30 words summarizing strengths and overall profile).


Here is the information to analyze:

CV:
{cv_text}

JD:
{jd_text_final}
"""

            # store data to mongo
            record = {
                "employer_id": str(uuid.uuid4()),
                "cv_filename": cv_file.filename,
                "jd_filename": jd_file.filename if jd_file else None,
                "jd_text": jd_text_final,
                "cv_text": cv_text,
            }
            try:
                mongo.db.employees.insert_one(record)
            except Exception as e:
                return jsonify({"error": f"MongoDB error: {str(e)}"}), 500

            # get response and parse it
            try:
                llm_response = get_llm_response(prompt)
                parsed_llm_response = parse_llm_response(llm_response)

                # Create a candidate result with filename and parsed response
                candidate_result = {
                    "filename": cv_file.filename,
                    **parsed_llm_response  # Unpack the parsed response directly
                }
                candidate_results.append(candidate_result)

            except Exception as e:
                return jsonify({"error": f"Error from LLM: {str(e)}"}), 500

        # Primary sort by JD-Match score (descending)
        # Secondary sort by number of missing skills (ascending) as a tiebreaker
        candidate_results.sort(
            key=lambda x: (
                -float(x.get("JD-Match", 0)),  # Negative for descending order
                # Fewer missing skills is better
                len(x.get("Missing Skills", []))
            )
        )

        # Assign positions after sorting all candidates
        for index, result in enumerate(candidate_results):
            result["Position"] = index + 1  # Assign position starting from 1

        # Return the final response with sorted candidates' results
        return jsonify({
            "message": "JD and candidate results processed successfully.",
            "candidates_results": candidate_results
        }), 200

    # GET
    return """
    <h2>Employer - Post JD</h2>
    <form method="post" enctype="multipart/form-data">
        <textarea name="jd_text" rows="10" cols="30" placeholder="Enter JD text"></textarea><br>
        OR<br>
        <input type="file" name="jd_file">
        <br><br>
        <h3>Upload Candidate Resumes (Maximum 5 Files)</h3>
        <input type="file" name="candidates[]" multiple><br><br>
        <input type="submit" value="Submit JD and Candidates">
    </form>
    """


if __name__ == "__main__":
    app.run(debug=True, port=5001)
