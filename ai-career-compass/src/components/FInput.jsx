

import { useState } from "react";

const FInput = ({
  label,
  type      = "text",
  value,
  onChange,
  rightIcon,
}) => {
  const [focused, setFocused] = useState(false);

  // Label is "active" (floated up) when focused OR when field has a value
  const isActive = focused || Boolean(value);

  return (
    <div style={{ position: "relative", marginBottom: 18 }}>

      {/* ── Input container ─────────────────────────────── */}
      <div style={{
        background:    "rgba(255,255,255,.03)",
        borderRadius:  12,
        border:        `1px solid ${focused
          ? "var(--aqua)"
          : "rgba(46,184,200,.16)"
        }`,
        transition:    "border-color .3s, box-shadow .3s",
        boxShadow:     focused
          ? "0 0 0 3px rgba(46,184,200,.09)"
          : "none",
        padding:       "18px 16px 7px",
      }}>

        {/* ── Floating label + input wrapper ──────────────── */}
        <div style={{ position: "relative" }}>

          {/* Floating label */}
          <label style={{
            position:      "absolute",
            left:          0,
            // Moves up when active, stays in middle when inactive
            top:           isActive ? -10 : 5,
            fontSize:      isActive ? 11 : 14,
            color:         isActive
              ? "var(--aqua)"
              : "var(--muted)",
            transition:    "all .2s ease",
            pointerEvents: "none",  // so clicking label focuses the input
            letterSpacing: isActive ? "0.06em" : 0,
            textTransform: isActive ? "uppercase" : "none",
          }}>
            {label}
          </label>

          {/* Actual input field */}
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={()  => setFocused(false)}
            style={{
              background:  "none",
              border:      "none",
              width:       "100%",
              color:       "var(--txt)",
              fontSize:    15,
              padding:     "4px 0",
              fontFamily:  "var(--fb)",
            }}
          />
        </div>

        {/* ── Right icon (e.g. password eye toggle) ──────── */}
        {rightIcon && (
          <span style={{
            position:  "absolute",
            right:     14,
            top:       "50%",
            transform: "translateY(-50%)",
          }}>
            {rightIcon}
          </span>
        )}

      </div>
    </div>
  );
};

export default FInput;