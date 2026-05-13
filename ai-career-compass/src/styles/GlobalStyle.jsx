// ─── GLOBAL STYLES ───────────────────────────────────────────
// All CSS variables, keyframe animations, and base resets
// live here. Import this once in App.jsx and it applies
// to the entire application.

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

    /* ── Reset ────────────────────────────────────────────── */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ── CSS Variables (Design Tokens) ───────────────────── */
    :root {
      /* Backgrounds */
      --bg:      #04101e;
      --surf:    #071828;
      --card:    #08203a;

      /* Brand colours */
      --teal:    #2eb8c8;
      --aqua:    #50d4e0;
      --foam:    #7ee8c8;
      --pearl:   #cceeff;
      --sand:    #f5e6c8;
      --gold:    #f0b429;
      --coral:   #ff7b6b;
      --sage:    #a8d8b0;

      /* Text */
      --txt:     #e4f2f8;
      --muted:   rgba(190, 225, 240, 0.42);

      /* UI */
      --brd:     rgba(50, 180, 210, 0.16);
      --glass:   rgba(6, 24, 46, 0.68);

      /* Typography */
      --fd: 'Syne', sans-serif;
      --fb: 'DM Sans', sans-serif;
    }

    /* ── Base ─────────────────────────────────────────────── */
    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: var(--fb);
      background: var(--bg);
      color: var(--txt);
      overflow-x: hidden;
      min-height: 100vh;
    }

    /* ── Scrollbar ────────────────────────────────────────── */
    ::-webkit-scrollbar        { width: 4px; }
    ::-webkit-scrollbar-track  { background: var(--bg); }
    ::-webkit-scrollbar-thumb  { background: var(--teal); border-radius: 2px; }

    /* ── Input / Button resets ────────────────────────────── */
    select option  { background: #071828; }
    input, select, textarea { font-family: var(--fb); outline: none; }
    button { cursor: pointer; font-family: var(--fb); }

    /* ── Reusable utility classes ─────────────────────────── */
    .page  { animation: fadeIn .4s ease forwards; }
    .fu    { animation: fadeUp .5s ease forwards; }
    .si    { animation: scaleIn .4s ease forwards; }

    /* Glassmorphism card */
    .glass {
      background:            var(--glass);
      backdrop-filter:       blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border:                1px solid var(--brd);
      border-radius:         18px;
    }

    /* Shimmer gradient text */
    .shimmer {
      background: linear-gradient(
        90deg,
        var(--aqua),
        var(--foam),
        var(--gold),
        var(--aqua)
      );
      background-size:            300% auto;
      -webkit-background-clip:    text;
      -webkit-text-fill-color:    transparent;
      background-clip:            text;
      animation:                  shimmer 4s linear infinite;
    }

    /* Slider thumb */
    input[type=range]::-webkit-slider-thumb {
      appearance: none;
      width:        18px;
      height:       18px;
      border-radius: 50%;
      background:   var(--aqua);
      cursor:       pointer;
    }

    /* ── Keyframe Animations ──────────────────────────────── */

    /* Page / element transitions */
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes slideR {
      from { opacity: 0; transform: translateX(-18px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Ocean background */
    @keyframes waveScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes twinkle {
      0%,100% { opacity: .12; transform: scale(1); }
      50%     { opacity: .8;  transform: scale(1.5); }
    }
    @keyframes bubbles {
      0%   { transform: translateY(0) scale(1);    opacity: .5; }
      100% { transform: translateY(-110px) scale(.25); opacity: 0; }
    }

    /* Floating elements */
    @keyframes floatA {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%     { transform: translateY(-14px) rotate(1deg); }
    }
    @keyframes floatB {
      0%,100% { transform: translateY(-6px); }
      50%     { transform: translateY(8px); }
    }
    @keyframes iFloat {
      0%,100% { transform: translateY(0) rotate(-.5deg); }
      50%     { transform: translateY(-10px) rotate(.5deg); }
    }

    /* Compass */
    @keyframes compassGlow {
      0%,100% { filter: drop-shadow(0 0 6px rgba(240,180,41,.5)); }
      50%     { filter: drop-shadow(0 0 18px rgba(240,180,41,.9)); }
    }

    /* Glow effects */
    @keyframes glowP {
      0%,100% { box-shadow: 0 0 14px rgba(50,180,210,.18); }
      50%     { box-shadow: 0 0 32px rgba(50,180,210,.5), 0 0 64px rgba(50,180,210,.12); }
    }

    /* Text shimmer */
    @keyframes shimmer {
      0%   { background-position: -300% center; }
      100% { background-position:  300% center; }
    }

    /* SVG paths */
    @keyframes drawPath {
      from { stroke-dashoffset: 800; }
      to   { stroke-dashoffset: 0; }
    }

    /* Button */
    @keyframes ripple {
      0%   { transform: scale(0); opacity: .5; }
      100% { transform: scale(3); opacity: 0; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* Progress bars */
    @keyframes pFill {
      from { width: 0; }
      to   { width: var(--w, 60%); }
    }

    /* Island path nodes */
    @keyframes blink {
      0%,100% { opacity: 1; }
      50%     { opacity: .25; }
    }
  `}</style>
);

export default GlobalStyle;