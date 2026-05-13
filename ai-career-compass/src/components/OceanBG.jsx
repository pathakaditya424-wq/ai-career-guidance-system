// ─── OCEAN BACKGROUND COMPONENT ──────────────────────────────
// Fixed-position animated background used on all 5 pages.
// Contains: stars, moon glow, 3 wave layers, glow orbs, bubbles.
// All animation keyframes are defined in GlobalStyle.jsx.

const OceanBG = () => {
  // Generate random stars once — 55 particles
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id:    i,
    x:     Math.random() * 100,       // left % position
    y:     Math.random() * 52,        // top % position (upper half only)
    size:  Math.random() * 2.2 + 0.4, // 0.4px to 2.6px
    dur:   Math.random() * 5 + 2,     // twinkle duration 2–7s
    delay: Math.random() * 4,         // staggered start 0–4s
    isGold: i % 6 === 0,              // every 6th star is gold
  }));

  // Generate rising bubbles — 10 particles
  const bubbles = Array.from({ length: 10 }, (_, i) => ({
    id:    i,
    x:     Math.random() * 100,       // left % position
    size:  Math.random() * 7 + 3,     // 3px to 10px
    dur:   Math.random() * 4 + 2,     // rise duration 2–6s
    delay: Math.random() * 6,         // staggered start 0–6s
  }));

  return (
    <div style={{
      position:      "fixed",
      inset:         0,
      zIndex:        0,
      overflow:      "hidden",
      pointerEvents: "none",
    }}>

      {/* ── Sky gradient ─────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        inset:      0,
        background: "linear-gradient(180deg, #020c18 0%, #04111f 28%, #061a30 52%, #082540 68%, #0a3050 82%, #0c3d62 100%)",
      }} />

      {/* ── Stars ────────────────────────────────────────── */}
      {stars.map(s => (
        <div key={s.id} style={{
          position:     "absolute",
          left:         `${s.x}%`,
          top:          `${s.y}%`,
          width:        s.size,
          height:       s.size,
          borderRadius: "50%",
          background:   s.isGold
            ? "rgba(240,180,41,.9)"
            : "rgba(195,232,252,.75)",
          animation:    `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* ── Moon ─────────────────────────────────────────── */}
      <div style={{
        position:     "absolute",
        top:          "7%",
        right:        "10%",
        width:        55,
        height:       55,
        borderRadius: "50%",
        background:   "radial-gradient(circle, rgba(248,235,205,.88) 28%, rgba(248,235,205,.28) 58%, transparent 78%)",
        boxShadow:    "0 0 36px rgba(248,235,205,.25)",
      }} />

      {/* ── Wave layers (3 overlapping) ───────────────────── */}
      {[
        { h: "20%", op: 0.16, spd: "20s", c: "46,180,210",  y: "80%" },
        { h: "17%", op: 0.24, spd: "15s", c: "28,140,175",  y: "84%" },
        { h: "14%", op: 0.34, spd: "11s", c: "14,100,148",  y: "87%" },
      ].map((w, i) => (
        <div key={i} style={{
          position:  "absolute",
          bottom:    0,
          left:      0,
          width:     "200%",    // double width so scroll looks seamless
          height:    w.h,
          top:       w.y,
          animation: `waveScroll ${w.spd} ${i * 1.8}s linear infinite`,
        }}>
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <path
              d={`M0,${38 + i * 7}
                  C180,${8 + i * 4} 360,${78 + i * 4} 540,${38 + i * 7}
                  C720,${8 + i * 4} 900,${78 + i * 4} 1080,${38 + i * 7}
                  C1260,${8 + i * 4} 1350,${68 + i * 4} 1440,${38 + i * 7}
                  L1440,120 L0,120 Z`}
              fill={`rgba(${w.c},${w.op})`}
            />
          </svg>
        </div>
      ))}

      {/* ── Ocean surface shimmer line ────────────────────── */}
      <div style={{
        position:   "absolute",
        bottom:     "10%",
        left:       0,
        right:      0,
        height:     2,
        background: "linear-gradient(90deg, transparent, rgba(100,220,240,.35), rgba(150,240,200,.25), transparent)",
        animation:  "shimmer 7s linear infinite",
      }} />

      {/* ── Bioluminescent glow orbs ─────────────────────── */}
      <div style={{
        position:   "absolute",
        bottom:     "16%",
        left:       "18%",
        width:      180,
        height:     55,
        background: "radial-gradient(ellipse, rgba(46,184,200,.1) 0%, transparent 70%)",
        animation:  "glowP 5s ease-in-out infinite",
      }} />
      <div style={{
        position:   "absolute",
        bottom:     "22%",
        right:      "22%",
        width:      140,
        height:     45,
        background: "radial-gradient(ellipse, rgba(126,232,200,.08) 0%, transparent 70%)",
        animation:  "glowP 7s 2s ease-in-out infinite",
      }} />

      {/* ── Rising bubbles ────────────────────────────────── */}
      {bubbles.map(b => (
        <div key={b.id} style={{
          position:     "absolute",
          left:         `${b.x}%`,
          bottom:       "6%",
          width:        b.size,
          height:       b.size,
          borderRadius: "50%",
          border:       "1px solid rgba(100,220,240,.25)",
          animation:    `bubbles ${b.dur}s ${b.delay}s ease-in infinite`,
        }} />
      ))}

    </div>
  );
};

export default OceanBG;