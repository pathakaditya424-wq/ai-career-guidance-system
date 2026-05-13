// ─── ROADMAP PAGE ────────────────────────────────────────────
// Displays top 3 career matches as floating animated islands.
// Fetches career prep + salary data live from FastAPI backend.
//
// Props:
//   data        {object}    — full API response from /predict/detailed
//   onBack      {function}  — returns to InputPage
//   onColleges  {function}  — called with selected career → CollegesPage
//   onJobs      {function}  — called with selected career → JobsPage

import { useState, useEffect } from "react";
import OceanBG   from "../components/OceanBG";
import Compass   from "../components/Compass";
import BackBtn   from "../components/BackBtn";
import {
  ISLAND_COLORS,
  ISLAND_ICONS,
  ROADMAP_TABS,
  FALLBACK_PREP,
  FALLBACK_SALARY,
} from "../data/constants";
import { getCareerPrep, getSalaryData } from "../config/api";

// ── Salary formatter helpers ──────────────────────────────────
const fmtINR = (n) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${(n / 1000).toFixed(0)}K`;

const RoadmapPage = ({ data, onBack, onColleges, onJobs }) => {
  const [active,       setActive]       = useState(0);
  const [tab,          setTab]          = useState("overview");
  const [compassAngle, setCompassAngle] = useState(-30);

  // ── Career prep + salary fetched from API ─────────────────
  const [prep,    setPrep]    = useState(null);
  const [sal,     setSal]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchErr,setFetchErr]= useState("");

  const careers = data?.results || [];
  const current = careers[active];

  // ── Fetch prep + salary whenever active career changes ────
  useEffect(() => {
    if (!current?.career) return;

    const fetchData = async () => {
      setLoading(true);
      setFetchErr("");
      setPrep(null);
      setSal(null);

      try {
        // Fetch both in parallel for speed
        const [prepRes, salRes] = await Promise.all([
          getCareerPrep(current.career),
          getSalaryData(current.career),
        ]);

        setPrep(prepRes.data  || FALLBACK_PREP);
        setSal(salRes.data    || FALLBACK_SALARY);

      } catch (err) {
        // If API fails fall back to constants
        setFetchErr("Could not load prep data. Showing defaults.");
        setPrep(FALLBACK_PREP);
        setSal(FALLBACK_SALARY);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [active, current?.career]);

  // ── Compass rotates when active island changes ────────────
  useEffect(() => {
    setCompassAngle(active * 110 - 20);
  }, [active]);

  // ── Handle island click ───────────────────────────────────
  const handleIslandClick = (i) => {
    setActive(i);
    setTab("overview");
  };

  return (
    <div className="page" style={{ minHeight: "100vh", position: "relative" }}>
      <OceanBG />

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10, padding: "24px 28px" }}>
        <div style={{
          maxWidth:       900,
          margin:         "0 auto",
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
        }}>
          <div>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 800 }}>
              <span className="shimmer">Your Career Roadmap</span>
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 3 }}>
              {careers.length} career islands · Click an island to explore
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Compass angle={compassAngle} size={68} />
            <BackBtn onClick={onBack} />
          </div>
        </div>
      </div>

      <div style={{
        position: "relative", zIndex: 5,
        maxWidth: 900, margin: "0 auto", padding: "0 28px",
      }}>

        {/* ── SVG curved path connecting islands ────────────── */}
        <svg style={{
          position:     "absolute",
          top:          30,
          left:         28,
          width:        "calc(100% - 56px)",
          height:       160,
          pointerEvents: "none",
          overflow:     "visible",
        }}>
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="rgba(46,184,200,0)" />
              <stop offset="50%"  stopColor="rgba(46,184,200,.5)" />
              <stop offset="100%" stopColor="rgba(126,232,200,.3)" />
            </linearGradient>
          </defs>

          {/* Draw path only when 2+ careers exist */}
          {careers.length >= 2 && (
            <path
              d={careers.length === 3
                ? "M 80,80 C 220,20 330,140 450,80 C 570,20 680,140 820,80"
                : "M 80,80 C 250,20 550,140 720,80"
              }
              fill="none"
              stroke="url(#pg)"
              strokeWidth="2"
              strokeDasharray="800"
              style={{ animation: "drawPath 2.5s ease forwards" }}
            />
          )}

          {/* Node dots on path */}
          {careers.map((_, i) => {
            const pos = careers.length === 3 ? [80, 450, 820] : [80, 720];
            return (
              <circle
                key={i}
                cx={pos[i] || 80}
                cy="80"
                r="6"
                fill={i === active ? "var(--gold)" : "rgba(46,184,200,.35)"}
                style={{
                  animation: `blink ${2 + i}s ease-in-out infinite`,
                  transition: "fill .4s",
                }}
              />
            );
          })}
        </svg>

        {/* ── Career Islands ─────────────────────────────────── */}
        <div style={{
          display:        "flex",
          justifyContent: "space-around",
          paddingTop:     20,
          paddingBottom:  10,
          gap:            16,
          flexWrap:       "wrap",
        }}>
          {careers.map((c, i) => {
            const col  = ISLAND_COLORS[i % 3];
            const isAct = i === active;

            return (
              <div
                key={i}
                onClick={() => handleIslandClick(i)}
                style={{
                  cursor:     "pointer",
                  textAlign:  "center",
                  position:   "relative",
                  animation:  `iFloat ${4.5 + i * 0.8}s ${i * 0.3}s ease-in-out infinite`,
                  transform:  isAct ? "scale(1.08)" : "scale(1)",
                  transition: "transform .35s cubic-bezier(.34,1.56,.64,1)",
                }}
              >
                {/* Island body */}
                <div style={{
                  width:        155,
                  height:       85,
                  background:   col.top,
                  borderRadius: "50% 50% 46% 46% / 42% 42% 58% 58%",
                  boxShadow:    `0 ${isAct ? 28 : 18}px 50px ${col.shadow}, inset 0 -8px 18px rgba(0,0,0,.32)`,
                  border:       isAct ? "2px solid rgba(255,255,255,.32)" : "2px solid transparent",
                  display:      "flex",
                  flexDirection: "column",
                  alignItems:   "center",
                  justifyContent: "center",
                  position:     "relative",
                  overflow:     "hidden",
                  transition:   "box-shadow .3s",
                }}>
                  {/* Island shadow */}
                  <div style={{
                    position:     "absolute",
                    bottom:       0, left: 0, right: 0,
                    height:       "38%",
                    background:   "rgba(0,0,0,.22)",
                    borderRadius: "0 0 50% 50%",
                  }} />
                  {/* Island content */}
                  <div style={{ position: "relative", zIndex: 2, padding: "0 10px" }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>
                      {ISLAND_ICONS[i] || "✦"}
                    </div>
                    <div style={{
                      fontFamily: "var(--fd)", fontWeight: 700,
                      fontSize: 11, color: "#fff",
                      textAlign: "center", lineHeight: 1.3,
                    }}>
                      {c.career}
                    </div>
                  </div>
                  {/* Active glow ring */}
                  {isAct && (
                    <div style={{
                      position:     "absolute",
                      inset:        -3,
                      borderRadius: "50% 50% 46% 46%",
                      border:       "2px solid rgba(255,255,255,.38)",
                      animation:    "glowP 2s ease-in-out infinite",
                    }} />
                  )}
                </div>

                {/* Rank + confidence badge */}
                <div style={{
                  position:     "absolute",
                  top:          -10, right: -6,
                  background:   "linear-gradient(135deg,#c47a00,var(--gold))",
                  color:        "#1a0800",
                  borderRadius: 20,
                  padding:      "3px 10px",
                  fontSize:     11,
                  fontWeight:   700,
                  fontFamily:   "var(--fd)",
                  boxShadow:    "0 3px 10px rgba(240,180,41,.38)",
                }}>
                  #{c.rank} · {c.confidence}%
                </div>

                {/* Label below island */}
                <div style={{
                  marginTop:  10,
                  fontSize:   12,
                  color:      isAct ? "var(--aqua)" : "var(--muted)",
                  fontFamily: "var(--fd)",
                  fontWeight: 600,
                  transition: "color .3s",
                }}>
                  {isAct ? "▼ Exploring" : "Click to explore"}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Career Detail Panel ────────────────────────────── */}
        {current && (
          <div className="glass fu" style={{ marginTop: 16, padding: 28 }} key={active}>

            {/* Loading state */}
            {loading && (
              <div style={{
                textAlign: "center", padding: "32px 0",
                color: "var(--muted)", fontSize: 14,
              }}>
                <span style={{
                  display:      "inline-block",
                  width:        20, height: 20,
                  borderRadius: "50%",
                  border:       "2px solid rgba(46,184,200,.3)",
                  borderTopColor: "var(--aqua)",
                  animation:    "spin .7s linear infinite",
                  marginRight:  10,
                  verticalAlign: "middle",
                }} />
                Loading career data…
              </div>
            )}

            {/* Error message */}
            {fetchErr && (
              <div style={{
                background:   "rgba(255,123,107,.1)",
                border:       "1px solid rgba(255,123,107,.28)",
                borderRadius: 10,
                padding:      "10px 14px",
                marginBottom: 16,
                color:        "var(--coral)",
                fontSize:     13,
              }}>
                {fetchErr}
              </div>
            )}

            {/* Career header */}
            {!loading && prep && sal && (
              <>
                <div style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "flex-start",
                  flexWrap:       "wrap",
                  gap:            14,
                  marginBottom:   22,
                }}>
                  <div>
                    <div style={{
                      fontSize:      11,
                      color:         "var(--aqua)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom:  5,
                    }}>
                      Rank #{current.rank} Match
                    </div>
                    <h2 style={{
                      fontFamily:   "var(--fd)",
                      fontSize:     26,
                      fontWeight:   800,
                      marginBottom: 8,
                    }}>
                      {current.career}
                    </h2>

                    {/* Info badges */}
                    <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                      {[
                        { l: `${current.confidence}% match`, c: "var(--gold)",  b: "rgba(240,180,41,.1)",   br: "rgba(240,180,41,.28)"  },
                        { l: `${current.colleges?.length || 0} colleges`, c: "var(--aqua)", b: "rgba(46,184,200,.08)", br: "rgba(46,184,200,.22)" },
                        { l: `${current.jobs?.length || 0} jobs`, c: "var(--foam)", b: "rgba(126,232,200,.07)", br: "rgba(126,232,200,.22)" },
                        { l: prep.timeline, c: "var(--sand)", b: "rgba(245,230,200,.07)", br: "rgba(245,230,200,.18)" },
                      ].map(b => (
                        <span key={b.l} style={{
                          background:   b.b,
                          border:       `1px solid ${b.br}`,
                          borderRadius: 20,
                          padding:      "4px 13px",
                          fontSize:     12,
                          color:        b.c,
                        }}>
                          {b.l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Confidence ring */}
                  <svg width="76" height="76" viewBox="0 0 76 76">
                    <circle cx="38" cy="38" r="32" fill="none"
                      stroke="rgba(46,184,200,.07)" strokeWidth="5" />
                    <circle cx="38" cy="38" r="32" fill="none"
                      stroke="url(#cg)" strokeWidth="5"
                      strokeDasharray={`${current.confidence * 2.01} 201`}
                      strokeLinecap="round"
                      transform="rotate(-90 38 38)"
                      style={{ animation: "drawPath 1.2s ease" }}
                    />
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="var(--teal)" />
                        <stop offset="100%" stopColor="var(--aqua)" />
                      </linearGradient>
                    </defs>
                    <text x="38" y="42" textAnchor="middle"
                      fill="var(--aqua)" fontSize="12"
                      fontWeight="800" fontFamily="Syne">
                      {current.confidence}%
                    </text>
                  </svg>
                </div>

                {/* ── Tabs ──────────────────────────────────────── */}
                <div style={{
                  display:      "flex",
                  gap:          5,
                  marginBottom: 20,
                  background:   "rgba(255,255,255,.03)",
                  borderRadius: 12,
                  padding:      4,
                }}>
                  {ROADMAP_TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      style={{
                        flex:         1,
                        padding:      "9px 4px",
                        background:   tab === t.id
                          ? "linear-gradient(135deg, rgba(46,184,200,.22), rgba(80,212,224,.12))"
                          : "transparent",
                        border:       tab === t.id
                          ? "1px solid rgba(46,184,200,.28)"
                          : "1px solid transparent",
                        borderRadius: 9,
                        color:        tab === t.id ? "var(--aqua)" : "var(--muted)",
                        fontFamily:   "var(--fd)",
                        fontWeight:   600,
                        fontSize:     12,
                        transition:   "all .25s",
                        cursor:       "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ───────────────────────────────── */}
                <div key={tab} style={{ animation: "fadeUp .3s ease" }}>

                  {/* Overview tab */}
                  {tab === "overview" && (
                    <div>
                      {/* Pro tip */}
                      <div style={{
                        background:   "rgba(46,184,200,.05)",
                        border:       "1px solid rgba(46,184,200,.14)",
                        borderRadius: 12,
                        padding:      "16px 18px",
                        marginBottom: 16,
                      }}>
                        <div style={{
                          fontSize: 11, color: "var(--aqua)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}>
                          💡 Pro Tip
                        </div>
                        <p style={{ fontSize: 14, color: "var(--txt)", lineHeight: 1.75 }}>
                          {prep.tip}
                        </p>
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{
                          background:   "rgba(240,180,41,.05)",
                          border:       "1px solid rgba(240,180,41,.14)",
                          borderRadius: 12,
                          padding:      "14px 16px",
                        }}>
                          <div style={{
                            fontSize: 11, color: "var(--gold)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase", marginBottom: 6,
                          }}>
                            ⏱ Prep Timeline
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>
                            {prep.timeline}
                          </div>
                        </div>

                        <div style={{
                          background:   "rgba(126,232,200,.05)",
                          border:       "1px solid rgba(126,232,200,.14)",
                          borderRadius: 12,
                          padding:      "14px 16px",
                        }}>
                          <div style={{
                            fontSize: 11, color: "var(--foam)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase", marginBottom: 6,
                          }}>
                            💰 Avg Fresher Salary
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>
                            {fmtINR(sal.avg)} / year
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills tab */}
                  {tab === "skills" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {prep.skills.map((sk, i) => (
                        <div key={i} style={{
                          display:     "flex",
                          alignItems:  "center",
                          gap:         12,
                          background:  "rgba(255,255,255,.03)",
                          borderRadius: 10,
                          padding:     "12px 16px",
                          animation:   `slideR .3s ${i * 0.06}s ease both`,
                        }}>
                          <div style={{
                            width:          26,
                            height:         26,
                            borderRadius:   "50%",
                            background:     "rgba(46,184,200,.11)",
                            border:         "1px solid rgba(46,184,200,.28)",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            fontSize:       11,
                            color:          "var(--aqua)",
                            fontWeight:     700,
                            flexShrink:     0,
                          }}>
                            {i + 1}
                          </div>
                          <span style={{ fontSize: 14 }}>{sk}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications tab */}
                  {tab === "certs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {prep.certifications.map((cert, i) => (
                        <div key={i} style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          12,
                          background:   "rgba(240,180,41,.04)",
                          border:       "1px solid rgba(240,180,41,.14)",
                          borderRadius: 10,
                          padding:      "12px 16px",
                          animation:    `slideR .3s ${i * 0.06}s ease both`,
                        }}>
                          <span style={{ fontSize: 17 }}>🏅</span>
                          <span style={{ fontSize: 14 }}>{cert}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tools tab */}
                  {tab === "tools" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                      {prep.tools.map((tool, i) => (
                        <div key={i} style={{
                          background:   "rgba(46,184,200,.07)",
                          border:       "1px solid rgba(46,184,200,.2)",
                          borderRadius: 10,
                          padding:      "10px 17px",
                          fontSize:     14,
                          animation:    `scaleIn .3s ${i * 0.05}s ease both`,
                        }}>
                          ⚙️ {tool}
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* ── CTA Buttons ───────────────────────────────── */}
                <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>

                  {/* Colleges button */}
                  <button
                    onClick={() => onColleges(current)}
                    style={{
                      flex:           1,
                      minWidth:       180,
                      background:     "linear-gradient(135deg, rgba(26,143,160,.22), rgba(46,184,200,.1))",
                      border:         "1px solid rgba(46,184,200,.28)",
                      borderRadius:   14,
                      padding:        "18px 22px",
                      cursor:         "pointer",
                      color:          "var(--txt)",
                      textAlign:      "left",
                      transition:     "all .3s",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform  = "translateY(-4px)";
                      e.currentTarget.style.boxShadow  = "0 16px 40px rgba(0,0,0,.4)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform  = "translateY(0)";
                      e.currentTarget.style.boxShadow  = "none";
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 8 }}>🎓</div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                      Recommended Colleges
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                      Top NIRF-ranked institutions for your profile
                    </div>
                    <div style={{ color: "var(--aqua)", fontSize: 13, fontWeight: 600 }}>
                      {current.colleges?.length || 0} colleges →
                    </div>
                  </button>

                  {/* Jobs button */}
                  <button
                    onClick={() => onJobs(current)}
                    style={{
                      flex:           1,
                      minWidth:       180,
                      background:     "linear-gradient(135deg, rgba(180,112,0,.18), rgba(240,180,41,.07))",
                      border:         "1px solid rgba(240,180,41,.26)",
                      borderRadius:   14,
                      padding:        "18px 22px",
                      cursor:         "pointer",
                      color:          "var(--txt)",
                      textAlign:      "left",
                      transition:     "all .3s",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform  = "translateY(-4px)";
                      e.currentTarget.style.boxShadow  = "0 16px 40px rgba(0,0,0,.4)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform  = "translateY(0)";
                      e.currentTarget.style.boxShadow  = "none";
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 8 }}>💼</div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                      Recommended Jobs
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                      Fresher openings sorted by your city
                    </div>
                    <div style={{ color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>
                      {current.jobs?.length || 0} jobs →
                    </div>
                  </button>

                </div>
              </>
            )}
          </div>
        )}

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
};

export default RoadmapPage;