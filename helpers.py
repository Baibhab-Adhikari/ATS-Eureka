import io
import json
import os
import time

import docx
import google.generativeai as genai
import pdfplumber as pdf
import redis
from fastapi import HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from google.ai.generativelanguage_v1beta.types import content

# redis setup (local)
redis_client = redis.Redis(
    host=os.environ["REDIS_HOSTNAME"],
    port=os.environ["REDIS_PORT"],  # type: ignore
    decode_responses=True,
    username=os.environ["REDIS_USERNAME"],
    password=os.environ["REDIS_PASSWORD"],
)


# Google Gemini LLM setup
genai.configure(api_key=os.environ["GEMINI_API_KEY"])  # type: ignore

generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_schema": content.Schema(
        type=content.Type.OBJECT,
        properties={
            "JD-Match": content.Schema(type=content.Type.INTEGER),
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
model = genai.GenerativeModel(  # type: ignore
    model_name="gemini-flash-latest", generation_config=generation_config)  # type: ignore


MAX_REQUESTS = 1000  # Maximum number of requests allowed
MAX_REQUESTS_FREE = 1000  # max number of requests for free users
RATE_LIMIT_WINDOW = 24 * 60 * 60  # 24 hours in seconds


# Helper functions


def extract_pdf_text(file: io.BytesIO) -> str:
    """Extracts text from a PDF file object in memory."""
    text: str = ""
    # removed unnecessary disk I/O
    with pdf.open(file) as pdf_file:
        for page in pdf_file.pages:
            text += page.extract_text() or ""

    return text


def extract_docx_text(file: io.BytesIO) -> str:
    """Extracts text from a DOCX file object in memory."""
    doc = docx.Document(file)
    return "\n".join([para.text for para in doc.paragraphs])


async def get_llm_response(prompt: str) -> str:
    """Gets response from LLM asynchronously."""
    try:
        # Using the asynchronous method
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        print(f"Error in async LLM call: {e}")
        raise HTTPException(
            status_code=500, detail="Error generating response from LLM")


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


# NOTE: The original extract_text_from_file is now a synchronous helper
def _extract_text_from_file_sync(file: UploadFile):
    """Synchronous helper for text extraction."""
    if not file.filename:
        raise HTTPException(
            status_code=400, detail="File is missing a filename.")

    file_extension = os.path.splitext(file.filename)[1].lower()

    # Read file content into an in-memory buffer
    # NOTE: We are using the synchronous file.file.read() here because
    # this whole function will be run in a separate thread.
    file_content = io.BytesIO(file.file.read())

    if file_extension == ".pdf":
        return extract_pdf_text(file_content)
    elif file_extension == ".docx":
        return extract_docx_text(file_content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PDF or DOCX files."
        )


async def extract_text_from_file(file: UploadFile) -> str:
    """
    Asynchronously extracts text from a file by running the
    synchronous extraction logic in a separate thread.
    """
    return await run_in_threadpool(_extract_text_from_file_sync, file)


def get_client_identifier(request: Request) -> str:
    """
    Get a unique identifier for the client.
    Uses the X-Forwarded-For header (if available) combined with User-Agent.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    ip = forwarded_for.split(",")[0].strip(
    ) if forwarded_for else request.client.host  # type: ignore
    user_agent = request.headers.get("user-agent", "")
    return f"{ip}:{user_agent}"


def check_rate_limit_demo(request: Request):
    """
    Check if the client has exceeded their rate limit using Redis.
    Returns the number of remaining requests.
    Raises HTTPException if rate limit is exceeded.
    """
    client_id = get_client_identifier(request)
    current_time = int(time.time())
    key_demo = f"rate_limit:demo:{client_id}"

    # Get the list of timestamps for this client
    timestamps_data = redis_client.get(key_demo)
    timestamps = json.loads(
        timestamps_data) if timestamps_data else []  # type: ignore

    # Filter out timestamps older than the rate limit window
    timestamps = [ts for ts in timestamps if current_time -
                  ts < RATE_LIMIT_WINDOW]

    # Check if client has reached the limit
    if len(timestamps) >= MAX_REQUESTS:
        oldest_timestamp = min(timestamps) if timestamps else current_time
        remaining_time = int(oldest_timestamp +
                             RATE_LIMIT_WINDOW - current_time)
        hours = remaining_time // 3600
        minutes = (remaining_time % 3600) // 60
        time_msg = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {time_msg}."
        )

    # Add current timestamp to the list
    timestamps.append(current_time)

    # Store updated timestamps in Redis with TTL of RATE_LIMIT_WINDOW
    redis_client.setex(key_demo, RATE_LIMIT_WINDOW, json.dumps(timestamps))

    # Return remaining requests
    return MAX_REQUESTS - len(timestamps)


def check_rate_limit_free_users(request: Request):
    """
    Check if the free client has exceeded their rate limit using Redis.
    Returns the number of remaining requests.
    Raises HTTPException if rate limit is exceeded.
    """
    client_id = get_client_identifier(request)
    current_time = int(time.time())
    key_free = f"rate_limit:free:{client_id}"

    # Get the list of timestamps for this client
    timestamps_data = redis_client.get(key_free)
    timestamps = json.loads(
        timestamps_data) if timestamps_data else []  # type: ignore

    # Filter out timestamps older than the rate limit window
    timestamps = [ts for ts in timestamps if current_time -
                  ts < RATE_LIMIT_WINDOW]

    # Check if client has reached the limit
    if len(timestamps) >= MAX_REQUESTS_FREE:
        oldest_timestamp = min(timestamps) if timestamps else current_time
        remaining_time = int(oldest_timestamp +
                             RATE_LIMIT_WINDOW - current_time)
        hours = remaining_time // 3600
        minutes = (remaining_time % 3600) // 60
        time_msg = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {time_msg}."
        )

    # Add current timestamp to the list
    timestamps.append(current_time)

    # Store updated timestamps in Redis with TTL of RATE_LIMIT_WINDOW
    redis_client.setex(key_free, RATE_LIMIT_WINDOW, json.dumps(timestamps))

    # Return remaining requests
    return MAX_REQUESTS_FREE - len(timestamps)
