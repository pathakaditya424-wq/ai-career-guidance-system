// ─── SLIDER COMPONENT ────────────────────────────────────────
// Custom styled range slider with live value display.
// Used on InputPage Step 1 (marks, CGPA) and Step 3 (budget).
//
// Props:
//   label    {string}    — label shown above slider
//   value    {number}    — current value (controlled)
//   onChange {function}  — called with new number value on change
//   min      {number}    — minimum value
//   max      {number}    — maximum value
//   unit     {string}    — unit suffix shown next to value (e.g. "%", "/10", "L/yr")
//
// Features:
//   - Teal gradient fill shows proportion visually
//   - Live value display in gold top-right
//   - Custom webkit slider thumb via GlobalStyle.jsx

const Slider = ({ label, value, onChange, min, max, unit }) => (
  <div style={{ marginBottom: 22 }}>

    {/* ── Label row — name on left, value on right ──────── */}
    <div style={{
      display:        "flex",
      justifyContent: "space-between",
      marginBottom:   8,
    }}>
      <label style={{
        fontSize:      11,
        color:         "var(--aqua)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily:    "var(--fd)",
      }}>
        {label}
      </label>

      {/* Live value display */}
      <span style={{
        fontSize:   14,
        color:      "var(--gold)",
        fontWeight: 600,
        fontFamily: "var(--fd)",
      }}>
        {value}{unit}
      </span>
    </div>

    {/* ── Slider track ─────────────────────────────────── */}
    <div style={{
      position:     "relative",
      height:       5,
      borderRadius: 3,
      background:   "rgba(46,184,200,.1)",
    }}>

      {/* Teal fill — width is proportional to current value */}
      <div style={{
        position:     "absolute",
        left:         0,
        top:          0,
        height:       "100%",
        width:        `${((value - min) / (max - min)) * 100}%`,
        background:   "linear-gradient(90deg, var(--teal), var(--aqua))",
        borderRadius: 3,
        transition:   "width .1s",
        pointerEvents: "none",
      }} />

      {/* Native range input — invisible but handles interaction.
          Positioned over the track so clicking/dragging works.
          Styled thumb is defined in GlobalStyle.jsx */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          position: "absolute",
          inset:    "-10px 0",
          width:    "100%",
          opacity:  0,
          cursor:   "pointer",
          height:   "25px",
        }}
      />
    </div>

  </div>
);

export default Slider;