// ─── INPUT PAGE ──────────────────────────────────────────────
import { useState }  from "react";
import OceanBG       from "../components/OceanBG";
import Compass       from "../components/Compass";
import BackBtn       from "../components/BackBtn";
import Btn           from "../components/Btn";
import Slider        from "../components/Slider";
import {
  BOARD_OPTIONS,
  STREAM_OPTIONS,
  CITY_OPTIONS,
  MODE_OPTIONS,
} from "../data/constants";
import { predictDetailed } from "../config/api";

const STEPS = ["Academic", "Interests", "Preferences"];

const dropdownStyle = {
  width:"100%", background:"rgba(255,255,255,.03)",
  border:"1px solid rgba(46,184,200,.16)", borderRadius:12,
  color:"var(--txt)", padding:"13px 15px", fontSize:14,
  fontFamily:"var(--fb)", cursor:"pointer",
};

const labelStyle = {
  fontSize:11, color:"var(--aqua)", letterSpacing:"0.08em",
  textTransform:"uppercase", display:"block", marginBottom:8, fontFamily:"var(--fd)",
};

const INTEREST_GROUPS = [
  { label:"💻 Technology", items:["Coding","Web Development","Mobile App Development","Data Science","Machine Learning","Artificial Intelligence","Cybersecurity","Cloud Computing","Blockchain","Embedded Systems","Automation","Electronics","Hardware","Gaming","Animation"] },
  { label:"📊 Data & Analytics", items:["Data Analytics","Data Analysis","Finance","Financial Analysis","Business","Analytics","Statistics","Research"] },
  { label:"🎨 Design & Creative", items:["Design","Digital Media","Content Writing","Media","Arts","Photography","Music"] },
  { label:"📈 Business & Management", items:["Marketing","Digital Marketing","Entrepreneurship","Management","Project Management","Human Resource","Customer Care"] },
  { label:"⚙️ Science & Engineering", items:["Engineering","Architecture And Construction","Biotechnology","Healthcare","Medicine","Agriculture","Environment"] },
  { label:"📚 Education & Social", items:["Teaching","Academia","Higher Studies","Government Jobs","Social Work","Law"] },
  { label:"🚀 Other", items:["Mobile Apps","Application Development","Innovation","Information Technology","Infrastructure","Robotics"] },
];

const InputPage = ({ user, onSubmit, onBack }) => {
  const [step, setStep] = useState(0);
  const [marks10, setMarks10] = useState(75);
  const [marks12, setMarks12] = useState(75);
  const [board,   setBoard]   = useState("");
  const [stream,  setStream]  = useState("");
  const [interests, setInterests] = useState([]);
  const [cities, setCities] = useState([]);
  const [budget, setBudget] = useState(5);
  const [mode,   setMode]   = useState("Offline");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const toggleInterest = (item) =>
    setInterests(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const toggleCity = (c) =>
    setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleAnalyze = async () => {
    if (!interests.length) { setError("Please select at least one interest."); return; }
    setError(""); setLoading(true);
    try {
      const body = {
        skills: interests.join(", "), interests: interests.join(", "),
        marks_12th: marks12, preferred_city: cities.length > 0 ? cities[0] : "",
        budget_lakhs: budget, preferred_mode: mode, top_n: 3,
        specialization: stream, degree: board,
      };
      const data = await predictDetailed(body);
      onSubmit(data, body);
    } catch (err) {
      setError(`Cannot reach backend. Make sure FastAPI is running.\nError: ${err.message}`);
      setLoading(false);
    }
  };

  const chipBtn = (label, selected, onClick) => (
    <button key={label} onClick={onClick} style={{
      padding:"8px 16px", borderRadius:24, cursor:"pointer", transition:"all .2s",
      border:`1.5px solid ${selected ? "var(--aqua)" : "rgba(46,184,200,.18)"}`,
      background: selected ? "linear-gradient(135deg,rgba(26,143,160,.28),rgba(46,184,200,.14))" : "rgba(255,255,255,.03)",
      color: selected ? "var(--aqua)" : "var(--muted)",
      fontFamily:"var(--fd)", fontWeight:600, fontSize:13,
      boxShadow: selected ? "0 0 12px rgba(46,184,200,.18)" : "none",
    }}>
      {selected ? "✓ " : ""}{label}
    </button>
  );

  return (
    <div className="page" style={{ minHeight:"100vh", padding:"24px 20px", position:"relative" }}>
      <OceanBG />
      <div style={{ position:"relative", zIndex:10, maxWidth:760, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <Compass angle={step * 60} size={52} />
            <div>
              <div style={{ fontFamily:"var(--fd)", fontSize:20, fontWeight:800 }}>
                <span className="shimmer">AI Career Compass</span>
              </div>
              <div style={{ fontSize:13, color:"var(--muted)" }}>Hello, {user?.name} 🌊</div>
            </div>
          </div>
          <BackBtn onClick={onBack} label="← Log Out" />
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {STEPS.map((label, i) => (
              <div key={label} onClick={() => setStep(i)}
                style={{ flex:1, cursor:"pointer", opacity:i<=step?1:0.32, transition:"opacity .3s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                  <div style={{
                    width:24, height:24, borderRadius:"50%", fontSize:11, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center", transition:"all .3s",
                    background: i<step ? "linear-gradient(135deg,var(--teal),var(--aqua))" : i===step ? "rgba(46,184,200,.14)" : "rgba(255,255,255,.04)",
                    border:`1.5px solid ${i<=step?"var(--aqua)":"rgba(46,184,200,.14)"}`,
                    color: i<=step ? "var(--aqua)" : "var(--muted)",
                  }}>{i<step?"✓":i+1}</div>
                  <span style={{ fontFamily:"var(--fd)", fontSize:12, fontWeight:600, color:i<=step?"var(--txt)":"var(--muted)" }}>{label}</span>
                </div>
                <div style={{ height:3, borderRadius:2, transition:"background .4s",
                  background: i<=step ? "linear-gradient(90deg,var(--teal),var(--aqua))" : "rgba(46,184,200,.09)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Step card */}
        <div className="glass fu" style={{ padding:34 }} key={step}>

          {/* STEP 1 — Academic */}
          {step === 0 && (<>
            <h2 style={{ fontFamily:"var(--fd)", fontSize:20, fontWeight:700, marginBottom:4 }}>Academic Background</h2>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:26 }}>Tell us about your schooling</p>
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Board</label>
              <select value={board} onChange={e=>setBoard(e.target.value)} style={dropdownStyle}>
                <option value="">Select your board</option>
                {BOARD_OPTIONS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Stream (12th)</label>
              <select value={stream} onChange={e=>setStream(e.target.value)} style={dropdownStyle}>
                <option value="">Select your stream</option>
                {STREAM_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Slider label="10th Marks / Percentage" value={marks10} onChange={setMarks10} min={40} max={100} unit="%" />
            <Slider label="12th Marks / Percentage" value={marks12} onChange={setMarks12} min={40} max={100} unit="%" />
          </>)}

          {/* STEP 2 — Interests */}
          {step === 1 && (<>
            <h2 style={{ fontFamily:"var(--fd)", fontSize:20, fontWeight:700, marginBottom:4 }}>What Are You Interested In?</h2>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:26 }}>Select all that apply — the more you pick, the better the recommendation</p>
            <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
              {INTEREST_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:"0.08em", textTransform:"uppercase",
                    fontFamily:"var(--fd)", marginBottom:10, paddingBottom:6, borderBottom:"1px solid rgba(46,184,200,.08)" }}>
                    {group.label}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {group.items.map(item => chipBtn(item, interests.includes(item), () => toggleInterest(item)))}
                  </div>
                </div>
              ))}
            </div>
            {interests.length > 0 && (
              <div style={{ marginTop:20, padding:"12px 16px", background:"rgba(46,184,200,.05)",
                borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"var(--aqua)", fontFamily:"var(--fd)" }}>
                  ✦ {interests.length} interest{interests.length>1?"s":""} selected
                </span>
                <button onClick={() => setInterests([])} style={{ background:"none", border:"none",
                  color:"var(--muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--fb)" }}>
                  × Clear all
                </button>
              </div>
            )}
          </>)}

          {/* STEP 3 — Preferences */}
          {step === 2 && (<>
            <h2 style={{ fontFamily:"var(--fd)", fontSize:20, fontWeight:700, marginBottom:4 }}>Your Preferences</h2>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:26 }}>Personalise college and job results</p>

            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>Preferred Cities
                <span style={{ color:"var(--muted)", fontSize:10, marginLeft:8, textTransform:"none" }}>(select one or more)</span>
              </label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:9 }}>
                {CITY_OPTIONS.map(c => chipBtn(c, cities.includes(c), () => toggleCity(c)))}
              </div>
              {cities.length > 0 && (
                <div style={{ marginTop:10, fontSize:12, color:"var(--aqua)", fontFamily:"var(--fd)" }}>📍 {cities.join(", ")}</div>
              )}
              {cities.length > 1 && (
                <button onClick={() => setCities([])} style={{ marginTop:8, background:"none", border:"none",
                  color:"var(--muted)", fontSize:12, cursor:"pointer", padding:0, fontFamily:"var(--fb)" }}>
                  × Clear all
                </button>
              )}
            </div>

            <Slider label="Max College Fee Budget" value={budget} onChange={setBudget} min={0} max={25} unit="L/yr" />

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Mode of Study</label>
              <div style={{ display:"flex", gap:10 }}>
                {MODE_OPTIONS.map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    flex:1, padding:"11px 0", cursor:"pointer", transition:"all .3s",
                    background: mode===m ? "linear-gradient(135deg,#1a8fa0,var(--aqua))" : "rgba(255,255,255,.03)",
                    border:`1px solid ${mode===m?"var(--aqua)":"rgba(46,184,200,.16)"}`,
                    borderRadius:10, color:mode===m?"#fff":"var(--muted)",
                    fontFamily:"var(--fd)", fontWeight:600, fontSize:14,
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background:"rgba(255,123,107,.1)", border:"1px solid rgba(255,123,107,.28)",
                borderRadius:10, padding:"11px 15px", marginBottom:14, color:"var(--coral)",
                fontSize:13, whiteSpace:"pre-line" }}>{error}</div>
            )}
          </>)}

          {/* Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:28 }}>
            {step > 0 ? <Btn onClick={() => setStep(s=>s-1)} variant="ghost">← Back</Btn> : <div />}
            {step < STEPS.length-1
              ? <Btn onClick={() => setStep(s=>s+1)} variant="primary">Continue →</Btn>
              : <Btn onClick={handleAnalyze} loading={loading} variant="gold" style={{ minWidth:180 }}>✦ Get My Analysis</Btn>
            }
          </div>

        </div>
      </div>
    </div>
  );
};

export default InputPage;