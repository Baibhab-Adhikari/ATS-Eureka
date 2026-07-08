import asyncio
import logging
from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime

from db import get_db
from models import EmployerAnalysisModel
from helpers import get_llm_response, parse_llm_response
from services.resume_service import ResumeService
from services.storage_service import LocalStorageProvider

logger = logging.getLogger(__name__)

class EmployerAnalysisService:
    def __init__(self):
        self.storage = LocalStorageProvider()
        self.resume_service = ResumeService(self.storage)

    async def analyze_batch(self, user_id: str, jd_id: str, resume_ids: list[str]):
        logger.info(f"Starting batch analysis for jd {jd_id} with {len(resume_ids)} resumes")
        db = get_db()
        
        # 1. Fetch the Job Description
        jd = await db.job_descriptions.find_one({"_id": ObjectId(jd_id), "user_id": user_id})
        if not jd:
            raise HTTPException(status_code=404, detail="Job description not found")
        
        jd_text_final = jd.get("full_description", "")
        if not jd_text_final:
            raise HTTPException(status_code=400, detail="Job description has no content")

        # 2. Define the concurrent analysis function
        async def analyze_single(resume_id: str):
            try:
                # Fetch resume text
                resume = await self.resume_service.get_resume(resume_id, user_id)
                if not resume:
                    return {"resume_id": resume_id, "error": "Resume not found"}
                
                cv_text = resume.resume_text
                
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
                
                ats_score = parsed_response.get("JD-Match", 0)
                
                # Create the EmployerAnalysis record
                analysis = EmployerAnalysisModel(
                    user_id=user_id,
                    jd_id=jd_id,
                    resume_id=resume_id,
                    candidate_name=resume.title, # Fallback to resume title
                    ats_score=ats_score,
                    analysis_result=parsed_response,
                    status="Analyzed"
                )
                
                # Check if analysis for this jd and resume already exists
                existing = await db.employer_analyses.find_one({
                    "jd_id": jd_id, 
                    "resume_id": resume_id
                })
                
                if existing:
                    # Update existing
                    await db.employer_analyses.update_one(
                        {"_id": existing["_id"]},
                        {"$set": {
                            "ats_score": ats_score, 
                            "analysis_result": parsed_response,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    analysis.id = str(existing["_id"])
                else:
                    # Insert new
                    result = await db.employer_analyses.insert_one(analysis.model_dump(by_alias=True, exclude_none=True))
                    analysis.id = str(result.inserted_id)
                    
                return {"resume_id": resume_id, "success": True, "analysis": analysis.model_dump(by_alias=True)}
            except Exception as e:
                logger.error(f"Error analyzing resume {resume_id}: {str(e)}")
                return {"resume_id": resume_id, "success": False, "error": str(e)}

        # 3. Run concurrently
        tasks = [analyze_single(rid) for rid in resume_ids]
        results = await asyncio.gather(*tasks)
        
        # Calculate summary metrics for the batch
        successful = [r for r in results if r.get("success")]
        failed = [r for r in results if not r.get("success")]
        
        return {
            "total_processed": len(results),
            "successful": len(successful),
            "failed": len(failed),
            "results": results
        }
