import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding, STEPS } from "../../hooks/OnboardingContext";

export default function OnboardingBanner() {
  const {
    onboarding, activeStep, setActiveStep,
    isStepComplete, allComplete, isDismissed,
    completedCount, progress, dismissOnboarding, completeStep
  } = useOnboarding();

  const [minimized, setMinimized] = useState(false);
  const navigate = useNavigate();

  // Don't show if dismissed, all done, or still loading
  if (!onboarding || isDismissed) return null;

  const currentStep = STEPS[activeStep];

  if (allComplete) {
    return (
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        border: "1px solid var(--border)", padding: "20px 24px", maxWidth: 320,
        animation: "slideUp 0.3s ease"
      }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>
          You're all set!
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
          You've completed all onboarding steps. LeadFlow is ready to use!
        </div>
        <button className="btn btn-primary btn-sm w-100" onClick={dismissOnboarding}>
          Got it, dismiss this
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .onboarding-step-item:hover { background: var(--surface-2) !important; }
      `}</style>

      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        background: "#fff", borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        border: "1px solid var(--border)",
        width: minimized ? "auto" : 340,
        animation: "slideUp 0.3s ease",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "var(--sidebar-bg)", padding: "14px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--primary)", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1rem"
            }}>⚡</div>
            {!minimized && (
              <div>
                <div style={{ color: "#fff", fontFamily: "Syne", fontWeight: 700, fontSize: "0.9rem" }}>
                  Getting Started
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                  {completedCount} of {STEPS.length} steps done
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMinimized(p => !p)} style={{
              background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
              width: 26, height: 26, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {minimized ? "▲" : "▼"}
            </button>
            <button onClick={dismissOnboarding} style={{
              background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
              width: 26, height: 26, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem",
              display: "flex", alignItems: "center", justifyContent: "center"
            }} title="Dismiss onboarding">
              ✕
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Progress bar */}
            <div style={{ padding: "12px 18px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Progress</span>
                <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>{progress}%</span>
              </div>
              <div style={{ background: "var(--surface-3)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{
                  width: progress + "%", height: "100%",
                  background: "linear-gradient(90deg, var(--primary), #60a5fa)",
                  borderRadius: 4, transition: "width 0.5s ease"
                }} />
              </div>
            </div>

            {/* Steps list */}
            <div style={{ padding: "10px 10px 14px" }}>
              {STEPS.map((step, i) => {
                const done = isStepComplete(step.id);
                const isActive = i === activeStep && !done;
                return (
                  <div
                    key={step.id}
                    className="onboarding-step-item"
                    onClick={() => { setActiveStep(i); navigate(step.page); }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                      background: isActive ? "var(--primary-light)" : "transparent",
                      border: isActive ? "1.5px solid #bfdbfe" : "1.5px solid transparent",
                      marginBottom: 4, transition: "all 0.15s"
                    }}
                  >
                    {/* Step circle */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: done ? "0.85rem" : "0.75rem", fontWeight: 700,
                      background: done ? "var(--success)" : isActive ? "var(--primary)" : "var(--surface-3)",
                      color: done || isActive ? "#fff" : "var(--text-muted)",
                      border: done ? "none" : isActive ? "none" : "2px solid var(--border)"
                    }}>
                      {done ? "✓" : step.icon}
                    </div>

                    {/* Step text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.82rem", fontWeight: 700,
                        color: done ? "var(--text-muted)" : isActive ? "var(--primary-dark)" : "var(--text-primary)",
                        textDecoration: done ? "line-through" : "none"
                      }}>
                        {step.title}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
                          {step.description}
                        </div>
                      )}
                    </div>

                    {/* Arrow for active */}
                    {isActive && !done && (
                      <div style={{ color: "var(--primary)", fontSize: "0.8rem", paddingTop: 4 }}>→</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action button */}
            <div style={{ padding: "0 14px 14px" }}>
              <button
                className="btn btn-primary w-100 btn-sm"
                onClick={() => {
                  navigate(currentStep.page);
                }}
              >
                Go to: {currentStep.title} →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
