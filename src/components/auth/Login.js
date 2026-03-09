import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.code === "auth/invalid-credential" ? "Invalid email or password." : err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div>
          <div className="auth-brand-logo">Lead<span>Flow</span></div>
          <div className="auth-brand-tagline">Track, manage & convert your leads<br />all in one place</div>
          <div className="auth-brand-stats">
            <div className="auth-stat"><div className="auth-stat-number">∞</div><div className="auth-stat-label">Leads</div></div>
            <div className="auth-stat"><div className="auth-stat-number">∞</div><div className="auth-stat-label">Businesses</div></div>
            <div className="auth-stat"><div className="auth-stat-number">CSV+</div><div className="auth-stat-label">Import</div></div>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your LeadFlow account</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input className="form-control" type="email" required value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center mt-4" style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
