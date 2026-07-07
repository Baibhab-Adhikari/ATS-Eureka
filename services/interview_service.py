import os
import json
import logging
import google.generativeai as genai
from fastapi import HTTPException
from models import InterviewPrepResponse
from .prompt_builder import build_interview_prep_prompt

logger = logging.getLogger(__name__)

class InterviewService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        # Use a stable version like gemini-2.5-flash for standard structured generation
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def process_interview_prep(self, resume_text: str, jd_text: str) -> dict:
        try:
            prompt = build_interview_prep_prompt(resume_text, jd_text)
            
            generation_config = genai.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=InterviewPrepResponse,
            )
            
            logger.info("Calling Gemini API for interview preparation")
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            if not response.text:
                raise HTTPException(status_code=500, detail="Empty response from LLM")
                
            logger.info(f"LLM Response: {response.text}")
            return json.loads(response.text)
            
        except Exception as e:
            logger.error(f"Error generating interview questions: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate interview questions: {str(e)}")

interview_service = InterviewService()
