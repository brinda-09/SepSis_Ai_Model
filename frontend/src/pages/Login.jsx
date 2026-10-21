import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  HeartPulse,
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  User,
  Building2,
  BadgeCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { addAuditLog } from "../utils/auditLogger";
import { recordAccessSession } from "../utils/sessionLogger";
import { apiGithubAuthExchange, apiGithubAuthStart } from "../api";

/* DEFAULT SEED NURSE REGISTRY IF EMPTY */
const DEFAULT_NURSE_REGISTRY = [
  {
    staffId: "NUR-4412",
    name: "Sarah Jenkins, RN",
    role: "Nurse",
    department: "Critical Care Nursing",
    hospital: "City ICU Hospital",
    shiftStart: "08:00 AM",
    shiftEnd: "04:00 PM",
    status: "ACTIVE",
    lastEntry: "24 Sep 2026, 08:05 AM",
    lastExit: "24 Sep 2026, 04:02 PM",
    createdDate: "2026-09-01"
  },
  {
    staffId: "N001",
    name: "Anita Sharma, RN",
    role: "Nurse",
    department: "Intensive Care Unit",
    hospital: "City ICU Hospital",
    shiftStart: "08:00 AM",
    shiftEnd: "04:00 PM",
    status: "ACTIVE",
    lastEntry: "24 Sep 2026, 08:00 AM",
    lastExit: "24 Sep 2026, 04:00 PM",
    createdDate: "2026-09-10"
  },
  {
    staffId: "N002",
    name: "Priya Patel, RN",
    role: "Nurse",
    department: "Cardiac ICU",
    hospital: "City ICU Hospital",
    shiftStart: "04:00 PM",
    shiftEnd: "12:00 AM",
    status: "ACTIVE",
    lastEntry: "23 Sep 2026, 06:30 PM",
    lastExit: "23 Sep 2026, 11:55 PM",
    createdDate: "2026-09-12"
  }
];

function Login({ onLogin, onNurseSessionStart }) {
  const navigate = useNavigate();
  const githubCallbackHandled = useRef(false);
  const [authMode, setAuthMode] = useState("ACCOUNT"); // "ACCOUNT" (Doctor/Admin) or "NURSE_ID" (Nurse Staff Verification)

  const [showPassword, setShowPassword] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Account Login State (Doctor / Admin)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("Doctor");

  // Nurse ID Verification State (NO Password / Account)
  const [nurseStaffId, setNurseStaffId] = useState("");
  const [outsideShiftModal, setOutsideShiftModal] = useState(null); // Data for outside shift confirmation modal

  // Doctor Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationEmail, setActivationEmail] = useState("");
  const [activationPassword, setActivationPassword] = useState("");
  const [activationConfirmPassword, setActivationConfirmPassword] = useState("");

  // Ensure Nurse Registry is initialized in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sepsis_nurse_registry");
    if (!saved) {
      localStorage.setItem("sepsis_nurse_registry", JSON.stringify(DEFAULT_NURSE_REGISTRY));
    }
  }, []);

  useEffect(() => {
    const callbackParams = new URLSearchParams(window.location.search);
    const code = callbackParams.get("github_code");
    const githubError = callbackParams.get("github_error");
    if (!code && !githubError) return;

    window.history.replaceState({}, document.title, window.location.pathname);
    if (githubError) {
      const messages = {
        access_denied: "GitHub sign-in was cancelled.",
        invalid_state: "GitHub sign-in expired. Please try again.",
        not_configured: "GitHub sign-in is not configured on the backend.",
        token_exchange: "GitHub could not complete sign-in. Please try again.",
      };
      setError(messages[githubError] || "GitHub sign-in failed. Please try again.");
      return;
    }
    if (githubCallbackHandled.current) return;
    githubCallbackHandled.current = true;
    setGithubLoading(true);

    apiGithubAuthExchange(code)
      .then((user) => {
        onLogin(user);
        recordAccessSession({
          name: user.name,
          personId: user.employeeId,
          role: user.role,
          accessType: "GitHub Account Login",
          accessStatus: "Account Login",
          sessionStatus: "ACTIVE",
        });
        addAuditLog({ action: "GitHub Login", user: user.name, role: user.role });
        navigate("/");
      })
      .catch((err) => {
        setError(err.message || "GitHub sign-in failed. Please try again.");
      })
      .finally(() => setGithubLoading(false));
  }, [navigate, onLogin]);

  const handleGithubSignIn = async () => {
    setError("");
    setSuccessMessage("");
    setGithubLoading(true);
    try {
      const { authorizationUrl } = await apiGithubAuthStart();
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(err.message || "Could not start GitHub sign-in.");
      setGithubLoading(false);
    }
  };

  /* ---------------------------------------------------------
     1-CLICK DEMO LOGIN SELECTOR
  --------------------------------------------------------- */
  const handleDemoLogin = (roleType) => {
    setError("");
    setSuccessMessage("");

    if (roleType === "Doctor") {
      const user = {
        id: "DOC-9021",
        name: "Dr. Alex Vance",
        email: "alex.vance@icu-hospital.org",
        role: "Doctor",
        title: "Critical Care Physician",
        specialization: "Critical Care Medicine",
        employeeId: "DOC-9021",
        department: "Intensive Care Unit (ICU)",
      };
      onLogin(user);
      recordAccessSession({
        name: user.name,
        personId: user.employeeId,
        role: "Doctor",
        accessType: "Account Login",
        accessStatus: "Account Login",
        sessionStatus: "ACTIVE"
      });
      addAuditLog({ action: "Doctor Login", user: user.name, role: "Doctor" });
      navigate("/");
    } else if (roleType === "Admin") {
      const user = {
        id: "ADM-1001",
        name: "Marcus Thorne",
        email: "admin.thorne@icu-hospital.org",
        role: "Administrator",
        title: "Clinical Systems Admin",
        employeeId: "ADM-1001",
        department: "Medical IT & AI Engineering",
      };
      onLogin(user);
      recordAccessSession({
        name: user.name,
        personId: user.employeeId,
        role: "Administrator",
        accessType: "Admin Account Login",
        accessStatus: "Account Login",
        sessionStatus: "ACTIVE"
      });
      addAuditLog({ action: "Admin Login", user: user.name, role: "Administrator" });
      navigate("/admin");
    } else if (roleType === "Nurse") {
      // Trigger Nurse Staff ID Verification for Sarah Jenkins (NUR-4412)
      setAuthMode("NURSE_ID");
      setNurseStaffId("NUR-4412");
    }
  };

  /* ---------------------------------------------------------
     ACCOUNT LOGIN SUBMIT (DOCTOR / ADMIN)
  --------------------------------------------------------- */
  const handleAccountLoginSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    // Check Registered Doctors / Users
    const doctorList = JSON.parse(localStorage.getItem("sepsis_doctors") || "[]");
    const regUsers = JSON.parse(localStorage.getItem("sepsis_registered_users") || "[]");

    const foundDoctor = doctorList.find(
      (d) => (d.email || "").toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (foundDoctor) {
      if (foundDoctor.verificationStatus === "PENDING" || foundDoctor.verificationStatus === "UNDER REVIEW") {
        setError("Your Doctor account is currently UNDER REVIEW by Administrator verification.");
        return;
      }
      if (foundDoctor.verificationStatus === "REJECTED" || foundDoctor.verificationStatus === "SUSPENDED") {
        setError(`Account access ${foundDoctor.verificationStatus}. Please contact Administrator.`);
        return;
      }
      if (foundDoctor.verificationStatus === "VERIFIED" && foundDoctor.accountStatus === "PENDING") {
        setError("Your account is VERIFIED but requires initial Password Activation. Click 'Activate Doctor Account' below.");
        setActivationEmail(foundDoctor.email);
        return;
      }
    }

    const foundUser = regUsers.find(
      (u) => (u.email || "").toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword
    );

    if (foundUser) {
      onLogin(foundUser);
      recordAccessSession({
        name: foundUser.name,
        personId: foundUser.employeeId || foundUser.id,
        role: foundUser.role,
        accessType: "Account Login",
        accessStatus: "Account Login",
        sessionStatus: "ACTIVE"
      });
      addAuditLog({ action: `${foundUser.role} Login`, user: foundUser.name, role: foundUser.role });
      if (foundUser.role === "Administrator" || foundUser.role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      // Default fallback account login for demonstration
      const user = {
        name: loginEmail.split("@")[0].replace(".", " ").toUpperCase(),
        email: loginEmail,
        role: loginRole,
        title: loginRole === "Doctor" ? "Critical Care Physician" : "System Administrator",
        specialization: loginRole === "Doctor" ? "Critical Care Medicine" : "IT Security",
        employeeId: "EMP-" + Math.floor(1000 + Math.random() * 9000),
        department: "Intensive Care Unit (ICU)",
      };
      onLogin(user);
      recordAccessSession({
        name: user.name,
        personId: user.employeeId,
        role: user.role,
        accessType: "Account Login",
        accessStatus: "Account Login",
        sessionStatus: "ACTIVE"
      });
      addAuditLog({ action: `${user.role} Login`, user: user.name, role: user.role });
      if (user.role === "Administrator" || user.role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  };

  /* ---------------------------------------------------------
     NURSE HOSPITAL ID VERIFICATION (NO ACCOUNT / NO PASSWORD)
  --------------------------------------------------------- */
  const handleNurseIdSubmit = (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!nurseStaffId.trim()) {
      setError("Please enter or scan your Nurse Hospital Staff ID.");
      return;
    }

    const nurseRegistry = JSON.parse(localStorage.getItem("sepsis_nurse_registry") || "[]");
    const foundNurse = nurseRegistry.find(
      (n) => (n.staffId || "").toLowerCase() === nurseStaffId.trim().toLowerCase()
    );

    if (!foundNurse) {
      setError("Hospital ID not recognized. Please verify Staff ID with ICU Administrator.");
      addAuditLog({
        action: "Hospital ID Entry Denied",
        entity: nurseStaffId,
        user: "Unrecognized Staff",
        role: "Nurse"
      });
      return;
    }

    if (foundNurse.status === "DISABLED") {
      setError("Access denied. This Hospital ID is currently disabled.");
      addAuditLog({
        action: "Hospital ID Entry Denied (Disabled)",
        entity: foundNurse.staffId,
        user: foundNurse.name,
        role: "Nurse"
      });
      return;
    }

    // Verify shift timings (e.g. 08:00 AM - 04:00 PM)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let shiftStartHour = 8;
    let shiftEndHour = 16;

    if (foundNurse.shiftStart && foundNurse.shiftStart.includes("PM")) {
      shiftStartHour = parseInt(foundNurse.shiftStart) + (parseInt(foundNurse.shiftStart) < 12 ? 12 : 0);
    } else if (foundNurse.shiftStart) {
      shiftStartHour = parseInt(foundNurse.shiftStart);
    }

    if (foundNurse.shiftEnd && foundNurse.shiftEnd.includes("PM")) {
      shiftEndHour = parseInt(foundNurse.shiftEnd) + (parseInt(foundNurse.shiftEnd) < 12 ? 12 : 0);
    } else if (foundNurse.shiftEnd) {
      shiftEndHour = parseInt(foundNurse.shiftEnd);
    }

    const isWithinShift = currentHour >= shiftStartHour && currentHour < shiftEndHour;
    const nowTimeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    if (isWithinShift) {
      // Start Immediate Nurse Shift Session
      startNurseSession(foundNurse, "Within Shift", "NO");
    } else {
      // Open Outside Shift Confirmation Modal
      setOutsideShiftModal({
        nurse: foundNurse,
        currentTimeStr: nowTimeStr,
        shiftStr: `${foundNurse.shiftStart || "08:00 AM"} - ${foundNurse.shiftEnd || "04:00 PM"}`
      });
    }
  };

  const startNurseSession = (nurseObj, accessStatusLabel, overrideConfirmationVal) => {
    const now = new Date();
    const nowStr = now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const sessionData = {
      staffId: nurseObj.staffId,
      name: nurseObj.name,
      role: "Nurse",
      title: "Senior ICU Staff Nurse",
      department: nurseObj.department || "Critical Care Nursing",
      hospital: nurseObj.hospital || "City ICU Hospital",
      shiftStart: nurseObj.shiftStart || "08:00 AM",
      shiftEnd: nurseObj.shiftEnd || "04:00 PM",
      entryTime: nowStr,
      accessStatus: accessStatusLabel,
      isNurseSession: true
    };

    // Save Active Session
    localStorage.setItem("sepsis_active_nurse_session", JSON.stringify(sessionData));

    // Record Access History
    const accessRec = recordAccessSession({
      name: nurseObj.name,
      personId: nurseObj.staffId,
      role: "Nurse",
      accessType: "Hospital ID Entry",
      entryTime: nowStr,
      shift: `${nurseObj.shiftStart || "08:00 AM"} - ${nurseObj.shiftEnd || "04:00 PM"}`,
      accessStatus: accessStatusLabel,
      overrideConfirmation: overrideConfirmationVal,
      sessionStatus: "ACTIVE"
    });

    if (accessRec) {
      sessionData.sessionRecordId = accessRec.id;
      localStorage.setItem("sepsis_active_nurse_session", JSON.stringify(sessionData));
    }

    addAuditLog({
      action: `Nurse ID Entry (${accessStatusLabel})`,
      entity: nurseObj.staffId,
      user: nurseObj.name,
      role: "Nurse"
    });

    onLogin({
      name: nurseObj.name,
      email: `${nurseObj.staffId.toLowerCase()}@hospital-staff.org`,
      role: "Nurse",
      title: "ICU Staff Nurse",
      employeeId: nurseObj.staffId,
      department: nurseObj.department,
      isNurseSession: true
    });

    setOutsideShiftModal(null);
    navigate("/");
  };

  const handleOutsideShiftConfirm = (confirmed) => {
    if (!outsideShiftModal) return;

    if (confirmed) {
      startNurseSession(outsideShiftModal.nurse, "Outside Shift - Confirmed", "YES");
    } else {
      addAuditLog({
        action: "Outside Shift Access Cancelled",
        entity: outsideShiftModal.nurse.staffId,
        user: outsideShiftModal.nurse.name,
        role: "Nurse"
      });
      setOutsideShiftModal(null);
      setError("Outside-shift access cancelled.");
    }
  };

  /* ---------------------------------------------------------
     DOCTOR ACCOUNT ACTIVATION SUBMIT
  --------------------------------------------------------- */
  const handleDoctorActivationSubmit = (e) => {
    e.preventDefault();
    if (!activationEmail || !activationPassword) {
      alert("Please fill in email and password.");
      return;
    }
    if (activationPassword !== activationConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const doctorList = JSON.parse(localStorage.getItem("sepsis_doctors") || "[]");
    let activatedDoc = null;

    const updatedDoctors = doctorList.map((doc) => {
      if ((doc.email || "").toLowerCase() === activationEmail.trim().toLowerCase()) {
        activatedDoc = { ...doc, accountStatus: "ACTIVE" };
        return activatedDoc;
      }
      return doc;
    });

    if (!activatedDoc) {
      alert("Doctor email not found in verified registry.");
      return;
    }

    localStorage.setItem("sepsis_doctors", JSON.stringify(updatedDoctors));

    // Add to registered users
    const regUsers = JSON.parse(localStorage.getItem("sepsis_registered_users") || "[]");
    const newReg = {
      name: activatedDoc.name,
      email: activatedDoc.email,
      password: activationPassword,
      role: "Doctor",
      title: activatedDoc.title || "Critical Care Physician",
      employeeId: activatedDoc.id || activatedDoc.hospitalId || "DOC-900",
      department: activatedDoc.department || "Intensive Care Unit (ICU)"
    };
    localStorage.setItem("sepsis_registered_users", JSON.stringify([newReg, ...regUsers]));

    addAuditLog({
      action: "Doctor Account Activated",
      entity: activatedDoc.name,
      user: activatedDoc.name,
      role: "Doctor"
    });

    setShowActivationModal(false);
    setSuccessMessage("Doctor account activated successfully! You may now sign in.");
    setLoginEmail(activationEmail);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* LEFT BRAND PANEL */}
        <div className="login-brand-panel">
          <div className="brand-logo-row">
            <div className="brand-icon-box">
              <HeartPulse size={28} />
            </div>
            <div>
              <h2>SepsisAlert AI</h2>
              <span>ICU Clinical Intelligence Platform</span>
            </div>
          </div>

          <div className="brand-hero-content">
            <h3>AI-Assisted Early Sepsis Warning & Temporal Risk Evaluation</h3>
            <p>
              Empowering intensive care clinicians with 6-hour deep neural sequence prediction to identify sepsis onset before overt clinical deterioration.
            </p>
          </div>

          <div className="role-perks-list">
            <div className="perk-item">
              <Stethoscope size={18} />
              <div>
                <strong>Physicians & Doctors</strong>
                <small>Secure application account, clinical decision support & care plans</small>
              </div>
            </div>

            <div className="perk-item">
              <CreditCard size={18} />
              <div>
                <strong>ICU Nursing Team</strong>
                <small>Hospital ID Card verification (No account required) & shift tracking</small>
              </div>
            </div>

            <div className="perk-item">
              <ShieldCheck size={18} />
              <div>
                <strong>Systems Administrator</strong>
                <small>Staff registry control, Doctor verification & audit trail logs</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="login-form-panel">
          <div className="auth-tab-switch">
            <button
              className={`tab-btn ${authMode === "ACCOUNT" ? "active" : ""}`}
              onClick={() => { setAuthMode("ACCOUNT"); setError(""); setSuccessMessage(""); }}
            >
              Doctor / Admin Sign In
            </button>
            <button
              className={`tab-btn ${authMode === "NURSE_ID" ? "active" : ""}`}
              onClick={() => { setAuthMode("NURSE_ID"); setError(""); setSuccessMessage(""); }}
              style={{ background: authMode === "NURSE_ID" ? "var(--primary-gradient)" : "transparent" }}
            >
              Nurse Staff ID Entry
            </button>
          </div>

          {/* 1-CLICK DEMO ACCOUNTS QUICK SELECTOR */}
          <div className="demo-accounts-box">
            <span className="demo-label">⚡ 1-Click Quick Demo Sign In / Verification:</span>
            <div className="demo-buttons-row">
              <button
                type="button"
                className="demo-chip doctor"
                onClick={() => handleDemoLogin("Doctor")}
              >
                <Stethoscope size={13} /> Doctor
              </button>
              <button
                type="button"
                className="demo-chip nurse"
                onClick={() => handleDemoLogin("Nurse")}
              >
                <UserCheck size={13} /> Nurse (NUR-4412)
              </button>
              <button
                type="button"
                className="demo-chip admin"
                onClick={() => handleDemoLogin("Admin")}
              >
                <ShieldCheck size={13} /> Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="status-pill success" style={{ padding: "10px 14px", marginBottom: "16px", width: "100%" }}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: DOCTOR & ADMIN ACCOUNT LOGIN */}
          {authMode === "ACCOUNT" && (
            <form onSubmit={handleAccountLoginSubmit} className="auth-form">
              <div className="form-group">
                <label>Account Role</label>
                <div className="input-with-icon">
                  <BadgeCheck size={16} />
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                  >
                    <option value="Doctor">Doctor / Physician (Account)</option>
                    <option value="Administrator">System Administrator (Account)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Clinical Email / Employee ID</label>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    type="text"
                    placeholder="alex.vance@icu-hospital.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Account Password</label>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn">
                <span>Sign In to Account</span> <ArrowRight size={16} />
              </button>

              <div className="github-auth-divider"><span>or</span></div>
              <button
                type="button"
                className="btn-secondary auth-submit-btn github-auth-btn"
                onClick={handleGithubSignIn}
                disabled={githubLoading}
              >
                <GitBranch size={17} />
                <span>{githubLoading ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
              </button>

              <div style={{ marginTop: "14px", textAlign: "center" }}>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setShowActivationModal(true)}
                >
                  <KeyRound size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                  Verified Doctor? Activate Account & Create Password
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: NURSE HOSPITAL ID CARD VERIFICATION (NO ACCOUNT / NO PASSWORD) */}
          {authMode === "NURSE_ID" && (
            <form onSubmit={handleNurseIdSubmit} className="auth-form">
              <div className="status-pill warning" style={{ width: "100%", padding: "10px 14px", marginBottom: "16px", borderRadius: "var(--radius-md)" }}>
                <Info size={16} />
                <span style={{ fontSize: "12px" }}>
                  <strong>Notice:</strong> Nurses do NOT have application accounts. Access is granted exclusively via Hospital Staff ID verification.
                </span>
              </div>

              <div className="form-group">
                <label>Scan / Enter Nurse Hospital Staff ID</label>
                <div className="input-with-icon">
                  <CreditCard size={18} style={{ color: "var(--primary)" }} />
                  <input
                    type="text"
                    placeholder="e.g. NUR-4412, N001, N002"
                    value={nurseStaffId}
                    onChange={(e) => setNurseStaffId(e.target.value)}
                    autoFocus
                  />
                </div>
                <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Enter your assigned Staff ID or tap the quick demo button above.
                </small>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" style={{ background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" }}>
                <span>Verify Staff ID & Start Shift</span> <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* OUTSIDE SHIFT ACCESS CONFIRMATION MODAL */}
      {outsideShiftModal && (
        <div className="panel" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "480px", zIndex: 1100, boxShadow: "0 24px 48px rgba(0,0,0,0.5)", border: "1px solid var(--warning-border)" }}>
          <div className="panel-header" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={22} style={{ color: "var(--warning)" }} />
              <div>
                <h3 style={{ color: "var(--warning)", margin: 0 }}>Outside Shift Hours Warning</h3>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Nurse Staff ID: {outsideShiftModal.nurse.staffId}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "18px 20px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-heading)", lineHeight: 1.5, marginTop: 0 }}>
              Your current time is outside your assigned shift hours.
            </p>

            <div style={{ background: "var(--bg-main)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-main)", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Assigned Shift:</span>
                <strong style={{ fontSize: "13px", color: "var(--text-heading)" }}>{outsideShiftModal.shiftStr}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Time:</span>
                <strong style={{ fontSize: "13px", color: "var(--warning)" }}>{outsideShiftModal.currentTimeStr} (Outside Shift)</strong>
              </div>
            </div>

            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "16px" }}>
              You are not currently in your assigned shift. Are you sure you want to continue?
            </p>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleOutsideShiftConfirm(false)}
                style={{ padding: "8px 16px", fontSize: "12px" }}
              >
                NO, CANCEL
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => handleOutsideShiftConfirm(true)}
                style={{ width: "auto", padding: "8px 18px", fontSize: "12px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
              >
                YES, CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR ACCOUNT ACTIVATION MODAL */}
      {showActivationModal && (
        <div className="panel" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "460px", zIndex: 1100, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
          <div className="panel-header">
            <div>
              <h3>Doctor Account Activation</h3>
              <p>Set your password for your verified Doctor account</p>
            </div>
            <button className="btn-secondary" onClick={() => setShowActivationModal(false)} style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleDoctorActivationSubmit} style={{ padding: "18px 20px" }}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Verified Doctor Email</label>
              <input
                type="email"
                placeholder="alex.vance@icu-hospital.org"
                value={activationEmail}
                onChange={(e) => setActivationEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Create Account Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={activationPassword}
                onChange={(e) => setActivationPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={activationConfirmPassword}
                onChange={(e) => setActivationConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowActivationModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ width: "auto" }}>
                Activate & Create Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
