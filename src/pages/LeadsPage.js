import React, { useState, useEffect } from "react";
import { useLeads } from "../hooks/LeadsContext";
import { useBusiness } from "../hooks/BusinessContext";
import AppLayout from "../components/layout/AppLayout";
import LeadsTable from "../components/leads/LeadsTable";
import LeadFormModal from "../components/leads/LeadFormModal";
import ColumnManager from "../components/business/ColumnManager";

export default function LeadsPage() {
  const { fetchLeads, leads } = useLeads();
  const { activeBusiness } = useBusiness();
  const [showAdd, setShowAdd] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (activeBusiness) fetchLeads(activeBusiness.id);
  }, [activeBusiness]);

  const filtered = leads.filter(l => {
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return Object.values(l).some(v => String(v).toLowerCase().includes(s));
    }
    return true;
  });

  const statuses = ["All", "New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

  return (
    <AppLayout title="Leads">
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Leads</h2>
          <p>{activeBusiness ? `${leads.length} leads in ${activeBusiness.name}` : "Select a business to view leads"}</p>
        </div>
        {activeBusiness && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => setShowCols(true)}>⚙️ Manage Columns</button>
            <a href="/import" className="btn btn-outline-primary btn-sm">📁 Import CSV</a>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Lead</button>
          </div>
        )}
      </div>

      {!activeBusiness ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <h5>No Business Selected</h5>
          <p>Select a business from the sidebar to manage leads.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-header">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="search-wrap" style={{ width: 220 }}>
                <span className="search-icon">🔍</span>
                <input className="form-control form-control-sm" placeholder="Search leads..."
                  value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
              </div>
              {/* Status filter */}
              <div className="d-flex gap-1 flex-wrap">
                {statuses.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                    {s}
                    {s !== "All" && <span style={{ marginLeft: 4, opacity: 0.7 }}>({leads.filter(l => l.status === s).length})</span>}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{filtered.length} results</span>
          </div>
          <LeadsTable search={search} statusFilter={statusFilter} filteredLeads={filtered} />
        </div>
      )}

      <LeadFormModal show={showAdd} onHide={() => setShowAdd(false)} />
      <ColumnManager show={showCols} onHide={() => setShowCols(false)} />
    </AppLayout>
  );
}
