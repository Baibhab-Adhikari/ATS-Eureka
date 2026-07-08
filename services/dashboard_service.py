import json
import logging
import google.generativeai as genai
import os
import hashlib
from fastapi import HTTPException
from db import get_db
from models import ResumeModel, ApplicationModel
from .analytics_service import analytics_service
from pydantic import BaseModel
from typing import List

logger = logging.getLogger(__name__)

class InsightResponse(BaseModel):
    insights: List[str]

class DashboardService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set for dashboard insights")
        else:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self._insight_cache = {}
        
    def _hash_stats(self, stats: dict) -> str:
        return hashlib.md5(json.dumps(stats, sort_keys=True).encode()).hexdigest()

    async def get_dashboard_data(self, user_id: str):
        db = get_db()
        
        # Fetch Resumes
        resume_cursor = db.resumes.find({"user_id": user_id})
        resumes_data = await resume_cursor.to_list(length=100)
        resumes = [ResumeModel(**r) for r in resumes_data]
        
        # Fetch Applications
        app_cursor = db.applications.find({"user_id": user_id})
        apps_data = await app_cursor.to_list(length=1000)
        applications = [ApplicationModel(**a) for a in apps_data]
        
        # Fetch ATS History
        from bson import ObjectId
        history_cursor = db.history.find({"user_id": ObjectId(user_id), "user_type": "employee"})
        history = await history_cursor.to_list(length=1000)
        
        # Calculate stats
        stats = analytics_service.calculate_dashboard_stats(applications, resumes, history)
        
        # Check cache before calling LLM
        stats_hash = self._hash_stats(stats)
        cached = self._insight_cache.get(user_id)
        if cached and cached['hash'] == stats_hash:
            insights = cached['insights']
            logger.info(f"Using cached dashboard insights for user {user_id}")
        else:
            # Generate Insights via LLM
            logger.info(f"Generating new dashboard insights for user {user_id}")
            insights = await self._generate_llm_insights(stats)
            self._insight_cache[user_id] = {'hash': stats_hash, 'insights': insights}
            
        stats["insights"] = insights
        
        return stats

    async def _generate_llm_insights(self, stats: dict) -> List[str]:
        if not stats["summary"]["applications"]:
            return ["Start adding job applications to get personalized insights on your career progress."]
            
        try:
            prompt = f"""
            You are an expert career coach and data analyst. Analyze the following job search metrics and provide exactly 3 concise, actionable, and personalized insights (1 sentence each) for the user. 
            Focus on identifying trends, highlighting their best performing resume, or advising on application strategy.
            Do not provide generic advice, tie it strictly to the data provided.
            
            Data:
            Summary: {json.dumps(stats['summary'])}
            Application Stats: {json.dumps(stats['application_statistics'])}
            Resume Stats: {json.dumps(stats['resume_statistics'])}
            ATS Analytics: {json.dumps(stats['ats_analytics'])}
            """
            
            generation_config = genai.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=InsightResponse,
            )
            
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            result = json.loads(response.text)
            return result.get("insights", [])
        except Exception as e:
            logger.error(f"Failed to generate dashboard insights: {str(e)}")
            return ["Keep applying and tailoring your resumes to improve your chances."]

dashboard_service = DashboardService()
