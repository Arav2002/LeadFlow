import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name);
      navigate("/dashboard");
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "Email already registered." : err.message);
    }
    setLoading(false);
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div>
          <div className="auth-brand-logo">Lead<span>Flow</span></div>
          <div className="auth-brand-tagline">Your complete lead generation<br />& accounting platform</div>
          <div className="auth-brand-stats">
            <div className="auth-stat"><div className="auth-stat-number">🚀</div><div className="auth-stat-label">Fast Setup</div></div>
            <div className="auth-stat"><div className="auth-stat-number">📊</div><div className="auth-stat-label">Analytics</div></div>
            <div className="auth-stat"><div className="auth-stat-number">📁</div><div className="auth-stat-label">CSV Import</div></div>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2>Create account</h2>
          <p className="auth-subtitle">Start tracking your leads for free</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input className="form-control" type="text" required value={form.name} onChange={set("name")} placeholder="Your full name" />
            </div>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input className="form-control" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" required value={form.password} onChange={set("password")} placeholder="Min. 6 characters" />
            </div>
            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" required value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center mt-4" style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
