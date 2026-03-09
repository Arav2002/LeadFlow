import React from "react";
import { useAuth } from "../hooks/AuthContext";
import { useOnboarding } from "../hooks/OnboardingContext";
import AppLayout from "../components/layout/AppLayout";

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const {
    onboarding, isDismissed, allComplete,
    completedCount, dismissOnboarding, resetOnboarding, steps
  } = useOnboarding();

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser?.email?.[0]?.toUpperCase() || "U";

  return (
    <AppLayout title="Settings">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your account and preferences</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Profile card */}
        <div className="metric-card mb-3">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 64, height: 64, background: "var(--primary)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontFamily: "Syne", fontWeight: 800, fontSize: "1.4rem"
            }}>{initials}</div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "1.1rem" }}>
                {currentUser?.displayName}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {currentUser?.email}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 2 }}>
                UID: {currentUser?.uid}
              </div>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="metric-card mb-3">
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 12 }}>Account</div>
          <div className="d-flex flex-column gap-2">
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Email</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{currentUser?.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Name</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{currentUser?.displayName || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Account Created</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {currentUser?.metadata?.creationTime
                  ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Onboarding card */}
        <div className="metric-card mb-3">
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 4 }}>
            Getting Started Guide
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
            The step-by-step onboarding guide helps new users learn how to use LeadFlow.
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Steps completed
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700 }}>
                {completedCount} / {steps.length}
              </span>
            </div>
            <div style={{ background: "var(--surface-3)", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{
                width: `${Math.round((completedCount / steps.length) * 100)}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--primary), #60a5fa)",
                borderRadius: 4, transition: "width 0.5s ease"
              }} />
            </div>
          </div>

          {/* Steps checklist */}
          <div style={{ marginBottom: 16 }}>
            {steps.map((step, i) => {
              const done = onboarding?.completedSteps?.includes(step.id);
              return (
                <div key={step.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none"
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 700,
                    background: done ? "var(--success)" : "var(--surface-3)",
                    color: done ? "#fff" : "var(--text-muted)",
                    border: done ? "none" : "2px solid var(--border)"
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span style={{
                    fontSize: "0.82rem", fontWeight: 500,
                    color: done ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: done ? "line-through" : "none"
                  }}>
                    {step.icon} {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="d-flex gap-2 flex-wrap">
            {isDismissed || allComplete ? (
              <button className="btn btn-outline-primary btn-sm" onClick={resetOnboarding}>
                🔄 Restart Onboarding Guide
              </button>
            ) : (
              <button className="btn btn-outline-danger btn-sm" onClick={dismissOnboarding}>
                ✕ Dismiss Onboarding Guide
              </button>
            )}
          </div>

          {isDismissed && (
            <div className="alert alert-info mt-3 py-2" style={{ fontSize: "0.8rem" }}>
              The onboarding guide is currently hidden. Click <strong>Restart Onboarding Guide</strong> to show it again.
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="metric-card">
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 12 }}>Actions</div>
          <button className="btn btn-outline-danger" onClick={logout}>🚪 Sign Out</button>
        </div>
      </div>
    </AppLayout>
  );
}
