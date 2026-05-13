// ─── COMPASS COMPONENT ───────────────────────────────────────
// Animated SVG compass with rotating needle.
// Used on: AuthPage (decorative), InputPage (shows step progress),
//          RoadmapPage (rotates to point at selected career island).
//
// Props:
//   angle  {number}  — needle rotation in degrees (default -30)
//   size   {number}  — width and height in px (default 80)

const Compass = ({ angle = -30, size = 80 }) => (
  <div style={{
    width:     size,
    height:    size,
    flexShrink: 0,
    animation: "compassGlow 3s ease-in-out infinite, floatA 6s ease-in-out infinite",
  }}>
    <svg
      viewBox="0 0 100 100"
      style={{ width: "100%", height: "100%" }}
    >

      {/* ── Outer ring ───────────────────────────────────── */}
      <circle
        cx="50" cy="50" r="46"
        fill="rgba(4,16,30,.92)"
        stroke="rgba(46,184,200,.32)"
        strokeWidth="1.5"
      />

      {/* ── Inner subtle ring ────────────────────────────── */}
      <circle
        cx="50" cy="50" r="40"
        fill="none"
        stroke="rgba(46,184,200,.08)"
        strokeWidth=".5"
      />

      {/* ── Tick marks (36 marks every 10 degrees) ────────── */}
      {Array.from({ length: 36 }, (_, i) => {
        const angleDeg = i * 10;
        const rad      = angleDeg * Math.PI / 180;

        // Cardinal marks (0,90,180,270) are longer and brighter
        const isCardinal = i % 9 === 0;
        const isMajor    = i % 3 === 0;

        const innerRadius = isCardinal ? 29 : isMajor ? 32 : 34;
        const outerRadius = 36;

        return (
          <line
            key={i}
            x1={50 + innerRadius * Math.sin(rad)}
            y1={50 - innerRadius * Math.cos(rad)}
            x2={50 + outerRadius * Math.sin(rad)}
            y2={50 - outerRadius * Math.cos(rad)}
            stroke={isCardinal
              ? "rgba(46,184,200,.55)"
              : "rgba(46,184,200,.18)"
            }
            strokeWidth={isCardinal ? 1.4 : 0.6}
          />
        );
      })}

      {/* ── Cardinal letters N E S W ──────────────────────── */}
      {["N", "E", "S", "W"].map((letter, i) => {
        const rad = i * 90 * Math.PI / 180;
        return (
          <text
            key={letter}
            x={50 + 24 * Math.sin(rad)}
            y={50 - 24 * Math.cos(rad)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={letter === "N" ? "var(--gold)" : "rgba(46,184,200,.68)"}
            fontSize="7"
            fontFamily="Syne"
            fontWeight="800"
          >
            {letter}
          </text>
        );
      })}

      {/* ── Rotating needle ──────────────────────────────────
          transform origin is the centre of the SVG (50,50).
          CSS spring transition gives a satisfying overshoot
          when the needle jumps to a new angle.
      ─────────────────────────────────────────────────────── */}
      <g style={{
        transformOrigin: "50px 50px",
        transform:       `rotate(${angle}deg)`,
        transition:      "transform 1.4s cubic-bezier(.34,1.56,.64,1)",
      }}>
        {/* North tip — coral red */}
        <polygon
          points="50,16 47,52 50,56 53,52"
          fill="var(--coral)"
          opacity=".94"
        />
        {/* South tip — translucent */}
        <polygon
          points="50,84 47,52 50,56 53,52"
          fill="rgba(195,230,242,.32)"
        />
        {/* Centre pivot — gold dot */}
        <circle cx="50" cy="50" r="4.5" fill="var(--gold)" />
        {/* Centre highlight */}
        <circle cx="50" cy="50" r="2" fill="white" />
      </g>

    </svg>
  </div>
);

export default Compass;