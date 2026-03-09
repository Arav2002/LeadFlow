import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useLeads } from "../hooks/LeadsContext";
import { useBusiness } from "../hooks/BusinessContext";
import AppLayout from "../components/layout/AppLayout";

export default function ImportPage() {
  const { activeBusiness } = useBusiness();
  const { bulkAddLeads, leads } = useLeads();
  const [step, setStep] = useState(1);
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const businessCols = (activeBusiness?.columns || []).filter(c => !c.locked);
  const allTargetCols = [
    { key: "status", label: "Status" },
    ...businessCols
  ];

  function parseFile(file) {
    setError("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        const rows = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
          const obj = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
          return obj;
        });
        setParsedHeaders(headers);
        setParsedRows(rows);
        autoMap(headers);
        setStep(2);
      };
      reader.onerror = () => setError("Failed to read file. Please try again.");
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        setParsedHeaders(headers);
        setParsedRows(data);
        autoMap(headers);
        setStep(2);
      };
      reader.onerror = () => setError("Failed to read file. Please try again.");
      reader.readAsBinaryString(file);
    } else {
      setError("Only CSV, XLS, or XLSX files are supported.");
    }
  }

  function autoMap(headers) {
    const m = {};
    allTargetCols.forEach(tc => {
      const match = headers.find(h =>
        h.toLowerCase().replace(/[^a-z0-9]/g, "") === tc.key.replace(/_/g, "") ||
        h.toLowerCase().includes(tc.label.toLowerCase())
      );
      if (match) m[tc.key] = match;
    });
    setMapping(m);
  }

  async function handleImport() {
    setLoading(true);
    setError("");
    try {
      const rows = parsedRows.map(row => {
        const lead = {};
        allTargetCols.forEach(tc => {
          if (mapping[tc.key]) lead[tc.key] = String(row[mapping[tc.key]] || "");
        });
        businessCols.forEach(tc => {
          if (!mapping[tc.key]) {
            const found = parsedHeaders.find(h => h.toLowerCase().replace(/\s+/g, "_") === tc.key);
            if (found) lead[tc.key] = String(row[found] || "");
          }
        });
        return lead;
      });
      await bulkAddLeads(activeBusiness.id, rows);
      setImportCount(rows.length);
      setStep(4);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  function reset() {
    setStep(1);
    setParsedHeaders([]);
    setParsedRows([]);
    setMapping({});
    setError("");
    setImportCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  return (
    <AppLayout title="Import Leads">
      <div className="page-header">
        <h2>Import Leads</h2>
        <p>Upload CSV or Excel files to bulk-import leads into your selected business</p>
      </div>

      {!activeBusiness ? (
        <div className="alert alert-warning">
          Please select a business from the sidebar before importing.
        </div>
      ) : (
        <div style={{ maxWidth: 760 }}>
          {/* Step Indicator */}
          <div className="d-flex align-items-center gap-3 mb-4">
            {["Upload File", "Map Columns", "Preview", "Done"].map((s, i) => (
              <React.Fragment key={i}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  color: step > i + 1 ? "var(--success)" : step === i + 1 ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: step === i + 1 ? 700 : 400,
                  fontSize: "0.85rem"
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700,
                    background: step > i + 1 ? "var(--success)" : step === i + 1 ? "var(--primary)" : "var(--surface-3)",
                    color: step >= i + 1 ? "#fff" : "var(--text-muted)"
                  }}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  {s}
                </div>
                {i < 3 && <div style={{ flex: 1, height: 1, background: "var(--border)" }} />}
              </React.Fragment>
            ))}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="table-card p-4">
              <div
                className={`upload-zone${dragging ? " dragging" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <div className="upload-icon">📁</div>
                <div className="upload-text">Drop your file here or click to browse</div>
                <div className="upload-subtext">Supports CSV, XLS, XLSX</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={e => e.target.files[0] && parseFile(e.target.files[0])}
                />
              </div>
              <div className="mt-3" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <strong>Tips:</strong> Your file should have column headers in the first row.
                Columns like "Status" will be auto-detected.
                Importing into: <strong>{activeBusiness.name}</strong>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="table-card p-4">
              <h5 className="mb-1">Map Columns</h5>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                Match your file's columns to LeadFlow fields. Unmapped columns will be skipped.
              </p>
              <div className="table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 16px", background: "var(--surface-2)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        LeadFlow Field
                      </th>
                      <th style={{ padding: "10px 16px", background: "var(--surface-2)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Your File Column
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTargetCols.map(tc => (
                      <tr key={tc.key}>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: "0.875rem" }}>
                          {tc.label}
                          {tc.key === "status" && (
                            <span style={{ fontSize: "0.7rem", color: "var(--primary)", marginLeft: 6 }}>auto</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                          <select
                            className="form-select form-select-sm"
                            value={mapping[tc.key] || ""}
                            onChange={e => setMapping(p => ({ ...p, [tc.key]: e.target.value }))}
                          >
                            <option value="">-- Skip --</option>
                            {parsedHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-light" onClick={reset}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  Preview Import ({parsedRows.length} rows) →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="table-card">
              <div className="table-header">
                <h5>Preview ({Math.min(5, parsedRows.length)} of {parsedRows.length} rows)</h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-light btn-sm" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={loading}>
                    {loading ? "Importing..." : `Import ${parsedRows.length} Leads`}
                  </button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="leads-table">
                  <thead>
                    <tr>
                      {allTargetCols.filter(tc => mapping[tc.key]).map(tc => (
                        <th key={tc.key}>{tc.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {allTargetCols.filter(tc => mapping[tc.key]).map(tc => (
                          <td key={tc.key}>{row[mapping[tc.key]] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <div style={{ padding: "12px 24px", fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
                  ...and {parsedRows.length - 5} more rows
                </div>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="table-card p-5 text-center">
              <div style={{ fontSize: "3rem" }}>✅</div>
              <h4 style={{ marginTop: 16, fontFamily: "Syne" }}>Import Successful!</h4>
              <p style={{ color: "var(--text-secondary)" }}>
                <strong>{importCount}</strong> leads imported into <strong>{activeBusiness.name}</strong>
              </p>
              <div className="d-flex gap-2 justify-content-center mt-4">
                <button className="btn btn-outline-primary" onClick={reset}>Import More</button>
                <a href="/leads" className="btn btn-primary">View Leads</a>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}