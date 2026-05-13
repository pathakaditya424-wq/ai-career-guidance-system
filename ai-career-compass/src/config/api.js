// ─── API CONFIGURATION ───────────────────────────────────────
// All backend communication lives here.
// If your FastAPI runs on a different port, change only this one line.

export const API_BASE = "http://127.0.0.1:8000";

// ─── HELPER ──────────────────────────────────────────────────
// Central fetch wrapper — handles errors consistently
const apiFetch = async (url, options = {}) => {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// ─── PREDICTION ENDPOINTS ────────────────────────────────────

/**
 * POST /predict/detailed
 * Send student profile → get top N careers with colleges + jobs
 *
 * @param {Object} body - student profile data
 * @param {string} body.skills          - comma separated skills
 * @param {string} body.interests       - comma separated interests
 * @param {number} body.marks_12th      - 12th percentage (40-100)
 * @param {number} body.cgpa            - CGPA (4.0-10.0)
 * @param {string} body.degree          - degree type
 * @param {string} body.preferred_city  - preferred job/college city
 * @param {number} body.budget_lakhs    - max college fee budget
 * @param {string} body.preferred_mode  - Offline / Online / Distance
 * @param {number} body.top_n           - number of careers to return (default 3)
 */
export const predictDetailed = (body) =>
  apiFetch("/predict/detailed", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * POST /predict
 * Send student profile → get top N careers only (no colleges/jobs)
 */
export const predict = (body) =>
  apiFetch("/predict", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ─── DATA ENDPOINTS ──────────────────────────────────────────

/**
 * GET /career-prep
 * Returns career preparation data — skills, certifications, tools, tip
 *
 * @param {string} career - optional career name to filter
 * @returns all 24 careers if no filter, or specific career data
 *
 * Usage:
 *   getCareerPrep()                        → all careers
 *   getCareerPrep("Data Scientist")        → only Data Scientist
 */
export const getCareerPrep = (career = null) => {
  const query = career ? `?career=${encodeURIComponent(career)}` : "";
  return apiFetch(`/career-prep${query}`);
};

/**
 * GET /salary-data
 * Returns realistic India salary benchmarks (fresher / mid / senior)
 *
 * @param {string} career - optional career name to filter
 * @returns all 25 careers if no filter, or specific career salary data
 *
 * Usage:
 *   getSalaryData()                        → all careers
 *   getSalaryData("Software Developer")    → only Software Developer
 */
export const getSalaryData = (career = null) => {
  const query = career ? `?career=${encodeURIComponent(career)}` : "";
  return apiFetch(`/salary-data${query}`);
};

// ─── INFO ENDPOINTS ──────────────────────────────────────────

/**
 * GET /careers
 * Returns all 22 career categories the ML model can predict
 */
export const getCareers = () => apiFetch("/careers");

/**
 * GET /colleges
 * Browse NIRF colleges — optionally filter by field
 *
 * @param {string} field  - optional field filter (e.g. "Engineering")
 * @param {number} limit  - max results to return (default 20)
 */
export const getColleges = (field = null, limit = 20) => {
  const params = new URLSearchParams({ limit });
  if (field) params.append("field", field);
  return apiFetch(`/colleges?${params}`);
};

/**
 * GET /jobs
 * Browse fresher jobs — optionally filter by keyword and city
 *
 * @param {string} keyword - job title keyword
 * @param {string} city    - preferred city
 * @param {number} limit   - max results to return (default 20)
 */
export const getJobs = (keyword = null, city = null, limit = 20) => {
  const params = new URLSearchParams({ limit });
  if (keyword) params.append("keyword", keyword);
  if (city) params.append("city", city);
  return apiFetch(`/jobs?${params}`);
};

/**
 * GET /college-types
 * Returns fee ranges and modes for each college type
 * (IIT, NIT, IIM, AIIMS, Govt, Private)
 */
export const getCollegeTypes = () => apiFetch("/college-types");

/**
 * GET /
 * Health check — confirms backend is running
 */
export const healthCheck = () => apiFetch("/");