from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any) -> Any:
        from pydantic_core import core_schema
        return core_schema.with_info_before_validator_function(
            cls.validate, 
            core_schema.str_schema()
        )

    @classmethod
    def validate(cls, v: Any, _: Any) -> str:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class ResumeModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    title: str
    file_name: str
    file_path: str
    mime_type: str
    resume_text: str
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class ProfileUpdateModel(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    skills: Optional[str] = None
    employment_status: Optional[str] = None

class ApplicationModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    company: str
    job_title: str
    job_link: Optional[str] = None
    platform: Optional[str] = None
    resume_used: Optional[PyObjectId] = None
    application_date: datetime = Field(default_factory=datetime.utcnow)
    ats_score: Optional[int] = None
    status: str = "Wishlist"  # e.g., Wishlist, Applied, Interview Scheduled, etc.
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class TailorResumeRequest(BaseModel):
    resume_id: str
    job_description: str

class TailorResumeResponse(BaseModel):
    is_compatible: bool
    compatibility_warning: Optional[str] = None
    tailored_resume: str
    changes_summary: List[str]
    keyword_additions: List[str]

class ExportRequest(BaseModel):
    format: str
    markdown_text: str

class InterviewQuestion(BaseModel):
    category: str
    difficulty: str
    question: str
    suggested_answer: str

class InterviewPrepRequest(BaseModel):
    resume_id: str
    jd_text: Optional[str] = None
    jd_file: Optional[str] = None

class InterviewPrepResponse(BaseModel):
    questions: List[InterviewQuestion]
