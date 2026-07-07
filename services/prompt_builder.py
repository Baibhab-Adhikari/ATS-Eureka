def build_tailoring_prompt(resume_text: str, jd_text: str) -> str:
    return f"""
You are an expert executive resume writer and ATS optimization specialist.
Your task is to tailor a candidate's resume for a specific Job Description (JD) while STRICTLY PRESERVING FACTUAL ACCURACY.

CRITICAL RULES:
1. First, perform a semantic compatibility check. If the candidate's CV has 0% overlap with the core requirements of the JD (e.g., completely different industry and skills), set `is_compatible` to false and provide a concise `compatibility_warning`. Do not attempt to tailor the resume if they are completely incompatible.
2. If they are somewhat compatible, set `is_compatible` to true.
3. NEVER invent work experience, companies, projects, or achievements.
4. NEVER invent certifications, skills, or fabricate numbers/metrics.
5. EVERY factual statement in your output MUST exist in the original resume.
6. You MAY rewrite wording for impact, improve grammar, optimize for ATS keywords, and reorder bullet points.
7. Optimize the resume so it reads beautifully in Markdown format (use ## for sections, * for bullets).
8. Ensure a professional tone throughout.

Return your response STRICTLY as a valid JSON object matching the requested schema.

ORIGINAL RESUME:
{resume_text}

TARGET JOB DESCRIPTION:
{jd_text}
"""

def build_interview_prep_prompt(resume_text: str, jd_text: str) -> str:
    return f"""
You are an expert technical recruiter and hiring manager. Your task is to generate 
a comprehensive set of interview questions for a candidate based on their Resume and the Job Description.

Create exactly 9 to 12 highly tailored questions, distributed evenly across three categories:
1. Project-based: Specific to the candidate's past projects, probing their role and technical depth.
2. Behavioral: Standard behavioral questions (e.g. STAR method) tailored to the role's seniority.
3. Scenario-based: Hypothetical problems directly related to the Job Description's requirements.

For each question, provide:
- category: 'Project', 'Behavioral', or 'Scenario'.
- difficulty: 'Easy', 'Medium', or 'Hard'.
- question: The interview question text.
- suggested_answer: Key points or a suggested structure for the best possible answer.

=== CANDIDATE RESUME ===
{resume_text}

=== JOB DESCRIPTION ===
{jd_text}
"""
