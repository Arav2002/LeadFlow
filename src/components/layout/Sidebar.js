import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext";
import { useBusiness } from "../../hooks/BusinessContext";
import { useOnboarding } from "../../hooks/OnboardingContext";
import BusinessModal from "../business/BusinessModal";

const NAV = [
  { path: "/dashboard", icon: "📊", label: "Dashboard", stepId: "view_dashboard" },
  { path: "/leads", icon: "👥", label: "Leads", stepId: "add_lead" },
  { path: "/import", icon: "📁", label: "Import", stepId: "import_leads" },
  { path: "/businesses", icon: "🏢", label: "Businesses", stepId: "create_business" },
  { path: "/settings", icon: "⚙️", label: "Settings", stepId: null },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { businesses, activeBusiness, setActiveBusiness, createBusiness } = useBusiness();
  const { completeStep, isDismissed, activeStep, isStepComplete, onboarding, steps } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showCreateBiz, setShowCreateBiz] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser?.email?.[0]?.toUpperCase() || "U";

  function NavItem({ item }) {
    const stepIndex = steps.findIndex(s => s.id === item.stepId);
    const isActiveStep = item.stepId
      && stepIndex === activeStep
      && !isStepComplete(item.stepId)
      && !isDismissed
      && !!onboarding;

    return (
      <div style={{ position: "relative", width: "100%" }}>
        {/* Pulse highlight */}
        {isActiveStep && (
          <div style={{
            position: "absolute", inset: "2px 4px",
            borderRadius: 8,
            border: "2px solid rgba(96,165,250,0.8)",
            animation: "pulseRing 1.5s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 5
          }} />
        )}

        <Link
          to={item.path}
          className={`sidebar-nav-item${location.pathname === item.path ? " active" : ""}`}
          style={{ display: "flex", width: "100%" }}
          onClick={() => {
            if (item.stepId && !isDismissed) completeStep(item.stepId);
          }}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>

        {/* Tooltip — only for active onboarding step */}
        {isActiveStep && (
          <div style={{
            position: "fixed",
            left: 272,
            marginTop: -44,
            background: "#1d4ed8",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: "0.78rem",
            width: 230,
            boxShadow: "0 6px 24px rgba(29,78,216,0.4)",
            zIndex: 99999,
            lineHeight: 1.5,
            pointerEvents: "none"
          }}>
            <div style={{
              position: "absolute",
              right: "100%", top: 20,
              width: 0, height: 0,
              borderStyle: "solid",
              borderWidth: "6px 8px 6px 0",
              borderColor: "transparent #1d4ed8 transparent transparent"
            }} />
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: "0.82rem" }}>
              Step {stepIndex + 1} of {steps.length}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {steps[stepIndex]?.title}
            </div>
            <div style={{ opacity: 0.85, fontSize: "0.75rem" }}>
              {steps[stepIndex]?.description}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulseRing {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .sidebar-nav-item {
          display: flex !important;
          width: 100%;
        }
      `}</style>

      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          Lead<span>Flow</span>
        </div>

        {/* Business Selector */}
        <div style={{ padding: "12px 12px 0" }}>
          <div style={{
            fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-muted)", padding: "0 8px 6px"
          }}>
            Active Business
          </div>
          <div className="business-selector">
            <button className="business-select-btn" onClick={() => setShowBizDropdown(p => !p)}>
              <div className="biz-icon">🏢</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: "#fff", fontWeight: 600, fontSize: "0.82rem",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {activeBusiness?.name || "Select Business"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Click to switch</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>▼</span>
            </button>
          </div>

          {showBizDropdown && (
            <div style={{
              background: "var(--sidebar-hover)", borderRadius: "var(--radius)",
              marginTop: 4, overflow: "hidden"
            }}>
              {businesses.map(b => (
                <button key={b.id}
                  onClick={() => { setActiveBusiness(b); setShowBizDropdown(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: activeBusiness?.id === b.id ? "rgba(37,99,235,0.2)" : "transparent",
                    border: "none",
                    color: activeBusiness?.id === b.id ? "#fff" : "var(--sidebar-text)",
                    cursor: "pointer", fontSize: "0.83rem", fontWeight: 500, textAlign: "left"
                  }}>
                  <span>🏢</span> {b.name}
                </button>
              ))}
              <button
                onClick={() => { setShowCreateBiz(true); setShowBizDropdown(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", background: "transparent", border: "none",
                  color: "var(--primary)", cursor: "pointer",
                  fontSize: "0.83rem", fontWeight: 600
                }}>
                <span>+</span> New Business
              </button>
            </div>
          )}
        </div>

        {/* Nav — flex column forces each item to its own row */}
        <div className="sidebar-section" style={{ flex: 1 }}>
          <div className="sidebar-section-label">Navigation</div>
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {NAV.map(item => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.displayName || "User"}</div>
              <div className="sidebar-user-email">{currentUser?.email}</div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{
              background: "none", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontSize: "1.1rem", padding: 4
            }}>
              🚪
            </button>
          </div>
        </div>
      </aside>

      <BusinessModal
        show={showCreateBiz}
        onHide={() => setShowCreateBiz(false)}
        onCreate={async (name, desc, cols) => {
          await createBusiness(name, desc, cols);
          completeStep("create_business");
        }}
      />
    </>
  );
}