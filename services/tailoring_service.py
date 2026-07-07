import json
import logging
from fastapi import HTTPException
from models import TailorResumeRequest, TailorResumeResponse
from services.prompt_builder import build_tailoring_prompt
from helpers import get_llm_response, parse_llm_response
from google.ai.generativelanguage_v1beta.types import content

logger = logging.getLogger(__name__)

tailoring_generation_config = {
    "temperature": 0.3,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_schema": content.Schema(
        type=content.Type.OBJECT,
        properties={
            "is_compatible": content.Schema(type=content.Type.BOOLEAN),
            "compatibility_warning": content.Schema(type=content.Type.STRING),
            "tailored_resume": content.Schema(type=content.Type.STRING),
            "changes_summary": content.Schema(
                type=content.Type.ARRAY,
                items=content.Schema(type=content.Type.STRING),
            ),
            "keyword_additions": content.Schema(
                type=content.Type.ARRAY,
                items=content.Schema(type=content.Type.STRING),
            ),
        },
    ),
    "response_mime_type": "application/json",
}

async def process_resume_tailoring(request: TailorResumeRequest, user_id: str, resume_svc) -> TailorResumeResponse:
    if not request.resume_id or not request.job_description:
        raise HTTPException(status_code=400, detail="Resume ID and Job Description are required")
        
    resume = await resume_svc.get_resume(request.resume_id, user_id)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    prompt = build_tailoring_prompt(resume.resume_text, request.job_description)
    
    try:
        llm_response_text = await get_llm_response(prompt, gen_config=tailoring_generation_config)
        import json
        import re
        
        # Clean up any potential markdown code blocks around JSON
        cleaned_text = llm_response_text
        if cleaned_text.startswith("```"):
            cleaned_text = re.sub(r"^```(?:json)?\n|```$", "", cleaned_text.strip())
            
        parsed = json.loads(cleaned_text)
        
        return TailorResumeResponse(
            is_compatible=parsed.get("is_compatible", True),
            compatibility_warning=parsed.get("compatibility_warning"),
            tailored_resume=parsed.get("tailored_resume", ""),
            changes_summary=parsed.get("changes_summary", []),
            keyword_additions=parsed.get("keyword_additions", [])
        )
    except Exception as e:
        logger.error(f"Error tailoring resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to tailor resume via AI")
