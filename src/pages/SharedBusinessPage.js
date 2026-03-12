/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/AuthContext";
import { useShare, PERMISSIONS } from "../hooks/ShareContext";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import AppLayout from "../components/layout/AppLayout";

const CHART_PALETTES = [
  ["#3b82f6","#f59e0b","#10b981","#8b5cf6","#ef4444","#06b6d4","#f43f5e","#84cc16"],
  ["#6366f1","#ec4899","#14b8a6","#f97316","#a855f7","#22c55e","#eab308","#0ea5e9"],
  ["#0f766e","#b45309","#1d4ed8","#7c3aed","#be123c","#15803d","#b91c1c","#1e40af"],
];

export default function SharedBusinessPage() {
  const { token } = useParams();
  const { currentUser } = useAuth();
  const { resolveToken } = useShare();
  const navigate = useNavigate();

  const [linkData, setLinkData]     = useState(null);
  const [business, setBusiness]     = useState(null);
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError]           = useState("");
  const [activeTab, setActiveTab]   = useState("dashboard");

  // Lead form state
  const [showForm, setShowForm]     = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadForm, setLeadForm]     = useState({});
  const [saving, setSaving]         = useState(false);

  // Filter state
  const [search, setSearch]         = useState("");
  const [activeFilters, setActiveFilters] = useState({});

  // Step 1: resolve token
  useEffect(() => {
    async function resolve() {
      setLoading(true);
      const data = await resolveToken(token);
      if (!data) {
        setError("This share link is invalid or has been revoked.");
      } else {
        setLinkData(data);
      }
      setLoading(false);
    }
    if (token) resolve();
  }, [token]);

  // Step 2: fetch data once token resolved
  useEffect(() => {
    if (linkData && currentUser) fetchData();
  }, [linkData?.id, currentUser?.uid]);

  async function fetchData() {
    setDataLoading(true);
    try {
      const bizDoc = await getDoc(doc(db, "businesses", linkData.businessId));
      if (bizDoc.exists()) setBusiness({ id: bizDoc.id, ...bizDoc.data() });

      const q = query(
        collection(db, "leads"),
        where("businessId", "==", linkData.businessId),
        where("ownerId", "==", linkData.ownerId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sno || 0) - (b.sno || 0));
      setLeads(list);
    } catch (e) { console.error("SharedBusinessPage fetchData:", e); }
    setDataLoading(false);
  }

  const perm = linkData ? PERMISSIONS[linkData.permission] : null;
  const columns = (business?.columns || []);
  const displayCols = columns.filter(c => c.key !== "sno");
  const hasSno = columns.some(c => c.key === "sno");
  const filterCols = columns.filter(c => c.type === "select" && c.enableFilter === true).slice(0, 3);

  // Filtering
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
  function getFilterVal(key) { return activeFilters[key] || "All"; }
  function getColOptions(col) {
    if (col.options?.length > 0) return col.options;
    return [...new Set(leads.map(l => l[col.key]).filter(Boolean))];
  }
  const hasActiveFilters = search || Object.values(activeFilters).some(v => v && v !== "All");

  // Dashboard stats
  const total = leads.length;
  const monthlyMap = {};
  leads.forEach(l => {
    const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date();
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });
  const barData = Object.entries(monthlyMap).slice(-6).map(([name, count]) => ({ name, count }));

  // Lead CRUD
  function openAdd() {
    const defaults = {};
    columns.filter(c => c.key !== "sno").forEach(c => { defaults[c.key] = ""; });
    setEditingLead(null); setLeadForm(defaults); setShowForm(true);
  }
  function openEdit(lead) { setEditingLead(lead); setLeadForm({ ...lead }); setShowForm(true); }

  async function saveLead() {
    setSaving(true);
    try {
      if (editingLead) {
        await updateDoc(doc(db, "leads", editingLead.id), { ...leadForm, updatedAt: serverTimestamp() });
      } else {
        const q = query(collection(db, "leads"), where("businessId", "==", linkData.businessId), where("ownerId", "==", linkData.ownerId));
        const snap = await getDocs(q);
        await addDoc(collection(db, "leads"), {
          ...leadForm,
          sno: snap.size + 1,
          businessId: linkData.businessId,
          ownerId: linkData.ownerId,
          addedBy: currentUser.email,
          createdAt: serverTimestamp()
        });
      }
      setShowForm(false);
      await fetchData();
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  }

  async function deleteLead(id) {
    if (window.confirm("Delete this lead?")) {
      await deleteDoc(doc(db, "leads", id));
      await fetchData();
    }
  }

  const permColors = { R: "#dbeafe", CRU: "#fef3c7", CRUD: "#fee2e2" };
  const permText   = { R: "#1d4ed8", CRU: "#92400e", CRUD: "#991b1b" };

  // Loading / error states
  if (loading) return (
    <AppLayout title="Shared Business">
      <div style={{ textAlign: "center", padding: 80 }}>
        <div className="spinner-border text-primary" role="status" />
        <p style={{ marginTop: 12, color: "var(--text-muted)" }}>Loading shared view...</p>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout title="Shared Business">
      <div style={{ textAlign: "center", padding: 80 }}>
        <i className="fa-solid fa-lock" style={{ fontSize: "3rem", color: "var(--text-muted)", marginBottom: 16, display: "block" }} />
        <h4>Link Unavailable</h4>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
          <i className="fa-solid fa-arrow-left me-1" />Back to Dashboard
        </button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title={linkData?.businessName || "Shared Business"}>
      {/* Shared business banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: "var(--radius-lg)", padding: "16px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, background: "rgba(37,99,235,0.3)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fa-solid fa-share-nodes" style={{ color: "#60a5fa", fontSize: "1.1rem" }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontFamily: "Syne", fontWeight: 700, fontSize: "1.05rem" }}>
              {linkData.businessName}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 2 }}>
              Shared by <strong style={{ color: "#cbd5e1" }}>{linkData.ownerName}</strong>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: permColors[linkData.permission], color: permText[linkData.permission], fontSize: "0.72rem", fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>
            {linkData.permission} · {PERMISSIONS[linkData.permission].label}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 24 }}>
        {["dashboard", "leads"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
            fontWeight: activeTab === tab ? 700 : 500, fontSize: "0.875rem",
            color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
            borderBottom: `2px solid ${activeTab === tab ? "var(--primary)" : "transparent"}`,
            marginBottom: -2, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6
          }}>
            <i className={`fa-solid ${tab === "dashboard" ? "fa-chart-pie" : "fa-users"}`} />
            {tab === "dashboard" ? "Dashboard" : "Leads"}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* ══ DASHBOARD TAB ══ */}
          {activeTab === "dashboard" && (
            <>
              {/* Metric cards */}
              <div className="row g-3 mb-4">
                {[
                  { label: "Total Leads", value: total,                                   icon: "fa-solid fa-users",         color: "#dbeafe", vc: "#2563eb" },
                  { label: "This Month",  value: barData[barData.length-1]?.count || 0,   icon: "fa-solid fa-calendar-days", color: "#fef3c7", vc: "#d97706" },
                  { label: "Columns",     value: columns.length,                           icon: "fa-solid fa-table-columns", color: "#d1fae5", vc: "#059669" },
                  { label: "Filters",     value: filterCols.length,                        icon: "fa-solid fa-filter",        color: "#ede9fe", vc: "#7c3aed" },
                ].map((m, i) => (
                  <div key={i} className="col-6 col-md-3">
                    <div className="metric-card">
                      <div className="metric-icon" style={{ background: m.color }}>
                        <i className={m.icon} style={{ color: m.vc, fontSize: "1rem" }} />
                      </div>
                      <div className="metric-label">{m.label}</div>
                      <div className="metric-value" style={{ color: m.vc }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leads over time */}
              <div className="table-card p-4 mb-4">
                <h5 style={{ marginBottom: 16, fontSize: "0.95rem" }}>
                  <i className="fa-solid fa-chart-bar me-2" style={{ color: "var(--primary)" }} />
                  Leads Over Time
                </h5>
                {barData.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Filter column pie charts */}
              {filterCols.length > 0 && (
                <div className="row g-3 mb-4">
                  {filterCols.map((col, idx) => {
                    const palette = CHART_PALETTES[idx] || CHART_PALETTES[0];
                    const counts = {};
                    leads.forEach(l => { const v = l[col.key]; if (v) counts[v] = (counts[v]||0)+1; });
                    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
                    if (data.length === 0) return null;
                    return (
                      <div key={col.key} className="col-md-6">
                        <div className="table-card p-4" style={{ height: 300 }}>
                          <h5 style={{ fontSize: "0.9rem", marginBottom: 12 }}>
                            <i className="fa-solid fa-chart-pie me-2" style={{ color: palette[0] }} />
                            {col.label} Breakdown
                          </h5>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={data} cx="50%" cy="50%" outerRadius={78} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                                labelLine={false} fontSize={10}>
                                {data.map((e, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
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

              {/* Breakdown bars */}
              {filterCols.map((col, idx) => {
                const palette = CHART_PALETTES[idx] || CHART_PALETTES[0];
                const counts = {};
                leads.forEach(l => { const v = l[col.key]; if (v) counts[v] = (counts[v]||0)+1; });
                const colTotal = Object.values(counts).reduce((a,b)=>a+b,0);
                if (colTotal === 0) return null;
                return (
                  <div key={col.key} className="table-card mb-3">
                    <div className="table-header">
                      <h5><i className="fa-solid fa-bars-progress me-2" style={{ color: palette[0] }} />{col.label} Breakdown</h5>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{colTotal} leads</span>
                    </div>
                    <div style={{ padding: "0 8px 8px" }}>
                      {(col.options || Object.keys(counts)).map((val, i) => {
                        const count = counts[val] || 0;
                        const pct = colTotal > 0 ? (count/colTotal)*100 : 0;
                        return (
                          <div key={val} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
                            <span style={{ width: 100, fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
                            <div style={{ flex: 1, background: "var(--surface-3)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                              <div style={{ width: pct+"%", height: "100%", background: palette[i%palette.length], borderRadius: 4, transition: "width 0.6s" }} />
                            </div>
                            <span style={{ width: 30, textAlign: "right", fontSize: "0.85rem", fontWeight: 700 }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ══ LEADS TAB ══ */}
          {activeTab === "leads" && (
            <>
              <div className="page-header d-flex align-items-start justify-content-between">
                <div>
                  <h2>Leads</h2>
                  <p>{filteredLeads.length} of {total} leads</p>
                </div>
                {perm?.canCreate && (
                  <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <i className="fa-solid fa-plus me-1" />Add Lead
                  </button>
                )}
              </div>

              <div className="table-card">
                {/* Search */}
                <div className="table-header">
                  <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }} />
                    <input className="form-control form-control-sm" placeholder="Search all fields..."
                      value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{filteredLeads.length} results</span>
                    {hasActiveFilters && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => { setActiveFilters({}); setSearch(""); }} style={{ fontSize: "0.72rem" }}>
                        <i className="fa-solid fa-xmark me-1" />Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic filters */}
                {filterCols.length > 0 && (
                  <div style={{ borderBottom: "1px solid var(--border)" }}>
                    {filterCols.map((col, idx) => {
                      const options = getColOptions(col);
                      const activeVal = getFilterVal(col.key);
                      const cc = [
                        { active: "#2563eb", light: "#dbeafe", text: "#1d4ed8" },
                        { active: "#7c3aed", light: "#ede9fe", text: "#5b21b6" },
                        { active: "#0f766e", light: "#ccfbf1", text: "#134e4a" },
                      ][idx] || { active: "#2563eb", light: "#dbeafe", text: "#1d4ed8" };
                      return (
                        <div key={col.key} style={{ padding: "8px 16px", borderBottom: idx < filterCols.length-1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: cc.text, background: cc.light, padding: "2px 8px", borderRadius: 20 }}>{col.label}</span>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {["All", ...options].map(val => {
                              const isAll = val === "All";
                              const isActive = isAll ? activeVal === "All" : activeVal === val;
                              const count = isAll ? leads.length : leads.filter(l => l[col.key] === val).length;
                              return (
                                <button key={val} onClick={() => setFilter(col.key, val)} style={{
                                  padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem",
                                  fontWeight: isActive ? 700 : 500, border: "1.5px solid",
                                  borderColor: isActive ? cc.active : "var(--border)",
                                  background: isActive ? cc.active : "transparent",
                                  color: isActive ? "#fff" : "var(--text-secondary)",
                                  cursor: "pointer", transition: "all 0.15s"
                                }}>{val} ({count})</button>
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
                    <div className="empty-state-icon"><i className="fa-solid fa-users" /></div>
                    <h5>{hasActiveFilters ? "No matching leads" : "No leads yet"}</h5>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="leads-table">
                      <thead>
                        <tr>
                          {hasSno && <th style={{ width: 56 }}>S.No</th>}
                          {displayCols.map(c => <th key={c.key}>{c.label}</th>)}
                          {(perm?.canUpdate || perm?.canDelete) && <th style={{ width: 100 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => (
                          <tr key={lead.id}>
                            {hasSno && <td className="sno-cell">#{lead.sno}</td>}
                            {displayCols.map(c => (
                              <td key={c.key}>{lead[c.key] || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                            ))}
                            {(perm?.canUpdate || perm?.canDelete) && (
                              <td>
                                <div className="d-flex gap-1">
                                  {perm.canUpdate && (
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(lead)}>
                                      <i className="fa-solid fa-pen-to-square" />
                                    </button>
                                  )}
                                  {perm.canDelete && (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLead(lead.id)}>
                                      <i className="fa-solid fa-trash" />
                                    </button>
                                  )}
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
        </>
      )}

      {/* Lead form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h5 style={{ fontFamily: "Syne", fontWeight: 700, margin: 0 }}>
                <i className={`fa-solid ${editingLead ? "fa-pen-to-square" : "fa-user-plus"} me-2`} style={{ color: "var(--primary)" }} />
                {editingLead ? "Edit Lead" : "Add New Lead"}
              </h5>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="row g-3">
              {columns.filter(c => c.key !== "sno").map(col => (
                <div key={col.key} className="col-md-6">
                  <label className="form-label">{col.label}</label>
                  {col.type === "select" ? (
                    <select className="form-select" value={leadForm[col.key] || ""}
                      onChange={e => setLeadForm(p => ({ ...p, [col.key]: e.target.value }))}>
                      <option value="">-- Select --</option>
                      {(col.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="form-control"
                      type={col.type === "email" ? "email" : col.type === "number" ? "number" : "text"}
                      value={leadForm[col.key] || ""}
                      onChange={e => setLeadForm(p => ({ ...p, [col.key]: e.target.value }))}
                      placeholder={`Enter ${col.label}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 mt-4 justify-content-end">
              <button className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLead} disabled={saving}>
                {saving ? "Saving..." : editingLead ? "Save Changes" : "Add Lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
