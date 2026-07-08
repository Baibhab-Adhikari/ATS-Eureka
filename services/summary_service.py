import logging
from bson import ObjectId
from fastapi import HTTPException
from db import get_db
from helpers import get_llm_response
from services.resume_service import ResumeService
from services.storage_service import LocalStorageProvider
from models import EmployerAnalysisModel
from datetime import datetime

logger = logging.getLogger(__name__)

class SummaryService:
    def __init__(self):
        self.storage = LocalStorageProvider()
        self.resume_service = ResumeService(self.storage)
        
    async def generate_resume_summary(self, candidate_id: str, user_id: str):
        """
        Generates a recruiter-friendly summary of a candidate's resume and caches it.
        candidate_id here refers to the EmployerAnalysis ID.
        """
        db = get_db()
        logger.info(f"Generating resume summary for candidate analysis {candidate_id}")
        
        analysis = await db.employer_analyses.find_one({
            "_id": ObjectId(candidate_id),
            "user_id": user_id
        })
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Candidate analysis not found")
            
        # Return cached summary if it exists
        if analysis.get("resume_summary"):
            logger.info("Returning cached resume summary")
            return {"summary": analysis["resume_summary"]}
            
        # Need to generate it
        resume_id = str(analysis["resume_id"])
        resume = await self.resume_service.get_resume(resume_id, user_id)
        
        prompt = f"""
You are an expert technical recruiter. Create a concise, professional summary of the following candidate based on their resume.
The summary should allow a hiring manager to understand the candidate's profile in just a few seconds.

Focus on:
1. Overall experience overview (e.g., "Backend engineer with 4 years...")
2. Core technical strengths and proficiencies.
3. Most relevant projects or achievements.
4. Leadership or soft skills demonstrated (if any).
5. Key observations (strengths or gaps).

Format the output as a single, well-structured paragraph, around 3-4 sentences. Do NOT use bullet points or markdown formatting. Keep it strictly textual.

Resume Text:
{resume.resume_text}
"""
        try:
            summary = await get_llm_response(prompt)
            # Clean up potential whitespace
            summary = summary.strip()
            
            # Cache the summary
            await db.employer_analyses.update_one(
                {"_id": ObjectId(candidate_id)},
                {"$set": {
                    "resume_summary": summary,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {"summary": summary}
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate AI summary")
