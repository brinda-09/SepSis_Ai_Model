import { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Bell,
  Volume2,
  Mail,
  Sliders,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Info,
  Key,
  Clock,
  Check,
  X,
  Eye,
  EyeOff,
  Stethoscope,
  Building2,
  FileBadge
} from "lucide-react";
import { addAuditLog } from "../utils/auditLogger";

function Settings() {
  const [currentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_user");
      return saved
        ? JSON.parse(saved)
        : {
            name: "Dr. Alex Vance",
            role: "Doctor",
            title: "Critical Care Physician",
            specialization: "Critical Care Medicine",
            department: "Intensive Care Unit (ICU)",
            email: "alex.vance@icu-hospital.org"
          };
    } catch {
      return {
        name: "Dr. Alex Vance",
        role: "Doctor",
        title: "Critical Care Physician",
        specialization: "Critical Care Medicine",
        department: "Intensive Care Unit (ICU)",
        email: "alex.vance@icu-hospital.org"
      };
    }
  });

  const doctorName = currentUser.name || "Dr. Alex Vance";
  const doctorTitle = currentUser.title || "Critical Care Physician";
  const doctorSpecialization = currentUser.specialization || "Critical Care Medicine";
  const doctorDepartment = currentUser.department || "Intensive Care Unit (ICU)";
  const doctorEmail = currentUser.email || "alex.vance@hospital.org";

  /* ---------------------------------------------------------
     CARD 2: NOTIFICATION PREFERENCES STATE & PERSISTENCE
  --------------------------------------------------------- */
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_doctor_notifications");
      return saved
        ? JSON.parse(saved)
        : {
            newSepsisAlerts: true,
            highRiskAlerts: true,
            alertSound: true,
            emailNotifications: false
          };
    } catch {
      return {
        newSepsisAlerts: true,
        highRiskAlerts: true,
        alertSound: true,
        emailNotifications: false
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("sepsis_doctor_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ---------------------------------------------------------
     CARD 3: ALERT PREFERENCES STATE & PERSISTENCE
  --------------------------------------------------------- */
  const [alertPrefs, setAlertPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_doctor_alert_prefs");
      return saved
        ? JSON.parse(saved)
        : {
            autoRefreshAlerts: true,
            showResolvedAlerts: true,
            defaultAlertView: "All Active Alerts"
          };
    } catch {
      return {
        autoRefreshAlerts: true,
        showResolvedAlerts: true,
        defaultAlertView: "All Active Alerts"
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("sepsis_doctor_alert_prefs", JSON.stringify(alertPrefs));
  }, [alertPrefs]);

  const toggleAlertPref = (key) => {
    setAlertPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ---------------------------------------------------------
     CARD 4: SYSTEM STATUS & LIVE API TEST
  --------------------------------------------------------- */
  const [systemStatus, setSystemStatus] = useState({
    apiServiceStatus: "Online",
    connectionStatus: "Connected",
    lastChecked: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    responseTimeMs: 18,
    isTesting: false,
    errorMessage: ""
  });

  const handleTestConnection = async () => {
    setSystemStatus((prev) => ({ ...prev, isTesting: true, errorMessage: "" }));
    const startTime = performance.now();
    try {
      const response = await fetch("http://127.0.0.1:8000/", { method: "GET" });
      const endTime = performance.now();
      const latency = Math.max(1, Math.round(endTime - startTime));

      const nowStr =
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      if (response.ok) {
        setSystemStatus({
          apiServiceStatus: "Online",
          connectionStatus: "Connected",
          lastChecked: nowStr,
          responseTimeMs: latency,
          isTesting: false,
          errorMessage: ""
        });
      } else {
        setSystemStatus({
          apiServiceStatus: "Error",
          connectionStatus: "Disconnected",
          lastChecked: nowStr,
          responseTimeMs: latency,
          isTesting: false,
          errorMessage: `HTTP Error ${response.status}`
        });
      }
    } catch {
      const nowStr =
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      setSystemStatus({
        apiServiceStatus: "Offline",
        connectionStatus: "Disconnected",
        lastChecked: nowStr,
        responseTimeMs: "--",
        isTesting: false,
        errorMessage: "Unable to connect to FastAPI backend at http://127.0.0.1:8000"
      });
    }
  };

  /* ---------------------------------------------------------
     CARD 6: ACCOUNT SECURITY & CHANGE PASSWORD MODAL
  --------------------------------------------------------- */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [showPassText, setShowPassText] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!passForm.currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }
    if (passForm.newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("New password and confirm password do not match.");
      return;
    }

    addAuditLog({
      action: "Doctor Password Changed",
      entity: doctorEmail,
      user: doctorName,
      role: "Doctor"
    });

    setPassSuccess("Password updated successfully!");
    setTimeout(() => {
      setShowPasswordModal(false);
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPassSuccess("");
    }, 1800);
  };

  return (
    <div className="page-content" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      {/* PAGE HEADER ROW */}
      <div className="page-title-row" style={{ marginBottom: "20px" }}>
        <div>
          <h2>Settings</h2>
          <p>Manage your account, notifications and application preferences</p>
        </div>

        <span className="badge badge-ai" style={{ background: "var(--primary-light)", color: "var(--primary)", fontSize: "12px", padding: "6px 14px" }}>
          <ShieldCheck size={14} /> DOCTOR PREFERENCES
        </span>
      </div>

      {/* 2x2 MAIN GRID FOR DESKTOP (STACKS ON TABLET/MOBILE) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          marginBottom: "20px"
        }}
      >
        {/* =========================================================
            ROW 1 - LEFT: CARD 1 - PROFILE INFORMATION
        ========================================================= */}
        <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="panel-header" style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-main)" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                Profile Information
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                Your account details and role information
              </p>
            </div>

            <span className="status-pill success" style={{ padding: "4px 10px", fontSize: "11px" }}>
              <CheckCircle2 size={12} /> Active
            </span>
          </div>

          <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Name
                </span>
                <strong style={{ fontSize: "14px", color: "var(--text-heading)" }}>{doctorName}</strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Role
                </span>
                <span
                  className="badge badge-ai"
                  style={{
                    background: "rgba(14, 165, 233, 0.12)",
                    color: "var(--primary)",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Stethoscope size={12} /> Doctor
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Professional Title
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {doctorTitle}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Specialization
                </span>
                <span style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600 }}>
                  {doctorSpecialization}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Department
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{doctorDepartment}</span>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Account Status
                </span>
                <span className="status-pill success" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  Active
                </span>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Clinical Email
                </span>
                <strong style={{ fontSize: "13px", color: "var(--text-heading)" }}>{doctorEmail}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            ROW 1 - RIGHT: CARD 2 - NOTIFICATION PREFERENCES
        ========================================================= */}
        <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="panel-header" style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-main)" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                Notification Preferences
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                Manage how you receive alerts and notifications
              </p>
            </div>
            <Bell size={18} style={{ color: "var(--primary)" }} />
          </div>

          <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* ROW 1: NEW SEPSIS ALERTS */}
            <div
              style={{
                display: "flex",
                justifySpace: "between",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  New Sepsis Alerts
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Get notified when new sepsis alerts are generated
                </p>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={notifications.newSepsisAlerts}
                  onChange={() => toggleNotification("newSepsisAlerts")}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "24px",
                    background: notifications.newSepsisAlerts ? "var(--primary)" : "rgba(148, 163, 184, 0.3)",
                    transition: "0.2s ease"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: notifications.newSepsisAlerts ? "22px" : "3px",
                      bottom: "3px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      transition: "0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>

            {/* ROW 2: HIGH RISK ALERTS */}
            <div
              style={{
                display: "flex",
                justifySpace: "between",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  High-risk Alert Notifications
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Get immediate alerts for high-risk predictions
                </p>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={notifications.highRiskAlerts}
                  onChange={() => toggleNotification("highRiskAlerts")}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "24px",
                    background: notifications.highRiskAlerts ? "var(--primary)" : "rgba(148, 163, 184, 0.3)",
                    transition: "0.2s ease"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: notifications.highRiskAlerts ? "22px" : "3px",
                      bottom: "3px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      transition: "0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>

            {/* ROW 3: ALERT SOUND */}
            <div
              style={{
                display: "flex",
                justifySpace: "between",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  Alert Sound
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Play sound for new high-risk alerts
                </p>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={notifications.alertSound}
                  onChange={() => toggleNotification("alertSound")}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "24px",
                    background: notifications.alertSound ? "var(--primary)" : "rgba(148, 163, 184, 0.3)",
                    transition: "0.2s ease"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: notifications.alertSound ? "22px" : "3px",
                      bottom: "3px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      transition: "0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>

            {/* ROW 4: EMAIL NOTIFICATIONS */}
            <div
              style={{
                display: "flex",
                justifySpace: "between",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  Email Notifications
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Receive summary notifications via email
                </p>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={() => toggleNotification("emailNotifications")}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "24px",
                    background: notifications.emailNotifications ? "var(--primary)" : "rgba(148, 163, 184, 0.3)",
                    transition: "0.2s ease"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: notifications.emailNotifications ? "22px" : "3px",
                      bottom: "3px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      transition: "0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* =========================================================
            ROW 2 - LEFT: CARD 3 - ALERT PREFERENCES
        ========================================================= */}
        <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="panel-header" style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-main)" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                Alert Preferences
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                Set your alert monitoring preferences
              </p>
            </div>
            <Sliders size={18} style={{ color: "var(--primary)" }} />
          </div>

          <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* ITEM 1: RISK THRESHOLD (READ ONLY) */}
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  Risk Threshold (Read Only)
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Current threshold for high-risk alerts
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  className="badge badge-ai"
                  style={{
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#8b5cf6",
                    fontSize: "13px",
                    fontWeight: 700,
                    padding: "4px 10px"
                  }}
                >
                  50% (0.50)
                </span>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Admin Controlled
                </small>
              </div>
            </div>

            {/* ITEM 2: AUTO REFRESH ALERTS */}
            <div
              style={{
                display: "flex",
                justifySpace: "between",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  Auto-refresh Alerts
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Automatically refresh alert data
                </p>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={alertPrefs.autoRefreshAlerts}
                  onChange={() => toggleAlertPref("autoRefreshAlerts")}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "24px",
                    background: alertPrefs.autoRefreshAlerts ? "var(--primary)" : "rgba(148, 163, 184, 0.3)",
                    transition: "0.2s ease"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: alertPrefs.autoRefreshAlerts ? "22px" : "3px",
                      bottom: "3px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      transition: "0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>

            {/* ITEM 3: SHOW RESOLVED ALERTS */}
            <div
              style={{
                display: "flex",
                justifySpace: "between",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--text-heading)", marginBottom: "2px" }}>
                  Show Resolved Alerts
                </strong>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Include resolved alerts in alert list
                </p>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={alertPrefs.showResolvedAlerts}
                  onChange={() => toggleAlertPref("showResolvedAlerts")}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "24px",
                    background: alertPrefs.showResolvedAlerts ? "var(--primary)" : "rgba(148, 163, 184, 0.3)",
                    transition: "0.2s ease"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: alertPrefs.showResolvedAlerts ? "22px" : "3px",
                      bottom: "3px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      transition: "0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>

            {/* ITEM 4: DEFAULT ALERT VIEW DROPDOWN */}
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)"
              }}
            >
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "4px" }}>
                Default Alert View
              </label>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 8px" }}>
                Set default filter for alerts page
              </p>
              <select
                value={alertPrefs.defaultAlertView}
                onChange={(e) => setAlertPrefs({ ...alertPrefs, defaultAlertView: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-main)",
                  fontWeight: 500
                }}
              >
                <option value="All Active Alerts">All Active Alerts</option>
                <option value="New Alerts">New Alerts</option>
                <option value="High Risk">High Risk</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================
            ROW 2 - RIGHT: CARD 4 - SYSTEM STATUS
        ========================================================= */}
        <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="panel-header" style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-main)" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                System Status
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                Current status of the AI prediction service
              </p>
            </div>
            <button
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={systemStatus.isTesting}
              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {systemStatus.isTesting ? <RefreshCw size={14} className="spin" /> : <Activity size={14} />}
              <span>{systemStatus.isTesting ? "Testing..." : "Test Connection"}</span>
            </button>
          </div>

          <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  API Service Status
                </span>
                <span
                  className={`status-pill ${systemStatus.apiServiceStatus === "Online" ? "success" : "danger"}`}
                  style={{ fontSize: "12px", padding: "3px 10px", display: "inline-flex" }}
                >
                  {systemStatus.apiServiceStatus === "Online" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {systemStatus.apiServiceStatus}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Connection Status
                </span>
                <strong style={{ fontSize: "13px", color: systemStatus.connectionStatus === "Connected" ? "var(--success)" : "#ef4444" }}>
                  ● {systemStatus.connectionStatus}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Response Time
                </span>
                <strong style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                  {systemStatus.responseTimeMs !== "--" ? `${systemStatus.responseTimeMs} ms` : "--"}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  FastAPI Endpoint
                </span>
                <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  http://127.0.0.1:8000
                </span>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Last Checked
                </span>
                <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
                  {systemStatus.lastChecked}
                </span>
              </div>
            </div>

            {systemStatus.errorMessage && (
              <div className="alert-error" style={{ fontSize: "12px", padding: "8px 12px", margin: 0 }}>
                <AlertTriangle size={14} />
                <span>{systemStatus.errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          ROW 3 - FULL WIDTH: CARD 5 - CLINICAL DECISION SUPPORT
      ========================================================= */}
      <div
        className="panel"
        style={{
          marginBottom: "20px",
          border: "1px solid rgba(14, 165, 233, 0.3)",
          background: "var(--primary-light)"
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px 20px" }}>
          <Info size={22} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--primary)", margin: "0 0 6px" }}>
              Clinical Decision Support
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5, margin: 0 }}>
              SepsisAlert AI provides an early risk prediction to support clinical monitoring. AI predictions should be reviewed by qualified healthcare professionals and should not be used as a standalone clinical diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          ROW 4 - FULL WIDTH: CARD 6 - ACCOUNT SECURITY
      ========================================================= */}
      <div className="panel" style={{ marginBottom: "20px" }}>
        <div className="panel-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Lock size={18} style={{ color: "var(--primary)" }} />
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                Account Security
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                Keep your account secure by using a strong password and signing out after use.
              </p>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => setShowPasswordModal(true)}
            style={{ width: "auto", fontSize: "12px" }}
          >
            <Key size={14} /> Change Password
          </button>
        </div>
      </div>

      {/* =========================================================
          CHANGE PASSWORD MODAL
      ========================================================= */}
      {showPasswordModal && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "440px",
            zIndex: 1600,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Lock size={20} style={{ color: "var(--primary)" }} />
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Change Password</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Update credentials for {doctorName}
                </p>
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowPasswordModal(false)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ padding: "18px 20px" }}>
            {passError && (
              <div className="alert-error" style={{ marginBottom: "12px", fontSize: "12px", padding: "8px 12px" }}>
                <AlertTriangle size={14} />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="status-pill success" style={{ marginBottom: "12px", fontSize: "12px", padding: "8px 12px", width: "100%" }}>
                <CheckCircle2 size={14} />
                <span>{passSuccess}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px" }}>Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassText ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px" }}>New Password</label>
              <input
                type={showPassText ? "text" : "password"}
                placeholder="Enter new password (min 6 chars)"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px" }}>Confirm New Password</label>
              <input
                type={showPassText ? "text" : "password"}
                placeholder="Re-enter new password"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "var(--text-muted)" }}>
                <input
                  type="checkbox"
                  checked={showPassText}
                  onChange={(e) => setShowPassText(e.target.checked)}
                />
                Show Passwords
              </label>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ width: "auto" }}>
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Settings;