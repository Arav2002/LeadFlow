/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/AuthContext";
import { PERMISSIONS } from "../hooks/ShareContext";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const STATUS_COLORS = {
  New: "#3b82f6", Contacted: "#f59e0b", Qualified: "#10b981",
  Proposal: "#8b5cf6", Won: "#059669", Lost: "#ef4444"
};
const STATUS_OPTIONS = ["New","Contacted","Qualified","Proposal","Won","Lost"];
const STATUS_CLASS   = {
  New:"status-new", Contacted:"status-contacted", Qualified:"status-qualified",
  Proposal:"status-proposal", Won:"status-won", Lost:"status-lost"
};
const CHART_PALETTES = [
  ["#3b82f6","#f59e0b","#10b981","#8b5cf6","#ef4444","#06b6d4","#f43f5e","#84cc16"],
  ["#6366f1","#ec4899","#14b8a6","#f97316","#a855f7","#22c55e","#eab308","#0ea5e9"],
  ["#0f766e","#b45309","#1d4ed8","#7c3aed","#be123c","#15803d","#b91c1c","#1e40af"],
];

export default function SharedPage() {
  const { token } = useParams();
  const { currentUser, login, signup } = useAuth();

  const [linkData, setLinkData]       = useState(null);
  const [leads, setLeads]             = useState([]);
  const [business, setBusiness]       = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState("dashboard");

  // Auth
  const [authMode, setAuthMode]       = useState("login");
  const [authForm, setAuthForm]       = useState({ name:"", email:"", password:"" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");

  // Lead form
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead]   = useState(null);
  const [leadForm, setLeadForm]         = useState({});
  const [savingLead, setSavingLead]     = useState(false);

  // Filters
  const [search, setSearch]             = useState("");
  const [activeFilters, setActiveFilters] = useState({});

  // ── Step 1: resolve token (no auth needed) ────────────
  useEffect(() => {
    async function resolveToken() {
      setLoadingPage(true);
      try {
        const q = query(
          collection(db, "shareLinks"),
          where("token", "==", token),
          where("active", "==", true)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("This share link is invalid or has been revoked.");
        } else {
          setLinkData({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (e) {
        console.error("Token resolve error:", e);
        setError("Failed to load share link. Please check your connection.");
      }
      setLoadingPage(false);
    }
    if (token) resolveToken();
  }, [token]);

  // ── Step 2: fetch data once logged in ─────────────────
  useEffect(() => {
    if (linkData && currentUser) fetchSharedData();
  }, [linkData?.id, currentUser?.uid]);

  async function fetchSharedData() {
    setLoadingData(true);
    try {
      const bizDoc = await getDoc(doc(db, "businesses", linkData.businessId));
      if (bizDoc.exists()) setBusiness({ id: bizDoc.id, ...bizDoc.data() });

      const q = query(
        collection(db, "leads"),
        where("businessId", "==", linkData.businessId),
        where("ownerId",    "==", linkData.ownerId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sno || 0) - (b.sno || 0));
      setLeads(list);
    } catch (e) {
      console.error("fetchSharedData error:", e);
    }
    setLoadingData(false);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    try {
      if (authMode === "login") await login(authForm.email, authForm.password);
      else await signup(authForm.email, authForm.password, authForm.name);
    } catch (err) {
      setAuthError(
        err.code === "auth/invalid-credential"   ? "Invalid email or password." :
        err.code === "auth/email-already-in-use" ? "Email already registered. Please sign in." :
        err.message
      );
    }
    setAuthLoading(false);
  }

  const perm       = linkData ? PERMISSIONS[linkData.permission] : null;
  const columns    = (business?.columns || []).filter(c => c.key !== "sno");
  const filterCols = (business?.columns || [])
    .filter(c => c.type === "select" && c.enableFilter === true)
    .slice(0, 3);

  // ── Filtering ─────────────────────────────────────────
  const filteredLeads = leads.filter(lead => {
    if (search) {
      const s = search.toLowerCase();
      if (!Object.values(lead).some(v => String(v).toLowerCase().includes(s))) return false;
    }
    for (const [key, val] of Object.entries(activeFilters)) {
      if (val && val !== "All" && lead[key] !== val) return false;
    }
    return true;
  });

  function setFilter(key, val) { setActiveFilters(p => ({ ...p, [key]: val })); }
  function getFilterVal(key)   { return activeFilters[key] || "All"; }
  function getColOptions(col)  {
    if (col.options?.length > 0) return col.options;
    return [...new Set(leads.map(l => l[col.key]).filter(Boolean))];
  }
  const hasActiveFilters = search || Object.values(activeFilters).some(v => v && v !== "All");

  // Stats
  const total    = leads.length;
  const won      = leads.filter(l => l.status === "Won").length;
  const active   = leads.filter(l => !["Won","Lost"].includes(l.status)).length;
  const convRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;
  const statusCounts = {};
  leads.forEach(l => { const s = l.status || "New"; statusCounts[s] = (statusCounts[s] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const permColors = { R:"#dbeafe", CRU:"#fef3c7", CRUD:"#fee2e2" };
  const permText   = { R:"#1d4ed8", CRU:"#92400e", CRUD:"#991b1b" };

  // Lead form
  function openAddLead() {
    const defaults = {};
    columns.filter(c => !c.locked).forEach(c => { defaults[c.key] = ""; });
    defaults.status = "New";
    setEditingLead(null); setLeadForm(defaults); setShowLeadForm(true);
  }
  function openEditLead(lead) { setEditingLead(lead); setLeadForm({...lead}); setShowLeadForm(true); }

  async function saveLead() {
    setSavingLead(true);
    try {
      if (editingLead) {
        await updateDoc(doc(db, "leads", editingLead.id), { ...leadForm, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "leads"), {
          ...leadForm, sno: leads.length + 1,
          businessId: linkData.businessId, ownerId: linkData.ownerId,
          addedBy: currentUser.email, status: leadForm.status || "New",
          createdAt: serverTimestamp()
        });
      }
      setShowLeadForm(false);
      await fetchSharedData();
    } catch (e) { alert("Error: " + e.message); }
    setSavingLead(false);
  }

  async function deleteLead(id) {
    if (window.confirm("Delete this lead?")) {
      await deleteDoc(doc(db, "leads", id));
      await fetchSharedData();
    }
  }

  // ── Loading ───────────────────────────────────────────
  if (loadingPage) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface-2)" }}>
      <div style={{ textAlign:"center" }}>
        <div className="spinner-border text-primary" role="status" />
        <p style={{ marginTop:12, color:"var(--text-muted)", fontSize:"0.875rem" }}>Loading shared view...</p>
      </div>
    </div>
  );

  // ── Invalid token ─────────────────────────────────────
  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface-2)", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <div style={{ fontSize:"3rem" }}>🔒</div>
        <h4 style={{ fontFamily:"Syne", marginTop:12 }}>Link Unavailable</h4>
        <p style={{ color:"var(--text-secondary)", marginBottom:20 }}>{error}</p>
        <a href="/login" className="btn btn-primary">Go to LeadFlow</a>
      </div>
    </div>
  );

  // ── Auth Gate ─────────────────────────────────────────
  if (!currentUser) return (
    <div style={{ minHeight:"100vh", background:"var(--surface-2)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:40, maxWidth:440, width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ background:"var(--primary-light)", borderRadius:10, padding:"14px 16px", marginBottom:28, border:"1px solid #bfdbfe", display:"flex", gap:12 }}>
          <div style={{ fontSize:"1.6rem", lineHeight:1 }}>🔗</div>
          <div>
            <div style={{ fontSize:"0.78rem", color:"var(--primary-dark)", fontWeight:600, marginBottom:2 }}>You've been invited to view</div>
            <div style={{ fontFamily:"Syne", fontWeight:800, color:"var(--primary)", fontSize:"1.05rem" }}>{linkData.businessName}</div>
            <div style={{ fontSize:"0.75rem", color:"var(--text-secondary)", marginTop:4, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span>Shared by <strong>{linkData.ownerName}</strong></span>
              <span style={{ background:permColors[linkData.permission], color:permText[linkData.permission], fontSize:"0.65rem", fontWeight:800, padding:"1px 7px", borderRadius:20 }}>
                {linkData.permission} · {PERMISSIONS[linkData.permission].label}
              </span>
            </div>
          </div>
        </div>
        <h3 style={{ fontFamily:"Syne", marginBottom:4, fontSize:"1.3rem" }}>
          {authMode === "login" ? "Sign in to continue" : "Create an account"}
        </h3>
        <p style={{ color:"var(--text-secondary)", fontSize:"0.83rem", marginBottom:20 }}>
          You need a LeadFlow account to access this shared view.
        </p>
        {authError && <div className="alert alert-danger py-2" style={{ fontSize:"0.83rem" }}>{authError}</div>}
        <form onSubmit={handleAuth}>
          {authMode === "signup" && (
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input className="form-control" required value={authForm.name}
                onChange={e => setAuthForm(p => ({...p, name:e.target.value}))} placeholder="Your name" />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" required value={authForm.email}
              onChange={e => setAuthForm(p => ({...p, email:e.target.value}))} placeholder="you@example.com" />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" required value={authForm.password}
              onChange={e => setAuthForm(p => ({...p, password:e.target.value}))} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={authLoading}>
            {authLoading ? "Please wait..." : authMode === "login" ? "Sign In & View" : "Sign Up & View"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:16, fontSize:"0.83rem", color:"var(--text-secondary)" }}>
          {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color:"var(--primary)", fontWeight:600, cursor:"pointer" }}
            onClick={() => { setAuthMode(m => m === "login" ? "signup" : "login"); setAuthError(""); }}>
            {authMode === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );

  // ── Main Shared View ──────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"var(--surface-2)" }}>
      {/* Topbar */}
      <div style={{ background:"#0f172a", padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontFamily:"Syne", fontWeight:800, color:"#fff", fontSize:"1.1rem" }}>
            ⚡ Lead<span style={{ color:"#f59e0b" }}>Flow</span>
          </div>
          <div style={{ width:1, height:18, background:"rgba(255,255,255,0.15)" }} />
          <div style={{ color:"#fff", fontSize:"0.85rem", fontWeight:600 }}>{linkData.businessName}</div>
          <div style={{ color:"#64748b", fontSize:"0.78rem" }}>· Shared by {linkData.ownerName}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ background:permColors[linkData.permission], color:permText[linkData.permission], fontSize:"0.68rem", fontWeight:800, padding:"3px 10px", borderRadius:20 }}>
            {linkData.permission} · {PERMISSIONS[linkData.permission].label}
          </span>
          <span style={{ color:"#64748b", fontSize:"0.75rem" }}>{currentUser.email}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid var(--border)", padding:"0 24px", display:"flex" }}>
        {["dashboard","leads"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding:"14px 20px", background:"none", border:"none", cursor:"pointer",
            fontWeight: activeTab === tab ? 700 : 500, fontSize:"0.875rem",
            color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
            borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom:-1, transition:"all 0.15s"
          }}>
            {tab === "dashboard" ? "📊 Dashboard" : "👥 Leads"}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div style={{ textAlign:"center", padding:60 }}>
          <div className="spinner-border text-primary" role="status" />
          <p style={{ marginTop:12, color:"var(--text-muted)" }}>Loading data...</p>
        </div>
      ) : (
        <div style={{ padding:"24px 28px" }}>

          {/* ════ DASHBOARD TAB ════ */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontFamily:"Syne" }}>{linkData.businessName}</h2>
                <p style={{ color:"var(--text-secondary)", fontSize:"0.875rem" }}>
                  {total} leads · Shared by <strong>{linkData.ownerName}</strong>
                </p>
              </div>

              {/* Metric Cards */}
              <div className="row g-3 mb-4">
                {[
                  { label:"Total Leads", value:total,          icon:"👥", bg:"#dbeafe", vc:"#2563eb" },
                  { label:"Active",      value:active,         icon:"🔥", bg:"#fef3c7", vc:"#d97706" },
                  { label:"Won",         value:won,            icon:"✅", bg:"#d1fae5", vc:"#059669" },
                  { label:"Conversion",  value:convRate+"%",   icon:"📈", bg:"#ede9fe", vc:"#7c3aed" },
                ].map((m,i) => (
                  <div key={i} className="col-6 col-md-3">
                    <div className="metric-card">
                      <div className="metric-icon" style={{ background:m.bg }}><span style={{ fontSize:"1.1rem" }}>{m.icon}</span></div>
                      <div className="metric-label">{m.label}</div>
                      <div className="metric-value" style={{ color:m.vc }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Pie + Time Bar */}
              {pieData.length > 0 && (
                <div className="row g-3 mb-4">
                  <div className="col-md-5">
                    <div className="table-card p-4" style={{ height:300 }}>
                      <h5 style={{ fontSize:"0.9rem", marginBottom:12 }}>Leads by Status</h5>
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                            labelLine={false} fontSize={10}>
                            {pieData.map((e,i) => <Cell key={i} fill={STATUS_COLORS[e.name] || "#94a3b8"} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-md-7">
                    <div className="table-card p-4" style={{ height:300 }}>
                      <h5 style={{ fontSize:"0.9rem", marginBottom:12 }}>Status Breakdown</h5>
                      <div style={{ paddingTop:8 }}>
                        {Object.entries(STATUS_COLORS).map(([status, color]) => {
                          const count = statusCounts[status] || 0;
                          const pct = total > 0 ? (count/total)*100 : 0;
                          return (
                            <div key={status} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                              <span style={{ width:82, fontSize:"0.78rem", fontWeight:600, color:"var(--text-secondary)" }}>{status}</span>
                              <div style={{ flex:1, background:"var(--surface-3)", borderRadius:4, height:8, overflow:"hidden" }}>
                                <div style={{ width:pct+"%", height:"100%", background:color, borderRadius:4, transition:"width 0.5s" }} />
                              </div>
                              <span style={{ width:24, textAlign:"right", fontSize:"0.82rem", fontWeight:700 }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic charts for filter-enabled select cols */}
              {filterCols.length > 0 && (
                <div className="row g-3 mb-4">
                  {filterCols.map((col, idx) => {
                    const palette = CHART_PALETTES[idx] || CHART_PALETTES[0];
                    const counts = {};
                    leads.forEach(l => { const v = l[col.key]; if (v) counts[v] = (counts[v]||0)+1; });
                    const data = Object.entries(counts).map(([name,value]) => ({ name, value }));
                    if (data.length === 0) return null;
                    return (
                      <div key={col.key} className="col-md-6">
                        <div className="table-card p-4" style={{ height:300 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                            <h5 style={{ fontSize:"0.9rem", margin:0 }}>📊 {col.label} Breakdown</h5>
                            <span style={{ fontSize:"0.68rem", background:"#dbeafe", color:"#1d4ed8", padding:"2px 7px", borderRadius:20, fontWeight:700 }}>Filter</span>
                          </div>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={data} cx="50%" cy="50%" outerRadius={78} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                                labelLine={false} fontSize={10}>
                                {data.map((e,i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dynamic breakdown bars */}
              {filterCols.map((col, idx) => {
                const palette = CHART_PALETTES[idx] || CHART_PALETTES[0];
                const counts = {};
                leads.forEach(l => { const v = l[col.key]; if (v) counts[v] = (counts[v]||0)+1; });
                const colTotal = Object.values(counts).reduce((a,b) => a+b, 0);
                if (colTotal === 0) return null;
                return (
                  <div key={col.key} className="table-card mb-3">
                    <div className="table-header">
                      <h5>📊 {col.label} Breakdown</h5>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{colTotal} leads</span>
                    </div>
                    <div style={{ padding:"0 8px 8px" }}>
                      {(col.options || Object.keys(counts)).map((val, i) => {
                        const count = counts[val] || 0;
                        const pct = colTotal > 0 ? (count/colTotal)*100 : 0;
                        return (
                          <div key={val} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px" }}>
                            <span style={{ width:100, fontSize:"0.8rem", fontWeight:600, color:"var(--text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</span>
                            <div style={{ flex:1, background:"var(--surface-3)", borderRadius:4, height:8, overflow:"hidden" }}>
                              <div style={{ width:pct+"%", height:"100%", background:palette[i%palette.length], borderRadius:4, transition:"width 0.6s ease" }} />
                            </div>
                            <span style={{ width:30, textAlign:"right", fontSize:"0.85rem", fontWeight:700 }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ════ LEADS TAB ════ */}
          {activeTab === "leads" && (
            <>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20 }}>
                <div>
                  <h2 style={{ fontFamily:"Syne", marginBottom:2 }}>Leads</h2>
                  <p style={{ color:"var(--text-secondary)", fontSize:"0.875rem" }}>
                    {filteredLeads.length} of {total} leads · {linkData.businessName}
                  </p>
                </div>
                {perm?.canCreate && (
                  <button className="btn btn-primary btn-sm" onClick={openAddLead}>+ Add Lead</button>
                )}
              </div>

              <div className="table-card">
                {/* Search */}
                <div className="table-header" style={{ flexWrap:"wrap", gap:10 }}>
                  <div style={{ position:"relative", flex:1, minWidth:200, maxWidth:320 }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:"0.9rem", pointerEvents:"none" }}>🔍</span>
                    <input className="form-control form-control-sm" placeholder="Search all fields..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      style={{ paddingLeft:32 }} />
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:"0.78rem", color:"var(--text-muted)" }}>
                      {filteredLeads.length} result{filteredLeads.length !== 1 ? "s" : ""}
                    </span>
                    {hasActiveFilters && (
                      <button className="btn btn-sm btn-outline-secondary"
                        onClick={() => { setActiveFilters({}); setSearch(""); }}
                        style={{ fontSize:"0.72rem" }}>
                        ✕ Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic filter rows */}
                {filterCols.length > 0 && (
                  <div style={{ borderBottom:"1px solid var(--border)" }}>
                    {filterCols.map((col, idx) => {
                      const options  = getColOptions(col);
                      const activeVal = getFilterVal(col.key);
                      const colColors = [
                        { active:"#2563eb", light:"#dbeafe", text:"#1d4ed8" },
                        { active:"#7c3aed", light:"#ede9fe", text:"#5b21b6" },
                        { active:"#0f766e", light:"#ccfbf1", text:"#134e4a" },
                      ][idx] || { active:"#2563eb", light:"#dbeafe", text:"#1d4ed8" };

                      return (
                        <div key={col.key} style={{
                          padding:"8px 20px",
                          borderBottom: idx < filterCols.length-1 ? "1px solid var(--border)" : "none",
                          display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"
                        }}>
                          <span style={{ fontSize:"0.72rem", fontWeight:800, color:colColors.text, background:colColors.light, padding:"2px 8px", borderRadius:20, minWidth:"fit-content" }}>
                            {col.label}
                          </span>
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            <button onClick={() => setFilter(col.key,"All")} style={{
                              padding:"3px 12px", borderRadius:20, fontSize:"0.72rem",
                              fontWeight: activeVal==="All" ? 700:500, border:"1.5px solid",
                              borderColor: activeVal==="All" ? colColors.active:"var(--border)",
                              background: activeVal==="All" ? colColors.active:"transparent",
                              color: activeVal==="All" ? "#fff":"var(--text-secondary)",
                              cursor:"pointer", transition:"all 0.15s"
                            }}>
                              All <span style={{ opacity:0.7 }}>({leads.length})</span>
                            </button>
                            {options.map(val => {
                              const count = leads.filter(l => l[col.key] === val).length;
                              const isActive = activeVal === val;
                              return (
                                <button key={val} onClick={() => setFilter(col.key, val)} style={{
                                  padding:"3px 12px", borderRadius:20, fontSize:"0.72rem",
                                  fontWeight: isActive?700:500, border:"1.5px solid",
                                  borderColor: isActive?colColors.active:"var(--border)",
                                  background: isActive?colColors.active:"transparent",
                                  color: isActive?"#fff":"var(--text-secondary)",
                                  cursor:"pointer", transition:"all 0.15s"
                                }}>
                                  {val} <span style={{ opacity:0.7 }}>({count})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Table */}
                {filteredLeads.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <h5>{hasActiveFilters ? "No matching leads" : "No leads yet"}</h5>
                  </div>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table className="leads-table">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          {columns.map(c => <th key={c.key}>{c.label}</th>)}
                          {(perm?.canUpdate || perm?.canDelete) && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => (
                          <tr key={lead.id}>
                            <td className="sno-cell">#{lead.sno}</td>
                            {columns.map(c => (
                              <td key={c.key}>
                                {c.key === "status"
                                  ? <span className={`status-badge ${STATUS_CLASS[lead.status]||"status-new"}`}>{lead.status||"New"}</span>
                                  : lead[c.key] || <span style={{ color:"var(--text-muted)" }}>—</span>}
                              </td>
                            ))}
                            {(perm?.canUpdate || perm?.canDelete) && (
                              <td>
                                <div className="d-flex gap-1">
                                  {perm.canUpdate && <button className="btn btn-sm btn-outline-primary" onClick={() => openEditLead(lead)}>✏️ Edit</button>}
                                  {perm.canDelete && <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLead(lead.id)}>🗑️</button>}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h5 style={{ fontFamily:"Syne", fontWeight:700, margin:0 }}>{editingLead ? "Edit Lead" : "Add New Lead"}</h5>
              <button onClick={() => setShowLeadForm(false)} style={{ background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
            </div>
            <div className="row g-3">
              {columns.map(col => (
                <div key={col.key} className="col-md-6">
                  <label className="form-label">{col.label}</label>
                  {col.key === "status" || col.type === "select" ? (
                    <select className="form-select" value={leadForm[col.key]||""}
                      onChange={e => setLeadForm(p => ({...p, [col.key]:e.target.value}))}>
                      {(col.key==="status" ? STATUS_OPTIONS : col.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="form-control"
                      type={col.type==="email"?"email":col.type==="number"?"number":"text"}
                      value={leadForm[col.key]||""}
                      onChange={e => setLeadForm(p => ({...p, [col.key]:e.target.value}))}
                      placeholder={`Enter ${col.label}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 mt-4 justify-content-end">
              <button className="btn btn-light" onClick={() => setShowLeadForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLead} disabled={savingLead}>
                {savingLead ? "Saving..." : editingLead ? "Save Changes" : "Add Lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}