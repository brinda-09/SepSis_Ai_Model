import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  useLocation,
  Navigate,
  useNavigate
} from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  BellRing,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Server,
  Clock,
  Brain,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  HeartPulse,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  FileText,
  BarChart3,
  UserPlus,
  Database
} from "lucide-react";

import "./App.css";

import Patients from "./pages/Patients";
import Alerts from "./pages/Alerts";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AuditLogs from "./pages/AuditLogs";
import ModelComparison from "./pages/ModelComparison";
import ExplainableAI from "./components/ExplainableAI";
import SequenceGraph from "./components/SequenceGraph";

import { addAuditLog } from "./utils/auditLogger";
import { apiGetDatasetInfo, apiGetDatasetSamples } from "./api";

/* =========================================================
   ROUTE PROTECTION COMPONENT
========================================================= */
function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role === "Admin" ? "Administrator" : user.role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect unauthorized attempt to role default dashboard
    if (userRole === "Administrator") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

/* =========================================================
   COMMON LAYOUT
========================================================= */
function Layout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("sepsis_theme") === "dark";
  });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("sepsis_theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("sepsis_theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleSignOut = () => {
    addAuditLog({
      action: "User Logout",
      user: user.name,
      role: user.role
    });
    onLogout();
    navigate("/login");
  };

  const getPageInfo = () => {
    if (location.pathname === "/patients") {
      return {
        title: "ICU Patient Registry",
        subtitle: "Monitor, register, and manage patient records in intensive care",
        breadcrumb: "Clinical Management / Patients",
      };
    }
    if (location.pathname === "/alerts") {
      return {
        title: "Clinical Sepsis Alerts",
        subtitle: "Real-time AI alerts requiring immediate clinical assessment",
        breadcrumb: "Risk Intelligence / Alerts",
      };
    }
    if (location.pathname === "/history") {
      return {
        title: "Prediction Logs & History",
        subtitle: "Historical audit trail of all AI sepsis risk predictions",
        breadcrumb: "AI Auditing / Prediction History",
      };
    }
    if (location.pathname === "/settings") {
      return {
        title: "System & Model Settings",
        subtitle: "Predictive model and API service status & parameters",
        breadcrumb: "System Configuration / Settings",
      };
    }
    if (location.pathname === "/admin") {
      return {
        title: "System Administration Dashboard",
        subtitle: "Real-time ICU system metrics, model health, patient alerts, and infrastructure diagnostics",
        breadcrumb: "System Management / Admin Dashboard",
      };
    }
    if (location.pathname === "/admin/users") {
      return {
        title: "User Access & Staff Management",
        subtitle: "Manage physician credentials, doctor account verification, and nurse hospital staff registry",
        breadcrumb: "System Management / User Management",
      };
    }
    if (location.pathname === "/admin/audit-logs") {
      return {
        title: "System Security & Audit Activity Logs",
        subtitle: "Real-time audit log recording operational actions, login sessions, and predictions",
        breadcrumb: "System Management / Audit Logs",
      };
    }
    if (location.pathname === "/model-comparison") {
      return {
        title: "Model Benchmark Comparison",
        subtitle: "Methodological benchmark evaluation comparing tabular baseline against time-series model",
        breadcrumb: "Evaluation / Model Comparison",
      };
    }
    return {
      title: "Sepsis Early Alert Dashboard",
      subtitle: "AI-assisted early risk prediction and temporal clinical monitoring for ICU patients",
      breadcrumb: "Clinical Intelligence / Dashboard",
    };
  };

  const pageInfo = getPageInfo();

  const getInitials = (name) => {
    if (!name) return "DR";
    const parts = name.replace("Dr.", "").trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const roleNormalized = user?.role === "Admin" ? "Administrator" : user?.role || "Doctor";
  const isAdmin = roleNormalized === "Administrator";
  const isNurse = roleNormalized === "Nurse";
  const isDoctor = roleNormalized === "Doctor";

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <HeartPulse size={24} />
          </div>
          <div className="logo-text">
            <h2>SepsisAlert AI</h2>
            <span>ICU Clinical Intelligence</span>
          </div>
        </div>

        <nav className="nav-menu">
          {/* DOCTOR / NURSE DASHBOARD */}
          {(!isAdmin) && (
            <NavLink
              to="/"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><LayoutDashboard size={18} /></span>
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* ADMIN DASHBOARD */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><LayoutDashboard size={18} /></span>
              <span>Admin Dashboard</span>
            </NavLink>
          )}

          {/* ADMIN USER MANAGEMENT */}
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><Users size={18} /></span>
              <span>User Management</span>
            </NavLink>
          )}

          {/* PATIENTS / PATIENT RECORDS */}
          <NavLink
            to="/patients"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon"><Users size={18} /></span>
            <span>{isAdmin ? "Patient Records" : "Patients"}</span>
          </NavLink>

          {/* SEPSIS ALERTS */}
          <NavLink
            to="/alerts"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon"><BellRing size={18} /></span>
            <span>Sepsis Alerts</span>
          </NavLink>

          {/* PREDICTION HISTORY */}
          {(!isAdmin) && (
            <NavLink
              to="/history"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><HistoryIcon size={18} /></span>
              <span>Prediction History</span>
            </NavLink>
          )}

          {/* ADMIN AUDIT LOGS */}
          {isAdmin && (
            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><FileText size={18} /></span>
              <span>Audit Logs</span>
            </NavLink>
          )}

          {/* MODEL COMPARISON */}
          {isAdmin && (
            <NavLink
              to="/model-comparison"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><BarChart3 size={18} /></span>
              <span>Model Comparison</span>
            </NavLink>
          )}

          {/* SETTINGS (DOCTOR & ADMIN ONLY) */}
          {(isDoctor || isAdmin) && (
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><SettingsIcon size={18} /></span>
              <span>Settings</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status-card">
            <div className="pulse-indicator">
              <span className="ring"></span>
              <span className="dot"></span>
            </div>
            <div className="system-status-info">
              <strong>Role: {roleNormalized}</strong>
              <small>{user?.department || "ICU Department"}</small>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="main">
        <header className="topbar">
          <div className="topbar-header">
            <p className="breadcrumb">
              <Activity size={13} /> {pageInfo.breadcrumb}
            </p>
            <h1>{pageInfo.title}</h1>
            <p className="subtitle">{pageInfo.subtitle}</p>
          </div>

          <div className="header-right">
            <div className="live-clock-badge">
              <Clock size={15} />
              <span>{currentTime}</span>
            </div>

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="profile-chip">
              <div className="profile-avatar">
                {getInitials(user?.name)}
              </div>
              <div className="profile-details">
                <strong>{user?.name || "Dr. Alex Vance"}</strong>
                <small>{user?.title || roleNormalized}</small>
              </div>
            </div>

            <button
              className="btn-logout"
              onClick={handleSignOut}
              title="Sign out of system"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </header>

        {/* Render active route page */}
        <Outlet />
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD PAGE
========================================================= */
function Dashboard() {
  const [currentUser] = useState(() => {
    const saved = localStorage.getItem("sepsis_user");
    return saved ? JSON.parse(saved) : { role: "Doctor", name: "Dr. Alex Vance" };
  });

  const [patientId, setPatientId] = useState("");
  const [sequence, setSequence] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // PhysioNet Dataset Integration State
  const [sampleIndex, setSampleIndex] = useState(0);
  const [currentDatasetMeta, setCurrentDatasetMeta] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [fetchingSample, setFetchingSample] = useState(false);

  const roleNorm = currentUser?.role === "Admin" ? "Administrator" : currentUser?.role || "Doctor";
  const isNurse = roleNorm === "Nurse";
  const isAdmin = roleNorm === "Administrator";
  const isDoctor = roleNorm === "Doctor";

  const loadDatasetPatientSample = async (idx = null, risk = null) => {
    setFetchingSample(true);
    setError("");
    try {
      const res = await apiGetDatasetSamples(idx, risk);
      if (res && res.sequence && res.sequence.length > 0) {
        setPatientId(res.patientId);
        setSequence(JSON.stringify(res.sequence, null, 2));
        setSampleIndex(res.sampleIndex);
        setCurrentDatasetMeta({
          patientId: res.patientId,
          target: res.target,
          targetLabel: res.targetLabel,
          sampleIndex: res.sampleIndex,
          totalSamples: res.totalSamples,
          positivesCount: res.positivesCount,
          negativesCount: res.negativesCount
        });
      } else {
        setError("Could not load sequence from PhysioNet dataset backend API.");
      }
    } catch (err) {
      setError("Failed to fetch PhysioNet dataset sample: " + err.message);
    } finally {
      setFetchingSample(false);
    }
  };

  // Load dataset metadata and the initial sample after the loader is initialized.
  useEffect(() => {
    apiGetDatasetInfo().then((info) => {
      if (info) setDatasetInfo(info);
    });
    loadDatasetPatientSample(0);
  }, []);

  const handleNextPatient = () => {
    const total = currentDatasetMeta?.totalSamples || 31098;
    const nextIdx = (sampleIndex + 1) % total;
    loadDatasetPatientSample(nextIdx);
  };

  const handleLoadHighRisk = () => {
    loadDatasetPatientSample(null, "high");
  };

  const handleLoadLowRisk = () => {
    loadDatasetPatientSample(null, "low");
  };

  const handlePredict = async () => {
    setError("");
    setResult(null);

    if (!patientId.trim()) {
      setError("Please enter or load a valid Patient ID.");
      return;
    }

    let parsedSequence;
    try {
      parsedSequence = JSON.parse(sequence);
    } catch {
      setError("Invalid JSON format. Please load a patient sequence from the PhysioNet dataset.");
      return;
    }

    if (
      !Array.isArray(parsedSequence) ||
      parsedSequence.length !== 6 ||
      !parsedSequence.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 39 &&
          row.every((value) => typeof value === "number" && Number.isFinite(value))
      )
    ) {
      setError("Sequence matrix must contain exactly 6 timesteps and 39 clinical features (6×39 input shape).");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: parsedSequence, patientId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Prediction API request failed (${response.status}).`);
      }

      const data = await response.json();
      setResult({ ...data, patientId, groundTruth: currentDatasetMeta?.targetLabel });

      // Record Audit Log
      addAuditLog({
        action: "Prediction Generated",
        entity: patientId,
        user: currentUser.name,
        role: roleNorm
      });

      // Save History locally for instant UI sync
      const historyRecord = {
        id: Date.now(),
        patientId,
        probability: data.probability,
        prediction: data.prediction,
        message: data.message,
        dateTime: data.dateTime || new Date().toLocaleString(),
      };

      const existingHistory = JSON.parse(localStorage.getItem("sepsis_prediction_history")) || [];
      localStorage.setItem("sepsis_prediction_history", JSON.stringify([historyRecord, ...existingHistory]));

      // Save Alert if Sepsis Detected (prediction === 1)
      if (Number(data.prediction) === 1) {
        const alertRecord = {
          id: Date.now() + 1,
          patientId,
          probability: data.probability,
          prediction: data.prediction,
          riskLevel: "High Risk",
          status: "NEW",
          dateTime: data.dateTime || new Date().toLocaleString(),
          message: data.message || "High sepsis risk predicted by LSTM temporal sequence analysis.",
        };
        const existingAlerts = JSON.parse(localStorage.getItem("sepsis_alerts")) || [];
        localStorage.setItem("sepsis_alerts", JSON.stringify([alertRecord, ...existingAlerts]));

        addAuditLog({
          action: "Sepsis Alert Generated",
          entity: patientId,
          user: currentUser.name,
          role: roleNorm
        });
      }
    } catch (err) {
      setError(err.message || "Prediction failed. Check the backend connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatientId("");
    setSequence("");
    setResult(null);
    setError("");
  };

  return (
    <>
      {/* ROLE SPECIFIC WORKFLOW BANNERS */}
      {isNurse && (
        <div className="panel" style={{ marginBottom: "20px", border: "1px solid var(--success-border)", background: "var(--success-light)" }}>
          <div className="panel-header" style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Stethoscope size={24} style={{ color: "var(--success)" }} />
              <div>
                <h2 style={{ color: "var(--success)" }}>ICU Nursing Shift Duty Station & Vitals Check</h2>
                <p style={{ color: "var(--text-secondary)" }}>Logged in as {currentUser.name} ({currentUser.title || "ICU Nurse"}) &mdash; Shift Duty Operational</p>
              </div>
            </div>
            <span className="badge badge-ai" style={{ background: "var(--success)", color: "#ffffff" }}>
              <CheckCircle2 size={12} /> SHIFT ACTIVE
            </span>
          </div>
        </div>
      )}

      {isDoctor && (
        <div className="panel" style={{ marginBottom: "20px", border: "1px solid rgba(14, 165, 233, 0.3)", background: "var(--primary-light)" }}>
          <div className="panel-header" style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Brain size={24} style={{ color: "var(--primary)" }} />
              <div>
                <h2 style={{ color: "var(--primary)" }}>Attending Physician Clinical Decision Workspace</h2>
                <p style={{ color: "var(--text-secondary)" }}>Logged in as {currentUser.name} ({currentUser.title || "Lead Clinician"}) &mdash; Sepsis Early Onset Risk Inference</p>
              </div>
            </div>
            <span className="badge badge-ai">
              <Sparkles size={12} /> DECISION SUPPORT READY
            </span>
          </div>
        </div>
      )}

      {/* KEY METRICS & STATS */}
      <section className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <Brain size={24} />
          </div>
          <div className="stat-info">
            <span>Model Architecture</span>
            <strong>Predictive Model</strong>
            <small>Deep Temporal Classifier</small>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span>Time Window</span>
            <strong>6 Time Steps</strong>
            <small>Sequential Input Matrix</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <Sliders size={24} />
          </div>
          <div className="stat-info">
            <span>Features Vector</span>
            <strong>39 Variables</strong>
            <small>Clinical Demographics & Vitals</small>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange">
            <Server size={24} />
          </div>
          <div className="stat-info">
            <span>API Server</span>
            <strong>FastAPI Ready</strong>
            <small>Endpoint: /predict</small>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID: INPUT FORM & RESULT GAUGE */}
      <section className="dashboard-grid">
        {/* INPUT FORM PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>New Sepsis Risk Evaluation</h2>
              <p>Actual PhysioNet Sepsis Dataset &mdash; 6 Timesteps × 39 Features</p>
            </div>
            <span className="badge badge-ai">
              <Database size={12} /> PHYSIONET DATASET
            </span>
          </div>

          {/* ACADEMIC PROTOTYPE SAFETY DISCLAIMER NOTICE */}
          <div className="alert-error" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "var(--warning)", marginBottom: "16px" }}>
            <Info size={16} />
            <span style={{ fontSize: "12px", lineHeight: "1.4" }}>
              <strong>Academic Prototype Notice:</strong> Model predictions are AI-generated risk estimates for evaluation and research testing. This is not a real clinical diagnostic tool.
            </span>
          </div>

          <div className="form-group">
            <label>Patient Identification Number (PhysioNet Dataset)</label>
            <input
              type="text"
              placeholder="e.g. PhysioNet-p000242"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
          </div>

          <div className="form-group">
            {/* REAL DATASET PATIENT LOADERS */}
            <div className="presets-container" style={{ flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                className="preset-btn"
                style={{ background: "var(--primary-light)", color: "var(--primary)", borderColor: "var(--primary)" }}
                onClick={() => loadDatasetPatientSample(sampleIndex)}
                disabled={fetchingSample}
              >
                <Database size={13} /> {fetchingSample ? "Loading..." : "Load Dataset Patient"}
              </button>

              <button
                type="button"
                className="preset-btn"
                onClick={handleNextPatient}
                disabled={fetchingSample}
              >
                <ArrowRight size={13} /> Next Patient (#{sampleIndex + 1})
              </button>

              <button
                type="button"
                className="preset-btn danger-preset"
                onClick={handleLoadHighRisk}
                disabled={fetchingSample}
              >
                <AlertTriangle size={13} /> Load High Risk (Sepsis=1)
              </button>

              <button
                type="button"
                className="preset-btn"
                onClick={handleLoadLowRisk}
                disabled={fetchingSample}
              >
                <CheckCircle2 size={13} /> Load Low Risk (Sepsis=0)
              </button>
            </div>

            <SequenceGraph
              sequence={sequence}
              features={datasetInfo?.features}
              patientId={currentDatasetMeta?.patientId}
            />
          </div>

          {/* DATASET METADATA SUMMARY & INFO BOX */}
          <div className="input-info-box" style={{ marginTop: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Database size={15} style={{ color: "var(--primary)" }} />
              <strong style={{ fontSize: "13px", color: "var(--text-heading)" }}>
                Dataset Context: {datasetInfo?.dataset_name || "PhysioNet 2019 Sepsis Challenge"}
              </strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <div>• Total Test Patients: <strong>{currentDatasetMeta?.totalSamples?.toLocaleString() || "31,098"}</strong></div>
              <div>• Input Dimensions: <strong>6 Steps × 39 Features</strong></div>
              <div>• Current Sample Index: <strong>{currentDatasetMeta?.sampleIndex ?? 0}</strong></div>
              <div>• Ground Truth Target: <strong style={{ color: currentDatasetMeta?.target === 1 ? "var(--danger)" : "var(--success)" }}>{currentDatasetMeta?.targetLabel || "Loading..."}</strong></div>
            </div>
          </div>

          {error && (
            <div className="alert-error" style={{ marginTop: "12px" }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="button-row" style={{ marginTop: "16px" }}>
            <button
              className="btn-primary"
              onClick={handlePredict}
              disabled={loading || fetchingSample}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Evaluating LSTM Model...
                </>
              ) : (
                <>
                  Predict Sepsis Risk <ArrowRight size={16} />
                </>
              )}
            </button>

            <button className="btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {/* PREDICTION RESULT PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>AI Assessment Outcome</h2>
              <p>Real-time risk probability & clinical advisory</p>
            </div>
            <span className="badge badge-live">● LIVE PREDICTION</span>
          </div>

          {!result ? (
            <div className="empty-result">
              <div className="empty-icon-wrapper">
                <HeartPulse size={32} />
              </div>
              <h3>Awaiting Clinical Input</h3>
              <p>Load a PhysioNet patient sequence and click Predict to evaluate AI sepsis risk.</p>
            </div>
          ) : (
            <div className="result-container">
              <div className="patient-badge-header">
                Patient Subject: <strong>{result.patientId}</strong>
              </div>

              {/* RADIAL PROBABILITY GAUGE */}
              <div
                className={`risk-gauge-box ${
                  Number(result.prediction) === 1 ? "risk-high" : "risk-low"
                }`}
              >
                <span className="percent">
                  {(result.probability * 100).toFixed(1)}%
                </span>
                <span className="label">
                  {Number(result.prediction) === 1 ? "SEPSIS RISK" : "NORMAL RISK"}
                </span>
              </div>

              {/* CLINICAL ACTION CALLOUT */}
              <div
                className={`clinical-action-box ${
                  Number(result.prediction) === 1 ? "danger" : "safe"
                }`}
              >
                <div className="action-icon">
                  {Number(result.prediction) === 1 ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <CheckCircle2 size={24} />
                  )}
                </div>
                <div className="action-text">
                  <strong>
                    {Number(result.prediction) === 1
                      ? "High Sepsis Onset Risk Detected!"
                      : "Patient Parameters Within Safe Range"}
                  </strong>
                  <p>
                    {result.message ||
                      (Number(result.prediction) === 1
                        ? "Immediate clinical assessment, serum lactate test, and blood cultures recommended."
                        : "No elevated sepsis indications detected across current 6-hour temporal window.")}
                  </p>
                </div>
              </div>

              {/* RESULT METADATA GRID */}
              <div className="result-meta-grid">
                <div className="meta-item">
                  <span>Class Output</span>
                  <strong>{result.prediction === 1 ? "1 (Positive)" : "0 (Negative)"}</strong>
                </div>
                <div className="meta-item">
                  <span>Risk Probability</span>
                  <strong>{(result.probability * 100).toFixed(2)}%</strong>
                </div>
                <div className="meta-item">
                  <span>Ground Truth Label</span>
                  <strong style={{ color: result.groundTruth?.includes("1") ? "var(--danger)" : "var(--success)" }}>
                    {result.groundTruth || "N/A"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* EXPLAINABLE AI */}
      <ExplainableAI result={result} />
    </>
  );
}

/* =========================================================
   APP ROUTER WITH RBAC ROUTE PROTECTION
========================================================= */
function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("sepsis_user");
    return savedUser
      ? JSON.parse(savedUser)
      : {
          name: "Dr. Alex Vance",
          email: "alex.vance@icu-hospital.org",
          role: "Doctor",
          title: "Lead ICU Clinician",
          employeeId: "DOC-9021",
          department: "Intensive Care Unit",
        };
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("sepsis_user", JSON.stringify(userData));
    addAuditLog({
      action: "User Login",
      user: userData.name,
      role: userData.role === "Admin" ? "Administrator" : userData.role
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sepsis_user");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* PROTECTED APP LAYOUT WRAPPER */}
        <Route
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* DASHBOARD (DOCTOR & NURSE DEFAULT) */}
          <Route
            path="/"
            element={
              <ProtectedRoute user={user} allowedRoles={["Doctor", "Nurse"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} allowedRoles={["Administrator"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* ADMIN USER MANAGEMENT */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute user={user} allowedRoles={["Administrator"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* PATIENTS / PATIENT RECORDS (ALL ROLES) */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute user={user} allowedRoles={["Doctor", "Nurse", "Administrator"]}>
                <Patients />
              </ProtectedRoute>
            }
          />

          {/* SEPSIS ALERTS (ALL ROLES) */}
          <Route
            path="/alerts"
            element={
              <ProtectedRoute user={user} allowedRoles={["Doctor", "Nurse", "Administrator"]}>
                <Alerts />
              </ProtectedRoute>
            }
          />

          {/* PREDICTION HISTORY (DOCTOR & NURSE) */}
          <Route
            path="/history"
            element={
              <ProtectedRoute user={user} allowedRoles={["Doctor", "Nurse"]}>
                <History />
              </ProtectedRoute>
            }
          />

          {/* ADMIN AUDIT LOGS (ADMIN ONLY) */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute user={user} allowedRoles={["Administrator"]}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          {/* MODEL COMPARISON (ADMIN ONLY) */}
          <Route
            path="/model-comparison"
            element={
              <ProtectedRoute user={user} allowedRoles={["Administrator"]}>
                <ModelComparison />
              </ProtectedRoute>
            }
          />

          {/* SETTINGS (DOCTOR READ-ONLY & ADMIN EDITABLE) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user} allowedRoles={["Doctor", "Administrator"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* CATCH-ALL ROUTE REDIRECT */}
          <Route
            path="*"
            element={
              user ? (
                user.role === "Administrator" || user.role === "Admin" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;