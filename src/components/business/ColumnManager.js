import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useBusiness } from "../../hooks/BusinessContext";
import { useOnboarding } from "../../hooks/OnboardingContext";

const COL_TYPES = ["text", "number", "email", "phone", "date", "select", "url"];

export default function ColumnManager({ show, onHide }) {
  const { activeBusiness, updateBusinessColumns } = useBusiness();
  const { completeStep, isDismissed } = useOnboarding();
  const [newCol, setNewCol] = useState({ label: "", type: "text", options: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const columns = activeBusiness?.columns || [];
  const userCols = columns.filter(c => !c.locked);
  const lockedCols = columns.filter(c => c.locked);

  async function addColumn() {
    if (!newCol.label.trim()) return setError("Column name required.");
    const key = newCol.label.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_");
    if (columns.find(c => c.key === key)) return setError("Column already exists.");
    const col = {
      key,
      label: newCol.label.trim(),
      type: newCol.type,
      options: newCol.type === "select"
        ? newCol.options.split(",").map(o => o.trim()).filter(Boolean)
        : []
    };
    const updated = [...columns, col];
    setLoading(true);
    try {
      await updateBusinessColumns(activeBusiness.id, updated);
      setNewCol({ label: "", type: "text", options: "" });
      setError("");
      // Mark onboarding step complete when a column is added
      if (!isDismissed) completeStep("add_columns");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function removeColumn(key) {
    const updated = columns.filter(c => c.key !== key);
    setLoading(true);
    try {
      await updateBusinessColumns(activeBusiness.id, updated);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  function handleClose() {
    setNewCol({ label: "", type: "text", options: "" });
    setError("");
    onHide();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Manage Columns — {activeBusiness?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
          Add or remove columns for this business. Locked columns cannot be removed.
        </p>

        {/* Existing columns */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {lockedCols.map(col => (
            <span key={col.key} className="column-tag locked">
              🔒 {col.label}
            </span>
          ))}
          {userCols.map(col => (
            <span key={col.key} className="column-tag">
              {col.label}
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 4 }}>
                ({col.type})
              </span>
              <span className="remove-btn" onClick={() => removeColumn(col.key)}>✕</span>
            </span>
          ))}
          {userCols.length === 0 && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No custom columns yet. Add one below.
            </span>
          )}
        </div>

        {/* Add column form */}
        <div style={{
          background: "var(--surface-2)", borderRadius: "var(--radius)",
          padding: 16, border: "1px solid var(--border)"
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 12 }}>
            Add New Column
          </div>
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <Form.Label className="form-label">Column Name</Form.Label>
              <Form.Control
                className="form-control"
                value={newCol.label}
                onChange={e => setNewCol(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Company, Source, Budget..."
                onKeyDown={e => e.key === "Enter" && addColumn()}
              />
            </div>
            <div className="col-md-3">
              <Form.Label className="form-label">Type</Form.Label>
              <Form.Select
                className="form-select"
                value={newCol.type}
                onChange={e => setNewCol(p => ({ ...p, type: e.target.value }))}
              >
                {COL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <Button
                variant="primary"
                className="w-100"
                onClick={addColumn}
                disabled={loading}
              >
                {loading ? "..." : "+ Add"}
              </Button>
            </div>
            {newCol.type === "select" && (
              <div className="col-12">
                <Form.Label className="form-label">Options (comma separated)</Form.Label>
                <Form.Control
                  className="form-control"
                  value={newCol.options}
                  onChange={e => setNewCol(p => ({ ...p, options: e.target.value }))}
                  placeholder="Option1, Option2, Option3..."
                />
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>Done</Button>
      </Modal.Footer>
    </Modal>
  );
}