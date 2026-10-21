import { useEffect, useState } from "react";
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Search,
  Check,
  Brain,
  ShieldAlert,
  Info,
  Stethoscope,
  PhoneCall,
  CheckSquare,
  Sparkles,
  RefreshCw,
  Clock,
  Eye,
  CheckCheck,
  ShieldCheck
} from "lucide-react";
import { apiGetAlerts, apiUpdateAlertStatus } from "../api";
import { addAuditLog } from "../utils/auditLogger";

function Alerts() {
  const [currentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_user");
      return saved ? JSON.parse(saved) : { role: "Nurse", name: "ICU Nurse" };
    } catch {
      return { role: "Nurse", name: "ICU Nurse" };
    }
  });

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusError, setStatusError] = useState("");
  const [updatingAlertId, setUpdatingAlertId] = useState(null);

  const isNurse = currentUser?.role === "Nurse";
  const isAdmin = currentUser?.role === "Administrator" || currentUser?.role === "Admin";
  const isDoctor = currentUser?.role === "Doctor";

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let data = await apiGetAlerts();
      if (!Array.isArray(data)) data = [];

      // Standardize status labels safely
      const formatted = data.map((a, index) => {
        if (!a) return null;
        let st = String(a.status || "NEW").toUpperCase();
        if (st === "ACTIVE") st = "NEW";
        if (st === "REVIEWED") st = "REVIEWED";

        return {
          id: a.id || `alt_${Date.now()}_${index}`,
          patientId: a.patientId || a.patient_id || `ICU-${100 + index}`,
          probability: typeof a.probability === "number" ? a.probability : parseFloat(a.probability || 0),
          prediction: a.prediction !== undefined ? a.prediction : 1,
          riskLevel: a.riskLevel || a.risk_level || "High Risk",
          status: st,
          dateTime: a.dateTime || a.date_time || new Date().toLocaleString(),
          message: a.message || "High sepsis risk predicted.",
          reviewedBy: a.reviewedBy || a.reviewed_by || ""
        };
      }).filter(Boolean);

      setAlerts(formatted);
    } catch (err) {
      console.error("Error loading alerts:", err);
      try {
        const saved = localStorage.getItem("sepsis_alerts");
        const parsed = saved ? JSON.parse(saved) : [];
        const formatted = (Array.isArray(parsed) ? parsed : []).map((a, idx) => ({
          id: a?.id || idx,
          patientId: a?.patientId || "ICU-Unknown",
          probability: Number(a?.probability || 0),
          prediction: 1,
          riskLevel: a?.riskLevel || "High Risk",
          status: String(a?.status || "NEW").toUpperCase() === "ACTIVE" ? "NEW" : String(a?.status || "NEW").toUpperCase(),
          dateTime: a?.dateTime || new Date().toLocaleString()
        }));
        setAlerts(formatted);
      } catch {
        setAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (alertId, nextStatus) => {
    const reviewerInfo = `${currentUser?.name || "Clinician"} (${currentUser?.role || "Staff"})`;
    setStatusError("");
    setUpdatingAlertId(alertId);
    try {
      await apiUpdateAlertStatus(alertId, nextStatus, reviewerInfo);
      const updated = alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: nextStatus,
              reviewedBy: reviewerInfo,
              reviewTime: new Date().toLocaleString()
            }
          : alert
      );
      setAlerts(updated);
      try {
        localStorage.setItem("sepsis_alerts", JSON.stringify(updated));
      } catch (storageError) {
        console.warn("Could not update the local alert cache:", storageError);
      }

      const actionLabel =
        nextStatus === "REVIEWED"
          ? "Alert Reviewed"
          : nextStatus === "ACKNOWLEDGED"
          ? "Alert Acknowledged"
          : "Alert Resolved";
      const targetAlert = alerts.find((alert) => alert.id === alertId);
      addAuditLog({
        action: actionLabel,
        entity: targetAlert?.patientId || `Patient #${alertId}`,
        user: currentUser?.name || "User",
        role: currentUser?.role || "Staff"
      });
    } catch (err) {
      setStatusError(err.message || "Could not update alert status. Please try again.");
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const filteredAlerts = (Array.isArray(alerts) ? alerts : []).filter((alert) => {
    if (!alert) return false;
    const patientIdStr = String(alert.patientId || "").toLowerCase();
    const alertStatusStr = String(alert.status || "NEW").toUpperCase();
    const searchStr = (search || "").toLowerCase();

    const matchesSearch = patientIdStr.includes(searchStr);
    const matchesStatus =
      statusFilter === "All" || alertStatusStr === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const newCount = alerts.filter((a) => a && (a.status === "NEW" || a.status === "Active")).length;
  const reviewedCount = alerts.filter((a) => a && (a.status === "REVIEWED" || a.status === "Reviewed")).length;
  const acknowledgedCount = alerts.filter((a) => a && a.status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter((a) => a && a.status === "RESOLVED").length;

  const getStatusBadge = (status) => {
    const st = String(status || "NEW").toUpperCase();
    switch (st) {
      case "NEW":
      case "ACTIVE":
        return (
          <span className="status-pill danger">
            <span className="pulse-dot red"></span> NEW
          </span>
        );
      case "REVIEWED":
        return (
          <span className="status-pill warning">
            <Eye size={12} /> REVIEWED
          </span>
        );
      case "ACKNOWLEDGED":
        return (
          <span className="status-pill primary">
            <CheckCheck size={12} /> ACKNOWLEDGED
          </span>
        );
      case "RESOLVED":
        return (
          <span className="status-pill success">
            <CheckCircle2 size={12} /> RESOLVED
          </span>
        );
      default:
        return <span className="status-pill info">{st}</span>;
    }
  };

  return (
    <div className="page-content">
      {/* PAGE TITLE */}
      <div className="page-title-row">
        <div>
          <h2>Sepsis Early Warning Alerts & Escalation Workflow</h2>
          <p>
            {isNurse
              ? "ICU Nursing Protocol Bundle & Clinical Alert Lifecycle"
              : isDoctor
              ? "Attending Physician Risk Assessment & Resolution Portal"
              : "System-Wide Real-Time Sepsis Alert Monitoring"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isNurse && (
            <span
              className="badge badge-ai"
              style={{
                background: "var(--danger-light)",
                color: "var(--danger)",
                border: "1px solid var(--danger-border)"
              }}
            >
              <Stethoscope size={14} /> NURSE FIRST-RESPONDER
            </span>
          )}
          {isAdmin && (
            <span
              className="badge badge-ai"
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                color: "#a78bfa",
                border: "1px solid rgba(139, 92, 246, 0.3)"
              }}
            >
              <ShieldCheck size={14} /> ADMIN OVERWRITE & VIEW
            </span>
          )}
          <span className="badge badge-ai">
            <ShieldAlert size={14} /> AI MONITORING ACTIVE
          </span>
        </div>
      </div>

      {/* STAT CARDS */}
      <section className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-icon orange">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span>New Warnings</span>
            <strong>{newCount} New Alerts</strong>
            <small>Awaiting Initial Clinical Review</small>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple">
            <Eye size={24} />
          </div>
          <div className="stat-info">
            <span>In Assessment</span>
            <strong>{reviewedCount} Reviewed</strong>
            <small>Under Active Evaluation</small>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon blue">
            <CheckCheck size={24} />
          </div>
          <div className="stat-info">
            <span>Acknowledged</span>
            <strong>{acknowledgedCount} Confirmed</strong>
            <small>Care Plan Initiated</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span>Resolved Alerts</span>
            <strong>{resolvedCount} Resolved</strong>
            <small>History Audit Retained</small>
          </div>
        </div>
      </section>

      {/* NURSE 1-HOUR PROTOCOL BUNDLE */}
      {isNurse && (newCount > 0 || reviewedCount > 0) && (
        <div
          className="panel"
          style={{
            marginBottom: "24px",
            border: "1px solid var(--danger-border)",
            background: "var(--danger-light)"
          }}
        >
          <div className="panel-header" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={20} style={{ color: "var(--danger)" }} />
              <div>
                <h2 style={{ color: "var(--danger)" }}>
                  Surviving Sepsis Campaign: 1-Hour Emergency Bundle (Nurse Protocol)
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  Immediate nursing interventions required upon high sepsis risk notification
                </p>
              </div>
            </div>
            <span
              className="badge badge-ai"
              style={{ background: "var(--danger)", color: "#ffffff" }}
            >
              <Sparkles size={12} /> CRITICAL BUNDLE
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg-card)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <CheckSquare size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)" }}>
                1. Measure Serum Lactate Level immediately
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg-card)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <CheckSquare size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)" }}>
                2. Obtain Blood Cultures prior to broad-spectrum antibiotics
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg-card)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <CheckSquare size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)" }}>
                3. Administer prescribed Broad-Spectrum Antibiotics
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg-card)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <PhoneCall size={16} style={{ color: "var(--danger)" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--danger)" }}>
                4. Notify Attending Physician / Duty Doctor
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ALERTS TABLE CARD */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Sepsis Early Alert Directory</h3>
            <p>
              Lifecycle progression: <strong>NEW &rarr; REVIEWED &rarr; ACKNOWLEDGED &rarr; RESOLVED</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "var(--radius-md)" }}
            >
              <option value="All">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <button
              className="btn-secondary"
              onClick={loadAlerts}
              style={{ padding: "8px 12px", fontSize: "12px" }}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
            </button>

            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                placeholder="Filter by Patient ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {statusError && (
          <div className="alert-error" role="alert">
            <AlertTriangle size={16} />
            <span>{statusError}</span>
          </div>
        )}

        {filteredAlerts.length === 0 ? (
          <div className="empty-result">
            <div
              className="empty-icon-wrapper"
              style={{ background: "var(--success-light)", color: "var(--success)" }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3>No Alerts Found</h3>
            <p>No sepsis alerts match your current filter parameters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Risk Probability</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const probNum = Number(alert.probability || 0);
                  const probFormatted = (probNum * 100).toFixed(2);
                  const statusStr = String(alert.status || "NEW").toUpperCase();

                  return (
                    <tr key={alert.id}>
                      <td>
                        <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                          {alert.patientId || "ICU-Unknown"}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: "var(--danger)", fontSize: "14px" }}>
                          {probFormatted}%
                        </strong>
                      </td>
                      <td>
                        <span className="status-pill danger">
                          <AlertTriangle size={13} /> {alert.riskLevel || "High Risk"}
                        </span>
                      </td>
                      <td>{getStatusBadge(statusStr)}</td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {alert.dateTime || "N/A"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {/* Action Workflow Progression */}
                          {(statusStr === "NEW" || statusStr === "ACTIVE") && (
                            <button
                              className="btn-primary"
                              onClick={() => handleUpdateStatus(alert.id, "REVIEWED")}
                              disabled={updatingAlertId === alert.id}
                              style={{ padding: "6px 12px", fontSize: "11px", width: "auto" }}
                            >
                              <Eye size={12} /> {updatingAlertId === alert.id ? "Saving..." : "Mark Reviewed"}
                            </button>
                          )}

                          {statusStr === "REVIEWED" && (
                            <button
                              className="btn-primary"
                              onClick={() => handleUpdateStatus(alert.id, "ACKNOWLEDGED")}
                              disabled={updatingAlertId === alert.id}
                              style={{
                                padding: "6px 12px",
                                fontSize: "11px",
                                width: "auto",
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                              }}
                            >
                              <CheckCheck size={12} /> {updatingAlertId === alert.id ? "Saving..." : "Acknowledge Alert"}
                            </button>
                          )}

                          {statusStr === "ACKNOWLEDGED" && (
                            <button
                              className="btn-primary"
                              onClick={() => handleUpdateStatus(alert.id, "RESOLVED")}
                              disabled={updatingAlertId === alert.id}
                              style={{
                                padding: "6px 12px",
                                fontSize: "11px",
                                width: "auto",
                                background: "linear-gradient(135deg, #10b981 0%, #047857 100%)"
                              }}
                            >
                              <CheckCircle2 size={12} /> {updatingAlertId === alert.id ? "Saving..." : "Resolve Alert"}
                            </button>
                          )}

                          {statusStr === "RESOLVED" && (
                            <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>
                              ✓ Resolved Log Saved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="demo-note-box">
        <Info size={16} />
        <p>
          Sepsis alerts follow the standard ICU clinical workflow: NEW &rarr; REVIEWED &rarr; ACKNOWLEDGED &rarr; RESOLVED. Resolving an alert preserves historical records for auditing.
        </p>
      </div>
    </div>
  );
}

export default Alerts;