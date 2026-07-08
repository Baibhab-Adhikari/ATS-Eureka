import logging
from bson import ObjectId
from datetime import datetime, timedelta

from db import get_db

logger = logging.getLogger(__name__)

class HrDashboardService:
    @staticmethod
    async def get_dashboard_data(user_id: str):
        logger.info(f"Fetching HR dashboard data for user {user_id}")
        db = get_db()
        
        # 1. Fetch JDs
        jds = await db.job_descriptions.find({"user_id": user_id}).to_list(length=100)
        
        # 2. Fetch Analyses
        analyses = await db.employer_analyses.find({"user_id": user_id}).to_list(length=1000)
        
        # 3. Calculate KPI Cards
        active_jobs = len([jd for jd in jds if jd.get("status") == "Open"])
        total_candidates = len(analyses)
        
        shortlisted = len([a for a in analyses if a.get("status") == "Shortlisted"])
        interviews = len([a for a in analyses if a.get("status") == "Interviewing"])
        offers = len([a for a in analyses if a.get("status") == "Offered"])
        hires = len([a for a in analyses if a.get("status") == "Hired"])
        rejections = len([a for a in analyses if a.get("status") == "Rejected"])
        
        avg_ats = 0
        if analyses:
            avg_ats = sum(a.get("ats_score", 0) for a in analyses) / len(analyses)
            
        # 4. Charts - Applications per Job
        apps_per_job = {}
        for jd in jds:
            apps_per_job[str(jd["_id"])] = {
                "title": jd["title"],
                "count": 0,
                "avg_score": 0,
                "total_score": 0
            }
            
        for a in analyses:
            jd_id_str = str(a.get("jd_id"))
            if jd_id_str in apps_per_job:
                apps_per_job[jd_id_str]["count"] += 1
                apps_per_job[jd_id_str]["total_score"] += a.get("ats_score", 0)
                
        for k, v in apps_per_job.items():
            if v["count"] > 0:
                v["avg_score"] = v["total_score"] / v["count"]
                
        applications_per_job_chart = [{"name": v["title"], "applications": v["count"]} for v in apps_per_job.values()]
        avg_score_by_job_chart = [{"name": v["title"], "score": round(v["avg_score"], 1)} for v in apps_per_job.values() if v["count"] > 0]
        
        # 5. Funnel
        funnel_data = [
            {"stage": "Analyzed", "count": total_candidates},
            {"stage": "Shortlisted", "count": shortlisted},
            {"stage": "Interviewing", "count": interviews},
            {"stage": "Offered", "count": offers},
            {"stage": "Hired", "count": hires}
        ]
        
        # Calculate conversion rates
        for i in range(len(funnel_data) - 1):
            current = funnel_data[i]["count"]
            next_stage = funnel_data[i+1]["count"]
            rate = (next_stage / current * 100) if current > 0 else 0
            funnel_data[i]["conversion_to_next"] = round(rate, 1)

        return {
            "kpis": {
                "active_jobs": active_jobs,
                "total_candidates": total_candidates,
                "shortlisted": shortlisted,
                "interviews": interviews,
                "offers": offers,
                "hires": hires,
                "rejections": rejections,
                "average_ats": round(avg_ats, 1)
            },
            "charts": {
                "applications_per_job": applications_per_job_chart,
                "avg_score_by_job": avg_score_by_job_chart,
                "hiring_funnel": funnel_data
            }
        }
