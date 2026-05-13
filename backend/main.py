# ============================================================
#  Career Guidance System — FastAPI Backend  v3.0
#  File: main.py
#  Run: uvicorn main:app --reload
#  Docs: http://127.0.0.1:8000/docs
#
#  New in v3.0:
#  - College type detection (IIT / NIT / IIM / AIIMS / Govt / Private)
#  - Estimated fee range per college based on type
#  - Budget filter: student sets max annual fees they can afford
#  - Mode of classes: Offline / Online / Distance
#    → each college type is tagged with supported modes
#  - All v2.0 features retained (eligibility, city jobs, marks)
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import pickle
import re
import os

# ── App Setup ────────────────────────────────────────────────
app = FastAPI(
    title="Career Guidance System API",
    description="Predicts careers (15 classes, v3 model), filters colleges by budget & mode, sorts jobs by city.",
    version="3.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load Model & Data ─────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_file(filename):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Required file not found: {filename}")
    return path

import warnings
warnings.filterwarnings("ignore")

with open(load_file("career_guidance_v3.pkl"), "rb") as f:
    _bundle = pickle.load(f)

model_pipeline  = _bundle["model"]
label_encoder   = _bundle["label_encoder"]
df_colleges     = _bundle["df_colleges"]
df_jobs         = _bundle["df_jobs"]

# Use domain/keyword maps from the bundle (15-career v3 mappings)
_BUNDLE_DOMAIN_MAP = _bundle["career_domain_map"]
_BUNDLE_JOB_KW     = _bundle["career_job_keywords"]

print(f"✅ career_guidance_v3.pkl loaded — {len(label_encoder.classes_)} careers | "
      f"{len(df_colleges)} colleges | {len(df_jobs)} jobs")

# ── College Type Detection ────────────────────────────────────
#
# We detect college type from the college name string.
# This lets us assign realistic fee ranges and supported modes
# without needing extra data.
#
# Types and their annual fee estimates (in INR lakhs):
#
#   IIT        →  8 – 10 L/year   (Offline only)
#   NIT        →  4 –  6 L/year   (Offline only)
#   IIM        → 15 – 25 L/year   (Offline only)
#   AIIMS      →  0 –  1 L/year   (Offline only, Govt funded)
#   IGNOU      →  0.1– 0.5L/year  (Distance / Online)
#   Govt/State →  1 –  3 L/year   (Offline + Distance)
#   Private    →  2 – 15 L/year   (Offline + Online + Distance)

COLLEGE_TYPE_RULES = [
    # (keyword_in_name,  type_label,   fee_min_L, fee_max_L,  modes)
    ("indian institute of technology",  "IIT",     8,   10,  ["Offline"]),
    ("iit ",                            "IIT",     8,   10,  ["Offline"]),
    ("national institute of technology","NIT",     4,    6,  ["Offline"]),
    ("nit ",                            "NIT",     4,    6,  ["Offline"]),
    ("indian institute of management",  "IIM",    15,   25,  ["Offline"]),
    ("iim ",                            "IIM",    15,   25,  ["Offline"]),
    ("all india institute of medical",  "AIIMS",   0,    1,  ["Offline"]),
    ("aiims",                           "AIIMS",   0,    1,  ["Offline"]),
    ("indira gandhi national open",     "IGNOU",   0,    1,  ["Online", "Distance"]),
    ("ignou",                           "IGNOU",   0,    1,  ["Online", "Distance"]),
    ("indian agricultural research",    "Govt",    1,    2,  ["Offline"]),
    ("university of delhi",             "Govt",    1,    3,  ["Offline", "Distance"]),
    ("jawaharlal nehru university",     "Govt",    1,    2,  ["Offline"]),
    ("banaras hindu university",        "Govt",    1,    3,  ["Offline"]),
    ("anna university",                 "Govt",    1,    3,  ["Offline"]),
    ("university",                      "Govt",    1,    4,  ["Offline", "Distance"]),
    ("institute of technology",         "Private", 3,   12,  ["Offline", "Online"]),
    ("college of engineering",          "Private", 2,   10,  ["Offline", "Online"]),
    ("school of",                       "Private", 3,   15,  ["Offline", "Online", "Distance"]),
]

def detect_college_type(name: str):
    """
    Returns (type_label, fee_min_lakhs, fee_max_lakhs, supported_modes)
    by matching college name against known keyword patterns.
    Defaults to Private if no match found.
    """
    name_lower = name.lower()
    for keyword, ctype, fee_min, fee_max, modes in COLLEGE_TYPE_RULES:
        if keyword in name_lower:
            return ctype, fee_min, fee_max, modes
    # Default: Private college
    return "Private", 2, 15, ["Offline", "Online", "Distance"]


def fee_label(fee_min: float, fee_max: float) -> str:
    """Human-readable fee range string."""
    if fee_max <= 1:
        return f"₹{fee_min:.1f}L – ₹{fee_max:.1f}L / year (Govt funded)"
    return f"₹{fee_min}L – ₹{fee_max}L / year"


# ── College Eligibility Logic ─────────────────────────────────
def get_eligibility_tag(nirf_score: float, marks_12: Optional[float], cgpa: Optional[float]) -> str:
    academic_score = None
    if marks_12 is not None:
        academic_score = marks_12
    elif cgpa is not None:
        academic_score = cgpa * 10

    if academic_score is None:
        return "Unknown"

    if nirf_score >= 75:
        if academic_score >= 90:   return "Eligible ✅"
        elif academic_score >= 80: return "Reach 🎯"
        else:                      return "Aspirational 🌟"
    elif nirf_score >= 60:
        if academic_score >= 75:   return "Eligible ✅"
        elif academic_score >= 60: return "Reach 🎯"
        else:                      return "Aspirational 🌟"
    else:
        if academic_score >= 50:   return "Eligible ✅"
        else:                      return "Reach 🎯"


# ── Career Mappings ───────────────────────────────────────────
CAREER_DOMAIN_MAP = {
    # 15 v3 career classes — mapped to NIRF domain strings
    "Software Developer"  : "Technology/IT,Engineering",
    "ML/AI Engineer"      : "Technology/IT,Engineering",
    "Data Analyst"        : "Technology/IT,Engineering",
    "Data Engineer"       : "Technology/IT,Engineering",
    "DevOps Engineer"     : "Technology/IT,Engineering",
    "Research Scientist"  : "Technology/IT,Engineering",
    "Mechanical Engineer" : "Technology/IT,Engineering",
    "Civil Engineer"      : "Technology/IT,Engineering",
    "Project Manager"     : "Business/Finance",
    "Graphic Designer"    : "Creative/Design,Engineering",
    "UI/UX Designer"      : "Creative/Design,Engineering",
    "Finance"             : "Business/Finance",
    "Marketing"           : "Business/Finance",
    "Sales Executive"     : "Business/Finance",
    "Teacher"             : "Business/Finance",
    # Legacy names kept for backward-compat (predict/detailed calls)
    "Full Stack Developer"     : "Technology/IT,Engineering",
    "Web Developer"            : "Technology/IT,Engineering",
    "Mobile App Developer"     : "Technology/IT,Engineering",
    "QA/Test Engineer"         : "Technology/IT,Engineering",
    "Cybersecurity Analyst"    : "Technology/IT,Engineering",
    "Embedded Systems Engineer": "Technology/IT,Engineering",
    "Digital Marketer"         : "Business/Finance",
    "Business Analyst"         : "Business/Finance",
    "Financial Analyst"        : "Business/Finance",
    "HR"                       : "Business/Finance",
    "Content Writer"           : "Business/Finance",
    "Teacher/Professor"        : "Business/Finance",
    "Data Scientist"           : "Technology/IT,Engineering",
    "Medical Practitioner"     : "Healthcare",
}

CAREER_JOB_KEYWORDS = {
    # ── 15 v3 career classes ──────────────────────────────────
    "Software Developer"  : ["software developer", "software engineer", "backend developer", "java developer", "python developer"],
    "ML/AI Engineer"      : ["machine learning", "data scientist", "artificial intelligence", "nlp engineer", "ai developer"],
    "Data Analyst"        : ["data analyst", "business analyst", "analytics", "business intelligence"],
    "Data Engineer"       : ["data engineer", "etl", "pipeline", "spark", "hadoop"],
    "DevOps Engineer"     : ["devops", "cloud engineer", "aws engineer", "kubernetes", "docker"],
    "Research Scientist"  : ["research scientist", "r&d engineer", "research engineer", "research associate", "lab researcher"],
    "Mechanical Engineer" : ["mechanical engineer", "design engineer", "production engineer", "autocad"],
    "Civil Engineer"      : ["civil engineer", "structural engineer", "construction", "site engineer"],
    "Project Manager"     : ["project manager", "program manager", "scrum master", "delivery manager"],
    "Graphic Designer"    : ["graphic designer", "visual designer", "creative designer", "illustrator"],
    "UI/UX Designer"      : ["ui designer", "ux designer", "product designer", "figma"],
    "Finance"             : ["finance", "accountant", "financial analyst", "banking", "investment"],
    "Marketing"           : ["marketing", "digital marketing", "seo", "social media", "content"],
    "Sales Executive"     : ["sales executive", "business development", "sales manager", "bdm"],
    "Teacher"             : ["teacher", "professor", "lecturer", "tutor", "educator"],
    # ── Legacy names kept for backward-compat ─────────────────
    "Full Stack Developer"     : ["full stack", "fullstack", "mern", "mean"],
    "Data Scientist"           : ["data scientist", "data science"],
    "Web Developer"            : ["web developer", "front end", "frontend", "react", "angular", "vue"],
    "Mobile App Developer"     : ["flutter", "react native", "ios", "android", "mobile"],
    "QA/Test Engineer"         : ["test", "qa", "quality", "automation tester", "sdet"],
    "Cybersecurity Analyst"    : ["security", "cyber", "penetration", "ethical hacker"],
    "Embedded Systems Engineer": ["embedded", "vlsi", "firmware", "hardware"],
    "Digital Marketer"         : ["marketing", "seo", "social media", "digital marketing"],
    "Business Analyst"         : ["business analyst", "consultant", "ba"],
    "Financial Analyst"        : ["finance", "accountant", "ca", "chartered", "financial"],
    "HR"                       : ["hr", "human resource", "talent", "recruiter"],
    "Content Writer"           : ["content", "writer", "copywriter", "editor", "seo writer"],
    "Teacher/Professor"        : ["teacher", "tutor", "professor", "lecturer", "educator"],
    "Medical Practitioner"     : ["doctor", "physician", "medical", "clinical", "health"],
}


# ── Helper: Get Colleges ──────────────────────────────────────
def get_matching_colleges(
    career         : str,
    marks_12       : Optional[float] = None,
    cgpa           : Optional[float] = None,
    budget_lakhs   : Optional[float] = None,
    preferred_mode : Optional[str]   = None,
    preferred_city : Optional[str]   = None,
    top_k          : int = 8,
) -> list:

    domain_str = CAREER_DOMAIN_MAP.get(career, "")
    if not domain_str:
        return []

    # Exact match against the college's domain column value.
    # The domain column contains values like "Technology/IT,Engineering",
    # "Creative/Design,Engineering", "Business/Finance" etc.
    # We match the full domain_str exactly so "Engineering" in
    # "Technology/IT,Engineering" never bleeds into "Creative/Design,Engineering".
    mask    = df_colleges["domain"].fillna("") == domain_str
    matches = df_colleges[mask].copy()

    result = []
    for _, row in matches.iterrows():
        name                           = row["college_name"]
        ctype, fee_min, fee_max, modes = detect_college_type(name)

        if budget_lakhs is not None:
            if fee_min > budget_lakhs:
                continue

        if preferred_mode and preferred_mode.strip():
            mode_clean = preferred_mode.strip().capitalize()
            if mode_clean not in modes:
                continue

        city_match = False
        if preferred_city and preferred_city.strip():
            city_q = preferred_city.strip().lower()
            city_q = {"bangalore": "bengaluru", "bombay": "mumbai",
                      "madras": "chennai", "calcutta": "kolkata"}.get(city_q, city_q)
            city_match = city_q in str(row["city"]).lower()

        result.append({
            "college_name" : name,
            "city"         : row["city"],
            "state"        : row["state"],
            "nirf_rank"    : int(row["nirf_rank"]),
            "nirf_score"   : float(row["nirf_score"]),
            "field"        : row["field"],
            "college_type" : ctype,
            "fee_range"    : fee_label(fee_min, fee_max),
            "fee_min_lakhs": fee_min,
            "fee_max_lakhs": fee_max,
            "modes_offered": modes,
            "eligibility"  : get_eligibility_tag(float(row["nirf_score"]), marks_12, cgpa),
            "city_match"   : city_match,
        })

        if len(result) >= top_k * 3:
            break

    result.sort(key=lambda x: (not x["city_match"], x["nirf_rank"]))
    return result[:5]


# ── Helper: Get Jobs ─────────────────────────────────────────

# Broader keyword sets that match actual job titles in the dataset
BROAD_JOB_KEYWORDS = {
    "ML/AI Engineer"      : ["machine learning", "python", "data", "developer", "engineer"],
    "Data Analyst"        : ["data", "analyst", "python", "developer", "software"],
    "Data Engineer"       : ["data", "python", "developer", "engineer", "software"],
    "DevOps Engineer"     : ["devops", "cloud", "aws", "network", "engineer", "support engineer"],
    "Research Scientist"  : ["developer", "engineer", "python", "software", "analyst"],
    "Mechanical Engineer" : ["engineer", "developer", "technical", "embedded"],
    "Civil Engineer"      : ["engineer", "developer", "technical", "support engineer"],
    "Project Manager"     : ["manager", "developer", "analyst", "technical lead", "software"],
    "Graphic Designer"    : ["designer", "ui", "ux", "web", "developer"],
    "UI/UX Designer"      : ["ui", "ux", "designer", "web", "developer"],
    "Finance"             : ["developer", "analyst", "engineer", "software", "python"],
    "Marketing"           : ["developer", "analyst", "engineer", "software", "web"],
    "Sales Executive"     : ["developer", "support", "analyst", "engineer", "software"],
    "Teacher"             : ["trainer", "developer", "engineer", "technical", "software"],
    # Legacy names
    "Full Stack Developer"     : ["full stack", "fullstack", "mern", "developer", "web"],
    "Data Scientist"           : ["machine learning", "python", "data", "developer"],
    "Web Developer"            : ["web", "frontend", "react", "angular", "developer"],
    "Mobile App Developer"     : ["flutter", "react native", "android", "ios", "mobile"],
    "QA/Test Engineer"         : ["test", "qa", "quality", "tester", "engineer"],
    "Cybersecurity Analyst"    : ["network", "security", "engineer", "support", "developer"],
    "Embedded Systems Engineer": ["embedded", "firmware", "hardware", "iot", "engineer"],
    "Digital Marketer"         : ["developer", "web", "analyst", "engineer", "software"],
    "Business Analyst"         : ["analyst", "developer", "software", "engineer"],
    "Financial Analyst"        : ["developer", "analyst", "engineer", "software"],
    "HR"                       : ["developer", "support", "analyst", "engineer"],
    "Content Writer"           : ["developer", "web", "analyst", "engineer"],
    "Teacher/Professor"        : ["trainer", "developer", "engineer", "technical"],
    "Medical Practitioner"     : ["developer", "engineer", "support", "analyst"],
    "Software Developer"       : ["software", "developer", "engineer", "python", "java"],
}

def get_matching_jobs(
    career        : str,
    preferred_city: Optional[str] = None,
    top_k         : int = 10
) -> list:
    def _search(keywords):
        pattern = "|".join(keywords)
        mask    = df_jobs["job_title"].fillna("").str.lower().str.contains(pattern, na=False)
        return df_jobs[mask].copy()

    # Try specific keywords first
    keywords = CAREER_JOB_KEYWORDS.get(career, [career.lower()])
    matches  = _search(keywords)

    # If fewer than 3 results, fall back to broader keywords
    if len(matches) < 3:
        broad = BROAD_JOB_KEYWORDS.get(career, ["developer", "engineer", "software"])
        matches = _search(broad)

    # Normalise common city name variants before matching
    CITY_ALIASES = {
        "bangalore": "bengaluru",
        "bombay"   : "mumbai",
        "madras"   : "chennai",
        "calcutta" : "kolkata",
    }
    matches["has_salary"] = matches["salary_annual_inr"].notna()
    matches["city_match"] = False
    if preferred_city and preferred_city.strip():
        city_q = preferred_city.strip().lower()
        city_q = CITY_ALIASES.get(city_q, city_q)   # normalise alias
        matches["city_match"] = matches["city"].fillna("").str.lower().str.contains(
            city_q, na=False
        )

    matches = matches.sort_values(
        ["city_match", "has_salary", "salary_annual_inr"],
        ascending=[False, False, False]
    )

    result = []
    for _, row in matches.head(top_k).iterrows():
        salary = None if pd.isna(row["salary_annual_inr"]) else float(row["salary_annual_inr"])
        result.append({
            "job_title"        : row["job_title"],
            "location"         : row["location"],
            "city"             : row["city"],
            "salary_annual_inr": salary,
            "preferred_city"   : bool(row["city_match"]),
        })

    return result


# ── Schemas ───────────────────────────────────────────────────

class PredictRequest(BaseModel):
    # Required
    skills   : str
    interests: str
    top_n    : int = 3

    # Academic profile (optional)
    marks_10th    : Optional[float] = None
    marks_12th    : Optional[float] = None
    cgpa          : Optional[float] = None
    degree        : Optional[str]   = None
    specialization: Optional[str]   = None

    # Preferences (optional)
    preferred_city: Optional[str]   = None
    budget_lakhs  : Optional[float] = None  # max annual college fees in lakhs
                                             # e.g. 5.0 means student can afford up to ₹5L/year
    preferred_mode: Optional[str]   = None  # "Offline" / "Online" / "Distance"

class CareerResult(BaseModel):
    rank      : int
    career    : str
    confidence: float

class CollegeResult(BaseModel):
    college_name : str
    city         : str
    state        : str
    nirf_rank    : int
    nirf_score   : float
    field        : str
    college_type : str           # IIT / NIT / IIM / AIIMS / Govt / Private
    fee_range    : str           # "₹8L – ₹10L / year"
    fee_min_lakhs: float
    fee_max_lakhs: float
    modes_offered: List[str]     # ["Offline"] or ["Online", "Distance"] etc.
    eligibility  : str           # Eligible ✅ / Reach 🎯 / Aspirational 🌟
    city_match   : bool = False  # True if college is in student preferred city

class JobResult(BaseModel):
    job_title        : str
    location         : str
    city             : str
    salary_annual_inr: Optional[float] = None
    preferred_city   : bool

class StudentProfile(BaseModel):
    marks_10th    : Optional[float] = None
    marks_12th    : Optional[float] = None
    cgpa          : Optional[float] = None
    degree        : Optional[str]   = None
    specialization: Optional[str]   = None
    preferred_city: Optional[str]   = None
    budget_lakhs  : Optional[float] = None
    preferred_mode: Optional[str]   = None

class PredictResponse(BaseModel):
    input_skills   : str
    input_interests: str
    student_profile: StudentProfile
    careers        : List[CareerResult]
    colleges       : List[CollegeResult]
    jobs           : List[JobResult]


# ── Routes ───────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "status" : "running",
        "version": "3.1.0",
        "message": "Career Guidance System API is live.",
        "docs"   : "/docs",
    }


@app.get("/careers", tags=["Info"])
def list_careers():
    """Returns all 15 career categories the model can predict (v3)."""
    return {"total": len(label_encoder.classes_), "careers": list(label_encoder.classes_)}


@app.get("/colleges", tags=["Info"])
def list_colleges(field: str = None, limit: int = 20):
    """Browse NIRF colleges. Filter by field name."""
    df = df_colleges.copy()
    if field:
        df = df[df["field"].str.lower() == field.lower()]
    result = df.head(limit)[["college_name", "city", "state", "nirf_rank", "nirf_score", "field"]].to_dict(orient="records")
    return {"total": len(result), "colleges": result}


@app.get("/jobs", tags=["Info"])
def list_jobs(keyword: str = None, city: str = None, limit: int = 20):
    """Browse fresher jobs. Filter by keyword and/or city."""
    df = df_jobs.copy()
    if keyword:
        df = df[df["job_title"].str.lower().str.contains(keyword.lower(), na=False)]
    if city:
        df = df[df["city"].str.lower().str.contains(city.lower(), na=False)]
    result = df.head(limit)[["job_title", "location", "city", "salary_annual_inr"]].to_dict(orient="records")
    for row in result:
        if pd.isna(row.get("salary_annual_inr")):
            row["salary_annual_inr"] = None
    return {"total": len(result), "jobs": result}


@app.get("/college-types", tags=["Info"])
def college_types_info():
    """
    Returns the fee ranges and modes used for each college type.
    Useful for showing students what to expect before they set a budget.
    """
    return {
        "college_types": [
            {"type": "IIT",     "fee_range": "₹8L – ₹10L/year",  "modes": ["Offline"],                       "description": "Indian Institutes of Technology"},
            {"type": "NIT",     "fee_range": "₹4L – ₹6L/year",   "modes": ["Offline"],                       "description": "National Institutes of Technology"},
            {"type": "IIM",     "fee_range": "₹15L – ₹25L/year", "modes": ["Offline"],                       "description": "Indian Institutes of Management"},
            {"type": "AIIMS",   "fee_range": "₹0.1L – ₹1L/year", "modes": ["Offline"],                       "description": "All India Institute of Medical Sciences (Govt funded)"},
            {"type": "IGNOU",   "fee_range": "₹0.1L – ₹0.5L/year","modes": ["Online", "Distance"],           "description": "Indira Gandhi National Open University"},
            {"type": "Govt",    "fee_range": "₹1L – ₹3L/year",   "modes": ["Offline", "Distance"],           "description": "Government / State Universities"},
            {"type": "Private", "fee_range": "₹2L – ₹15L/year",  "modes": ["Offline", "Online", "Distance"], "description": "Private Colleges and Deemed Universities"},
        ],
        "note": "Fee ranges are estimated averages. Actual fees vary by course and college."
    }


# ── Career Prep Data ─────────────────────────────────────────
# All 22 careers with skills, certifications, tools, timeline, tip
CAREER_PREP_DATA = {
    "Software Developer": {
        "skills":         ["Data Structures & Algorithms", "Object-Oriented Programming", "Version Control (Git)", "REST APIs", "Database Design (SQL/NoSQL)", "System Design basics"],
        "certifications": ["Oracle Java SE Certification", "AWS Certified Developer", "Meta Back-End Developer (Coursera)", "Google Associate Android Developer"],
        "tools":          ["VS Code / IntelliJ IDEA", "Git & GitHub", "Postman", "Docker", "JIRA", "Linux Terminal"],
        "timeline":       "6-12 months",
        "tip":            "Build 3-5 real projects and put them on GitHub before applying. Recruiters check repos.",
    },
    "Full Stack Developer": {
        "skills":         ["HTML/CSS/JavaScript", "React or Vue.js", "Node.js / Express", "SQL & MongoDB", "REST APIs", "Deployment (Vercel, Netlify, AWS)"],
        "certifications": ["Meta Full-Stack Developer (Coursera)", "freeCodeCamp Full Stack", "The Odin Project (free)", "AWS Certified Developer"],
        "tools":          ["VS Code", "Git & GitHub", "Figma (for UI reference)", "Postman", "MongoDB Compass", "Vercel"],
        "timeline":       "8-14 months",
        "tip":            "Build and deploy at least one full-stack project with auth, database, and a live URL.",
    },
    "ML/AI Engineer": {
        "skills":         ["Python (NumPy, Pandas)", "Machine Learning (scikit-learn)", "Deep Learning (TensorFlow / PyTorch)", "Statistics & Probability", "Data Preprocessing", "Model Deployment (FastAPI / Flask)"],
        "certifications": ["Google ML Crash Course (free)", "DeepLearning.AI TensorFlow Developer", "Coursera Machine Learning Specialization", "AWS Machine Learning Specialty"],
        "tools":          ["Jupyter Notebook", "Google Colab", "TensorFlow / PyTorch", "scikit-learn", "Hugging Face", "MLflow"],
        "timeline":       "10-18 months",
        "tip":            "Kaggle competitions are the best way to build a portfolio. Aim for top 20% in at least one competition.",
    },
    "Data Scientist": {
        "skills":         ["Python & R", "Statistics & Probability", "Machine Learning", "Data Visualization (Matplotlib, Seaborn)", "SQL", "Feature Engineering"],
        "certifications": ["IBM Data Science Professional (Coursera)", "Google Data Analytics", "Kaggle certifications", "Microsoft Azure Data Scientist Associate"],
        "tools":          ["Jupyter Notebook", "Pandas / NumPy", "Tableau / Power BI", "scikit-learn", "SQL (PostgreSQL)", "Spark (for big data)"],
        "timeline":       "10-16 months",
        "tip":            "A strong portfolio of 3-4 end-to-end projects (problem -> data -> model -> insights) is more valuable than certifications.",
    },
    "Data Analyst": {
        "skills":         ["SQL (advanced queries)", "Excel & Google Sheets", "Python (Pandas, Matplotlib)", "Data Visualization", "Business Understanding", "Statistics basics"],
        "certifications": ["Google Data Analytics (Coursera)", "Microsoft Power BI Data Analyst", "IBM Data Analyst Professional", "Tableau Desktop Specialist"],
        "tools":          ["Excel / Google Sheets", "Power BI / Tableau", "SQL (MySQL, PostgreSQL)", "Python (Pandas)", "Looker Studio"],
        "timeline":       "4-8 months",
        "tip":            "Practice SQL daily on LeetCode or HackerRank. Most analyst interviews are 60% SQL.",
    },
    "Data Engineer": {
        "skills":         ["SQL & NoSQL databases", "Python scripting", "Apache Spark", "ETL pipelines", "Cloud platforms (AWS/GCP/Azure)", "Data warehousing (Snowflake, BigQuery)"],
        "certifications": ["Google Professional Data Engineer", "AWS Data Analytics Specialty", "Databricks Certified Associate Developer", "dbt Analytics Engineering"],
        "tools":          ["Apache Spark", "Airflow", "dbt", "Snowflake", "BigQuery", "Kafka"],
        "timeline":       "12-18 months",
        "tip":            "Learn dbt and Airflow together - they are the two most in-demand data engineering tools right now.",
    },
    "Web Developer": {
        "skills":         ["HTML5 & CSS3", "JavaScript (ES6+)", "React / Vue / Angular", "Responsive Design", "Browser DevTools", "Basic SEO"],
        "certifications": ["freeCodeCamp Responsive Web Design", "Meta Front-End Developer (Coursera)", "W3Schools Frontend Certification", "Google UX Design Certificate"],
        "tools":          ["VS Code", "Chrome DevTools", "Figma", "Git & GitHub", "Netlify / Vercel", "npm"],
        "timeline":       "5-9 months",
        "tip":            "Build a personal portfolio website first. It is both practice and your best resume.",
    },
    "Mobile App Developer": {
        "skills":         ["Flutter / React Native OR Swift / Kotlin", "State management", "REST API integration", "App Store submission", "UI/UX principles", "Push notifications"],
        "certifications": ["Google Associate Android Developer", "Meta iOS Developer (Coursera)", "Flutter & Dart - Full Course (Udemy)", "React Native - The Practical Guide"],
        "tools":          ["Android Studio / Xcode", "Flutter SDK", "Firebase", "Postman", "Figma", "Git"],
        "timeline":       "8-14 months",
        "tip":            "Publish at least one app to the Play Store or App Store. It signals real-world experience instantly.",
    },
    "DevOps Engineer": {
        "skills":         ["Linux & Shell scripting", "Docker & Kubernetes", "CI/CD pipelines (GitHub Actions, Jenkins)", "Cloud (AWS/GCP/Azure)", "Infrastructure as Code (Terraform)", "Monitoring (Prometheus, Grafana)"],
        "certifications": ["AWS Solutions Architect Associate", "Certified Kubernetes Administrator (CKA)", "HashiCorp Terraform Associate", "Docker Certified Associate"],
        "tools":          ["Docker", "Kubernetes", "Terraform", "Jenkins / GitHub Actions", "Prometheus + Grafana", "AWS / GCP"],
        "timeline":       "12-20 months",
        "tip":            "Set up a home lab using free AWS/GCP credits. Hands-on practice with real cloud infra is non-negotiable.",
    },
    "QA/Test Engineer": {
        "skills":         ["Manual testing fundamentals", "Selenium / Playwright (automation)", "API testing (Postman)", "Test case design", "Bug reporting (JIRA)", "SQL basics"],
        "certifications": ["ISTQB Foundation Level", "Selenium WebDriver with Java (Udemy)", "Postman API Testing", "AWS Certified Cloud Practitioner"],
        "tools":          ["Selenium / Playwright", "Postman", "JIRA", "TestNG / JUnit", "BrowserStack", "Appium (mobile)"],
        "timeline":       "4-8 months",
        "tip":            "Learn API testing first - it is faster to learn and more in-demand than UI automation.",
    },
    "Cybersecurity Analyst": {
        "skills":         ["Networking fundamentals (TCP/IP, DNS)", "Linux command line", "Ethical hacking basics", "SIEM tools", "Vulnerability assessment", "Cryptography basics"],
        "certifications": ["CompTIA Security+", "Certified Ethical Hacker (CEH)", "Google Cybersecurity Certificate", "OSCP (advanced)"],
        "tools":          ["Kali Linux", "Wireshark", "Metasploit", "Burp Suite", "Nmap", "Splunk"],
        "timeline":       "10-18 months",
        "tip":            "Practice on TryHackMe and HackTheBox. Completing 50+ rooms on TryHackMe is considered solid beginner experience.",
    },
    "Embedded Systems Engineer": {
        "skills":         ["C / C++ programming", "Microcontrollers (Arduino, STM32)", "RTOS basics", "Digital electronics", "PCB reading", "Communication protocols (I2C, SPI, UART)"],
        "certifications": ["ARM Cortex-M Programming (Udemy)", "NPTEL Embedded Systems", "Texas Instruments Embedded Certification", "Coursera Embedded Software and Hardware Architecture"],
        "tools":          ["Keil MDK / STM32CubeIDE", "Oscilloscope & Logic Analyzer", "Arduino IDE", "Proteus (simulation)", "Git", "JTAG debugger"],
        "timeline":       "12-20 months",
        "tip":            "Build hardware projects. A blinking LED to a mini RTOS scheduler - document every build on GitHub.",
    },
    "Mechanical Engineer": {
        "skills":         ["AutoCAD & SolidWorks / CATIA", "Thermodynamics & Fluid Mechanics", "Manufacturing processes", "FEM / FEA basics", "GD&T (Geometric Dimensioning)", "Project management"],
        "certifications": ["SolidWorks CSWA / CSWP", "AutoCAD Certified User", "Six Sigma Green Belt", "ANSYS Mechanical certification"],
        "tools":          ["SolidWorks / CATIA / NX", "AutoCAD", "ANSYS", "MATLAB", "MS Project", "SAP PM"],
        "timeline":       "6-12 months",
        "tip":            "Get your CSWA certification early. It is free with student license and recognised across industries.",
    },
    "Civil Engineer": {
        "skills":         ["Structural analysis", "AutoCAD & STAAD.Pro", "Construction management", "Surveying", "Material science", "IS codes knowledge"],
        "certifications": ["STAAD.Pro certification", "AutoCAD Certified User", "PMP (Project Management)", "NICMAR construction management courses"],
        "tools":          ["AutoCAD", "STAAD.Pro / ETABS", "Revit (BIM)", "MS Project", "Google Earth Pro", "Primavera P6"],
        "timeline":       "6-12 months",
        "tip":            "Learn Revit and BIM modelling. The construction industry is rapidly shifting to BIM and it is a strong differentiator.",
    },
    "UI/UX Designer": {
        "skills":         ["Design thinking", "Wireframing & prototyping", "Figma (advanced)", "User research methods", "Visual design principles", "Usability testing"],
        "certifications": ["Google UX Design Certificate (Coursera)", "Interaction Design Foundation courses", "Figma UI UX Design Essentials (Udemy)", "Nielsen Norman Group UX Certification"],
        "tools":          ["Figma", "Adobe XD", "Maze (user testing)", "Miro (user journey)", "Zeplin", "InVision"],
        "timeline":       "5-9 months",
        "tip":            "Your portfolio is everything. Document your design process (research, wireframes, iterations, final design) for every project.",
    },
    "Graphic Designer": {
        "skills":         ["Adobe Illustrator & Photoshop", "Typography", "Colour theory", "Brand identity design", "Layout & composition", "Motion graphics basics"],
        "certifications": ["Adobe Certified Professional", "Canva Design School", "Coursera Graphic Design Specialization (CalArts)", "Shillington Graphic Design Certificate"],
        "tools":          ["Adobe Photoshop", "Adobe Illustrator", "Canva Pro", "Adobe InDesign", "After Effects (motion)", "Procreate (illustration)"],
        "timeline":       "4-8 months",
        "tip":            "Build a Behance profile. Clients and agencies specifically search Behance when hiring designers.",
    },
    "Digital Marketer": {
        "skills":         ["SEO & SEM", "Social media marketing", "Content marketing", "Google Ads & Meta Ads", "Email marketing", "Analytics (GA4)"],
        "certifications": ["Google Digital Marketing & E-commerce", "Meta Social Media Marketing", "HubSpot Content Marketing", "Google Analytics Individual Qualification"],
        "tools":          ["Google Analytics 4", "Google Ads", "Meta Business Suite", "SEMrush / Ahrefs", "Mailchimp", "Canva"],
        "timeline":       "3-6 months",
        "tip":            "Run a real campaign even with Rs 500 budget. Practical ad spend experience is far more valuable than theory.",
    },
    "Business Analyst": {
        "skills":         ["Requirements gathering", "SQL for data analysis", "Process mapping (BPMN)", "Excel & Power BI", "Stakeholder communication", "Agile / Scrum methodology"],
        "certifications": ["CBAP (Certified Business Analysis Professional)", "PMI-PBA", "Google Data Analytics", "Agile Analysis Certification (AAC)"],
        "tools":          ["Excel / Google Sheets", "Power BI / Tableau", "Confluence & JIRA", "Lucidchart (process maps)", "SQL", "MS Visio"],
        "timeline":       "5-9 months",
        "tip":            "Combine domain knowledge with data skills. A BA who can write SQL and build dashboards commands 40% higher salary.",
    },
    "Financial Analyst": {
        "skills":         ["Financial modelling (Excel)", "Valuation methods (DCF, comparables)", "Accounting fundamentals", "Financial statement analysis", "VBA / Python for finance", "Bloomberg Terminal basics"],
        "certifications": ["CFA Level 1", "NSE Certification in Financial Markets (NCFM)", "CPA / CA foundation", "Financial Modelling & Valuation Analyst (FMVA)"],
        "tools":          ["MS Excel (advanced)", "Bloomberg / Reuters Eikon", "Python (Pandas, yfinance)", "Tally / QuickBooks", "Power BI", "Capital IQ"],
        "timeline":       "8-14 months",
        "tip":            "Learn DCF modelling in Excel from scratch without a template. Being able to build a model from a blank sheet is the industry benchmark.",
    },
    "HR": {
        "skills":         ["Talent acquisition & sourcing", "HR information systems (HRIS)", "Labour law basics", "Performance management", "Onboarding design", "People analytics"],
        "certifications": ["SHRM-CP", "PHR (Professional in Human Resources)", "LinkedIn Recruiter Certification", "People Analytics (Coursera - Wharton)"],
        "tools":          ["Workday / SAP SuccessFactors", "LinkedIn Recruiter", "Zoho People / Darwinbox", "MS Excel", "Google Meet / Zoom", "ATS systems (Greenhouse, Lever)"],
        "timeline":       "3-6 months",
        "tip":            "Learn one HRIS platform deeply (Workday or Darwinbox). Most companies list it as a required skill.",
    },
    "Sales Executive": {
        "skills":         ["Lead generation & prospecting", "CRM management (Salesforce)", "Negotiation techniques", "Product knowledge", "Cold calling & email outreach", "Pipeline management"],
        "certifications": ["Salesforce Sales Representative Certification", "HubSpot Sales Software Certification", "Dale Carnegie Sales Training", "SPIN Selling certification"],
        "tools":          ["Salesforce / HubSpot CRM", "LinkedIn Sales Navigator", "Outreach.io / Apollo", "Zoom / Google Meet", "Excel / Google Sheets", "Lusha (prospecting)"],
        "timeline":       "2-4 months",
        "tip":            "Internship or part-time sales experience converts to full-time offers fast. Focus on quota attainment numbers in your resume.",
    },
    "Content Writer": {
        "skills":         ["SEO writing", "Research & fact-checking", "Storytelling & narrative structure", "Grammar & style (AP / Chicago)", "Content strategy basics", "Social media copywriting"],
        "certifications": ["HubSpot Content Marketing Certification", "Google Digital Marketing (content modules)", "Coursera Creative Writing Specialization", "SEMrush Content Marketing Toolkit Exam"],
        "tools":          ["Google Docs", "Grammarly / Hemingway App", "SEMrush / Ahrefs (SEO)", "WordPress / Ghost", "Notion (content calendar)", "Canva (visual content)"],
        "timeline":       "2-5 months",
        "tip":            "Start a blog or newsletter and write 20+ posts before applying. It is your portfolio and proves consistency.",
    },
    "Teacher/Professor": {
        "skills":         ["Subject matter expertise", "Lesson planning & curriculum design", "Classroom management", "Assessment design", "Communication & public speaking", "EdTech tools"],
        "certifications": ["B.Ed (Bachelor of Education)", "CTET / TET (for school teaching)", "UGC NET (for college lectureship)", "Coursera / edX teaching certificates"],
        "tools":          ["Google Classroom / Moodle", "Zoom / MS Teams", "Kahoot / Quizlet", "Canva (presentations)", "MS PowerPoint", "Mentimeter"],
        "timeline":       "12-36 months",
        "tip":            "Clear UGC NET early. It is mandatory for assistant professor roles in government colleges and greatly improves private college salaries too.",
    },
    "Research Scientist": {
        "skills":         ["Research methodology", "Statistical analysis (SPSS / R / Python)", "Academic writing & publishing", "Literature review", "Experimental design", "Grant writing basics"],
        "certifications": ["PhD or M.Tech / MSc (mandatory)", "Research Methods (Coursera)", "NPTEL research methodology courses", "Scopus / Web of Science author profile"],
        "tools":          ["MATLAB / Python / R", "SPSS / STATA", "LaTeX (paper writing)", "Mendeley / Zotero (references)", "Origin (data plotting)", "NCBI / PubMed (literature)"],
        "timeline":       "24-60 months",
        "tip":            "Publish in peer-reviewed journals early. Even one indexed paper (Scopus or SCI) significantly boosts PhD admissions and research job applications.",
    },
    "Medical Practitioner": {
        "skills":         ["Clinical diagnosis", "Patient communication & empathy", "Medical procedures (based on specialty)", "EMR / EHR systems", "Evidence-based medicine", "Emergency care basics"],
        "certifications": ["MBBS (mandatory)", "USMLE (for US practice)", "DNB / MD / MS (postgraduate)", "Basic Life Support (BLS) & ACLS"],
        "tools":          ["Epic / Practo (EMR systems)", "Medical imaging viewers (DICOM)", "Clinical decision support tools", "PubMed / UpToDate", "Stethoscope & diagnostic equipment", "Telemedicine platforms"],
        "timeline":       "60-84 months",
        "tip":            "MBBS is just the beginning. Specialisation through MD/MS or DNB determines your actual earning potential and career path.",
    },
    # ── v3 career name aliases ────────────────────────────────
    "Finance": {
        "skills":         ["Financial modelling (Excel)", "Valuation methods (DCF, comparables)", "Accounting fundamentals", "Financial statement analysis", "VBA / Python for finance", "Bloomberg Terminal basics"],
        "certifications": ["CFA Level 1", "NSE Certification in Financial Markets (NCFM)", "CPA / CA foundation", "Financial Modelling & Valuation Analyst (FMVA)"],
        "tools":          ["MS Excel (advanced)", "Bloomberg / Reuters Eikon", "Python (Pandas, yfinance)", "Tally / QuickBooks", "Power BI", "Capital IQ"],
        "timeline":       "8-14 months",
        "tip":            "Learn DCF modelling in Excel from scratch without a template. Being able to build a model from a blank sheet is the industry benchmark.",
    },
    "Marketing": {
        "skills":         ["SEO & SEM", "Social media marketing", "Content marketing", "Google Ads & Meta Ads", "Email marketing", "Analytics (GA4)"],
        "certifications": ["Google Digital Marketing & E-commerce", "Meta Social Media Marketing", "HubSpot Content Marketing", "Google Analytics Individual Qualification"],
        "tools":          ["Google Analytics 4", "Google Ads", "Meta Business Suite", "SEMrush / Ahrefs", "Mailchimp", "Canva"],
        "timeline":       "3-6 months",
        "tip":            "Run a real campaign even with Rs 500 budget. Practical ad spend experience is far more valuable than theory.",
    },
    "Teacher": {
        "skills":         ["Subject matter expertise", "Lesson planning & curriculum design", "Classroom management", "Assessment design", "Communication & public speaking", "EdTech tools"],
        "certifications": ["B.Ed (Bachelor of Education)", "CTET / TET (for school teaching)", "UGC NET (for college lectureship)", "Coursera / edX teaching certificates"],
        "tools":          ["Google Classroom / Moodle", "Zoom / MS Teams", "Kahoot / Quizlet", "Canva (presentations)", "MS PowerPoint", "Mentimeter"],
        "timeline":       "12-36 months",
        "tip":            "Clear UGC NET early. It is mandatory for assistant professor roles in government colleges and greatly improves private college salaries too.",
    },
    "Project Manager": {
        "skills":         ["Project planning & scheduling", "Risk management", "Agile / Scrum / Kanban", "Stakeholder communication", "Budget management", "Team leadership"],
        "certifications": ["PMP (Project Management Professional)", "Certified Scrum Master (CSM)", "PRINCE2 Foundation", "Google Project Management Certificate (Coursera)"],
        "tools":          ["JIRA / Confluence", "MS Project", "Asana / Trello", "Slack", "Notion", "Smartsheet"],
        "timeline":       "6-12 months",
        "tip":            "PMP certification requires 36 months of project experience — start accumulating documented experience early. In the meantime, get CSM or PSM first.",
    },
}

# ── Salary Benchmarks ─────────────────────────────────────────
# All figures in INR per year (annual CTC)
SALARY_DATA = {
    "Software Developer":        {"fresher": [350000, 700000],  "mid": [800000, 1500000],  "senior": [1800000, 3500000], "avg": 480000,  "source": "Naukri / AmbitionBox 2024"},
    "Full Stack Developer":      {"fresher": [400000, 800000],  "mid": [900000, 1800000],  "senior": [2000000, 4000000], "avg": 550000,  "source": "Naukri / AmbitionBox 2024"},
    "ML/AI Engineer":            {"fresher": [500000, 1000000], "mid": [1200000, 2500000], "senior": [3000000, 6000000], "avg": 680000,  "source": "Naukri / AmbitionBox 2024"},
    "Data Scientist":            {"fresher": [450000, 900000],  "mid": [1000000, 2200000], "senior": [2500000, 5000000], "avg": 620000,  "source": "Naukri / AmbitionBox 2024"},
    "Data Analyst":              {"fresher": [300000, 600000],  "mid": [700000, 1400000],  "senior": [1600000, 3000000], "avg": 420000,  "source": "Naukri / AmbitionBox 2024"},
    "Data Engineer":             {"fresher": [450000, 850000],  "mid": [1000000, 2000000], "senior": [2400000, 4500000], "avg": 600000,  "source": "Naukri / AmbitionBox 2024"},
    "Web Developer":             {"fresher": [250000, 550000],  "mid": [600000, 1200000],  "senior": [1400000, 2800000], "avg": 380000,  "source": "Naukri / AmbitionBox 2024"},
    "Mobile App Developer":      {"fresher": [350000, 700000],  "mid": [800000, 1600000],  "senior": [1800000, 3500000], "avg": 480000,  "source": "Naukri / AmbitionBox 2024"},
    "DevOps Engineer":           {"fresher": [400000, 800000],  "mid": [1000000, 2000000], "senior": [2200000, 4500000], "avg": 560000,  "source": "Naukri / AmbitionBox 2024"},
    "QA/Test Engineer":          {"fresher": [280000, 550000],  "mid": [600000, 1300000],  "senior": [1500000, 2800000], "avg": 390000,  "source": "Naukri / AmbitionBox 2024"},
    "Cybersecurity Analyst":     {"fresher": [400000, 800000],  "mid": [900000, 2000000],  "senior": [2200000, 5000000], "avg": 560000,  "source": "Naukri / AmbitionBox 2024"},
    "Embedded Systems Engineer": {"fresher": [300000, 600000],  "mid": [700000, 1500000],  "senior": [1700000, 3200000], "avg": 430000,  "source": "Naukri / AmbitionBox 2024"},
    "Mechanical Engineer":       {"fresher": [250000, 500000],  "mid": [600000, 1200000],  "senior": [1400000, 2800000], "avg": 360000,  "source": "Naukri / AmbitionBox 2024"},
    "Civil Engineer":            {"fresher": [220000, 450000],  "mid": [500000, 1100000],  "senior": [1200000, 2500000], "avg": 320000,  "source": "Naukri / AmbitionBox 2024"},
    "UI/UX Designer":            {"fresher": [300000, 650000],  "mid": [700000, 1500000],  "senior": [1700000, 3500000], "avg": 440000,  "source": "Naukri / AmbitionBox 2024"},
    "Graphic Designer":          {"fresher": [200000, 450000],  "mid": [500000, 1000000],  "senior": [1200000, 2500000], "avg": 300000,  "source": "Naukri / AmbitionBox 2024"},
    "Digital Marketer":          {"fresher": [250000, 500000],  "mid": [550000, 1200000],  "senior": [1400000, 2800000], "avg": 360000,  "source": "Naukri / AmbitionBox 2024"},
    "Business Analyst":          {"fresher": [350000, 700000],  "mid": [800000, 1600000],  "senior": [1800000, 3500000], "avg": 480000,  "source": "Naukri / AmbitionBox 2024"},
    "Financial Analyst":         {"fresher": [300000, 650000],  "mid": [700000, 1500000],  "senior": [1700000, 3500000], "avg": 440000,  "source": "Naukri / AmbitionBox 2024"},
    "HR":                        {"fresher": [250000, 500000],  "mid": [550000, 1100000],  "senior": [1300000, 2800000], "avg": 360000,  "source": "Naukri / AmbitionBox 2024"},
    "Sales Executive":           {"fresher": [200000, 450000],  "mid": [500000, 1100000],  "senior": [1200000, 2800000], "avg": 320000,  "source": "Naukri / AmbitionBox 2024"},
    "Content Writer":            {"fresher": [180000, 400000],  "mid": [450000, 900000],   "senior": [1000000, 2200000], "avg": 280000,  "source": "Naukri / AmbitionBox 2024"},
    "Teacher/Professor":         {"fresher": [200000, 450000],  "mid": [500000, 1000000],  "senior": [1200000, 2500000], "avg": 320000,  "source": "Naukri / AmbitionBox 2024"},
    "Research Scientist":        {"fresher": [350000, 700000],  "mid": [800000, 1600000],  "senior": [1800000, 4000000], "avg": 480000,  "source": "Naukri / AmbitionBox 2024"},
    "Medical Practitioner":      {"fresher": [400000, 800000],  "mid": [1000000, 2500000], "senior": [3000000, 8000000], "avg": 580000,  "source": "Naukri / AmbitionBox 2024"},
    # ── v3 career name aliases ────────────────────────────────
    "Finance":         {"fresher": [300000, 650000],  "mid": [700000, 1500000],  "senior": [1700000, 3500000], "avg": 440000,  "source": "Naukri / AmbitionBox 2024"},
    "Marketing":       {"fresher": [250000, 500000],  "mid": [550000, 1200000],  "senior": [1400000, 2800000], "avg": 360000,  "source": "Naukri / AmbitionBox 2024"},
    "Teacher":         {"fresher": [200000, 450000],  "mid": [500000, 1000000],  "senior": [1200000, 2500000], "avg": 320000,  "source": "Naukri / AmbitionBox 2024"},
    "Project Manager": {"fresher": [400000, 800000],  "mid": [1000000, 2000000], "senior": [2200000, 4500000], "avg": 580000,  "source": "Naukri / AmbitionBox 2024"},
}

FALLBACK_PREP = {
    "skills":         ["Domain knowledge", "Communication", "Problem solving", "Teamwork", "Industry tools"],
    "certifications": ["LinkedIn Learning courses", "Coursera specialisation", "Industry certification"],
    "tools":          ["Microsoft Office", "Google Workspace", "Project management tools"],
    "timeline":       "3-6 months",
    "tip":            "Research top companies hiring for this role and tailor your preparation accordingly.",
}

FALLBACK_SALARY = {
    "fresher": [250000, 450000],
    "mid":     [550000, 950000],
    "senior":  [1100000, 2000000],
    "avg":     350000,
    "source":  "Market estimate",
}


@app.get("/career-prep", tags=["Info"])
def get_career_prep(career: str = None):
    """
    Returns skills, certifications, tools, timeline, and pro tip
    for each career. If career param provided, returns only that career.
    """
    if career:
        data = CAREER_PREP_DATA.get(career, FALLBACK_PREP)
        return {"career": career, "data": data}
    return {
        "total":   len(CAREER_PREP_DATA),
        "careers": CAREER_PREP_DATA,
    }


@app.get("/salary-data", tags=["Info"])
def get_salary_data(career: str = None):
    """
    Returns fresher / mid / senior salary benchmarks in INR.
    If career param provided, returns only that career.
    """
    if career:
        data = SALARY_DATA.get(career, FALLBACK_SALARY)
        return {"career": career, "data": data}
    return {
        "total":   len(SALARY_DATA),
        "careers": SALARY_DATA,
    }


# ── Keyword boost map ────────────────────────────────────────
CAREER_KEYWORD_BOOST = {
    "Content Writer":       ["content writing", "writing", "blogging", "seo", "copywriting", "journalism", "content creation", "storytelling"],
    "Teacher/Professor":    ["teaching", "teacher", "education", "lecture", "tutor", "professor", "classroom", "academia"],
    "Graphic Designer":     ["photoshop", "illustrator", "graphic design", "canva", "visual design", "creative design", "adobe"],
    "UI/UX Designer":       ["figma", "ux", "ui design", "user experience", "wireframe", "prototype", "adobe xd", "user interface"],
    "Digital Marketer":     ["digital marketing", "seo", "social media", "marketing", "google ads", "meta ads", "branding", "content marketing"],
    "Data Scientist":       ["machine learning", "tensorflow", "pytorch", "data science", "deep learning", "nlp", "neural network", "statistics"],
    "Data Analyst":         ["data analysis", "power bi", "tableau", "excel", "sql", "data visualization", "business intelligence"],
    "ML/AI Engineer":       ["machine learning", "ai", "artificial intelligence", "deep learning", "tensorflow", "pytorch", "nlp"],
    "Financial Analyst":    ["finance", "accounting", "financial analysis", "valuation", "ca", "chartered accountant", "tally", "investment"],
    "Civil Engineer":       ["civil engineering", "autocad", "structural", "construction", "surveying", "architecture", "staad"],
    "Mechanical Engineer":  ["mechanical", "solidworks", "autocad", "ansys", "catia", "manufacturing", "production", "thermodynamics"],
    "HR":                   ["human resource", "hr", "recruitment", "talent acquisition", "people management", "payroll"],
    "Business Analyst":     ["business analysis", "requirements", "process mapping", "stakeholder", "jira", "agile", "scrum"],
    "Medical Practitioner": ["medicine", "medical", "biology", "chemistry", "healthcare", "clinical", "doctor", "patient care"],
    "Research Scientist":   ["research", "laboratory", "biology", "chemistry", "biochemistry", "academic research", "publication"],
    "Cybersecurity Analyst":["cybersecurity", "security", "ethical hacking", "penetration testing", "network security", "kali linux"],
    "DevOps Engineer":      ["devops", "docker", "kubernetes", "ci/cd", "jenkins", "aws", "cloud", "terraform", "linux"],
    "Mobile App Developer": ["flutter", "react native", "android", "ios", "mobile development", "kotlin", "swift"],
    "Web Developer":        ["html", "css", "javascript", "react", "angular", "vue", "frontend", "web design"],
    "Sales Executive":      ["sales", "business development", "crm", "negotiation", "cold calling", "lead generation"],
    # ── v3 career name aliases ────────────────────────────────
    "Finance":         ["finance", "accounting", "financial analysis", "valuation", "ca", "chartered accountant", "tally", "investment"],
    "Marketing":       ["digital marketing", "seo", "social media", "marketing", "google ads", "meta ads", "branding", "content marketing"],
    "Teacher":         ["teaching", "teacher", "education", "lecture", "tutor", "professor", "classroom", "academia"],
    "Project Manager": ["project management", "pmp", "scrum", "agile", "kanban", "jira", "planning", "stakeholder"],
}

BOOST_STRENGTH = 0.18

def apply_keyword_boost(proba: np.ndarray, combined_text: str) -> np.ndarray:
    boosted = proba.copy()
    classes = label_encoder.classes_
    for i, career in enumerate(classes):
        keywords = CAREER_KEYWORD_BOOST.get(career, [])
        matches  = sum(1 for kw in keywords if kw in combined_text)
        if matches > 0:
            boost = BOOST_STRENGTH * min(matches, 3) / 3
            boosted[i] = min(1.0, boosted[i] + boost)
    total = boosted.sum()
    if total > 0:
        boosted = boosted / total
    return boosted


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
def predict_career(request: PredictRequest):
    """
    Core prediction endpoint — v3.0

    1. Predicts top N careers from skills + interests (ML model)
    2. Returns colleges filtered by:
       - Career domain match
       - Budget (max annual fees in lakhs)
       - Mode of classes (Offline / Online / Distance)
       - With eligibility tags based on 12th % and CGPA
    3. Returns jobs sorted by preferred city first
    """
    # ── Validation ────────────────────────────────────────────
    if not request.skills.strip() or not request.interests.strip():
        raise HTTPException(status_code=400, detail="Both 'skills' and 'interests' must be non-empty.")
    if request.marks_10th is not None and not (0 <= request.marks_10th <= 100):
        raise HTTPException(status_code=400, detail="marks_10th must be between 0 and 100.")
    if request.marks_12th is not None and not (0 <= request.marks_12th <= 100):
        raise HTTPException(status_code=400, detail="marks_12th must be between 0 and 100.")
    if request.cgpa is not None and not (0 <= request.cgpa <= 10):
        raise HTTPException(status_code=400, detail="cgpa must be between 0 and 10.")
    if request.budget_lakhs is not None and request.budget_lakhs <= 0:
        raise HTTPException(status_code=400, detail="budget_lakhs must be a positive number.")
    if request.preferred_mode is not None and request.preferred_mode not in ["Offline", "Online", "Distance"]:
        raise HTTPException(status_code=400, detail="preferred_mode must be 'Offline', 'Online', or 'Distance'.")

    top_n = max(1, min(request.top_n, 5))

    # ── Step 1: Preprocess & predict ─────────────────────────
    combined = (request.skills + " " + request.interests).lower()
    combined = re.sub(r"[^a-z0-9,\s]", " ", combined)
    combined = re.sub(r"\s+", " ", combined).strip()

    raw_proba = model_pipeline.predict_proba([combined])[0]
    proba     = apply_keyword_boost(raw_proba, combined)
    top_idx   = np.argsort(proba)[::-1][:top_n]
    careers   = label_encoder.inverse_transform(top_idx)
    scores    = proba[top_idx]

    career_results = [
        CareerResult(rank=i+1, career=c, confidence=round(float(s)*100, 1))
        for i, (c, s) in enumerate(zip(careers, scores))
    ]

    # ── Step 2: Colleges (with budget + mode filter) ──────────
    top_career = careers[0]
    colleges   = get_matching_colleges(
        career         = top_career,
        marks_12       = request.marks_12th,
        cgpa           = request.cgpa,
        budget_lakhs   = request.budget_lakhs,
        preferred_mode = request.preferred_mode,
        preferred_city = request.preferred_city,
        top_k          = 8,
    )

    # ── Step 3: Jobs (sorted by preferred city) ───────────────
    jobs = get_matching_jobs(
        career         = top_career,
        preferred_city = request.preferred_city,
        top_k          = 10,
    )

    return PredictResponse(
        input_skills    = request.skills,
        input_interests = request.interests,
        student_profile = StudentProfile(
            marks_10th     = request.marks_10th,
            marks_12th     = request.marks_12th,
            cgpa           = request.cgpa,
            degree         = request.degree,
            specialization = request.specialization,
            preferred_city = request.preferred_city,
            budget_lakhs   = request.budget_lakhs,
            preferred_mode = request.preferred_mode,
        ),
        careers  = career_results,
        colleges = [CollegeResult(**c) for c in colleges],
        jobs     = [JobResult(**j) for j in jobs],
    )


@app.post("/predict/detailed", tags=["Prediction"])
def predict_detailed(request: PredictRequest):
    """
    Extended version — colleges + jobs for ALL top-N careers.
    All budget, mode, eligibility, and city filters apply here too.
    """
    if not request.skills.strip() or not request.interests.strip():
        raise HTTPException(status_code=400, detail="Both 'skills' and 'interests' must be non-empty.")

    top_n = max(1, min(request.top_n, 5))

    combined = (request.skills + " " + request.interests).lower()
    combined = re.sub(r"[^a-z0-9,\s]", " ", combined)
    combined = re.sub(r"\s+", " ", combined).strip()

    raw_proba = model_pipeline.predict_proba([combined])[0]
    proba     = apply_keyword_boost(raw_proba, combined)
    top_idx   = np.argsort(proba)[::-1][:top_n]
    careers   = label_encoder.inverse_transform(top_idx)
    scores    = proba[top_idx]

    detailed = []
    for i, (career, score) in enumerate(zip(careers, scores)):
        detailed.append({
            "rank"      : i + 1,
            "career"    : career,
            "confidence": round(float(score) * 100, 1),
            "colleges"  : get_matching_colleges(
                            career         = career,
                            marks_12       = request.marks_12th,
                            cgpa           = request.cgpa,
                            budget_lakhs   = request.budget_lakhs,
                            preferred_mode = request.preferred_mode,
                            preferred_city = request.preferred_city,
                            top_k          = 5,
                          ),
            "jobs"      : get_matching_jobs(career, request.preferred_city, top_k=5),
        })

    return {
        "input_skills"    : request.skills,
        "input_interests" : request.interests,
        "student_profile" : {
            "marks_10th"    : request.marks_10th,
            "marks_12th"    : request.marks_12th,
            "cgpa"          : request.cgpa,
            "degree"        : request.degree,
            "specialization": request.specialization,
            "preferred_city": request.preferred_city,
            "budget_lakhs"  : request.budget_lakhs,
            "preferred_mode": request.preferred_mode,
        },
        "results": detailed,
    }