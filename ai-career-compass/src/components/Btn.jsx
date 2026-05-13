// ─── BUTTON COMPONENT ────────────────────────────────────────
// Primary action button used across all pages.
//
// Props:
//   children  {node}      — button label / content
//   onClick   {function}  — click handler
//   loading   {boolean}   — shows spinner + "Analysing…" when true
//   variant   {string}    — "primary" | "gold" | "ghost" (default "primary")
//   style     {object}    — extra inline styles to merge in
//   disabled  {boolean}   — disables button and reduces opacity
//
// Features:
//   - Ripple effect that spawns at the exact click coordinates
//   - 3 visual variants (teal, gold, outline)
//   - Loading spinner state
//   - Disabled state with reduced opacity

import { useState } from "react";

const Btn = ({
  children,
  onClick,
  loading,
  variant  = "primary",
  style    = {},
  disabled,
}) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    // Calculate click position relative to the button
    const rect = e.currentTarget.getBoundingClientRect();
    const id   = Date.now();

    // Add ripple at click coordinates
    setRipples(prev => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);

    // Remove ripple after animation completes (700ms)
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);

    // Fire the actual click handler
    if (!disabled && !loading) onClick?.(e);
  };

  // ── Variant styles ──────────────────────────────────────
  const variants = {
    primary: {
      background: "linear-gradient(135deg, #1a8fa0, var(--aqua))",
      color:      "#fff",
      boxShadow:  "0 4px 20px rgba(46,184,200,.28)",
    },
    gold: {
      background: "linear-gradient(135deg, #c47a00, var(--gold))",
      color:      "#1a0a00",
      boxShadow:  "0 4px 20px rgba(240,180,41,.32)",
    },
    ghost: {
      background: "rgba(46,184,200,.07)",
      border:     "1px solid rgba(46,184,200,.26)",
      color:      "var(--aqua)",
    },
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        // Base styles
        position:     "relative",
        overflow:     "hidden",
        border:       "none",
        borderRadius: 12,
        fontFamily:   "var(--fd)",
        fontWeight:   600,
        padding:      "13px 28px",
        fontSize:     15,
        transition:   "all .3s",
        cursor:       disabled || loading ? "not-allowed" : "pointer",
        opacity:      disabled ? 0.5 : 1,
        // Apply selected variant
        ...variants[variant],
        // Apply any extra styles passed in
        ...style,
      }}
    >

      {/* ── Ripple effects ──────────────────────────────── */}
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position:      "absolute",
            left:          r.x - 10,
            top:           r.y - 10,
            width:         20,
            height:        20,
            borderRadius:  "50%",
            background:    "rgba(255,255,255,.22)",
            animation:     "ripple .7s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Content: spinner or label ────────────────────── */}
      {loading ? (
        <span style={{
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          justifyContent: "center",
        }}>
          {/* Spinning circle */}
          <span style={{
            width:        16,
            height:       16,
            borderRadius: "50%",
            border:       "2px solid rgba(255,255,255,.3)",
            borderTopColor: "#fff",
            display:      "inline-block",
            animation:    "spin .7s linear infinite",
          }} />
          Analysing…
        </span>
      ) : (
        children
      )}

    </button>
  );
};

export default Btn;