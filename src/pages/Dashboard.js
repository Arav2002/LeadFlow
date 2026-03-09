import React, { useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLeads } from "../hooks/LeadsContext";
import { useBusiness } from "../hooks/BusinessContext";
import AppLayout from "../components/layout/AppLayout";

const STATUS_COLORS = {
  New: "#3b82f6", Contacted: "#f59e0b", Qualified: "#10b981",
  Proposal: "#8b5cf6", Won: "#059669", Lost: "#ef4444"
};

export default function Dashboard() {
  const { leads, fetchLeads } = useLeads();
  const { activeBusiness, businesses } = useBusiness();

  useEffect(() => {
    if (activeBusiness) fetchLeads(activeBusiness.id);
  }, [activeBusiness]);

  // Compute stats
  const total = leads.length;
  const won = leads.filter(l => l.status === "Won").length;
  const lost = leads.filter(l => l.status === "Lost").length;
  const active = leads.filter(l => !["Won", "Lost"].includes(l.status)).length;
  const convRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

  const statusCounts = {};
  leads.forEach(l => { statusCounts[l.status || "New"] = (statusCounts[l.status || "New"] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Monthly bar data (by createdAt)
  const monthlyMap = {};
  leads.forEach(l => {
    const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt || Date.now());
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });
  const barData = Object.entries(monthlyMap).slice(-6).map(([name, leads]) => ({ name, leads }));

  const metrics = [
    { label: "Total Leads", value: total, icon: "👥", color: "#dbeafe", iconColor: "#2563eb" },
    { label: "Active Leads", value: active, icon: "🔥", color: "#fef3c7", iconColor: "#d97706" },
    { label: "Won", value: won, icon: "✅", color: "#d1fae5", iconColor: "#059669" },
    { label: "Conversion Rate", value: convRate + "%", icon: "📈", color: "#ede9fe", iconColor: "#7c3aed" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <h2>{activeBusiness?.name || "Select a Business"}</h2>
        <p>{activeBusiness ? `Tracking ${total} leads across ${Object.keys(statusCounts).length} statuses` : "Choose a business from the sidebar to see your dashboard"}</p>
      </div>

      {!activeBusiness ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <h5>No Business Selected</h5>
          <p>Create or select a business from the sidebar to get started.</p>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="row g-3 mb-4">
            {metrics.map((m, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="metric-card">
                  <div className="metric-icon" style={{ background: m.color }}>
                    <span style={{ fontSize: "1.1rem" }}>{m.icon}</span>
                  </div>
                  <div className="metric-label">{m.label}</div>
                  <div className="metric-value" style={{ color: m.iconColor }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="row g-3 mb-4">
            <div className="col-md-5">
              <div className="table-card p-4" style={{ height: 320 }}>
                <h5 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Leads by Status</h5>
                {pieData.length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px 0" }}><p>No data yet</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="col-md-7">
              <div className="table-card p-4" style={{ height: 320 }}>
                <h5 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Leads Over Time</h5>
                {barData.length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px 0" }}><p>No data yet</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="leads" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Status breakdown table */}
          <div className="table-card">
            <div className="table-header">
              <h5>Status Breakdown</h5>
            </div>
            <div style={{ padding: "0 8px 8px" }}>
              {Object.entries(STATUS_COLORS).map(([status, color]) => {
                const count = statusCounts[status] || 0;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
                    <span style={{ width: 80, fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>{status}</span>
                    <div style={{ flex: 1, background: "var(--surface-3)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ width: 30, textAlign: "right", fontSize: "0.85rem", fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
