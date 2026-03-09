import React, { useEffect, useRef } from "react";
import { useOnboarding } from "../../hooks/OnboardingContext";

export default function OnboardingTooltip({ stepId, children, position = "bottom" }) {
  const { activeStep, isStepComplete, isDismissed, onboarding, steps } = useOnboarding();
  const ref = useRef();

  const stepIndex = steps.findIndex(s => s.id === stepId);
  const step = steps[stepIndex];
  const isActive = stepIndex === activeStep && !isStepComplete(stepId) && !isDismissed && onboarding;

  const posStyles = {
    bottom: { top: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)" },
    top: { bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)" },
    right: { left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)" },
    left: { right: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)" },
  };

  const arrowStyles = {
    bottom: { bottom: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "0 6px 6px 6px", borderColor: "transparent transparent var(--primary) transparent" },
    top: { top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "6px 6px 0 6px", borderColor: "var(--primary) transparent transparent transparent" },
    right: { right: "100%", top: "50%", transform: "translateY(-50%)", borderWidth: "6px 6px 6px 0", borderColor: "transparent var(--primary) transparent transparent" },
    left: { left: "100%", top: "50%", transform: "translateY(-50%)", borderWidth: "6px 0 6px 6px", borderColor: "transparent transparent transparent var(--primary)" },
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Pulse ring when active */}
      {isActive && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: 10,
          border: "2px solid var(--primary)",
          animation: "pulseRing 1.5s ease-in-out infinite",
          pointerEvents: "none", zIndex: 10
        }} />
      )}

      {children}

      {/* Tooltip bubble */}
      {isActive && (
        <>
          <style>{`
            @keyframes pulseRing {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.04); }
            }
            @keyframes fadeInTooltip {
              from { opacity: 0; transform: translateX(-50%) translateY(4px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          {/* Arrow */}
          <div style={{
            position: "absolute",
            width: 0, height: 0,
            borderStyle: "solid",
            zIndex: 1001,
            ...arrowStyles[position]
          }} />
          {/* Bubble */}
          <div style={{
            position: "absolute",
            background: "var(--primary)",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: "0.78rem",
            width: 220,
            boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
            zIndex: 1001,
            lineHeight: 1.5,
            animation: "fadeInTooltip 0.2s ease",
            ...posStyles[position]
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: "0.82rem" }}>
              Step {stepIndex + 1}: {step.title}
            </div>
            <div style={{ opacity: 0.9 }}>{step.description}</div>
          </div>
        </>
      )}
    </div>
  );
}
