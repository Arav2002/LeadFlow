import React, { useState } from "react";
import { useBusiness } from "../hooks/BusinessContext";
import AppLayout from "../components/layout/AppLayout";
import BusinessModal from "../components/business/BusinessModal";
import ColumnManager from "../components/business/ColumnManager";
import ShareModal from "../components/share/ShareModal";

export default function BusinessesPage() {
  const { businesses, activeBusiness, setActiveBusiness, createBusiness, deleteBusiness } = useBusiness();
  const [showCreate, setShowCreate] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [showShare, setShowShare] = useState(false);

  function handleManageCols(biz) {
    setActiveBusiness(biz);
    setShowCols(true);
  }

  function handleShare(biz) {
    setActiveBusiness(biz);
    setShowShare(true);
  }

  async function handleDelete(biz) {
    if (window.confirm(`Delete "${biz.name}"? This will NOT delete associated leads.`)) {
      await deleteBusiness(biz.id);
    }
  }

  return (
    <AppLayout title="Businesses">
      <div className="page-header d-flex align-items-start justify-content-between">
        <div>
          <h2>Businesses</h2>
          <p>Manage your lead businesses, columns and share access</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Business</button>
      </div>

      {businesses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <h5>No businesses yet</h5>
          <p>Create your first business to start tracking leads.</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowCreate(true)}>
            Create Business
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {businesses.map(biz => (
            <div key={biz.id} className="col-md-4">
              <div
                className="metric-card"
                style={{
                  cursor: "pointer",
                  border: activeBusiness?.id === biz.id
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border)"
                }}
                onClick={() => setActiveBusiness(biz)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, background: "var(--primary-light)",
                    borderRadius: "var(--radius)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "1.3rem"
                  }}>🏢</div>
                  {activeBusiness?.id === biz.id && (
                    <span style={{
                      background: "var(--primary)", color: "#fff",
                      fontSize: "0.7rem", fontWeight: 700,
                      padding: "2px 8px", borderRadius: 20
                    }}>Active</span>
                  )}
                </div>

                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
                  {biz.name}
                </div>
                {biz.description && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                    {biz.description}
                  </div>
                )}
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 12 }}>
                  {(biz.columns || []).length} columns configured
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                  {(biz.columns || []).slice(0, 5).map(col => (
                    <span key={col.key}
                      className={`column-tag${col.locked ? " locked" : ""}`}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}>
                      {col.label}
                    </span>
                  ))}
                  {(biz.columns || []).length > 5 && (
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "3px 8px" }}>
                      +{biz.columns.length - 5} more
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="d-flex gap-2" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-outline-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleManageCols(biz)}>
                    ⚙️ Columns
                  </button>
                  <button className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleShare(biz)}>
                    🔗 Share
                  </button>
                  <button className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(biz)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BusinessModal show={showCreate} onHide={() => setShowCreate(false)} onCreate={createBusiness} />
      <ColumnManager show={showCols} onHide={() => setShowCols(false)} />
      <ShareModal show={showShare} onHide={() => setShowShare(false)} />
    </AppLayout>
  );
}
