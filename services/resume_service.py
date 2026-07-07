import uuid
import logging
from fastapi import UploadFile, HTTPException
from bson import ObjectId
from datetime import datetime

from db import get_db
from models import ResumeModel
from services.storage_service import StorageService
from helpers import extract_text_from_file

logger = logging.getLogger(__name__)

class ResumeService:
    def __init__(self, storage: StorageService):
        self.storage = storage

    async def create_resume(self, user_id: str, file: UploadFile, title: str, tags: list[str] = None):
        logger.info(f"Starting resume upload for user {user_id}, file: {file.filename}")
        if not file.filename:
            logger.error("Resume upload failed: Filename missing")
            raise HTTPException(status_code=400, detail="Filename missing")
            
        try:
            # Extract text BEFORE saving the stream
            logger.info("Extracting text from resume file")
            resume_text = await extract_text_from_file(file)
            
            # We need to seek back to 0 because extract_text_from_file reads the file
            await file.seek(0)
            
            # Generate unique filename to avoid conflicts
            ext = file.filename.split('.')[-1]
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            
            # Save to storage
            logger.info(f"Saving resume to storage as {unique_filename}")
            file_path = await self.storage.save(file.file, unique_filename)
            
            db = get_db()
            resume = ResumeModel(
                user_id=user_id,
                title=title,
                file_name=file.filename,
                file_path=file_path,
                mime_type=file.content_type or "application/octet-stream",
                resume_text=resume_text,
                tags=tags or []
            )
            
            logger.info("Inserting resume record into database")
            result = await db.resumes.insert_one(resume.model_dump(by_alias=True, exclude_none=True))
            resume.id = str(result.inserted_id)
            logger.info(f"Successfully created resume {resume.id} for user {user_id}")
            return resume
        except Exception as e:
            logger.error(f"Error creating resume: {str(e)}")
            raise
        
    async def get_resumes_by_user(self, user_id: str):
        logger.info(f"Fetching resumes for user {user_id}")
        try:
            db = get_db()
            cursor = db.resumes.find({"user_id": user_id})
            resumes = await cursor.to_list(length=100)
            logger.info(f"Found {len(resumes)} resumes for user {user_id}")
            return [ResumeModel(**r) for r in resumes]
        except Exception as e:
            logger.error(f"Error fetching resumes for user {user_id}: {str(e)}")
            raise
        
    async def get_resume(self, resume_id: str, user_id: str):
        logger.info(f"Fetching resume {resume_id} for user {user_id}")
        db = get_db()
        resume = await db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            logger.warning(f"Resume {resume_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Resume not found")
        return ResumeModel(**resume)
        
    async def delete_resume(self, resume_id: str, user_id: str):
        logger.info(f"Deleting resume {resume_id} for user {user_id}")
        db = get_db()
        resume = await db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            logger.warning(f"Cannot delete: Resume {resume_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Resume not found")
            
        try:
            # Delete from DB
            await db.resumes.delete_one({"_id": ObjectId(resume_id)})
            logger.info(f"Deleted resume {resume_id} from database")
            
            # Delete from storage
            await self.storage.delete(resume["file_path"])
            logger.info(f"Deleted resume file {resume['file_path']} from storage")
            return True
        except Exception as e:
            logger.error(f"Error deleting resume {resume_id}: {str(e)}")
            raise

    async def update_resume(self, resume_id: str, user_id: str, update_data: dict):
        logger.info(f"Updating resume {resume_id} for user {user_id}")
        db = get_db()
        
        allowed_fields = ["title", "tags"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            logger.warning(f"No valid fields to update for resume {resume_id}")
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        filtered_data["updated_at"] = datetime.utcnow()
        
        try:
            result = await db.resumes.update_one(
                {"_id": ObjectId(resume_id), "user_id": user_id},
                {"$set": filtered_data}
            )
            
            if result.matched_count == 0:
                logger.warning(f"Cannot update: Resume {resume_id} not found for user {user_id}")
                raise HTTPException(status_code=404, detail="Resume not found")
                
            logger.info(f"Successfully updated resume {resume_id}")
            return await self.get_resume(resume_id, user_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating resume {resume_id}: {str(e)}")
            raise
