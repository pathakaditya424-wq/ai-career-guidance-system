// ─── AUTH PAGE ───────────────────────────────────────────────
// First page the user sees.
// Handles both Login and Signup in one card with a toggle.
//
// Props:
//   onAuth  {function}  — called with { name, email } after login
//
// Features:
//   - Login / Signup toggle with smooth form transition
//   - Floating label inputs (FInput)
//   - Password visibility toggle
//   - Client-side validation (empty fields, password mismatch)
//   - Signup success animation → auto-redirects to Login tab
//   - Loading spinner on submit
//   - Note: Auth is simulated — any credentials are accepted

import { useState } from "react";
import OceanBG  from "../components/OceanBG";
import Compass  from "../components/Compass";
import Btn      from "../components/Btn";
import FInput   from "../components/FInput";

const AuthPage = ({ onAuth }) => {
  const [isLogin,  setIsLogin]  = useState(true);
  const [form,     setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  // Helper to update a single form field
  const setField = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError("");

    // ── Validation ───────────────────────────────────────
    if (!form.email || !form.password) {
      setError("Please fill all required fields.");
      return;
    }
    if (!isLogin && form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Simulate API call delay (1.1 seconds)
    await new Promise(r => setTimeout(r, 1100));

    if (!isLogin) {
      // ── Signup flow ──────────────────────────────────
      // Show success message → auto-switch to login after 2.2s
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsLogin(true);
        setForm(f => ({ ...f, password: "", confirm: "" }));
      }, 2200);
    } else {
      // ── Login flow ───────────────────────────────────
      // Accept any credentials — pass user object to parent
      setLoading(false);
      onAuth({
        name:  form.name || form.email.split("@")[0],
        email: form.email,
      });
    }
  };

  return (
    <div
      className="page"
      style={{
        minHeight:      "100vh",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        20,
        position:       "relative",
      }}
    >
      <OceanBG />

      {/* ── Top-left logo ─────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        24,
        left:       28,
        display:    "flex",
        alignItems: "center",
        gap:        12,
        zIndex:     10,
      }}>
        <Compass angle={-30} size={42} />
        <span style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 800 }}>
          <span className="shimmer">AI Career</span>
          <span style={{ color: "var(--muted)", marginLeft: 5 }}>Compass</span>
        </span>
      </div>

      {/* ── Auth card ────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 425 }}>
        <div
          className="glass si"
          style={{
            padding:   "40px 36px",
            boxShadow: "0 30px 80px rgba(0,0,0,.6)",
          }}
        >

          {/* Login / Signup toggle pills */}
          <div style={{
            display:      "flex",
            background:   "rgba(255,255,255,.04)",
            borderRadius: 50,
            padding:      4,
            marginBottom: 32,
          }}>
            {["Login", "Sign Up"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(i === 0); setError(""); }}
                style={{
                  flex:       1,
                  padding:    "9px",
                  borderRadius: 50,
                  border:     "none",
                  background: (isLogin ? i === 0 : i === 1)
                    ? "linear-gradient(135deg, #1a8fa0, var(--aqua))"
                    : "transparent",
                  color: (isLogin ? i === 0 : i === 1)
                    ? "#fff"
                    : "var(--muted)",
                  fontFamily: "var(--fd)",
                  fontWeight: 600,
                  fontSize:   14,
                  transition: "all .3s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily:   "var(--fd)",
            fontSize:     24,
            fontWeight:   800,
            marginBottom: 6,
          }}>
            {isLogin ? "Welcome back, navigator" : "Start your voyage"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>
            {isLogin
              ? "Sign in to chart your career course"
              : "Create your compass account today"
            }
          </p>

          {/* Success message (after signup) */}
          {success && (
            <div style={{
              background:   "rgba(46,184,200,.1)",
              border:       "1px solid rgba(46,184,200,.32)",
              borderRadius: 10,
              padding:      "13px 16px",
              marginBottom: 18,
              color:        "var(--aqua)",
              fontSize:     14,
              textAlign:    "center",
              animation:    "scaleIn .4s ease",
            }}>
              ✓ Account created! Redirecting to login…
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              background:   "rgba(255,123,107,.1)",
              border:       "1px solid rgba(255,123,107,.28)",
              borderRadius: 10,
              padding:      "11px 15px",
              marginBottom: 16,
              color:        "var(--coral)",
              fontSize:     13,
            }}>
              {error}
            </div>
          )}

          {/* Form fields — re-animate when switching login/signup */}
          <div key={isLogin ? "login" : "signup"} style={{ animation: "fadeUp .35s ease" }}>
            {!isLogin && (
              <FInput
                label="Full Name"
                value={form.name}
                onChange={setField("name")}
              />
            )}
            <FInput
              label="Email Address"
              type="email"
              value={form.email}
              onChange={setField("email")}
            />
            <FInput
              label="Password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={setField("password")}
              rightIcon={
                <span
                  onClick={() => setShowPwd(v => !v)}
                  style={{ cursor: "pointer", opacity: 0.5, fontSize: 15 }}
                >
                  {showPwd ? "🙈" : "👁️"}
                </span>
              }
            />
            {!isLogin && (
              <FInput
                label="Confirm Password"
                type="password"
                value={form.confirm}
                onChange={setField("confirm")}
              />
            )}
          </div>

          {/* Submit button */}
          <Btn
            onClick={handleSubmit}
            loading={loading}
            variant="primary"
            style={{ width: "100%", marginTop: 8 }}
          >
            {isLogin ? "Set Sail →" : "Create Account →"}
          </Btn>

        </div>

        {/* Footer note */}
        <p style={{
          textAlign:  "center",
          marginTop:  20,
          fontSize:   12,
          color:      "rgba(190,225,240,.22)",
        }}>
          Safe & secure · Your data stays private
        </p>
      </div>
    </div>
  );
};

export default AuthPage;