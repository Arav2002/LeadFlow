/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useShare, PERMISSIONS } from "../../hooks/ShareContext";
import { useBusiness } from "../../hooks/BusinessContext";

function safeCopyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    return Promise.resolve();
  } catch (e) { return Promise.reject(e); }
}

export default function ShareModal({ show, onHide }) {
  const { activeBusiness } = useBusiness();
  const { shareLinks, loading, fetchShareLinks, createShareLink, revokeShareLink } = useShare();
  const [permission, setPermission]     = useState("R");
  const [label, setLabel]               = useState("");
  const [email, setEmail]               = useState("");
  const [creating, setCreating]         = useState(false);
  const [copiedId, setCopiedId]         = useState(null);
  const [newToken, setNewToken]         = useState(null);
  const [error, setError]               = useState("");

  useEffect(() => {
    if (show && activeBusiness) fetchShareLinks(activeBusiness.id);
  }, [show, activeBusiness]);

  async function handleCreate() {
    if (!activeBusiness) return;
    setCreating(true); setError("");
    try {
      const token = await createShareLink(
        activeBusiness.id, activeBusiness.name,
        permission, label, email
      );
      setNewToken(token); setLabel(""); setEmail("");
    } catch (e) { setError(e.message); }
    setCreating(false);
  }

  function getLink(token) { return `${window.location.origin}/shared/${token}`; }

  function copyLink(token, id) {
    safeCopyToClipboard(getLink(token))
      .then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); })
      .catch(() => alert("Copy failed. Please copy the link manually."));
  }

  async function handleRevoke(linkId) {
    if (window.confirm("Revoke this share link? Anyone using it will lose access.")) {
      await revokeShareLink(linkId, activeBusiness.id);
      if (newToken) setNewToken(null);
    }
  }

  const permColors = { R: "#dbeafe", CRU: "#fef3c7", CRUD: "#fee2e2" };
  const permText   = { R: "#1d4ed8", CRU: "#92400e", CRUD: "#991b1b" };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fa-solid fa-share-nodes me-2" style={{ color: "var(--primary)" }} />
          Share — {activeBusiness?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {/* Newly created link */}
        {newToken && (
          <div style={{ background: "#d1fae5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 8, fontSize: "0.875rem" }}>
              <i className="fa-solid fa-circle-check me-2" />Share link created! Copy it below:
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={getLink(newToken)} className="form-control form-control-sm"
                style={{ fontFamily: "monospace", fontSize: "0.78rem" }}
                onClick={e => e.target.select()} />
              <button className="btn btn-sm btn-success" onClick={() => copyLink(newToken, "new")}>
                {copiedId === "new" ? <><i className="fa-solid fa-check me-1" />Copied!</> : <><i className="fa-solid fa-copy me-1" />Copy</>}
              </button>
            </div>
          </div>
        )}

        {/* Create new link */}
        <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 20, border: "1px solid var(--border)", marginBottom: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 16 }}>
            <i className="fa-solid fa-link me-2" style={{ color: "var(--primary)" }} />
            Create New Share Link
          </div>

          {/* Permission selector */}
          <div className="mb-3">
            <Form.Label className="form-label">Permission Level</Form.Label>
            <div className="d-flex flex-column gap-2">
              {Object.entries(PERMISSIONS).map(([key, perm]) => (
                <label key={key} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${permission === key ? "var(--primary)" : "var(--border)"}`,
                  background: permission === key ? "var(--primary-light)" : "var(--surface)",
                  transition: "all 0.15s"
                }}>
                  <input type="radio" name="permission" value={key}
                    checked={permission === key} onChange={() => setPermission(key)} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: permColors[key], color: permText[key], fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{key}</span>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{perm.label}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 3 }}>{perm.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email (optional — for sidebar auto-discovery) */}
          <Form.Group className="mb-3">
            <Form.Label className="form-label">
              <i className="fa-solid fa-envelope me-1" />
              Share with Email <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
            </Form.Label>
            <Form.Control className="form-control" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com" />
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
              <i className="fa-solid fa-circle-info me-1" />
              If entered, this business will appear in that user's <strong>Shared With Me</strong> sidebar section automatically.
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="form-label">Link Label (optional)</Form.Label>
            <Form.Control className="form-control" value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Sales Team, Client View..." />
          </Form.Group>

          <Button variant="primary" onClick={handleCreate} disabled={creating || !activeBusiness}>
            {creating ? "Creating..." : <><i className="fa-solid fa-link me-1" />Generate Share Link</>}
          </Button>
        </div>

        {/* Active links */}
        <div>
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 12, fontSize: "0.95rem" }}>
            Active Share Links
            {shareLinks.length > 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
                ({shareLinks.length})
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading...</div>
          ) : shareLinks.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "16px 0" }}>
              No share links yet. Create one above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {shareLinks.map(link => (
                <div key={link.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"
                }}>
                  <span style={{ background: permColors[link.permission], color: permText[link.permission], fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
                    {link.permission}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{link.label}</div>
                    {link.sharedWithEmail && (
                      <div style={{ fontSize: "0.72rem", color: "var(--primary)", marginTop: 1 }}>
                        <i className="fa-solid fa-user me-1" />{link.sharedWithEmail}
                      </div>
                    )}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getLink(link.token)}
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => copyLink(link.token, link.id)}>
                      {copiedId === link.id
                        ? <><i className="fa-solid fa-check me-1" />Copied</>
                        : <><i className="fa-solid fa-copy me-1" />Copy</>}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleRevoke(link.id)}>
                      <i className="fa-solid fa-ban me-1" />Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}