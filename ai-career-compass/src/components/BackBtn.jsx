// ─── BACK BUTTON COMPONENT ───────────────────────────────────
// Consistent back/navigation button used on every page
// except AuthPage.
//
// Props:
//   onClick  {function}  — called when button is clicked
//   label    {string}    — button text (default "← Go Back")
//
// Features:
//   - Translucent teal background
//   - Slides left 3px on hover (micro-interaction)
//   - Consistent styling across all pages

const BackBtn = ({ onClick, label = "← Go Back" }) => (
  <button
    onClick={onClick}
    style={{
      display:        "flex",
      alignItems:     "center",
      gap:            7,
      background:     "rgba(46,184,200,.08)",
      border:         "1px solid rgba(46,184,200,.24)",
      borderRadius:   10,
      padding:        "9px 17px",
      color:          "var(--aqua)",
      fontFamily:     "var(--fd)",
      fontWeight:     600,
      fontSize:       14,
      cursor:         "pointer",
      transition:     "all .25s",
      whiteSpace:     "nowrap",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background  = "rgba(46,184,200,.16)";
      e.currentTarget.style.transform   = "translateX(-3px)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background  = "rgba(46,184,200,.08)";
      e.currentTarget.style.transform   = "translateX(0)";
    }}
  >
    {label}
  </button>
);

export default BackBtn;