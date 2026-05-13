// ─── JOBS PAGE ───────────────────────────────────────────────
// Displays fresher job listings matched to predicted career.
// Shows honest salary data — no fake benchmarks.
//
// Props:
//   career  {object}    — selected career from RoadmapPage
//   onBack  {function}  — returns to RoadmapPage

import { useState, useEffect } from "react";
import OceanBG  from "../components/OceanBG";
import BackBtn  from "../components/BackBtn";
import { SALARY_THRESHOLDS, FALLBACK_SALARY } from "../data/constants";
import { getSalaryData } from "../config/api";

// ── Salary format helpers ─────────────────────────────────────
const fmtINR = (n) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${(n / 1000).toFixed(0)}K`;

const fmtSal = (n) => {
  if (!n) return null;
  return n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L/yr`
    : `₹${(n / 1000).toFixed(0)}K/yr`;
};

const salColor = (n) => {
  if (!n) return "var(--muted)";
  if (n >= SALARY_THRESHOLDS.high)   return "var(--foam)";
  if (n >= SALARY_THRESHOLDS.medium) return "var(--gold)";
  return "var(--coral)";
};

// ── Career → relevant keywords map ───────────────────────────
// Used to badge jobs as "Relevant" vs "Related"
const CAREER_KEYWORDS = {
  "Software Developer":   ["software", "developer", "programmer", "backend", "frontend", "full stack"],
  "ML/AI Engineer":       ["machine learning", "ml ", "artificial intelligence", "deep learning", "nlp", "data scien"],
  "Data Scientist":       ["data scien", "machine learning", "analytics engineer"],
  "Data Analyst":         ["data analyst", "analytics", "bi analyst", "power bi"],
  "Web Developer":        ["web", "frontend", "front end", "html", "react", "angular", "wordpress"],
  "Content Writer":       ["content", "writer", "copywriter", "seo", "blog"],
  "Digital Marketer":     ["marketing", "seo", "social media", "digital"],
  "Graphic Designer":     ["graphic", "designer", "creative", "ui", "ux", "visual"],
  "Financial Analyst":    ["finance", "financial", "account", "audit", "tax"],
  "Mechanical Engineer":  ["mechanical", "autocad", "solidworks", "production"],
  "Civil Engineer":       ["civil", "structural", "construction"],
  "Teacher/Professor":    ["teacher", "tutor", "trainer", "faculty", "professor"],
  "HR":                   ["hr", "human resource", "recruiter", "talent"],
  "Sales Executive":      ["sales", "business development", "bdm"],
  "DevOps Engineer":      ["devops", "cloud", "aws", "docker", "kubernetes"],
  "QA/Test Engineer":     ["test engineer", "qa", "quality analyst", "automation test", "selenium"],
  "Mobile App Developer": ["mobile", "flutter", "android", "ios", "react native"],
  "UI/UX Designer":       ["ui", "ux", "designer", "figma", "product design"],
  "Business Analyst":     ["business analyst", "ba ", "product analyst", "requirements"],
  "Research Scientist":   ["research", "scientist", "r&d", "laboratory"],
  "Medical Practitioner": ["medical", "doctor", "clinical", "healthcare"],
  "Embedded Systems Engineer": ["embedded", "firmware", "iot", "rtos", "microcontroller"],
};

// Check if a job title is directly relevant to the career
const isRelevant = (jobTitle, careerName) => {
  const keywords = CAREER_KEYWORDS[careerName] || [];
  const title = jobTitle.toLowerCase();
  return keywords.some(kw => title.includes(kw));
};

// Careers with very few or no jobs in current dataset
const LOW_COVERAGE_CAREERS = [
  "Digital Marketer", "Financial Analyst", "Mechanical Engineer",
  "Civil Engineer", "HR", "Medical Practitioner", "Research Scientist",
];

const JobsPage = ({ career, onBack }) => {
  const jobs       = career?.jobs || [];
  const careerName = career?.career || "";

  // ── Salary benchmark from API ─────────────────────────────
  const [sal,     setSal]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!careerName) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await getSalaryData(careerName);
        setSal(res.data || FALLBACK_SALARY);
      } catch {
        setSal(FALLBACK_SALARY);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [careerName]);

  // ── Job relevance tagging ─────────────────────────────────
  const taggedJobs = jobs.map(j => ({
    ...j,
    relevant: isRelevant(j.job_title, careerName),
  }));

  const relevantCount = taggedJobs.filter(j => j.relevant).length;
  const cityCount     = taggedJobs.filter(j => j.preferred_city).length;
  const isLowCoverage = LOW_COVERAGE_CAREERS.includes(careerName) || relevantCount === 0;

  // Only use real salary — never substitute benchmark
  const jobsWithRealSal = taggedJobs.filter(
    j => j.salary_annual_inr && j.salary_annual_inr >= 100000
  );
  const avgRealSal = jobsWithRealSal.length > 0
    ? jobsWithRealSal.reduce((a, b) => a + b.salary_annual_inr, 0) / jobsWithRealSal.length
    : null;

  return (
    <div
      className="page"
      style={{ minHeight: "100vh", padding: "26px 22px", position: "relative" }}
    >
      <OceanBG />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <BackBtn onClick={onBack} />
          <div>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 800 }}>
              💼 Fresher Job Listings
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
              For <span style={{ color: "var(--gold)" }}>{careerName}</span>
              {" "}· {jobs.length} openings found
            </p>
          </div>
        </div>

        {/* ── Salary benchmark card ────────────────────────── */}
        {!loading && sal && (
          <div className="glass" style={{
            padding:      "20px 24px",
            marginBottom: 22,
            borderLeft:   "3px solid var(--gold)",
            animation:    "fadeUp .4s ease",
          }}>
            <div style={{
              fontSize:      11,
              color:         "var(--gold)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom:  12,
              fontFamily:    "var(--fd)",
            }}>
              💰 Salary Benchmarks — {careerName} (India 2024)
            </div>

            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap:                 12,
            }}>
              {[
                { label: "Fresher (0-1 yr)",   range: sal.fresher, color: "var(--coral)" },
                { label: "Mid Level (2-4 yr)", range: sal.mid,     color: "var(--gold)"  },
                { label: "Senior (5+ yr)",     range: sal.senior,  color: "var(--foam)"  },
              ].map(tier => (
                <div key={tier.label} style={{
                  background:   "rgba(255,255,255,.03)",
                  borderRadius: 10,
                  padding:      "12px 14px",
                }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>
                    {tier.label}
                  </div>
                  <div style={{
                    fontFamily: "var(--fd)",
                    fontSize:   15,
                    fontWeight: 700,
                    color:      tier.color,
                  }}>
                    {fmtINR(tier.range?.[0])} - {fmtINR(tier.range?.[1])}
                  </div>
                  <div style={{
                    height: 3, borderRadius: 2,
                    background: "rgba(255,255,255,.05)", marginTop: 8,
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      background: tier.color, opacity: 0.55,
                      width: `${((tier.range?.[1] || 0) / (sal.senior?.[1] || 1)) * 100}%`,
                      animation: "pFill 1s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
              Source: {sal.source || "Market estimates 2024"}.
              IIT/NIT grads typically earn 20-40% above these figures.
            </div>
          </div>
        )}

        {/* ── Dataset limitation warning ────────────────────── */}
        {isLowCoverage && (
          <div style={{
            background:   "rgba(240,180,41,.07)",
            border:       "1px solid rgba(240,180,41,.28)",
            borderRadius: 12,
            padding:      "14px 18px",
            marginBottom: 18,
            fontSize:     13,
          }}>
            <div style={{
              color:        "var(--gold)",
              fontWeight:   700,
              marginBottom: 5,
              fontFamily:   "var(--fd)",
            }}>
              ⚠️ Limited job listings for {careerName}
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Our current dataset has very few fresher jobs for this career.
              The listings below may not be directly relevant.
              For accurate openings, check{" "}
              <span style={{ color: "var(--aqua)" }}>Naukri.com</span>,{" "}
              <span style={{ color: "var(--aqua)" }}>LinkedIn</span>, or{" "}
              <span style={{ color: "var(--aqua)" }}>Internshala</span>{" "}
              directly with the search term "{careerName}".
            </div>
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          {[
            {
              label: "Total Openings",
              value: jobs.length,
              icon:  "📋",
              color: "var(--aqua)",
            },
            {
              label: "Est. Avg Salary",
              value: avgRealSal ? fmtSal(avgRealSal) : "Not available",
              icon:  "💰",
              color: avgRealSal ? "var(--gold)" : "var(--muted)",
            },
            {
              label: "City Matches",
              value: cityCount,
              icon:  "📍",
              color: "var(--foam)",
            },
          ].map(s => (
            <div key={s.label} className="glass" style={{
              flex: 1, minWidth: 130,
              padding: "14px 18px", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{
                fontFamily: "var(--fd)", fontSize: 18,
                fontWeight: 800, color: s.color,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Empty state ──────────────────────────────────── */}
        {jobs.length === 0 && (
          <div style={{
            textAlign:    "center",
            padding:      "48px 24px",
            background:   "rgba(255,255,255,.02)",
            borderRadius: 16,
            border:       "1px solid rgba(46,184,200,.1)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
            <div style={{
              fontFamily:   "var(--fd)",
              fontSize:     18,
              fontWeight:   700,
              marginBottom: 10,
            }}>
              No listings found for {careerName}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
              Our dataset currently has no fresher jobs for this career.<br />
              Search directly on{" "}
              <span style={{ color: "var(--aqua)" }}>Naukri.com</span>,{" "}
              <span style={{ color: "var(--aqua)" }}>LinkedIn</span>, or{" "}
              <span style={{ color: "var(--aqua)" }}>Internshala</span>.
            </div>
          </div>
        )}

        {/* ── Job cards ────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {taggedJobs.map((j, i) => {
            const hasSalary = j.salary_annual_inr && j.salary_annual_inr >= 100000;
            return (
              <div
                key={i}
                className="glass"
                style={{
                  padding:    "18px 22px",
                  animation:  `slideR .4s ${i * 0.05}s ease both`,
                  borderLeft: j.preferred_city
                    ? "3px solid var(--aqua)"
                    : "3px solid transparent",
                  transition: "transform .3s, box-shadow .3s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateX(5px)";
                  e.currentTarget.style.boxShadow = "0 10px 35px rgba(0,0,0,.4)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: 10,
                }}>

                  {/* Job title + badges + location */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: 8, marginBottom: 5, flexWrap: "wrap",
                    }}>
                      <h3 style={{
                        fontFamily: "var(--fd)",
                        fontSize:   15,
                        fontWeight: 700,
                      }}>
                        {j.job_title}
                      </h3>

                      {/* Relevant badge */}
                      {j.relevant && (
                        <span style={{
                          background:   "rgba(126,232,200,.11)",
                          border:       "1px solid rgba(126,232,200,.28)",
                          borderRadius: 20,
                          padding:      "2px 9px",
                          fontSize:     11,
                          color:        "var(--foam)",
                        }}>
                          ✓ Relevant
                        </span>
                      )}

                      {/* City match badge */}
                      {j.preferred_city && (
                        <span style={{
                          background:   "rgba(46,184,200,.11)",
                          border:       "1px solid rgba(46,184,200,.26)",
                          borderRadius: 20,
                          padding:      "2px 9px",
                          fontSize:     11,
                          color:        "var(--aqua)",
                        }}>
                          📍 Your City
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      📍 {j.location}
                    </div>
                  </div>

                  {/* Salary — only show real data */}
                  <div style={{ textAlign: "right" }}>
                    {hasSalary ? (
                      <>
                        <div style={{
                          fontFamily: "var(--fd)", fontSize: 19,
                          fontWeight: 800, color: salColor(j.salary_annual_inr),
                        }}>
                          {fmtSal(j.salary_annual_inr)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          Annual CTC
                        </div>
                      </>
                    ) : (
                      <div style={{
                        fontSize: 13, color: "var(--muted)",
                        fontStyle: "italic", marginTop: 4,
                      }}>
                        Salary not disclosed
                      </div>
                    )}
                  </div>
                </div>

                {/* Salary bar — only show when real salary exists */}
                {hasSalary && sal && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      height: 3, background: "rgba(255,255,255,.04)", borderRadius: 2,
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        background: `linear-gradient(90deg, ${salColor(j.salary_annual_inr)}, transparent)`,
                        width: `${Math.min(((j.salary_annual_inr || 0) / (sal.senior?.[1] || 5000000)) * 100, 95)}%`,
                        animation: "pFill 1s ease",
                      }} />
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginTop: 4, fontSize: 11, color: "var(--muted)",
                    }}>
                      <span>Fresher min: {fmtINR(sal.fresher?.[0] || 0)}</span>
                      <span>Senior max: {fmtINR(sal.senior?.[1]  || 0)}</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
};

export default JobsPage;