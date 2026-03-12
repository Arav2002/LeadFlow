/* eslint-disable */
import React, { useState } from "react";
import { useBusiness } from "../../hooks/BusinessContext";
import LeadFormModal from "./LeadFormModal";

export default function LeadsTable({ leads, onEdit, onDelete }) {
  const { activeBusiness } = useBusiness();
  const [editLead, setEditLead] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  // Show all columns defined on the business (sno is removable, no status)
  const columns = (activeBusiness?.columns || []);
  // Exclude sno from data columns (we handle it separately in display)
  const displayCols = columns.filter(c => c.key !== "sno");
  const hasSno = columns.some(c => c.key === "sno");

  function handleEdit(lead) {
    if (onEdit) { onEdit(lead); return; }
    setEditLead(lead);
    setShowEdit(true);
  }

  if (!leads || leads.length === 0) return null;

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table className="leads-table">
          <thead>
            <tr>
              {hasSno && <th style={{ width: 56 }}>S.No</th>}
              {displayCols.map(col => <th key={col.key}>{col.label}</th>)}
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                {hasSno && (
                  <td className="sno-cell">#{lead.sno}</td>
                )}
                {displayCols.map(col => (
                  <td key={col.key}>
                    {lead[col.key]
                      ? <span>{lead[col.key]}</span>
                      : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                ))}
                <td>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(lead)} title="Edit">
                      <i className="fa-solid fa-pen-to-square" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(lead.id)} title="Delete">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEdit && (
        <LeadFormModal show={showEdit} onHide={() => setShowEdit(false)} editLead={editLead} />
      )}
    </>
  );
}