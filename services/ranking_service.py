import logging
from bson import ObjectId
from fastapi import HTTPException
from db import get_db
from models import EmployerAnalysisModel

logger = logging.getLogger(__name__)

class RankingService:
    @staticmethod
    async def get_candidates_for_jd(jd_id: str, user_id: str):
        logger.info(f"Fetching ranked candidates for jd {jd_id} (user: {user_id})")
        db = get_db()
        
        try:
            # Fetch all analyses for this JD and sort by ATS score descending
            cursor = db.employer_analyses.find({
                "jd_id": jd_id, 
                "user_id": user_id
            }).sort("ats_score", -1)
            
            analyses = await cursor.to_list(length=1000)
            
            # Fetch the actual JD to include in response
            jd = await db.job_descriptions.find_one({"_id": ObjectId(jd_id)})
            
            return {
                "job_description": {
                    "id": str(jd["_id"]),
                    "title": jd.get("title", "Unknown Role")
                } if jd else None,
                "candidates": [EmployerAnalysisModel(**a) for a in analyses]
            }
        except Exception as e:
            logger.error(f"Error fetching candidates for jd {jd_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch candidate rankings")
