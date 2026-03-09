import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useOnboarding } from "../../hooks/OnboardingContext";

const COL_TYPES = ["text", "number", "email", "phone", "date", "select", "url"];

export default function BusinessModal({ show, onHide, onCreate }) {
  const { completeStep, isDismissed } = useOnboarding();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [columns, setColumns] = useState([]);
  const [newCol, setNewCol] = useState({ label: "", type: "text", options: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addColumn() {
    if (!newCol.label.trim()) return setError("Column name is required.");
    const key = newCol.label.trim().toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_");
    if (columns.find(c => c.key === key)) return setError("Column name already exists.");
    const col = {
      key,
      label: newCol.label.trim(),
      type: newCol.type,
      options: newCol.type === "select"
        ? newCol.options.split(",").map(o => o.trim()).filter(Boolean)
        : []
    };
    setColumns(p => [...p, col]);
    setNewCol({ label: "", type: "text", options: "" });
    setError("");
  }

  function removeColumn(key) {
    setColumns(p => p.filter(c => c.key !== key));
  }

  function goToStep2() {
    if (!name.trim()) return setError("Business name is required.");
    setError("");
    setStep(2);
  }

  async function handleCreate() {
    if (!name.trim()) return setError("Business name is required.");
    setLoading(true);
    try {
      await onCreate(name.trim(), description.trim(), columns);
      // If user added custom columns during creation mark that step done too
      if (columns.length > 0 && !isDismissed) {
        completeStep("add_columns");
      }
      resetAndClose();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  function resetAndClose() {
    setStep(1);
    setName("");
    setDescription("");
    setColumns([]);
    setNewCol({ label: "", type: "text", options: "" });
    setError("");
    onHide();
  }

  return (
    <Modal show={show} onHide={resetAndClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {step === 1 ? "Create New Business" : "Configure Columns"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {step === 1 && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.875rem" }}>
              Create a business to organize your leads. Each business has its own lead list and custom columns.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="form-label">Business Name *</Form.Label>
              <Form.Control
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Real Estate Leads, E-commerce Clients..."
                onKeyDown={e => e.key === "Enter" && goToStep2()}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="form-label">Description (optional)</Form.Label>
              <Form.Control
                as="textarea" rows={3} className="form-control"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What kind of leads are you tracking?"
              />
            </Form.Group>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.875rem" }}>
              Define the columns for your leads. <strong>S.No</strong> and <strong>Status</strong> are always included automatically.
            </p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="column-tag locked">🔒 S.No (auto)</span>
              <span className="column-tag locked">🔒 Status (select)</span>
              {columns.map(col => (
                <span key={col.key} className="column-tag">
                  {col.label}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginLeft: 4 }}>
                    ({col.type})
                  </span>
                  <span className="remove-btn" onClick={() => removeColumn(col.key)}>✕</span>
                </span>
              ))}
              {columns.length === 0 && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "6px 0" }}>
                  No custom columns yet — add below or skip to use defaults only.
                </span>
              )}
            </div>

            <div style={{
              background: "var(--surface-2)", borderRadius: "var(--radius)",
              padding: 16, border: "1px solid var(--border)"
            }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 12 }}>Add a Column</div>
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <Form.Label className="form-label">Column Name</Form.Label>
                  <Form.Control
                    className="form-control"
                    value={newCol.label}
                    onChange={e => setNewCol(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Name, Phone, Source..."
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
                  <Button variant="outline-primary" className="w-100" onClick={addColumn}>
                    + Add
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

            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 10 }}>
              💡 You can also add more columns later via <strong>Manage Columns</strong>.
            </p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === 1 ? (
          <>
            <Button variant="light" onClick={resetAndClose}>Cancel</Button>
            <Button variant="primary" onClick={goToStep2}>
              Next: Configure Columns →
            </Button>
          </>
        ) : (
          <>
            <Button variant="light" onClick={() => { setStep(1); setError(""); }}>← Back</Button>
            <Button variant="primary" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Business"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}