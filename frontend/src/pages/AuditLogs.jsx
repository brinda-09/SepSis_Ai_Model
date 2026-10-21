import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import { getAuditLogs } from "../utils/auditLogger";

function AuditLogs() {
  const [currentUser] = useState(() => {
    const saved = localStorage.getItem("sepsis_user");
    return saved ? JSON.parse(saved) : { role: "Administrator", name: "Marcus Thorne" };
  });

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");

  const loadLogs = () => {
    const auditData = getAuditLogs();
    setLogs(auditData);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter((log) => {
    if (!log) return false;
    const s = (search || "").toLowerCase();
    const lUser = String(log.user || "").toLowerCase();
    const lAction = String(log.action || "").toLowerCase();
    const lEntity = String(log.entity || "").toLowerCase();
    const lRole = String(log.role || "").toLowerCase();

    const matchesSearch = lUser.includes(s) || lAction.includes(s) || lEntity.includes(s);
    const matchesRole = roleFilter === "All" || lRole === (roleFilter || "").toLowerCase();
    const matchesAction = actionFilter === "All" || lAction.includes((actionFilter || "").toLowerCase());

    return matchesSearch && matchesRole && matchesAction;
  });

  const getActionBadgeClass = (action) => {
    const act = (action || "").toLowerCase();
    if (act.includes("login")) return "primary";
    if (act.includes("logout")) return "secondary";
    if (act.includes("alert generated")) return "danger";
    if (act.includes("resolved")) return "success";
    if (act.includes("acknowledged") || act.includes("reviewed")) return "warning";
    if (act.includes("created")) return "purple";
    return "primary";
  };

  return (
    <div className="page-content">
      {/* PAGE TITLE */}
      <div className="page-title-row">
        <div>
          <h2>System Security & Audit Activity Logs</h2>
          <p>Real-time audit trail recording operational actions, predictions, and access logs</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            className="badge badge-ai"
            style={{
              background: "rgba(139, 92, 246, 0.15)",
              color: "#a78bfa",
              border: "1px solid rgba(139, 92, 246, 0.3)"
            }}
          >
            <ShieldCheck size={14} /> AUDIT COMPLIANCE ACTIVE
          </span>

          <button
            className="btn-secondary"
            onClick={loadLogs}
            style={{ padding: "8px 14px", fontSize: "12px", gap: "6px" }}
          >
            <RefreshCw size={13} /> Refresh Audit Trail
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <section className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon purple">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span>Total Recorded Actions</span>
            <strong>{logs.length} Logged Events</strong>
            <small>Immutable Real Action Records</small>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon blue">
            <User size={24} />
          </div>
          <div className="stat-info">
            <span>Active Roles Recorded</span>
            <strong>3 Roles Audited</strong>
            <small>Admin, Doctor & Nurse</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span>System Integrity</span>
            <strong>100% Operational</strong>
            <small>LocalStorage Sync Active</small>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span>Latest Action</span>
            <strong>{logs[0] ? logs[0].action : "No Events Yet"}</strong>
            <small>{logs[0] ? logs[0].dateTime : "Awaiting user activity"}</small>
          </div>
        </div>
      </section>

      {/* AUDIT LOG TABLE CARD */}
      <div className="table-card">
        <div className="table-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3>Operational Action Logs</h3>
            <p>Chronological record of authentication, clinical predictions, alerts, and user modifications</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                placeholder="Search user, action, patient ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={14} style={{ color: "var(--text-muted)" }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "var(--radius-md)" }}
              >
                <option value="All">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "var(--radius-md)" }}
              >
                <option value="All">All Action Types</option>
                <option value="Login">User Login</option>
                <option value="Logout">User Logout</option>
                <option value="Created">User/Patient Created</option>
                <option value="Prediction">Prediction Generated</option>
                <option value="Alert">Alert Triggered / Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-result">
            <div className="empty-icon-wrapper" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
              <Activity size={32} />
            </div>
            <h3>No Audit Logs Found</h3>
            <p>
              {logs.length === 0
                ? "No operational actions have been recorded yet. Perform actions like login, predictions, or alert reviews to see audit logs here."
                : "No log events match your current search and role filters."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action Performed</th>
                  <th>Target / Entity</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <strong style={{ color: "var(--text-heading)" }}>{log.user}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          log.role === "Doctor"
                            ? "success"
                            : log.role === "Administrator"
                            ? "danger"
                            : "warning"
                        }`}
                      >
                        {log.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                        {log.entity || "System"}
                      </strong>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {log.dateTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="demo-note-box">
        <Info size={16} />
        <p>
          Audit logs record real-time actions executed across the Sepsis Early Alert System. This log cannot be modified or cleared by non-admin accounts.
        </p>
      </div>
    </div>
  );
}

export default AuditLogs;
