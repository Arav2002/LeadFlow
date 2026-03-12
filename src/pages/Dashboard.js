/* eslint-disable */
import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useLeads } from "../hooks/LeadsContext";
import { useBusiness } from "../hooks/BusinessContext";
import AppLayout from "../components/layout/AppLayout";

const CHART_PALETTES = [
  ["#3b82f6","#f59e0b","#10b981","#8b5cf6","#ef4444","#06b6d4","#f43f5e","#84cc16"],
  ["#6366f1","#ec4899","#14b8a6","#f97316","#a855f7","#22c55e","#eab308","#0ea5e9"],
  ["#0f766e","#b45309","#1d4ed8","#7c3aed","#be123c","#15803d","#b91c1c","#1e40af"],
];

export default function Dashboard() {
  const { leads, loading } = useLeads();
  const { activeBusiness } = useBusiness();

  const total = leads.length;

  // Leads over time
  const monthlyMap = {};
  leads.forEach(l => {
    const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date();
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });
  const barData = Object.entries(monthlyMap).slice(-6).map(([name, count]) => ({ name, count }));

  // Filter-enabled select columns only
  const filterCols = (activeBusiness?.columns || [])
    .filter(c => c.type === "select" && c.enableFilter === true)
    .slice(0, 3);

  const metrics = [
    { label: "Total Leads",  value: total,                                   icon: "fa-solid fa-users",         color: "#dbeafe", vc: "#2563eb" },
    { label: "This Month",   value: barData[barData.length - 1]?.count || 0, icon: "fa-solid fa-calendar-days", color: "#fef3c7", vc: "#d97706" },
    { label: "Columns",      value: (activeBusiness?.columns || []).length,  icon: "fa-solid fa-table-columns", color: "#d1fae5", vc: "#059669" },
    { label: "Filter Views", value: filterCols.length,                       icon: "fa-solid fa-filter",        color: "#ede9fe", vc: "#7c3aed" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <h2>{activeBusiness?.name || "Select a Business"}</h2>
        <p>{activeBusiness
          ? `Tracking ${total} leads · ${filterCols.length} filter view${filterCols.length !== 1 ? "s" : ""} active`
          : "Choose a business from the sidebar to get started"}
        </p>
      </div>

      {!activeBusiness ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-building" /></div>
          <h5>No Business Selected</h5>
          <p>Create or select a business from the sidebar to get started.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Loading...
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="row g-3 mb-4">
            {metrics.map((m, i) => (
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

          {/* Leads Over Time */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="table-card p-4">
                <h5 style={{ marginBottom: 16, fontSize: "0.95rem" }}>
                  <i className="fa-solid fa-chart-bar me-2" style={{ color: "var(--primary)" }} />
                  Leads Over Time
                </h5>
                {barData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    No data yet — add some leads to see trends.
                  </div>
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
            </div>
          </div>

          {/* Dynamic Pie Charts */}
          {filterCols.length > 0 && (
            <div className="row g-3 mb-4">
              {filterCols.map((col, idx) => {
                const palette = CHART_PALETTES[idx] || CHART_PALETTES[0];
                const counts = {};
                leads.forEach(l => { const v = l[col.key]; if (v) counts[v] = (counts[v] || 0) + 1; });
                const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
                if (data.length === 0) return null;
                return (
                  <div key={col.key} className="col-md-6">
                    <div className="table-card p-4" style={{ height: 300 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <h5 style={{ fontSize: "0.9rem", margin: 0 }}>
                          <i className="fa-solid fa-chart-pie me-2" style={{ color: palette[0] }} />
                          {col.label} Breakdown
                        </h5>
                        <span style={{ fontSize: "0.68rem", background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Filter</span>
                      </div>
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
            leads.forEach(l => { const v = l[col.key]; if (v) counts[v] = (counts[v] || 0) + 1; });
            const colTotal = Object.values(counts).reduce((a, b) => a + b, 0);
            if (colTotal === 0) return null;
            return (
              <div key={col.key} className="table-card mb-3">
                <div className="table-header">
                  <h5>
                    <i className="fa-solid fa-bars-progress me-2" style={{ color: palette[0] }} />
                    {col.label} Breakdown
                  </h5>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{colTotal} leads</span>
                </div>
                <div style={{ padding: "0 8px 8px" }}>
                  {(col.options || Object.keys(counts)).map((val, i) => {
                    const count = counts[val] || 0;
                    const pct = colTotal > 0 ? (count / colTotal) * 100 : 0;
                    return (
                      <div key={val} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
                        <span style={{ width: 100, fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
                        <div style={{ flex: 1, background: "var(--surface-3)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: palette[i % palette.length], borderRadius: 4, transition: "width 0.6s ease" }} />
                        </div>
                        <span style={{ width: 30, textAlign: "right", fontSize: "0.85rem", fontWeight: 700 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filterCols.length === 0 && total > 0 && (
            <div className="table-card p-4" style={{ textAlign: "center" }}>
              <i className="fa-solid fa-filter" style={{ fontSize: "1.8rem", color: "var(--text-muted)", marginBottom: 12, display: "block" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Enable <strong>Filter &amp; Dashboard</strong> on a select column via <strong>Manage Columns</strong> to see breakdown charts.
              </p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}