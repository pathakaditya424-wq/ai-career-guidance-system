import { useState } from "react";

const TagInput = ({ label, value = [], onChange, sugg = [], ph }) => {
  const [input, setInput] = useState("");
  const [show,  setShow]  = useState(false);

  // Filter suggestions — exclude already selected, match input text
  const filtered = sugg.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  // No match AND user has typed something
  const noMatch = input.trim().length > 0 && filtered.length === 0;

  // Add a tag from suggestion click only — no free typing
  const add = (tag) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
    setShow(false);
  };

  // Remove a tag
  const remove = (tag) => onChange(value.filter(t => t !== tag));

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Label ───────────────────────────────────────── */}
      <label style={{
        fontSize:      11,
        color:         "var(--aqua)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display:       "block",
        marginBottom:  8,
        fontFamily:    "var(--fd)",
      }}>
        {label}
      </label>

      {/* ── Tags + input container ───────────────────────── */}
      <div style={{
        background:   "rgba(255,255,255,.03)",
        border:       "1px solid rgba(46,184,200,.16)",
        borderRadius: 12,
        padding:      "10px 12px",
        minHeight:    50,
        display:      "flex",
        flexWrap:     "wrap",
        gap:          6,
        alignItems:   "center",
      }}>

        {/* Selected tags */}
        {value.map(tag => (
          <span key={tag} style={{
            background:   "rgba(46,184,200,.11)",
            border:       "1px solid rgba(46,184,200,.3)",
            borderRadius: 20,
            padding:      "3px 12px",
            fontSize:     13,
            color:        "var(--aqua)",
            display:      "flex",
            alignItems:   "center",
            gap:          6,
            animation:    "scaleIn .2s ease",
            fontFamily:   "var(--fb)",
          }}>
            {tag}
            <span
              onClick={() => remove(tag)}
              style={{ cursor: "pointer", opacity: 0.6, fontSize: 15 }}
            >
              ×
            </span>
          </span>
        ))}

        {/* Search input — typing filters the dropdown only, no free-form adding */}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={()  => setTimeout(() => setShow(false), 180)}
          onKeyDown={e => {
            // Block Enter from adding free-typed values
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder={value.length === 0 ? ph : "Search to add more…"}
          style={{
            background: "none",
            border:     "none",
            color:      "var(--txt)",
            fontSize:   14,
            minWidth:   120,
            flex:       1,
            fontFamily: "var(--fb)",
          }}
        />
      </div>

      {/* ── Dropdown ─────────────────────────────────────── */}
      {show && (
        <div style={{
          background:     "rgba(6,20,40,.97)",
          backdropFilter: "blur(16px)",
          border:         "1px solid rgba(46,184,200,.18)",
          borderRadius:   10,
          marginTop:      4,
          overflow:       "hidden",
          position:       "relative",
          zIndex:         100,
          maxHeight:      220,
          overflowY:      "auto",
        }}>

          {/* Matching suggestions */}
          {filtered.slice(0, 8).map(s => (
            <div
              key={s}
              onMouseDown={() => add(s)}
              style={{
                padding:    "10px 14px",
                cursor:     "pointer",
                fontSize:   14,
                transition: "background .15s",
                color:      "var(--txt)",
                fontFamily: "var(--fb)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(46,184,200,.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {s}
            </div>
          ))}

          {/* No match — apology message */}
          {noMatch && (
            <div style={{
              padding:    "14px 16px",
              fontSize:   13,
              color:      "var(--muted)",
              fontStyle:  "italic",
              lineHeight: 1.6,
              borderTop:  filtered.length > 0 ? "1px solid rgba(46,184,200,.1)" : "none",
            }}>
              😔 Sorry, <span style={{ color: "var(--aqua)" }}>"{input}"</span> is not
              in our list yet. Please select from the available options above.
            </div>
          )}

          {/* Empty state — nothing typed, show hint */}
          {!input && filtered.length === 0 && (
            <div style={{
              padding:   "12px 14px",
              fontSize:  13,
              color:     "var(--muted)",
              fontStyle: "italic",
            }}>
              All options already selected ✓
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TagInput;