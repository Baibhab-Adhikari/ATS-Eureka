import logging
from bson import ObjectId
from fastapi import HTTPException
from typing import List, Optional

from db import get_db
from models import ApplicationModel

logger = logging.getLogger(__name__)

class ApplicationService:
    async def create_application(self, user_id: str, app_data: dict):
        logger.info(f"Creating application for user {user_id}")
        db = get_db()
        
        try:
            # Verify resume exists if provided
            if app_data.get("resume_used"):
                resume = await db.resumes.find_one({"_id": ObjectId(app_data["resume_used"]), "user_id": user_id})
                if not resume:
                    logger.warning(f"Provided resume {app_data['resume_used']} not found for user {user_id}")
                    raise HTTPException(status_code=400, detail="Provided resume not found for this user")
                    
            application = ApplicationModel(user_id=user_id, **app_data)
            
            result = await db.applications.insert_one(application.model_dump(by_alias=True, exclude_none=True))
            application.id = str(result.inserted_id)
            logger.info(f"Successfully created application {application.id} for user {user_id}")
            return application
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating application for user {user_id}: {str(e)}")
            raise
        
    async def get_applications_by_user(self, user_id: str):
        logger.info(f"Fetching applications for user {user_id}")
        try:
            db = get_db()
            cursor = db.applications.find({"user_id": user_id})
            applications = await cursor.to_list(length=100)
            logger.info(f"Found {len(applications)} applications for user {user_id}")
            return [ApplicationModel(**app) for app in applications]
        except Exception as e:
            logger.error(f"Error fetching applications for user {user_id}: {str(e)}")
            raise
        
    async def get_application(self, app_id: str, user_id: str):
        logger.info(f"Fetching application {app_id} for user {user_id}")
        db = get_db()
        application = await db.applications.find_one({"_id": ObjectId(app_id), "user_id": user_id})
        if not application:
            logger.warning(f"Application {app_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Application not found")
        return ApplicationModel(**application)
        
    async def update_application(self, app_id: str, user_id: str, update_data: dict):
        logger.info(f"Updating application {app_id} for user {user_id}")
        db = get_db()
        
        try:
            if update_data.get("resume_used"):
                resume = await db.resumes.find_one({"_id": ObjectId(update_data["resume_used"]), "user_id": user_id})
                if not resume:
                    logger.warning(f"Provided resume {update_data['resume_used']} not found for user {user_id}")
                    raise HTTPException(status_code=400, detail="Provided resume not found for this user")
                    
            # Only allow specific fields to be updated
            allowed_fields = ["company", "job_title", "job_link", "platform", "resume_used", 
                              "ats_score", "status", "notes", "interview_date"]
            
            filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
            
            if not filtered_data:
                logger.warning(f"No valid fields to update for application {app_id}")
                raise HTTPException(status_code=400, detail="No valid fields to update")
                
            result = await db.applications.update_one(
                {"_id": ObjectId(app_id), "user_id": user_id},
                {"$set": filtered_data}
            )
            
            if result.matched_count == 0:
                logger.warning(f"Cannot update: Application {app_id} not found for user {user_id}")
                raise HTTPException(status_code=404, detail="Application not found")
                
            logger.info(f"Successfully updated application {app_id}")
            return await self.get_application(app_id, user_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating application {app_id}: {str(e)}")
            raise
        
    async def delete_application(self, app_id: str, user_id: str):
        logger.info(f"Deleting application {app_id} for user {user_id}")
        try:
            db = get_db()
            result = await db.applications.delete_one({"_id": ObjectId(app_id), "user_id": user_id})
            if result.deleted_count == 0:
                logger.warning(f"Cannot delete: Application {app_id} not found for user {user_id}")
                raise HTTPException(status_code=404, detail="Application not found")
            
            logger.info(f"Successfully deleted application {app_id}")
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting application {app_id}: {str(e)}")
            raise
