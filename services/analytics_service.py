import statistics
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from typing import List, Dict, Any
from models import ApplicationModel, ResumeModel

class AnalyticsService:
    @staticmethod
    def calculate_dashboard_stats(applications: List[ApplicationModel], resumes: List[ResumeModel], history: List[Dict] = None) -> Dict[str, Any]:
        now = datetime.utcnow()
        if history is None:
            history = []
        
        # Summary metrics
        total_apps = len(applications)
        total_resumes = len(resumes)
        
        # Filters
        history_scores = []
        for h in history:
            result = h.get("analysis_result", {})
            if "JD-Match" in result:
                history_scores.append({
                    "score": result["JD-Match"],
                    "date": h.get("created_at", now),
                    "resume_id": h.get("resume_id")
                })
                
        ats_scores = [app.ats_score for app in applications if app.ats_score is not None] + [h["score"] for h in history_scores]
        offers = [app for app in applications if app.status.lower() == 'offered']
        rejections = [app for app in applications if app.status.lower() == 'rejected']
        interviews = [app for app in applications if app.status.lower() == 'interview scheduled']
        wishlists = [app for app in applications if app.status.lower() == 'wishlist']
        
        avg_ats = sum(ats_scores) / len(ats_scores) if ats_scores else 0
        success_rate = (len(offers) / total_apps * 100) if total_apps > 0 else 0
        
        summary = {
            "applications": total_apps,
            "resumes": total_resumes,
            "average_ats": int(avg_ats),
            "offers": len(offers),
            "wishlist": len(wishlists),
            "rejections": len(rejections),
            "interviews": len(interviews),
            "success_rate": round(success_rate, 1)
        }
        
        # Application Stats
        apps_this_month = len([app for app in applications if app.application_date.year == now.year and app.application_date.month == now.month])
        apps_this_week = len([app for app in applications if app.application_date >= now - timedelta(days=7)])
        apps_today = len([app for app in applications if app.application_date.date() == now.date()])
        
        platforms = [app.platform for app in applications if app.platform]
        most_used_platform = Counter(platforms).most_common(1)[0][0] if platforms else "N/A"
        
        resume_counts = Counter([str(app.resume_used) for app in applications if app.resume_used])
        most_used_resume_id = resume_counts.most_common(1)[0][0] if resume_counts else None
        most_used_resume_name = next((r.title for r in resumes if str(r.id) == most_used_resume_id), "N/A") if most_used_resume_id else "N/A"
        
        first_app_date = min([app.application_date for app in applications]) if applications else now
        weeks_active = max((now - first_app_date).days / 7, 1)
        avg_apps_per_week = round(total_apps / weeks_active, 1)
        
        application_statistics = {
            "apps_this_month": apps_this_month,
            "apps_this_week": apps_this_week,
            "apps_today": apps_today,
            "avg_apps_per_week": avg_apps_per_week,
            "most_used_resume": most_used_resume_name,
            "most_used_platform": most_used_platform
        }
        
        # Resume Stats
        resume_performance = defaultdict(list)
        for app in applications:
            if app.resume_used and app.ats_score:
                resume_performance[str(app.resume_used)].append(app.ats_score)
                
        for h in history_scores:
            if h.get("resume_id"):
                resume_performance[str(h["resume_id"])].append(h["score"])
                
        highest_scoring_resume = "N/A"
        max_avg_score = 0
        for res_id, scores in resume_performance.items():
            avg_score = sum(scores) / len(scores)
            if avg_score > max_avg_score:
                max_avg_score = avg_score
                highest_scoring_resume = next((r.title for r in resumes if str(r.id) == res_id), "Unknown")
                
        latest_resume = sorted(resumes, key=lambda x: x.created_at, reverse=True)[0].title if resumes else "N/A"
        
        resume_statistics = {
            "total": total_resumes,
            "latest": latest_resume,
            "most_used": most_used_resume_name,
            "highest_scoring": highest_scoring_resume,
        }
        
        # ATS Analytics
        ats_analytics = {
            "highest": max(ats_scores) if ats_scores else 0,
            "lowest": min(ats_scores) if ats_scores else 0,
            "average": int(avg_ats),
            "median": statistics.median(ats_scores) if ats_scores else 0,
        }
        
        # Charts
        # 1. ATS Score Trend
        combined_ats_events = []
        for app in applications:
            if app.ats_score:
                combined_ats_events.append({
                    "date_obj": app.application_date,
                    "date": app.application_date.strftime("%b %d"),
                    "score": app.ats_score,
                    "company": app.company
                })
        for h in history_scores:
            combined_ats_events.append({
                "date_obj": h["date"],
                "date": h["date"].strftime("%b %d"),
                "score": h["score"],
                "company": "Analysis Report"
            })
            
        combined_ats_events.sort(key=lambda x: x["date_obj"])
        ats_trend = [{"date": e["date"], "score": e["score"], "company": e["company"]} for e in combined_ats_events]
        # 2. Application Status
        status_counts = Counter([app.status for app in applications])
        status_distribution = [{"name": status, "value": count} for status, count in status_counts.items()]
        
        # 3. Applications Per Month
        month_counts = Counter([app.application_date.strftime("%b %Y") for app in applications])
        apps_per_month = [{"month": month, "count": count} for month, count in month_counts.items()]
        
        # 4. ATS Score Distribution
        score_bins = {"0-60": 0, "60-70": 0, "70-80": 0, "80-90": 0, "90-100": 0}
        for score in ats_scores:
            if score < 60: score_bins["0-60"] += 1
            elif score < 70: score_bins["60-70"] += 1
            elif score < 80: score_bins["70-80"] += 1
            elif score < 90: score_bins["80-90"] += 1
            else: score_bins["90-100"] += 1
        ats_distribution = [{"range": k, "count": v} for k, v in score_bins.items()]
        
        # 5. Resume Performance Comparison
        resume_comp = []
        for res in resumes:
            scores = resume_performance.get(str(res.id), [])
            avg = int(sum(scores) / len(scores)) if scores else 0
            resume_comp.append({"name": res.title, "score": avg})
            
        # 6. Top Companies
        company_counts = Counter([app.company for app in applications])
        top_companies = [{"company": comp, "count": count} for comp, count in company_counts.most_common(5)]
        
        charts = {
            "ats_trend": ats_trend,
            "status_distribution": status_distribution,
            "apps_per_month": apps_per_month,
            "ats_distribution": ats_distribution,
            "resume_performance": resume_comp,
            "top_companies": top_companies
        }
        
        # Recent Activity (last 10 apps for simplicity, could merge with resumes)
        recent_activity = []
        sorted_apps = sorted(applications, key=lambda x: x.application_date)
        for app in sorted_apps[-10:]:
            recent_activity.append({
                "type": "Application",
                "title": f"Applied to {app.company} for {app.job_title}",
                "date": app.application_date.isoformat(),
                "status": app.status
            })
        # Sort newest first
        recent_activity.reverse()
        
        # Upcoming Interviews
        upcoming_interviews = []
        for app in applications:
            if app.interview_date and app.interview_date > now:
                res_name = next((r.title for r in resumes if str(r.id) == str(app.resume_used)), "N/A")
                upcoming_interviews.append({
                    "company": app.company,
                    "job_title": app.job_title,
                    "date": app.interview_date.isoformat(),
                    "resume_used": res_name
                })
        upcoming_interviews.sort(key=lambda x: x["date"])
        
        return {
            "summary": summary,
            "application_statistics": application_statistics,
            "resume_statistics": resume_statistics,
            "ats_analytics": ats_analytics,
            "charts": charts,
            "recent_activity": recent_activity,
            "upcoming_interviews": upcoming_interviews
        }

analytics_service = AnalyticsService()
