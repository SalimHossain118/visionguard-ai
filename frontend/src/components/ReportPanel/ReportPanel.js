import React, { useState } from "react";
import { useSelector } from "react-redux";

const stripMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/Part Number:.*?\n/g, "")
    .replace(/Date:.*?\n/g, "")
    .replace(/Inspector:.*?\n/g, "")
    .replace(/Quality Inspection Report/g, "")
    .trim();
};

const twoSentences = (text) => {
  if (!text) return "";
  const cleaned = stripMarkdown(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 2).join(" ").trim();
};

export default function ReportPanel() {
  const { currentInspection } = useSelector((s) => s.inspection);

  const [form, setForm] = useState({
    companyName: "",
    productName: "",
    customerName: "",
    orderNumber: "",
    machineId: "",
    shift: "Morning",
    material: "",
    operatorName: "",
    supervisorName: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const shifts = ["Morning", "Afternoon", "Night"];

  if (!currentInspection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-sm">Run an inspection first to generate a report</p>
      </div>
    );
  }

  const decisionColor =
    currentInspection.decision === "PASS"
      ? "#22c55e"
      : currentInspection.decision === "REWORK"
        ? "#f59e0b"
        : "#ef4444";

  const sectionTitle = {
    fontSize: "8px",
    fontWeight: "bold",
    color: "#1e3a5f",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  };

  const textBox = {
    fontSize: "9px",
    lineHeight: "1.6",
    color: "#374151",
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "3px",
    padding: "8px 10px",
  };

  const divider = {
    marginBottom: "14px",
    paddingBottom: "14px",
    borderBottom: "1px solid #e5e7eb",
  };

  return (
    <>
      <div className="no-print flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          Non-Conformance Report
        </h2>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          Print / Export PDF
        </button>
      </div>

      <div
        className="report-page"
        style={{
          width: "210mm",
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#fff",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            backgroundColor: "#1e3a5f",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}
            >
              NON-CONFORMANCE REPORT
            </div>
            <div
              style={{ fontSize: "8px", color: "#93b4d4", marginTop: "2px" }}
            >
              VisionGuard AI — Automated Quality Control System
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                backgroundColor: decisionColor,
                padding: "4px 12px",
                borderRadius: "3px",
                fontWeight: "bold",
                fontSize: "12px",
                color: "#fff",
                display: "inline-block",
              }}
            >
              {currentInspection.decision}
            </div>
            <div
              style={{ fontSize: "7px", color: "#93b4d4", marginTop: "3px" }}
            >
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: "14px 14px" }}>
          {/* Section 1 */}
          <div style={divider}>
            <div style={sectionTitle}>1. Production Information</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px 12px",
              }}
            >
              {[
                { name: "companyName", label: "Company Name" },
                { name: "productName", label: "Product / Part Name" },
                { name: "customerName", label: "Customer Name" },
                { name: "orderNumber", label: "Order / Batch Number" },
                { name: "machineId", label: "Machine / Station ID" },
                { name: "material", label: "Material Specification" },
              ].map((f) => (
                <div key={f.name}>
                  <div
                    style={{
                      fontSize: "7px",
                      color: "#9ca3af",
                      marginBottom: "2px",
                    }}
                  >
                    {f.label}
                  </div>
                  <input
                    type="text"
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder="—"
                    style={{
                      width: "100%",
                      fontSize: "9px",
                      borderBottom: "1px solid #d1d5db",
                      padding: "2px 0",
                      outline: "none",
                      background: "transparent",
                      color: "#111",
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px 12px",
                marginTop: "8px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "7px",
                    color: "#9ca3af",
                    marginBottom: "3px",
                  }}
                >
                  Shift
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {shifts.map((s) => (
                    <label
                      key={s}
                      style={{
                        fontSize: "9px",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="shift"
                        value={s}
                        checked={form.shift === s}
                        onChange={() => setForm({ ...form, shift: s })}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              {[
                { name: "operatorName", label: "Operator Name" },
                { name: "supervisorName", label: "Supervisor Name" },
              ].map((f) => (
                <div key={f.name}>
                  <div
                    style={{
                      fontSize: "7px",
                      color: "#9ca3af",
                      marginBottom: "2px",
                    }}
                  >
                    {f.label}
                  </div>
                  <input
                    type="text"
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder="—"
                    style={{
                      width: "100%",
                      fontSize: "9px",
                      borderBottom: "1px solid #d1d5db",
                      padding: "2px 0",
                      outline: "none",
                      background: "transparent",
                      color: "#111",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div style={divider}>
            <div style={sectionTitle}>2. AI Inspection Findings</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                {
                  label: "Anomaly Score",
                  value: currentInspection.anomaly_score?.toFixed(4),
                },
                { label: "Severity", value: currentInspection.severity },
                {
                  label: "Defect Location",
                  value: currentInspection.defect_location,
                },
                {
                  label: "Surface Coverage",
                  value: `${currentInspection.coverage_percent}%`,
                },
                { label: "Category", value: currentInspection.category },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: "3px",
                    padding: "6px 8px",
                  }}
                >
                  <div style={{ fontSize: "7px", color: "#9ca3af" }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#1e3a5f",
                      marginTop: "2px",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div style={divider}>
            <div style={sectionTitle}>3. Inspection Report</div>
            <div style={textBox}>
              {twoSentences(currentInspection.inspection_report)}
            </div>
          </div>

          {/* Section 4 */}
          <div style={divider}>
            <div style={sectionTitle}>4. Root Cause Analysis</div>
            <div style={textBox}>
              {twoSentences(currentInspection.root_cause)}
            </div>
          </div>

          {/* Section 5 */}
          <div style={divider}>
            <div style={sectionTitle}>5. Decision &amp; Justification</div>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
            >
              <div
                style={{
                  backgroundColor: decisionColor,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "9px",
                  padding: "4px 12px",
                  borderRadius: "3px",
                  flexShrink: 0,
                }}
              >
                {currentInspection.decision}
              </div>
              <div
                style={{ fontSize: "9px", lineHeight: "1.6", color: "#374151" }}
              >
                {stripMarkdown(currentInspection.decision_justification)}
              </div>
            </div>
          </div>

          {/* Section 6 — Signatures */}
          <div style={{ marginBottom: "0" }}>
            <div style={sectionTitle}>6. Signatures &amp; Approval</div>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Operator", "Shift Supervisor", "QA Manager"].map((role) => (
                <div key={role} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      borderBottom: "1px solid #374151",
                      height: "35px",
                      marginBottom: "4px",
                    }}
                  />
                  <div style={{ fontSize: "8px", color: "#6b7280" }}>
                    {role}
                  </div>
                  <div
                    style={{
                      fontSize: "7px",
                      color: "#9ca3af",
                      marginTop: "3px",
                    }}
                  >
                    Date: _______________
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            backgroundColor: "#1e3a5f",
            padding: "5px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <span style={{ fontSize: "7px", color: "#93b4d4" }}>
            Generated by VisionGuard AI — Industrial Quality Control System
          </span>
          <span style={{ fontSize: "7px", color: "#93b4d4" }}>
            Confidential — Internal Use Only
          </span>
        </div>
      </div>

      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          header, nav, .no-print { display: none !important; }
          .report-page { box-shadow: none !important; margin: 0 !important; width: 210mm !important; }
        }
        @page { size: A4 portrait; margin: 0; }
      `}</style>
    </>
  );
}
