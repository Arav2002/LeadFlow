import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useLeads } from "../../hooks/LeadsContext";
import { useBusiness } from "../../hooks/BusinessContext";

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function LeadFormModal({ show, onHide, editLead = null }) {
  const { addLead, updateLead } = useLeads();
  const { activeBusiness } = useBusiness();
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const columns = (activeBusiness?.columns || []).filter(c => c.key !== "sno");

  useEffect(() => {
    if (editLead) {
      setForm({ ...editLead });
    } else {
      const defaults = {};
      columns.forEach(c => { defaults[c.key] = ""; });
      defaults.status = "New";
      setForm(defaults);
    }
    setError("");
  }, [show, editLead]);

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (editLead) {
        await updateLead(editLead.id, form);
      } else {
        await addLead(activeBusiness.id, form);
      }
      onHide();
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function renderField(col) {
    if (col.locked && col.key === "status") {
      return (
        <Form.Select className="form-select" value={form.status || "New"} onChange={set("status")}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </Form.Select>
      );
    }
    if (col.type === "select") {
      return (
        <Form.Select className="form-select" value={form[col.key] || ""} onChange={set(col.key)}>
          <option value="">-- Select --</option>
          {(col.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </Form.Select>
      );
    }
    return (
      <Form.Control className="form-control" type={col.type === "number" ? "number" : col.type === "email" ? "email" : col.type === "date" ? "date" : "text"}
        value={form[col.key] || ""} onChange={set(col.key)} placeholder={`Enter ${col.label}`} />
    );
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editLead ? "Edit Lead" : "Add New Lead"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!activeBusiness ? (
          <div className="alert alert-warning">Please select a business first.</div>
        ) : (
          <>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit} id="lead-form">
              <div className="row g-3">
                {columns.map(col => (
                  <div key={col.key} className="col-md-6">
                    <Form.Label className="form-label">{col.label}</Form.Label>
                    {renderField(col)}
                  </div>
                ))}
                {columns.length === 0 && (
                  <div className="col-12">
                    <div className="alert alert-info">
                      This business has no custom columns yet. Only S.No and Status will be recorded.
                      <br /><small>Go to <strong>Businesses → Manage Columns</strong> to add more fields.</small>
                    </div>
                    <Form.Group>
                      <Form.Label className="form-label">Status</Form.Label>
                      <Form.Select className="form-select" value={form.status || "New"} onChange={set("status")}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </div>
                )}
              </div>
            </form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>Cancel</Button>
        <Button variant="primary" type="submit" form="lead-form" disabled={loading || !activeBusiness}>
          {loading ? "Saving..." : editLead ? "Save Changes" : "Add Lead"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
