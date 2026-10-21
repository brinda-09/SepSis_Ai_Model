import { useEffect, useState } from "react";
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Brain,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Lock,
  Clock,
  User,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Info,
  Calendar,
  Filter
} from "lucide-react";
import { apiGetHistory, apiClearHistory } from "../api";
import { getAccessHistory } from "../utils/sessionLogger";

function History() {
  const [currentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_user");
      return saved ? JSON.parse(saved) : { role: "Nurse", name: "ICU Nurse" };
    } catch {
      return { role: "Nurse", name: "ICU Nurse" };
    }
  });

  const [activeTab, setActiveTab] = useState("PREDICTIONS"); // "PREDICTIONS" or "ACCESS_SESSIONS"
  const [history, setHistory] = useState([]);
  const [accessHistory, setAccessHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const isNurse = currentUser?.role === "Nurse";
  const isAdmin = currentUser?.role === "Administrator" || currentUser?.role === "Admin";

  const loadAllHistory = async () => {
    setLoading(true);

    // 1. Load AI Prediction History
    try {
      const data = await apiGetHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      const saved = localStorage.getItem("sepsis_prediction_history");
      setHistory(saved ? JSON.parse(saved) : []);
    }

    // 2. Load Access & Session History
    const accessLogs = getAccessHistory();
    setAccessHistory(accessLogs);

    setLoading(false);
  };

  useEffect(() => {
    loadAllHistory();
  }, []);

  const clearPredictionHistory = async () => {
    if (isNurse) {
      alert("Permission Notice: Clearing AI prediction logs requires Attending Physician or Administrator authorization.");
      return;
    }

    if (window.confirm("Are you sure you want to purge all historical AI prediction logs?")) {
      await apiClearHistory();
      await loadAllHistory();
    }
  };

  const filteredHistory = (Array.isArray(history) ? history : []).filter((item) => {
    if (!item) return false;
    const pId = String(item.patientId || "").toLowerCase();
    const s = (search || "").toLowerCase();
    return pId.includes(s);
  });

  const filteredAccessHistory = (Array.isArray(accessHistory) ? accessHistory : []).filter((rec) => {
    if (!rec) return false;
    const s = (search || "").toLowerCase();
    const nameStr = String(rec.name || "").toLowerCase();
    const idStr = String(rec.personId || "").toLowerCase();
    const statusStr = String(rec.accessStatus || "").toLowerCase();
    const roleStr = String(rec.role || "").toLowerCase();

    const matchesSearch = nameStr.includes(s) || idStr.includes(s) || statusStr.includes(s);
    const matchesRole = roleFilter === "All" || roleStr === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const highRiskCount = history.filter((h) => Number(h.prediction) === 1).length;
  const activeNurseSessionsCount = accessHistory.filter((a) => a.role === "Nurse" && a.sessionStatus === "ACTIVE").length;
  const outsideShiftCount = accessHistory.filter((a) => String(a.accessStatus).includes("Outside Shift")).length;

  return (
    <div className="page-content">
      {/* PAGE TITLE */}
      <div className="page-title-row">
        <div>
          <h2>System Logs & Access History Audit</h2>
          <p>
            Separate records for <strong>AI Prediction Inference History</strong> and <strong>Staff Access & Shift Session History</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isAdmin && (
            <span className="badge badge-ai" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
              <ShieldCheck size={14} /> SYSTEM AUDIT COMPLIANT
            </span>
          )}
          <span className="badge badge-ai">
            <Brain size={14} /> REAL-TIME AUDITED
          </span>
        </div>
      </div>

      {/* STAT CARDS */}
      <section className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <HistoryIcon size={24} />
          </div>
          <div className="stat-info">
            <span>Prediction History</span>
            <strong>{history.length} Saved Logs</strong>
            <small>Evaluated Sequence Runs</small>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange">
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <span>High Risk Positives</span>
            <strong>{highRiskCount} Predictions</strong>
            <small>Sepsis Onset Detected</small>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple">
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <span>Nurse Shift Sessions</span>
            <strong>{activeNurseSessionsCount} Active Sessions</strong>
            <small>Hospital ID Staff Verified</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span>Outside Shift Accesses</span>
            <strong>{outsideShiftCount} Confirmed</strong>
            <small>Audited Override Logs</small>
          </div>
        </div>
      </section>

      {/* SECTION NAVIGATION TABS */}
      <div className="auth-tab-switch" style={{ maxWidth: "480px", marginBottom: "20px" }}>
        <button
          className={`tab-btn ${activeTab === "PREDICTIONS" ? "active" : ""}`}
          onClick={() => { setActiveTab("PREDICTIONS"); setSearch(""); }}
        >
          <Brain size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          1. AI Prediction History
        </button>

        <button
          className={`tab-btn ${activeTab === "ACCESS_SESSIONS" ? "active" : ""}`}
          onClick={() => { setActiveTab("ACCESS_SESSIONS"); setSearch(""); }}
        >
          <Clock size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          2. Access & Session History
        </button>
      </div>

      {/* TAB 1: AI PREDICTION HISTORY */}
      {activeTab === "PREDICTIONS" && (
        <div className="table-card">
          <div className="table-header">
            <div>
              <h3>Sepsis Risk Prediction Audit Log</h3>
              <p>Historical audit trail of all risk predictions generated by the early warning model</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {!isNurse && (
                <button className="btn-icon-danger" onClick={clearPredictionHistory} style={{ padding: "8px 12px", fontSize: "12px" }}>
                  <Trash2 size={13} style={{ marginRight: "4px" }} /> Purge History
                </button>
              )}

              <button className="btn-secondary" onClick={loadAllHistory} style={{ padding: "8px 12px", fontSize: "12px" }}>
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

          {filteredHistory.length === 0 ? (
            <div className="empty-result">
              <div className="empty-icon-wrapper">
                <HistoryIcon size={32} />
              </div>
              <h3>No Prediction History Found</h3>
              <p>Execute risk predictions on the Dashboard to generate historical logs.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Patient ID</th>
                    <th>Date & Time</th>
                    <th>Risk Probability</th>
                    <th>Class Prediction</th>
                    <th>Assessing Model</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>
                        <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "12px" }}>
                          #{item.id || idx + 1}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                          {item.patientId || "ICU-Unknown"}
                        </strong>
                      </td>
                      <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                        {item.dateTime || "N/A"}
                      </td>
                      <td>
                        <strong
                          style={{
                            color: Number(item.prediction) === 1 ? "var(--danger)" : "var(--success)",
                            fontSize: "14px"
                          }}
                        >
                          {(Number(item.probability || 0) * 100).toFixed(2)}%
                        </strong>
                      </td>
                      <td>
                        <span className={`status-pill ${Number(item.prediction) === 1 ? "danger" : "success"}`}>
                          {Number(item.prediction) === 1 ? "High Risk (1)" : "Normal (0)"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-ai" style={{ fontSize: "11px" }}>
                          Predictive Model
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACCESS & SESSION HISTORY (DOCTOR LOGINS & NURSE STAFF ENTRIES) */}
      {activeTab === "ACCESS_SESSIONS" && (
        <div className="table-card">
          <div className="table-header" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3>Staff Access & Shift Session History</h3>
              <p>Audit trail recording Doctor account logins/logouts and Nurse Hospital ID staff entries/exits</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <Filter size={14} style={{ color: "var(--text-muted)" }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "var(--radius-md)" }}
              >
                <option value="All">All Roles</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Administrator">Administrator</option>
              </select>

              <button className="btn-secondary" onClick={loadAllHistory} style={{ padding: "8px 12px", fontSize: "12px" }}>
                <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
              </button>

              <div className="search-input-wrapper">
                <Search size={16} />
                <input
                  placeholder="Search name, Staff ID, status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredAccessHistory.length === 0 ? (
            <div className="empty-result">
              <div className="empty-icon-wrapper" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                <Clock size={32} />
              </div>
              <h3>No Access Sessions Found</h3>
              <p>Doctor account logins and Nurse Hospital ID entries will be recorded here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>ID / Role</th>
                    <th>Entry / Login Time</th>
                    <th>Exit / Logout Time</th>
                    <th>Assigned Shift</th>
                    <th>Access Status</th>
                    <th>Session Duration</th>
                    <th>Session Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccessHistory.map((rec) => {
                    const isOutside = String(rec.accessStatus || "").includes("Outside Shift");
                    const isActiveSess = rec.sessionStatus === "ACTIVE";

                    return (
                      <tr key={rec.id}>
                        <td>
                          <strong style={{ color: "var(--text-heading)" }}>{rec.name}</strong>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontSize: "12px" }}>
                              {rec.personId}
                            </strong>
                            <span className={`status-pill ${rec.role === "Doctor" ? "success" : rec.role === "Administrator" ? "danger" : "warning"}`} style={{ fontSize: "10px", padding: "2px 6px", width: "fit-content" }}>
                              {rec.role}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                          {rec.entryTime}
                        </td>
                        <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                          {isActiveSess ? (
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>Active Session</span>
                          ) : (
                            rec.exitTime || "Exit Time Not Recorded"
                          )}
                        </td>
                        <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                          {rec.shift || "N/A"}
                        </td>
                        <td>
                          <span className={`status-pill ${isOutside ? "warning" : "success"}`}>
                            {isOutside ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                            {rec.accessStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-heading)" }}>
                          {rec.sessionDuration || "Active"}
                        </td>
                        <td>
                          <span className={`status-pill ${isActiveSess ? "danger" : "info"}`}>
                            {isActiveSess ? <span className="pulse-dot red"></span> : <CheckCircle2 size={12} />}
                            {rec.sessionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="demo-note-box">
        <Info size={16} />
        <p>
          AI prediction logs and Staff access session records are maintained separately for clinical auditing compliance.
        </p>
      </div>
    </div>
  );
}

export default History;