/* eslint-disable */
import React, { useState } from "react";
import { useLeads } from "../hooks/LeadsContext";
import { useBusiness } from "../hooks/BusinessContext";
import AppLayout from "../components/layout/AppLayout";
import LeadFormModal from "../components/leads/LeadFormModal";
import LeadsTable from "../components/leads/LeadsTable";

export default function LeadsPage() {
  const { leads, loading, deleteLead } = useLeads();
  const { activeBusiness } = useBusiness();

  const [showForm, setShowForm]       = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [search, setSearch]           = useState("");
  const [activeFilters, setActiveFilters] = useState({});

  // All columns including sno (sno is now optional/removable)
  const columns = (activeBusiness?.columns || []);

  // Filter-enabled select cols (max 3)
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

  function setFilter(key, val) { setActiveFilters(prev => ({ ...prev, [key]: val })); }
  function getFilterVal(key) { return activeFilters[key] || "All"; }
  function getColOptions(col) {
    if (col.options?.length > 0) return col.options;
    return [...new Set(leads.map(l => l[col.key]).filter(Boolean))];
  }
  function clearAllFilters() { setActiveFilters({}); setSearch(""); }
  const hasActiveFilters = search || Object.values(activeFilters).some(v => v && v !== "All");

  function openAdd() { setEditingLead(null); setShowForm(true); }
  function openEdit(lead) { setEditingLead(lead); setShowForm(true); }

  async function handleDelete(id) {
    if (window.confirm("Delete this lead?")) await deleteLead(id);
  }

  return (
    <AppLayout title="Leads">
      <div className="page-header d-flex align-items-start justify-content-between">
        <div>
          <h2>Leads</h2>
          <p>
            {activeBusiness
              ? `${filteredLeads.length} of ${leads.length} leads in ${activeBusiness.name}`
              : "Select a business to view leads"}
          </p>
        </div>
        {activeBusiness && (
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="fa-solid fa-plus me-1" /> Add Lead
          </button>
        )}
      </div>

      {!activeBusiness ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-users" /></div>
          <h5>No Business Selected</h5>
          <p>Select a business from the sidebar to manage leads.</p>
        </div>
      ) : (
        <div className="table-card">
          {/* Search bar */}
          <div className="table-header">
            <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }} />
              <input
                className="form-control form-control-sm"
                placeholder="Search all fields..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {filteredLeads.length} result{filteredLeads.length !== 1 ? "s" : ""}
              </span>
              {hasActiveFilters && (
                <button className="btn btn-sm btn-outline-secondary" onClick={clearAllFilters} style={{ fontSize: "0.72rem" }}>
                  <i className="fa-solid fa-xmark me-1" />Clear
                </button>
              )}
            </div>
          </div>

          {/* Dynamic filter rows */}
          {filterCols.length > 0 && (
            <div style={{ borderBottom: "1px solid var(--border)" }}>
              {filterCols.map((col, idx) => {
                const options = getColOptions(col);
                const activeVal = getFilterVal(col.key);
                const colColors = [
                  { active: "#2563eb", light: "#dbeafe", text: "#1d4ed8" },
                  { active: "#7c3aed", light: "#ede9fe", text: "#5b21b6" },
                  { active: "#0f766e", light: "#ccfbf1", text: "#134e4a" },
                ][idx] || { active: "#2563eb", light: "#dbeafe", text: "#1d4ed8" };

                return (
                  <div key={col.key} style={{
                    padding: "8px 16px",
                    borderBottom: idx < filterCols.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"
                  }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: colColors.text, background: colColors.light, padding: "2px 8px", borderRadius: 20, minWidth: "fit-content" }}>
                      {col.label}
                    </span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button onClick={() => setFilter(col.key, "All")} style={{
                        padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem",
                        fontWeight: activeVal === "All" ? 700 : 500, border: "1.5px solid",
                        borderColor: activeVal === "All" ? colColors.active : "var(--border)",
                        background: activeVal === "All" ? colColors.active : "transparent",
                        color: activeVal === "All" ? "#fff" : "var(--text-secondary)",
                        cursor: "pointer", transition: "all 0.15s"
                      }}>
                        All ({leads.length})
                      </button>
                      {options.map(val => {
                        const count = leads.filter(l => l[col.key] === val).length;
                        const isActive = activeVal === val;
                        return (
                          <button key={val} onClick={() => setFilter(col.key, val)} style={{
                            padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem",
                            fontWeight: isActive ? 700 : 500, border: "1.5px solid",
                            borderColor: isActive ? colColors.active : "var(--border)",
                            background: isActive ? colColors.active : "transparent",
                            color: isActive ? "#fff" : "var(--text-secondary)",
                            cursor: "pointer", transition: "all 0.15s"
                          }}>
                            {val} ({count})
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
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><i className="fa-solid fa-users" /></div>
              <h5>{hasActiveFilters ? "No matching leads" : "No leads yet"}</h5>
              <p>{hasActiveFilters ? "Try clearing filters." : "Click \"Add Lead\" to get started."}</p>
              {hasActiveFilters && (
                <button className="btn btn-outline-primary btn-sm mt-2" onClick={clearAllFilters}>
                  <i className="fa-solid fa-filter-circle-xmark me-1" />Clear Filters
                </button>
              )}
            </div>
          ) : (
            <LeadsTable leads={filteredLeads} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      )}

      {showForm && (
        <LeadFormModal
          show={showForm}
          onHide={() => setShowForm(false)}
          editLead={editingLead}
        />
      )}
    </AppLayout>
  );
}