// ─── COLLEGES PAGE ───────────────────────────────────────────
// Displays college recommendations from the API response.
// Data comes from the career object passed as prop —
// no additional API calls needed here.
//
// Props:
//   career  {object}    — selected career from RoadmapPage
//                         contains career.colleges[] array
//   onBack  {function}  — returns to RoadmapPage

import OceanBG  from "../components/OceanBG";
import BackBtn  from "../components/BackBtn";
import { useState } from "react";
import {
  COLLEGE_TYPE_COLORS,
  ELIGIBILITY_COLORS,
} from "../data/constants";

const CollegesPage = ({ career, onBack }) => {
  const [filter, setFilter] = useState("all");

  const colleges = career?.colleges || [];

  // Get unique college types from the data for filter pills
  const types = [...new Set(colleges.map(c => c.college_type))];

  // Apply type filter then sort: preferred city first, then NIRF rank
  const filtered = (filter === "all"
    ? colleges
    : colleges.filter(c => c.college_type === filter)
  ).slice().sort((a, b) => {
    if (a.city_match && !b.city_match) return -1;
    if (!a.city_match && b.city_match) return 1;
    return a.nirf_rank - b.nirf_rank;
  });

  return (
    <div
      className="page"
      style={{ minHeight: "100vh", padding: "26px 22px", position: "relative" }}
    >
      <OceanBG />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <BackBtn onClick={onBack} />
          <div>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 800 }}>
              🎓 Recommended Colleges
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
              For{" "}
              <span style={{ color: "var(--aqua)" }}>{career?.career}</span>
              {" "}· {colleges.length} institutions found
            </p>
          </div>
        </div>

        {/* ── Type filter pills ────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {["all", ...types].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding:      "6px 16px",
                borderRadius: 20,
                border:       "none",
                background:   filter === t
                  ? (COLLEGE_TYPE_COLORS[t] || "var(--teal)")
                  : "rgba(255,255,255,.05)",
                color:        filter === t ? "#fff" : "var(--muted)",
                fontFamily:   "var(--fd)",
                fontWeight:   600,
                fontSize:     13,
                cursor:       "pointer",
                transition:   "all .2s",
              }}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>

        {/* ── Empty state ──────────────────────────────────── */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
            <p>No colleges match this filter or your budget setting.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Try adjusting your fee budget on the input page.
            </p>
          </div>
        )}

        {/* ── College cards grid ───────────────────────────── */}
        <div style={{
          display:               "grid",
          gridTemplateColumns:   "repeat(auto-fill, minmax(370px, 1fr))",
          gap:                   16,
        }}>
          {filtered.map((c, i) => (
            <div
              key={i}
              className="glass"
              style={{
                padding:    "22px 24px",
                animation:  `fadeUp .4s ${i * 0.07}s ease both`,
                transition: "transform .3s, box-shadow .3s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform  = "translateY(-5px)";
                e.currentTarget.style.boxShadow  = "0 20px 55px rgba(0,0,0,.5)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform  = "translateY(0)";
                e.currentTarget.style.boxShadow  = "none";
              }}
            >

              {/* ── Card top row ─────────────────────────── */}
              <div style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "flex-start",
                gap:            12,
                marginBottom:   14,
              }}>
                <div style={{ flex: 1 }}>
                  {/* Type badge + eligibility + city match */}
                  <div style={{
                    display:     "flex",
                    alignItems:  "center",
                    gap:         8,
                    marginBottom: 7,
                    flexWrap:    "wrap",
                  }}>
                    <span style={{
                      background:   COLLEGE_TYPE_COLORS[c.college_type] || "#555",
                      color:        "#fff",
                      borderRadius: 6,
                      padding:      "2px 8px",
                      fontSize:     11,
                      fontWeight:   700,
                    }}>
                      {c.college_type}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color:    ELIGIBILITY_COLORS[c.eligibility] || "var(--txt)",
                    }}>
                      {c.eligibility}
                    </span>
                    {c.city_match && (
                      <span style={{
                        background:   "rgba(46,184,200,.11)",
                        border:       "1px solid rgba(46,184,200,.28)",
                        borderRadius: 20,
                        padding:      "2px 9px",
                        fontSize:     11,
                        color:        "var(--aqua)",
                      }}>
                        📍 Your City
                      </span>
                    )}
                  </div>

                  {/* College name */}
                  <h3 style={{
                    fontFamily:  "var(--fd)",
                    fontSize:    14,
                    fontWeight:  700,
                    lineHeight:  1.4,
                  }}>
                    {c.college_name}
                  </h3>
                </div>

                {/* NIRF Rank */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{
                    fontSize:   22,
                    fontFamily: "var(--fd)",
                    fontWeight: 800,
                    color:      "var(--gold)",
                  }}>
                    #{c.nirf_rank}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>NIRF</div>
                </div>
              </div>

              {/* ── Info grid ────────────────────────────── */}
              <div style={{
                display:             "grid",
                gridTemplateColumns: "1fr 1fr",
                gap:                 8,
                marginBottom:        14,
              }}>
                {[
                  { label: "📍 Location", value: `${c.city}, ${c.state}` },
                  { label: "📚 Field",    value: c.field },
                  { label: "💰 Fee Range", value: c.fee_range },
                  { label: "🎓 Modes",   value: c.modes_offered?.join(" · ") },
                ].map(item => (
                  <div key={item.label} style={{
                    background:   "rgba(255,255,255,.03)",
                    borderRadius: 8,
                    padding:      "8px 11px",
                  }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── NIRF score bar ───────────────────────── */}
              <div>
                <div style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  fontSize:       11,
                  color:          "var(--muted)",
                  marginBottom:   4,
                }}>
                  <span>NIRF Score</span>
                  <span style={{ color: "var(--aqua)", fontWeight: 600 }}>
                    {c.nirf_score?.toFixed(1)}
                  </span>
                </div>
                <div style={{
                  height:       4,
                  background:   "rgba(46,184,200,.07)",
                  borderRadius: 2,
                }}>
                  <div style={{
                    height:       "100%",
                    background:   "linear-gradient(90deg, var(--teal), var(--aqua))",
                    borderRadius: 2,
                    width:        `${c.nirf_score}%`,
                    animation:    "pFill 1.2s ease",
                  }} />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CollegesPage;