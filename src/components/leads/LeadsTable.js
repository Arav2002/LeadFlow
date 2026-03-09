import React, { useState } from "react";
import { useLeads } from "../../hooks/LeadsContext";
import { useBusiness } from "../../hooks/BusinessContext";
import LeadFormModal from "./LeadFormModal";

const STATUS_CLASS = {
  New: "status-new", Contacted: "status-contacted", Qualified: "status-qualified",
  Proposal: "status-proposal", Won: "status-won", Lost: "status-lost"
};

export default function LeadsTable({ search = "", filteredLeads }) {
  const { leads, loading, deleteLead } = useLeads();
  const { activeBusiness } = useBusiness();
  const [editLead, setEditLead] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const columns = (activeBusiness?.columns || []).filter(c => c.key !== "sno");
  const userCols = columns.filter(c => !c.locked || c.key !== "sno");

  const filtered = filteredLeads !== undefined ? filteredLeads : leads.filter(lead => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(lead).some(v => String(v).toLowerCase().includes(s));
  });

  function handleEdit(lead) {
    setEditLead(lead);
    setShowEdit(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Delete this lead?")) await deleteLead(id);
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
      Loading leads...
    </div>
  );

  if (filtered.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">👥</div>
      <h5>{search ? "No leads match your search" : "No leads yet"}</h5>
      <p style={{ fontSize: "0.875rem" }}>{search ? "Try different keywords." : "Add your first lead using the button above or import a CSV/Excel file."}</p>
    </div>
  );

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table className="leads-table">
          <thead>
            <tr>
              <th>S.No</th>
              {userCols.map(col => <th key={col.key}>{col.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id}>
                <td className="sno-cell">#{lead.sno}</td>
                {userCols.map(col => (
                  <td key={col.key}>
                    {col.key === "status" ? (
                      <span className={`status-badge ${STATUS_CLASS[lead.status] || "status-new"}`}>
                        {lead.status || "New"}
                      </span>
                    ) : (
                      <span>{lead[col.key] || <span style={{ color: "var(--text-muted)" }}>—</span>}</span>
                    )}
                  </td>
                ))}
                <td>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(lead)}>✏️ Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(lead.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LeadFormModal show={showEdit} onHide={() => setShowEdit(false)} editLead={editLead} />
    </>
  );
}
