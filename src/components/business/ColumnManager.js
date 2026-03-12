/* eslint-disable */
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useBusiness } from "../../hooks/BusinessContext";
import { useOnboarding } from "../../hooks/OnboardingContext";

const COL_TYPES = ["text", "number", "email", "phone", "date", "select", "url"];

export default function ColumnManager({ show, onHide }) {
  const { activeBusiness, updateBusinessColumns } = useBusiness();
  const { completeStep, isDismissed } = useOnboarding();
  const [newCol, setNewCol] = useState({ label: "", type: "text", options: "", enableFilter: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const columns = activeBusiness?.columns || [];
  // S.No is removable — no locked columns concept
  const filterEnabledCount = columns.filter(c => c.type === "select" && c.enableFilter).length;
  const canAddFilter = filterEnabledCount < 3;

  async function addColumn() {
    if (!newCol.label.trim()) return setError("Column name required.");
    const key = newCol.label.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_");
    if (columns.find(c => c.key === key)) return setError("Column already exists.");
    if (newCol.type === "select" && newCol.enableFilter && !canAddFilter) {
      return setError("Maximum 3 select columns can have Filter enabled.");
    }
    const col = {
      key, label: newCol.label.trim(), type: newCol.type,
      options: newCol.type === "select" ? newCol.options.split(",").map(o => o.trim()).filter(Boolean) : [],
      enableFilter: newCol.type === "select" ? newCol.enableFilter : false,
      removable: true
    };
    const updated = [...columns, col];
    setLoading(true);
    try {
      await updateBusinessColumns(activeBusiness.id, updated);
      setNewCol({ label: "", type: "text", options: "", enableFilter: false });
      setError("");
      if (!isDismissed) completeStep("add_columns");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function toggleFilter(key) {
    const col = columns.find(c => c.key === key);
    if (!col) return;
    if (!col.enableFilter && !canAddFilter) return setError("Maximum 3 filter slots used.");
    const updated = columns.map(c => c.key === key ? { ...c, enableFilter: !c.enableFilter } : c);
    setLoading(true);
    try { await updateBusinessColumns(activeBusiness.id, updated); setError(""); }
    catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function removeColumn(key) {
    const updated = columns.filter(c => c.key !== key);
    setLoading(true);
    try { await updateBusinessColumns(activeBusiness.id, updated); }
    catch (e) { setError(e.message); }
    setLoading(false);
  }

  function handleClose() {
    setNewCol({ label: "", type: "text", options: "", enableFilter: false });
    setError(""); onHide();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fa-solid fa-table-columns me-2" style={{ color: "var(--primary)" }} />
          Manage Columns — {activeBusiness?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>
          Add or remove columns. For <strong>select</strong> type columns, enable
          <strong> Filter &amp; Dashboard</strong> to get filter tabs on Leads and a chart on Dashboard.
          Maximum <strong>3</strong> filter slots.
        </p>

        {/* Filter slot indicator */}
        <div style={{
          background: filterEnabledCount >= 3 ? "#fee2e2" : "#dbeafe",
          color: filterEnabledCount >= 3 ? "#991b1b" : "#1d4ed8",
          borderRadius: 8, padding: "8px 14px", marginBottom: 20,
          fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6
        }}>
          <i className="fa-solid fa-filter" />
          Filter &amp; Dashboard slots used: {filterEnabledCount} / 3
        </div>

        {/* Existing columns */}
        {columns.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Current Columns
            </div>
            <div className="d-flex flex-column gap-2">
              {columns.map(col => (
                <div key={col.key} style={{
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap"
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {col.key === "sno" && <i className="fa-solid fa-hashtag me-1" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }} />}
                      {col.label}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: 8, background: "var(--surface-3)", padding: "1px 6px", borderRadius: 4 }}>
                      {col.type}
                    </span>
                    {col.type === "select" && col.options?.length > 0 && (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginLeft: 6 }}>
                        ({col.options.join(", ")})
                      </span>
                    )}
                  </div>

                  {/* Toggle for select columns */}
                  {col.type === "select" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Filter &amp; Dashboard</span>
                      <div onClick={() => toggleFilter(col.key)} style={{
                        width: 36, height: 20, borderRadius: 10, cursor: "pointer",
                        background: col.enableFilter ? "var(--primary)" : "#cbd5e1",
                        position: "relative", transition: "background 0.2s", flexShrink: 0
                      }}>
                        <div style={{
                          position: "absolute", top: 2,
                          left: col.enableFilter ? 18 : 2,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "#fff", transition: "left 0.2s"
                        }} />
                      </div>
                      {col.enableFilter && <span style={{ fontSize: "0.68rem", color: "var(--primary)", fontWeight: 700 }}>ON</span>}
                    </div>
                  )}

                  {/* Remove button — all columns removable */}
                  <span onClick={() => removeColumn(col.key)} style={{
                    cursor: "pointer", color: "#ef4444", fontSize: "0.78rem",
                    padding: "3px 10px", borderRadius: 6, background: "#fee2e2",
                    fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-trash" style={{ fontSize: "0.7rem" }} />
                    Remove
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add column form */}
        <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 12 }}>
            <i className="fa-solid fa-plus me-2" style={{ color: "var(--primary)" }} />
            Add New Column
          </div>
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <Form.Label className="form-label">Column Name</Form.Label>
              <Form.Control className="form-control" value={newCol.label}
                onChange={e => setNewCol(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Source, City, Budget..."
                onKeyDown={e => e.key === "Enter" && addColumn()} />
            </div>
            <div className="col-md-3">
              <Form.Label className="form-label">Type</Form.Label>
              <Form.Select className="form-select" value={newCol.type}
                onChange={e => setNewCol(p => ({ ...p, type: e.target.value, enableFilter: false }))}>
                {COL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <Button variant="primary" className="w-100" onClick={addColumn} disabled={loading}>
                {loading ? "..." : <><i className="fa-solid fa-plus me-1" />Add</>}
              </Button>
            </div>

            {newCol.type === "select" && (
              <>
                <div className="col-12">
                  <Form.Label className="form-label">Options (comma separated)</Form.Label>
                  <Form.Control className="form-control" value={newCol.options}
                    onChange={e => setNewCol(p => ({ ...p, options: e.target.value }))}
                    placeholder="Option1, Option2, Option3..." />
                </div>
                <div className="col-12">
                  <div onClick={() => canAddFilter && setNewCol(p => ({ ...p, enableFilter: !p.enableFilter }))}
                    style={{
                      background: newCol.enableFilter ? "#eff6ff" : "var(--surface-3)",
                      border: `1.5px solid ${newCol.enableFilter ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: 10, padding: "12px 16px",
                      display: "flex", alignItems: "flex-start", gap: 12,
                      cursor: canAddFilter ? "pointer" : "not-allowed",
                      opacity: canAddFilter ? 1 : 0.55
                    }}>
                    <input type="checkbox" checked={newCol.enableFilter} readOnly style={{ marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="fa-solid fa-chart-pie" style={{ color: "var(--primary)" }} />
                        Enable Filter &amp; Dashboard for this column
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                        Adds filter tabs on Leads page and a chart on Dashboard.
                        {!canAddFilter && <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: 600 }}>Limit of 3 reached.</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          <i className="fa-solid fa-check me-1" />Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}