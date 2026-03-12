/* eslint-disable */
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext";
import { useBusiness } from "../../hooks/BusinessContext";
import { useOnboarding } from "../../hooks/OnboardingContext";
import BusinessModal from "../business/BusinessModal";

const NAV = [
  { path: "/dashboard",  icon: "fa-solid fa-chart-pie",      label: "Dashboard",  stepId: "view_dashboard"  },
  { path: "/leads",      icon: "fa-solid fa-users",           label: "Leads",      stepId: "add_lead"        },
  { path: "/import",     icon: "fa-solid fa-file-arrow-up",   label: "Import",     stepId: "import_leads"    },
  { path: "/businesses", icon: "fa-solid fa-building",        label: "Businesses", stepId: "create_business" },
  { path: "/settings",   icon: "fa-solid fa-gear",            label: "Settings",   stepId: null              },
];

export default function Sidebar({ open, onClose }) {
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
    const isActiveStep = item.stepId && stepIndex === activeStep
      && !isStepComplete(item.stepId) && !isDismissed && !!onboarding;
    const isActive = location.pathname === item.path;

    return (
      <div style={{ position: "relative", width: "100%" }}>
        {isActiveStep && (
          <div style={{
            position: "absolute", inset: "2px 4px", borderRadius: 8,
            border: "2px solid rgba(96,165,250,0.8)",
            animation: "pulseRing 1.5s ease-in-out infinite",
            pointerEvents: "none", zIndex: 5
          }} />
        )}
        <Link
          to={item.path}
          className={`sidebar-nav-item${isActive ? " active" : ""}`}
          onClick={() => {
            if (item.stepId && !isDismissed) completeStep(item.stepId);
            if (onClose) onClose();
          }}
        >
          <i className={`${item.icon} nav-icon-fa`} />
          <span>{item.label}</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulseRing { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .nav-icon-fa { width:20px;text-align:center;margin-right:10px;font-size:0.9rem;flex-shrink:0; }
        .biz-icon-fa { width:20px;text-align:center;margin-right:8px;font-size:0.9rem;flex-shrink:0;opacity:0.7; }
        .sidebar-nav-item { display:flex!important;align-items:center;width:100%;text-decoration:none; }
        .sidebar-close-btn { display:none;background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer;padding:4px 8px; }
        @media(max-width:768px){ .sidebar-close-btn{display:flex;align-items:center;} }
      `}</style>

      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <div className="sidebar-header" style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div className="sidebar-logo">
            <i className="fa-solid fa-bolt" style={{ marginRight:6,fontSize:"1rem" }} />
            Lead<span>Flow</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Business Selector */}
        <div style={{ padding:"12px 12px 0" }}>
          <div style={{ fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-muted)",padding:"0 8px 6px" }}>
            Active Business
          </div>
          <div className="business-selector">
            <button className="business-select-btn" onClick={() => setShowBizDropdown(p => !p)}>
              <i className="fa-solid fa-building biz-icon-fa" />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ color:"#fff",fontWeight:600,fontSize:"0.82rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {activeBusiness?.name || "Select Business"}
                </div>
                <div style={{ fontSize:"0.7rem",color:"var(--text-muted)" }}>Click to switch</div>
              </div>
              <i className="fa-solid fa-chevron-down" style={{ color:"var(--text-muted)",fontSize:"0.65rem" }} />
            </button>
          </div>

          {showBizDropdown && (
            <div style={{ background:"var(--sidebar-hover)",borderRadius:"var(--radius)",marginTop:4,overflow:"hidden" }}>
              {businesses.map(b => (
                <button key={b.id}
                  onClick={() => { setActiveBusiness(b); setShowBizDropdown(false); }}
                  style={{
                    width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
                    background: activeBusiness?.id===b.id ? "rgba(37,99,235,0.2)" : "transparent",
                    border:"none", color: activeBusiness?.id===b.id ? "#fff" : "var(--sidebar-text)",
                    cursor:"pointer",fontSize:"0.83rem",fontWeight:500,textAlign:"left"
                  }}>
                  <i className="fa-solid fa-building" style={{ opacity:0.6,fontSize:"0.78rem" }} />
                  {b.name}
                </button>
              ))}
              <button
                onClick={() => { setShowCreateBiz(true); setShowBizDropdown(false); }}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
                  background:"transparent",border:"none",borderTop:"1px solid rgba(255,255,255,0.06)",
                  color:"var(--primary)",cursor:"pointer",fontSize:"0.83rem",fontWeight:600
                }}>
                <i className="fa-solid fa-plus" style={{ fontSize:"0.78rem" }} />
                New Business
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="sidebar-section" style={{ flex:1 }}>
          <div className="sidebar-section-label">Navigation</div>
          <div style={{ display:"flex",flexDirection:"column",width:"100%" }}>
            {NAV.map(item => <NavItem key={item.path} item={item} />)}
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
            <button onClick={handleLogout} title="Logout" style={{ background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:"1rem",padding:4 }}>
              <i className="fa-solid fa-right-from-bracket" />
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