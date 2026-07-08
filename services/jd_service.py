import logging
from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime

from db import get_db
from models import JobDescriptionModel
from helpers import get_llm_response
import json

logger = logging.getLogger(__name__)

class JdService:
    @staticmethod
    async def create_jd(user_id: str, jd_data: dict):
        logger.info(f"Creating job description for user {user_id}")
        db = get_db()
        try:
            jd = JobDescriptionModel(user_id=user_id, **jd_data)
            result = await db.job_descriptions.insert_one(jd.model_dump(by_alias=True, exclude_none=True))
            jd.id = str(result.inserted_id)
            return jd
        except Exception as e:
            logger.error(f"Error creating jd: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create job description")

    @staticmethod
    async def get_jds_by_user(user_id: str):
        logger.info(f"Fetching job descriptions for user {user_id}")
        db = get_db()
        try:
            cursor = db.job_descriptions.find({"user_id": user_id}).sort("created_at", -1)
            jds = await cursor.to_list(length=100)
            return [JobDescriptionModel(**jd) for jd in jds]
        except Exception as e:
            logger.error(f"Error fetching jds: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch job descriptions")

    @staticmethod
    async def get_jd(jd_id: str, user_id: str):
        logger.info(f"Fetching jd {jd_id} for user {user_id}")
        db = get_db()
        try:
            jd = await db.job_descriptions.find_one({"_id": ObjectId(jd_id), "user_id": user_id})
            if not jd:
                raise HTTPException(status_code=404, detail="Job description not found")
            return JobDescriptionModel(**jd)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching jd {jd_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch job description")

    @staticmethod
    async def update_jd(jd_id: str, user_id: str, update_data: dict):
        logger.info(f"Updating jd {jd_id} for user {user_id}")
        db = get_db()
        
        # Remove fields that shouldn't be updated directly
        update_data.pop("_id", None)
        update_data.pop("id", None)
        update_data.pop("user_id", None)
        update_data.pop("created_at", None)
        
        update_data["updated_at"] = datetime.utcnow()
        
        try:
            result = await db.job_descriptions.update_one(
                {"_id": ObjectId(jd_id), "user_id": user_id},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Job description not found")
            
            return await JdService.get_jd(jd_id, user_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating jd {jd_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update job description")

    @staticmethod
    async def parse_jd_from_text(text: str) -> dict:
        """Parse structured metadata from a raw job description text using LLM."""
        logger.info("Parsing JD text with LLM")
        prompt = f"""
        Extract the following job description metadata from the provided text.
        Return ONLY a raw JSON object with no markdown formatting.
        The JSON must contain these exact keys:
        - "title" (string, the job title)
        - "department" (string, the department or team if specified, otherwise empty string)
        - "location" (string, the job location if specified, otherwise empty string)
        - "experience_required" (string, years of experience required, otherwise empty string)
        - "required_skills" (string, comma-separated list of key skills)
        
        Job Description Text:
        {text}
        """
        
        try:
            llm_response = await get_llm_response(prompt)
            # Clean up markdown code blocks if the LLM adds them
            if llm_response.startswith('```json'):
                llm_response = llm_response[7:-3].strip()
            elif llm_response.startswith('```'):
                llm_response = llm_response[3:-3].strip()
                
            parsed_data = json.loads(llm_response)
            parsed_data["full_description"] = text
            return parsed_data
        except Exception as e:
            logger.error(f"Error parsing JD text with LLM: {str(e)}")
            # Fallback if LLM fails, just return the raw text
            return {
                "title": "Parsed Job Description",
                "department": "",
                "location": "",
                "experience_required": "",
                "required_skills": "",
                "full_description": text
            }


    @staticmethod
    async def delete_jd(jd_id: str, user_id: str):
        logger.info(f"Deleting jd {jd_id} for user {user_id}")
        db = get_db()
        try:
            result = await db.job_descriptions.delete_one({"_id": ObjectId(jd_id), "user_id": user_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Job description not found")
            
            # Also optionally delete related employer analyses, or mark them orphaned. 
            # We'll just leave them for now to preserve history.
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting jd {jd_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete job description")
