/* eslint-disable */
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useOnboarding } from "../../hooks/OnboardingContext";

const COL_TYPES = ["text", "number", "email", "phone", "date", "select", "url"];

// S.No is included by default but is removable
const DEFAULT_COLUMNS = [
  { key: "sno", label: "S.No", type: "auto", locked: false, removable: true }
];

export default function BusinessModal({ show, onHide, onCreate }) {
  const { completeStep, isDismissed } = useOnboarding();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [columns, setColumns] = useState([...DEFAULT_COLUMNS]);
  const [newCol, setNewCol] = useState({ label: "", type: "text", options: "", enableFilter: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filterEnabledCount = columns.filter(c => c.type === "select" && c.enableFilter).length;
  const canAddFilter = filterEnabledCount < 3;

  function addColumn() {
    if (!newCol.label.trim()) return setError("Column name is required.");
    const key = newCol.label.trim().toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_");
    if (columns.find(c => c.key === key)) return setError("Column name already exists.");
    if (newCol.type === "select" && newCol.enableFilter && !canAddFilter) {
      return setError("Maximum 3 select columns can have Filter enabled.");
    }
    const col = {
      key, label: newCol.label.trim(), type: newCol.type,
      options: newCol.type === "select" ? newCol.options.split(",").map(o => o.trim()).filter(Boolean) : [],
      enableFilter: newCol.type === "select" ? newCol.enableFilter : false,
      removable: true
    };
    setColumns(p => [...p, col]);
    setNewCol({ label: "", type: "text", options: "", enableFilter: false });
    setError("");
  }

  function removeColumn(key) { setColumns(p => p.filter(c => c.key !== key)); }

  function goToStep2() {
    if (!name.trim()) return setError("Business name is required.");
    setError(""); setStep(2);
  }

  async function handleCreate() {
    if (!name.trim()) return setError("Business name is required.");
    setLoading(true);
    try {
      await onCreate(name.trim(), description.trim(), columns);
      if (columns.length > 0 && !isDismissed) completeStep("add_columns");
      resetAndClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function resetAndClose() {
    setStep(1); setName(""); setDescription(""); setColumns([...DEFAULT_COLUMNS]);
    setNewCol({ label: "", type: "text", options: "", enableFilter: false });
    setError(""); onHide();
  }

  return (
    <Modal show={show} onHide={resetAndClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`fa-solid ${step === 1 ? "fa-building" : "fa-table-columns"} me-2`} style={{ color: "var(--primary)" }} />
          {step === 1 ? "Create New Business" : "Configure Columns"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {step === 1 && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.875rem" }}>
              Create a business to organize your leads. Each business has its own lead list and columns.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="form-label">Business Name *</Form.Label>
              <Form.Control className="form-control" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Real Estate Leads, E-commerce Clients..."
                onKeyDown={e => e.key === "Enter" && goToStep2()} />
            </Form.Group>
            <Form.Group>
              <Form.Label className="form-label">Description (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} className="form-control" value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What kind of leads are you tracking?" />
            </Form.Group>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: "0.875rem" }}>
              Define columns for your leads. <strong>S.No</strong> is included by default and can be removed.
              For <strong>select</strong> columns, enable <strong>Filter &amp; Dashboard</strong> to get filter tabs and charts.
            </p>

            {filterEnabledCount > 0 && (
              <div style={{
                background: filterEnabledCount >= 3 ? "#fee2e2" : "#dbeafe",
                color: filterEnabledCount >= 3 ? "#991b1b" : "#1d4ed8",
                borderRadius: 8, padding: "7px 14px", marginBottom: 14,
                fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6
              }}>
                <i className="fa-solid fa-filter" />
                Filter &amp; Dashboard slots: {filterEnabledCount} / 3
              </div>
            )}

            {/* Column preview */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {columns.map(col => (
                <span key={col.key} className={`column-tag${col.key === "sno" ? " locked" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {col.key === "sno" && <i className="fa-solid fa-hashtag" style={{ fontSize: "0.75rem" }} />}
                  {col.label}
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>({col.type})</span>
                  {col.enableFilter && <i className="fa-solid fa-chart-pie" style={{ fontSize: "0.65rem", color: "var(--primary)" }} />}
                  {col.removable !== false && (
                    <span className="remove-btn" onClick={() => removeColumn(col.key)}>
                      <i className="fa-solid fa-xmark" />
                    </span>
                  )}
                </span>
              ))}
              {columns.length === 0 && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "6px 0" }}>
                  No columns yet — add below or skip.
                </span>
              )}
            </div>

            {/* Add column form */}
            <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 12 }}>Add a Column</div>
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <Form.Label className="form-label">Column Name</Form.Label>
                  <Form.Control className="form-control" value={newCol.label}
                    onChange={e => setNewCol(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Name, Phone, Source..."
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
                  <Button variant="outline-primary" className="w-100" onClick={addColumn}>
                    <i className="fa-solid fa-plus me-1" />Add
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
                            Adds filter tabs on Leads page and a breakdown chart on Dashboard.
                            {!canAddFilter && <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: 600 }}>Limit of 3 reached.</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 10 }}>
              <i className="fa-solid fa-circle-info me-1" />
              You can add or remove columns later via <strong>Manage Columns</strong>.
            </p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === 1 ? (
          <>
            <Button variant="light" onClick={resetAndClose}>Cancel</Button>
            <Button variant="primary" onClick={goToStep2}>
              Next: Configure Columns <i className="fa-solid fa-arrow-right ms-1" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="light" onClick={() => { setStep(1); setError(""); }}>
              <i className="fa-solid fa-arrow-left me-1" />Back
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : <><i className="fa-solid fa-check me-1" />Create Business</>}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}