import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Server,
  Activity,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Stethoscope,
  UserCheck,
  Filter,
  Info,
  Clock,
  BellRing,
  History as HistoryIcon,
  Database,
  Lock,
  X,
  CreditCard,
  Edit,
  Eye,
  Link2,
  Check,
  ChevronDown,
  MoreVertical,
  Power,
  UserX,
  AlertCircle,
  ArrowRight,
  FileText,
  Sliders,
  Brain
} from "lucide-react";
import { apiGetPatients, apiGetAlerts, apiGetHistory } from "../api";
import { addAuditLog, getAuditLogs } from "../utils/auditLogger";

/* SEED DEFAULT DOCTORS IF EMPTY */
const DEFAULT_DOCTORS = [
  {
    id: "DOC-9021",
    name: "Dr. Alex Vance",
    role: "Doctor",
    title: "Critical Care Physician",
    specialization: "Critical Care Medicine",
    department: "Intensive Care Unit (ICU)",
    hospitalName: "City ICU Hospital",
    hospitalId: "HOSP-DOC-9021",
    registrationNumber: "REG-MC-88021",
    email: "alex.vance@icu-hospital.org",
    phone: "+1 (555) 234-5678",
    verificationStatus: "VERIFIED",
    accountStatus: "ACTIVE",
    idStatus: "ISSUED",
    idLinkedDate: "2026-09-01",
    idLinkedBy: "System Administrator",
    lastLogin: "24 Sep 2026, 09:15 AM"
  },
  {
    id: "DOC-3042",
    name: "Dr. Elena Rostova",
    role: "Doctor",
    title: "Pulmonologist & Intensivist",
    specialization: "Critical Care Medicine",
    department: "Pulmonary ICU",
    hospitalName: "City ICU Hospital",
    hospitalId: "",
    registrationNumber: "REG-MC-90412",
    email: "elena.rostova@icu-hospital.org",
    phone: "+1 (555) 345-6789",
    verificationStatus: "UNDER REVIEW",
    accountStatus: "PENDING",
    idStatus: "NOT_ISSUED",
    idLinkedDate: null,
    idLinkedBy: null,
    lastLogin: "Never"
  }
];

/* SEED DEFAULT NURSE REGISTRY IF EMPTY */
const DEFAULT_NURSE_REGISTRY = [
  {
    staffId: "NUR-4412",
    id: "NUR-4412",
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
    id: "N001",
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
    id: "N002",
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

/* DEFAULT ADMIN RECORD FOR DIRECTORY DISPLAY */
const DEFAULT_ADMIN = {
  id: "ADM-1001",
  name: "Marcus Thorne",
  role: "Administrator",
  title: "Chief System Administrator",
  specialization: "Health Informatics & Security",
  department: "System Administration",
  hospitalName: "City ICU Hospital",
  hospitalId: "ADM-SYS-1001",
  email: "admin@sepsisalert.org",
  phone: "+1 (555) 100-9900",
  verificationStatus: "VERIFIED",
  accountStatus: "ACTIVE",
  idStatus: "ISSUED",
  lastLogin: "24 Sep 2026, 10:30 AM"
};

function Admin() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine view mode based on URL route
  const isUsersRoute = location.pathname.includes("/admin/users");

  const [currentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_user");
      return saved ? JSON.parse(saved) : { role: "Administrator", name: "Marcus Thorne" };
    } catch {
      return { role: "Administrator", name: "Marcus Thorne" };
    }
  });

  // User Management tab & filtering states
  const [roleFilter, setRoleFilter] = useState("All"); // "All", "Doctor", "Nurse", "Administrator"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Main data states
  const [doctorsList, setDoctorsList] = useState([]);
  const [nurseRegistry, setNurseRegistry] = useState([]);
  const [adminUser] = useState(DEFAULT_ADMIN);

  // Counter & Overview states
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");

  // Action Menu Dropdown State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Modals state
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [idNotIssuedYet, setIdNotIssuedYet] = useState(false);
  const [newDocForm, setNewDocForm] = useState({
    name: "",
    title: "Critical Care Physician",
    specialization: "Critical Care Medicine",
    department: "Intensive Care Unit (ICU)",
    hospitalName: "City ICU Hospital",
    hospitalId: "",
    registrationNumber: "",
    email: "",
    phone: ""
  });

  // Edit Doctor Modal State
  const [editDocModalData, setEditDocModalData] = useState(null);

  // Link Hospital ID Modal State
  const [selectedDocForIdLink, setSelectedDocForIdLink] = useState(null);
  const [linkHospitalIdVal, setLinkHospitalIdVal] = useState("");

  // Add Nurse Staff Modal State
  const [showAddNurseModal, setShowAddNurseModal] = useState(false);
  const [newNurseForm, setNewNurseForm] = useState({
    staffId: "",
    name: "",
    department: "Critical Care Nursing",
    hospital: "City ICU Hospital",
    shiftStart: "08:00 AM",
    shiftEnd: "04:00 PM"
  });

  // Edit Nurse Staff Modal State
  const [editNurseModalData, setEditNurseModalData] = useState(null);

  // View User Modal State
  const [viewUserModalData, setViewUserModalData] = useState(null);

  // Disable / Enable Confirmation Modal State
  const [confirmToggleModalData, setConfirmToggleModalData] = useState(null);

  // View Access Session History Modal State
  const [historyModalData, setHistoryModalData] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Close action dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadAdminData = async () => {
    // 1. Load Doctors
    try {
      const savedDocs = localStorage.getItem("sepsis_doctors");
      if (savedDocs) {
        setDoctorsList(JSON.parse(savedDocs));
      } else {
        setDoctorsList(DEFAULT_DOCTORS);
        localStorage.setItem("sepsis_doctors", JSON.stringify(DEFAULT_DOCTORS));
      }
    } catch {
      setDoctorsList(DEFAULT_DOCTORS);
    }

    // 2. Load Nurse Registry
    try {
      const savedNurses = localStorage.getItem("sepsis_nurse_registry");
      if (savedNurses) {
        setNurseRegistry(JSON.parse(savedNurses));
      } else {
        setNurseRegistry(DEFAULT_NURSE_REGISTRY);
        localStorage.setItem("sepsis_nurse_registry", JSON.stringify(DEFAULT_NURSE_REGISTRY));
      }
    } catch {
      setNurseRegistry(DEFAULT_NURSE_REGISTRY);
    }

    // 3. Patients
    try {
      const pData = await apiGetPatients();
      setPatients(pData || []);
    } catch {
      const saved = JSON.parse(localStorage.getItem("sepsis_patients") || "[]");
      setPatients(saved);
    }

    // 4. History Predictions
    try {
      const hData = await apiGetHistory();
      setHistoryLogs(hData || []);
    } catch {
      const saved = JSON.parse(localStorage.getItem("sepsis_prediction_history") || "[]");
      setHistoryLogs(saved);
    }

    // 5. Sepsis Alerts
    try {
      const aData = await apiGetAlerts();
      setAlerts(aData || []);
    } catch {
      const saved = JSON.parse(localStorage.getItem("sepsis_alerts") || "[]");
      setAlerts(saved);
    }

    // 6. Audit Logs
    try {
      const logs = getAuditLogs();
      setAuditLogsList(logs.slice(0, 5));
    } catch {
      setAuditLogsList([]);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [location.pathname]);

  /* ---------------------------------------------------------
     DOCTOR MANAGEMENT ACTIONS
  --------------------------------------------------------- */
  const handleUpdateDoctorVerification = (docId, newVerificationStatus) => {
    const updated = doctorsList.map((doc) => {
      if (doc.id === docId) {
        let newAccountStatus = doc.accountStatus;
        if (newVerificationStatus === "VERIFIED") {
          newAccountStatus = doc.accountStatus === "DISABLED" ? "ACTIVE" : doc.accountStatus || "ACTIVE";
        } else if (newVerificationStatus === "REJECTED" || newVerificationStatus === "SUSPENDED") {
          newAccountStatus = "DISABLED";
        }
        return {
          ...doc,
          verificationStatus: newVerificationStatus,
          accountStatus: newAccountStatus
        };
      }
      return doc;
    });

    setDoctorsList(updated);
    localStorage.setItem("sepsis_doctors", JSON.stringify(updated));

    const docObj = doctorsList.find((d) => d.id === docId);
    addAuditLog({
      action: `Doctor Verification Updated (${newVerificationStatus})`,
      entity: docObj?.name || docId,
      user: currentUser.name,
      role: currentUser.role
    });

    showToast(`Doctor ${docObj?.name || docId} verification set to ${newVerificationStatus}`);
  };

  const handleAddDoctorSubmit = (e) => {
    e.preventDefault();
    if (!newDocForm.name.trim() || !newDocForm.email.trim()) {
      alert("Please enter Doctor Full Name and Clinical Email.");
      return;
    }

    const docId = "DOC-" + Math.floor(1000 + Math.random() * 9000);
    const newDoc = {
      id: docId,
      name: newDocForm.name.trim(),
      role: "Doctor",
      title: newDocForm.title || "Critical Care Physician",
      specialization: newDocForm.specialization || "Critical Care Medicine",
      department: newDocForm.department || "Intensive Care Unit (ICU)",
      hospitalName: newDocForm.hospitalName || "City ICU Hospital",
      hospitalId: idNotIssuedYet ? null : (newDocForm.hospitalId.trim() || null),
      registrationNumber: newDocForm.registrationNumber.trim() || "N/A",
      email: newDocForm.email.trim(),
      phone: newDocForm.phone.trim() || "N/A",
      verificationStatus: "PENDING",
      accountStatus: "INACTIVE",
      idStatus: idNotIssuedYet || !newDocForm.hospitalId.trim() ? "NOT_ISSUED" : "ISSUED",
      idLinkedDate: idNotIssuedYet || !newDocForm.hospitalId.trim() ? null : new Date().toISOString().split("T")[0],
      idLinkedBy: idNotIssuedYet || !newDocForm.hospitalId.trim() ? null : currentUser.name,
      lastLogin: "Never"
    };

    const updated = [newDoc, ...doctorsList];
    setDoctorsList(updated);
    localStorage.setItem("sepsis_doctors", JSON.stringify(updated));

    addAuditLog({
      action: `Doctor Registered (${idNotIssuedYet ? "ID Not Issued Yet" : "ID Issued"})`,
      entity: newDoc.name,
      user: currentUser.name,
      role: currentUser.role
    });

    setShowAddDoctorModal(false);
    setNewDocForm({
      name: "",
      title: "Critical Care Physician",
      specialization: "Critical Care Medicine",
      department: "Intensive Care Unit (ICU)",
      hospitalName: "City ICU Hospital",
      hospitalId: "",
      registrationNumber: "",
      email: "",
      phone: ""
    });

    showToast("Doctor added successfully.");
  };

  const handleEditDoctorSubmit = (e) => {
    e.preventDefault();
    if (!editDocModalData.name.trim() || !editDocModalData.email.trim()) {
      alert("Please enter Doctor Name and Clinical Email.");
      return;
    }

    const updated = doctorsList.map((doc) => {
      if (doc.id === editDocModalData.id) {
        return {
          ...doc,
          name: editDocModalData.name.trim(),
          title: editDocModalData.title,
          specialization: editDocModalData.specialization,
          department: editDocModalData.department,
          hospitalName: editDocModalData.hospitalName,
          hospitalId: editDocModalData.hospitalId ? editDocModalData.hospitalId.trim() : null,
          registrationNumber: editDocModalData.registrationNumber,
          email: editDocModalData.email.trim(),
          phone: editDocModalData.phone,
          idStatus: editDocModalData.hospitalId ? "ISSUED" : "NOT_ISSUED"
        };
      }
      return doc;
    });

    setDoctorsList(updated);
    localStorage.setItem("sepsis_doctors", JSON.stringify(updated));

    addAuditLog({
      action: "Doctor Profile Updated",
      entity: editDocModalData.name,
      user: currentUser.name,
      role: currentUser.role
    });

    setEditDocModalData(null);
    showToast("Doctor updated successfully.");
  };

  const handleLinkHospitalIdSubmit = (e) => {
    e.preventDefault();
    if (!linkHospitalIdVal.trim() || !selectedDocForIdLink) {
      alert("Please enter a valid Hospital ID.");
      return;
    }

    const updated = doctorsList.map((doc) => {
      if (doc.id === selectedDocForIdLink.id) {
        return {
          ...doc,
          hospitalId: linkHospitalIdVal.trim(),
          idStatus: "ISSUED",
          idLinkedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          idLinkedBy: currentUser.name
        };
      }
      return doc;
    });

    setDoctorsList(updated);
    localStorage.setItem("sepsis_doctors", JSON.stringify(updated));

    addAuditLog({
      action: "Doctor Hospital ID Linked",
      entity: `${selectedDocForIdLink.name} (${linkHospitalIdVal.trim()})`,
      user: currentUser.name,
      role: currentUser.role
    });

    setSelectedDocForIdLink(null);
    setLinkHospitalIdVal("");
    showToast(`Hospital ID linked for ${selectedDocForIdLink.name}`);
  };

  /* ---------------------------------------------------------
     NURSE STAFF REGISTRY ACTIONS (NO PASSWORDS)
  --------------------------------------------------------- */
  const handleAddNurseSubmit = (e) => {
    e.preventDefault();
    if (!newNurseForm.staffId.trim() || !newNurseForm.name.trim()) {
      alert("Please enter Staff ID and Nurse Full Name.");
      return;
    }

    const exists = nurseRegistry.some(
      (n) => String(n.staffId).toLowerCase() === newNurseForm.staffId.trim().toLowerCase()
    );
    if (exists) {
      alert("Nurse Staff ID already exists in registry.");
      return;
    }

    const newNurse = {
      staffId: newNurseForm.staffId.trim().toUpperCase(),
      id: newNurseForm.staffId.trim().toUpperCase(),
      name: newNurseForm.name.trim(),
      role: "Nurse",
      department: newNurseForm.department || "Critical Care Nursing",
      hospital: newNurseForm.hospital || "City ICU Hospital",
      shiftStart: newNurseForm.shiftStart || "08:00 AM",
      shiftEnd: newNurseForm.shiftEnd || "04:00 PM",
      status: "ACTIVE",
      lastEntry: "Never",
      lastExit: "Never",
      createdDate: new Date().toISOString().split("T")[0]
    };

    const updated = [newNurse, ...nurseRegistry];
    setNurseRegistry(updated);
    localStorage.setItem("sepsis_nurse_registry", JSON.stringify(updated));

    addAuditLog({
      action: "Nurse Staff ID Registered",
      entity: `${newNurse.name} (${newNurse.staffId})`,
      user: currentUser.name,
      role: currentUser.role
    });

    setShowAddNurseModal(false);
    setNewNurseForm({
      staffId: "",
      name: "",
      department: "Critical Care Nursing",
      hospital: "City ICU Hospital",
      shiftStart: "08:00 AM",
      shiftEnd: "04:00 PM"
    });

    showToast("Nurse staff record added successfully.");
  };

  const handleEditNurseSubmit = (e) => {
    e.preventDefault();
    if (!editNurseModalData.name.trim()) {
      alert("Please enter Nurse Full Name.");
      return;
    }

    const updated = nurseRegistry.map((n) => {
      if (n.staffId === editNurseModalData.staffId) {
        return {
          ...n,
          name: editNurseModalData.name.trim(),
          department: editNurseModalData.department,
          hospital: editNurseModalData.hospital,
          shiftStart: editNurseModalData.shiftStart,
          shiftEnd: editNurseModalData.shiftEnd
        };
      }
      return n;
    });

    setNurseRegistry(updated);
    localStorage.setItem("sepsis_nurse_registry", JSON.stringify(updated));

    addAuditLog({
      action: "Nurse Staff Record & Shift Updated",
      entity: `${editNurseModalData.name} (${editNurseModalData.staffId})`,
      user: currentUser.name,
      role: currentUser.role
    });

    setEditNurseModalData(null);
    showToast("Nurse staff record updated successfully.");
  };

  /* ---------------------------------------------------------
     TOGGLE ENABLE / DISABLE ACCOUNT / ID
  --------------------------------------------------------- */
  const handleConfirmToggleStatus = () => {
    if (!confirmToggleModalData) return;
    const { item, targetType } = confirmToggleModalData;

    if (targetType === "DOCTOR") {
      const isCurrentlyActive = item.accountStatus === "ACTIVE";
      const newStatus = isCurrentlyActive ? "DISABLED" : "ACTIVE";

      const updated = doctorsList.map((d) => {
        if (d.id === item.id) {
          return {
            ...d,
            accountStatus: newStatus,
            verificationStatus: newStatus === "DISABLED" && d.verificationStatus === "VERIFIED" ? "SUSPENDED" : d.verificationStatus
          };
        }
        return d;
      });

      setDoctorsList(updated);
      localStorage.setItem("sepsis_doctors", JSON.stringify(updated));

      addAuditLog({
        action: `Doctor Account ${newStatus === "DISABLED" ? "Disabled" : "Enabled"}`,
        entity: `${item.name} (${item.id})`,
        user: currentUser.name,
        role: currentUser.role
      });

      showToast(`Doctor account ${newStatus === "DISABLED" ? "disabled" : "enabled"} successfully.`);
    } else if (targetType === "NURSE") {
      const isCurrentlyActive = item.status === "ACTIVE";
      const newStatus = isCurrentlyActive ? "DISABLED" : "ACTIVE";

      const updated = nurseRegistry.map((n) => {
        if (n.staffId === item.staffId) {
          return { ...n, status: newStatus };
        }
        return n;
      });

      setNurseRegistry(updated);
      localStorage.setItem("sepsis_nurse_registry", JSON.stringify(updated));

      addAuditLog({
        action: `Nurse Staff ID ${newStatus === "DISABLED" ? "Disabled" : "Enabled"}`,
        entity: `${item.name} (${item.staffId})`,
        user: currentUser.name,
        role: currentUser.role
      });

      showToast(`Nurse Staff ID ${newStatus === "DISABLED" ? "disabled" : "enabled"} successfully.`);
    }

    setConfirmToggleModalData(null);
  };

  /* ---------------------------------------------------------
     COMBINED UNIFIED DIRECTORY LIST & FILTERING
  --------------------------------------------------------- */
  const getCombinedUserList = () => {
    const docs = doctorsList.map((d) => ({
      ...d,
      itemType: "DOCTOR",
      displayRole: "Doctor",
      displayEmail: d.email || "--",
      displayId: d.hospitalId || "Not Yet Issued",
      displayDepartment: d.department || "ICU Department",
      displayStatus: d.accountStatus === "ACTIVE" ? "ACTIVE" : d.verificationStatus || d.accountStatus || "PENDING",
      lastActivityLabel: "Last Login",
      lastActivityVal: d.lastLogin || "Never"
    }));

    const nurses = nurseRegistry.map((n) => ({
      ...n,
      itemType: "NURSE",
      displayRole: "Nurse",
      displayEmail: `Staff ID: ${n.staffId} (No Password)`,
      displayId: n.staffId,
      displayDepartment: n.department || "Nursing",
      displayStatus: n.status || "ACTIVE",
      lastActivityLabel: "Last Entry",
      lastActivityVal: n.lastEntry || "Never"
    }));

    const admins = [
      {
        ...adminUser,
        itemType: "ADMIN",
        displayRole: "Administrator",
        displayEmail: adminUser.email,
        displayId: adminUser.hospitalId,
        displayDepartment: adminUser.department,
        displayStatus: "ACTIVE",
        lastActivityLabel: "Last Login",
        lastActivityVal: adminUser.lastLogin || "Active Now"
      }
    ];

    return [...docs, ...nurses, ...admins];
  };

  const combinedUsers = getCombinedUserList();

  const filteredUsers = combinedUsers.filter((u) => {
    const s = (search || "").toLowerCase();
    const matchesSearch =
      String(u.name || "").toLowerCase().includes(s) ||
      String(u.displayEmail || "").toLowerCase().includes(s) ||
      String(u.displayRole || "").toLowerCase().includes(s) ||
      String(u.displayDepartment || "").toLowerCase().includes(s) ||
      String(u.displayId || "").toLowerCase().includes(s) ||
      String(u.specialization || "").toLowerCase().includes(s);

    let matchesRole = true;
    if (roleFilter !== "All") {
      if (roleFilter === "Doctor") matchesRole = u.displayRole === "Doctor";
      else if (roleFilter === "Nurse") matchesRole = u.displayRole === "Nurse";
      else if (roleFilter === "Administrator") matchesRole = u.displayRole === "Administrator";
    }

    let matchesStatus = true;
    if (statusFilter !== "All") {
      matchesStatus = String(u.displayStatus).toUpperCase() === statusFilter.toUpperCase();
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalRegisteredStaffCount = doctorsList.length + nurseRegistry.length + 1;
  const activeAlertsCount = alerts.filter((a) => String(a.status).toUpperCase() !== "RESOLVED").length;

  return (
    <div className="page-content">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--primary-gradient)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-glow-primary)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* =========================================================
          PAGE VIEW 1: ADMIN DASHBOARD (/admin)
      ========================================================= */}
      {!isUsersRoute && (
        <>
          <div className="page-title-row">
            <div>
              <h2>System Administration & ICU Operations Overview</h2>
              <p>Real-time ICU metrics, high-risk sepsis alert monitor, AI neural model diagnostics, and security feed</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="badge badge-ai" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                <ShieldCheck size={14} /> ADMIN COMMAND CENTER
              </span>

              <button
                className="btn-primary"
                onClick={() => navigate("/admin/users")}
                style={{ width: "auto", fontSize: "12px" }}
              >
                <Users size={14} /> Manage Users & Registry <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* DASHBOARD TOP METRIC CARDS */}
          <section className="stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">
                <Brain size={24} />
              </div>
              <div className="stat-info">
                <span>AI Service Status</span>
                <strong>FastAPI Online</strong>
                <small>Endpoint: 127.0.0.1:8000</small>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon green">
                <Database size={24} />
              </div>
              <div className="stat-info">
                <span>ICU Patients</span>
                <strong>{patients.length} Registered</strong>
                <small>Active Beds Tracked</small>
              </div>
            </div>

            <div className="stat-card danger" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
              <div className="stat-icon danger" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                <BellRing size={24} />
              </div>
              <div className="stat-info">
                <span>Active Sepsis Alerts</span>
                <strong style={{ color: "#ef4444" }}>{activeAlertsCount} Alerts</strong>
                <small>High Onset Probability</small>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon purple">
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <span>Evaluated Predictions</span>
                <strong>{historyLogs.length} Evaluated</strong>
                <small>6x39 Time-Series Runs</small>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon orange">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span>Clinical Staff</span>
                <strong>{totalRegisteredStaffCount} Registered</strong>
                <small>{doctorsList.length} Docs, {nurseRegistry.length} Nurses</small>
              </div>
            </div>
          </section>

          {/* DASHBOARD CONTENT GRID */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "20px", marginTop: "20px" }}>
            {/* LEFT COLUMN: ACTIVE SEPSIS ALERTS MONITOR & SYSTEM DIAGNOSTICS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* ACTIVE ALERTS SUMMARY CARD */}
              <div className="table-card">
                <div className="table-header">
                  <div>
                    <h3>Active Clinical Sepsis Alerts Overview</h3>
                    <p>Patients with high risk prediction requiring attending physician evaluation</p>
                  </div>
                  <Link to="/alerts" className="btn-secondary" style={{ fontSize: "12px", textDecoration: "none" }}>
                    View All Alerts ({alerts.length})
                  </Link>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Risk Level</th>
                        <th>Probability</th>
                        <th>Status</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                            No active sepsis alerts currently flagged.
                          </td>
                        </tr>
                      ) : (
                        alerts.slice(0, 4).map((alt) => (
                          <tr key={alt.id}>
                            <td>
                              <strong style={{ color: "var(--text-heading)" }}>{alt.patientId}</strong>
                            </td>
                            <td>
                              <span className="badge badge-ai" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                                <AlertTriangle size={12} /> {alt.riskLevel || "High Risk"}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: "#ef4444", fontFamily: "var(--font-mono)" }}>
                                {alt.probability ? `${(alt.probability * 100).toFixed(1)}%` : "88.7%"}
                              </strong>
                            </td>
                            <td>
                              <span className="status-pill warning">{alt.status || "NEW"}</span>
                            </td>
                            <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                              {alt.dateTime || alt.timestamp || "Recent"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI INFRASTRUCTURE DIAGNOSTICS */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Predictive System Architecture & Diagnostics</h3>
                    <p>FastAPI backend service and early warning model inference parameters</p>
                  </div>
                  <span className="badge badge-live">● SYSTEM HEALTHY</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  <div className="meta-item">
                    <span>Model Architecture</span>
                    <strong>Predictive Model</strong>
                  </div>
                  <div className="meta-item">
                    <span>Decision Threshold</span>
                    <strong>0.50 (50.0%)</strong>
                  </div>
                  <div className="meta-item">
                    <span>Time Window</span>
                    <strong>6 Steps</strong>
                  </div>
                  <div className="meta-item">
                    <span>Feature Vector</span>
                    <strong>39 Variables</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RECENT AUDIT LOGS & STAFF SUMMARY */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* STAFF DIRECTORY QUICK CARD */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Staff Management Summary</h3>
                    <p>Configured clinical roles</p>
                  </div>
                  <button className="btn-secondary" onClick={() => navigate("/admin/users")} style={{ padding: "4px 8px", fontSize: "11px" }}>
                    Open Directory
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-main)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Stethoscope size={16} style={{ color: "var(--primary)" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>Doctor Accounts</span>
                    </div>
                    <strong style={{ color: "var(--primary)" }}>{doctorsList.length} Registered</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-main)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CreditCard size={16} style={{ color: "#10b981" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>Nurse Staff IDs</span>
                    </div>
                    <strong style={{ color: "#10b981" }}>{nurseRegistry.length} Registered</strong>
                  </div>
                </div>
              </div>

              {/* RECENT SECURITY AUDIT LOG FEED */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Recent System Audit Logs</h3>
                    <p>Administrative security event log</p>
                  </div>
                  <Link to="/admin/audit-logs" className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px", textDecoration: "none" }}>
                    View All
                  </Link>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {auditLogsList.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No audit events logged yet.</span>
                  ) : (
                    auditLogsList.map((log, idx) => (
                      <div key={log.id || idx} style={{ padding: "8px 10px", background: "var(--bg-main)", borderRadius: "6px", fontSize: "12px" }}>
                        <strong style={{ display: "block", color: "var(--text-heading)", fontSize: "12px" }}>{log.action}</strong>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{log.user || "Admin"} &bull; {log.entity || log.target}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          PAGE VIEW 2: USER MANAGEMENT & STAFF DIRECTORY (/admin/users)
      ========================================================= */}
      {isUsersRoute && (
        <>
          {/* PAGE TITLE */}
          <div className="page-title-row">
            <div>
              <h2>Clinical User Management & Staff Directory</h2>
              <p>
                User management directory, clinical staff registry, identity verification, and role access control
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="badge badge-ai" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                <ShieldCheck size={14} /> ADMIN MASTER CONTROL
              </span>

              <button
                className="btn-primary"
                onClick={() => setShowAddDoctorModal(true)}
                style={{ width: "auto", fontSize: "12px" }}
              >
                <Stethoscope size={14} /> Add Doctor
              </button>

              <button
                className="btn-primary"
                onClick={() => setShowAddNurseModal(true)}
                style={{ width: "auto", fontSize: "12px", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" }}
              >
                <CreditCard size={14} /> Add Nurse
              </button>
            </div>
          </div>

          {/* STAT CARDS GRID */}
          <section className="stats-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            <div className="stat-card purple" style={{ padding: "14px 16px" }}>
              <div className="stat-icon purple" style={{ width: "38px", height: "38px" }}>
                <Users size={20} />
              </div>
              <div className="stat-info">
                <span style={{ fontSize: "11px" }}>REGISTERED STAFF</span>
                <strong style={{ fontSize: "18px" }}>{totalRegisteredStaffCount} Total</strong>
                <small style={{ fontSize: "10px" }}>Accounts & Registry</small>
              </div>
            </div>

            <div className="stat-card blue" style={{ padding: "14px 16px" }}>
              <div className="stat-icon blue" style={{ width: "38px", height: "38px" }}>
                <Stethoscope size={20} />
              </div>
              <div className="stat-info">
                <span style={{ fontSize: "11px" }}>Total Doctors</span>
                <strong style={{ fontSize: "18px" }}>{doctorsList.length} Doctors</strong>
                <small style={{ fontSize: "10px" }}>Doctor Accounts</small>
              </div>
            </div>

            <div className="stat-card green" style={{ padding: "14px 16px" }}>
              <div className="stat-icon green" style={{ width: "38px", height: "38px" }}>
                <CreditCard size={20} />
              </div>
              <div className="stat-info">
                <span style={{ fontSize: "11px" }}>Total Nurses</span>
                <strong style={{ fontSize: "18px" }}>{nurseRegistry.length} Nurse IDs</strong>
                <small style={{ fontSize: "10px" }}>Staff Registry</small>
              </div>
            </div>

            <div className="stat-card orange" style={{ padding: "14px 16px" }}>
              <div className="stat-icon orange" style={{ width: "38px", height: "38px" }}>
                <Database size={20} />
              </div>
              <div className="stat-info">
                <span style={{ fontSize: "11px" }}>Total Patients</span>
                <strong style={{ fontSize: "18px" }}>{patients.length} Patients</strong>
                <small style={{ fontSize: "10px" }}>ICU Registry</small>
              </div>
            </div>

            <div className="stat-card purple" style={{ padding: "14px 16px" }}>
              <div className="stat-icon purple" style={{ width: "38px", height: "38px" }}>
                <Activity size={20} />
              </div>
              <div className="stat-info">
                <span style={{ fontSize: "11px" }}>Total Predictions</span>
                <strong style={{ fontSize: "18px" }}>{historyLogs.length} Evaluated</strong>
                <small style={{ fontSize: "10px" }}>Sequence Runs</small>
              </div>
            </div>

            <div className="stat-card danger" style={{ padding: "14px 16px", borderColor: "rgba(239, 68, 68, 0.3)" }}>
              <div className="stat-icon danger" style={{ width: "38px", height: "38px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                <BellRing size={20} />
              </div>
              <div className="stat-info">
                <span style={{ fontSize: "11px" }}>Active Alerts</span>
                <strong style={{ fontSize: "18px", color: "#ef4444" }}>{activeAlertsCount} Sepsis</strong>
                <small style={{ fontSize: "10px" }}>Requires Assessment</small>
              </div>
            </div>
          </section>

          {/* USER MANAGEMENT DIRECTORY CONTAINER */}
          <div className="table-card" style={{ marginTop: "12px", overflow: "visible" }}>
            {/* TABLE CONTROLS & HEADER */}
            <div className="table-header" style={{ flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-main)", paddingBottom: "16px" }}>
              <div>
                <h3>User Management Directory</h3>
                <p>Manage application accounts, doctor credentials, and nurse staff ID card records</p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                {/* ROLE FILTER DROPDOWN */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Filter size={14} style={{ color: "var(--text-muted)" }} />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                      padding: "7px 12px",
                      fontSize: "13px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-main)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-main)",
                      fontWeight: 500
                    }}
                  >
                    <option value="All">All Roles</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                {/* SEARCH USER INPUT */}
                <div className="search-input-wrapper">
                  <Search size={16} />
                  <input
                    placeholder="Search user, name, email, role, ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* USER TABLE */}
            <div className="table-wrapper" style={{ overflowX: "auto", overflowY: "visible" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email / Identifier</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Last Login / Entry</th>
                    <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                        <Info size={24} style={{ display: "block", margin: "0 auto 8px", opacity: 0.6 }} />
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isDoctor = u.itemType === "DOCTOR";
                      const isNurse = u.itemType === "NURSE";
                      const isAdmin = u.itemType === "ADMIN";

                      return (
                        <tr key={`${u.itemType}_${u.id}`}>
                          {/* NAME */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: isDoctor
                                    ? "rgba(14, 165, 233, 0.15)"
                                    : isNurse
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(139, 92, 246, 0.15)",
                                  color: isDoctor ? "#0ea5e9" : isNurse ? "#10b981" : "#a78bfa",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px",
                                  fontWeight: 700
                                }}
                              >
                                {u.name.replace("Dr.", "").trim().substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text-heading)", fontSize: "13px" }}>{u.name}</strong>
                                {isDoctor && u.title && (
                                  <small style={{ display: "block", color: "var(--text-muted)", fontSize: "11px" }}>{u.title}</small>
                                )}
                                {isNurse && (
                                  <small style={{ display: "block", color: "var(--text-muted)", fontSize: "11px" }}>
                                    Shift: {u.shiftStart} - {u.shiftEnd}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* EMAIL / IDENTIFIER */}
                          <td>
                            {isDoctor ? (
                              <div>
                                <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{u.displayEmail}</span>
                                <small style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                                  Hospital ID: {u.displayId}
                                </small>
                              </div>
                            ) : isNurse ? (
                              <div>
                                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#10b981" }}>
                                  Staff ID: {u.displayId}
                                </strong>
                                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>
                                  Staff ID / Hospital Card (No Password)
                                </small>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: "12px" }}>{u.displayEmail}</span>
                                <small style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>Master Admin</small>
                              </div>
                            )}
                          </td>

                          {/* ROLE */}
                          <td>
                            <span
                              className="badge"
                              style={{
                                fontSize: "11px",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                background: isDoctor
                                  ? "rgba(14, 165, 233, 0.12)"
                                  : isNurse
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : "rgba(139, 92, 246, 0.12)",
                                color: isDoctor ? "#0ea5e9" : isNurse ? "#10b981" : "#a78bfa",
                                border: `1px solid ${isDoctor ? "rgba(14,165,233,0.3)" : isNurse ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.3)"}`
                              }}
                            >
                              {isDoctor && <Stethoscope size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />}
                              {isNurse && <CreditCard size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />}
                              {isAdmin && <ShieldCheck size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />}
                              {u.displayRole}
                            </span>
                          </td>

                          {/* DEPARTMENT */}
                          <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {u.displayDepartment}
                          </td>

                          {/* STATUS */}
                          <td>
                            <span
                              className={`status-pill ${
                                u.displayStatus === "ACTIVE" || u.displayStatus === "VERIFIED"
                                  ? "success"
                                  : u.displayStatus === "UNDER REVIEW" || u.displayStatus === "PENDING"
                                  ? "warning"
                                  : "danger"
                              }`}
                            >
                              {u.displayStatus === "ACTIVE" || u.displayStatus === "VERIFIED" ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <AlertTriangle size={12} />
                              )}
                              {u.displayStatus}
                            </span>
                          </td>

                          {/* LAST LOGIN / LAST ENTRY */}
                          <td>
                            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                              <span style={{ display: "block", color: "var(--text-primary)" }}>{u.lastActivityVal}</span>
                              <small style={{ fontSize: "10px", color: "var(--text-muted)" }}>{u.lastActivityLabel}</small>
                            </div>
                          </td>

                          {/* ACTIONS DROPDOWN */}
                          <td style={{ textAlign: "right", position: "relative" }}>
                            <div style={{ display: "inline-block", position: "relative" }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === u.id ? null : u.id);
                                }}
                                style={{
                                  padding: "5px 10px",
                                  fontSize: "12px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <span>Actions</span>
                                <ChevronDown size={13} />
                              </button>

                              {/* DROPDOWN MENU OVERLAY */}
                              {activeMenuId === u.id && (
                                <div
                                  ref={menuRef}
                                  style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "100%",
                                    marginTop: "4px",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border-main)",
                                    borderRadius: "var(--radius-md)",
                                    boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                                    width: "190px",
                                    zIndex: 1200,
                                    padding: "6px 0",
                                    textAlign: "left"
                                  }}
                                >
                                  {/* VIEW DETAILS */}
                                  <button
                                    type="button"
                                    style={{
                                      width: "100%",
                                      padding: "8px 14px",
                                      fontSize: "12px",
                                      background: "none",
                                      border: "none",
                                      color: "var(--text-primary)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      cursor: "pointer"
                                    }}
                                    onClick={() => {
                                      setViewUserModalData(u);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <Eye size={14} style={{ color: "var(--primary)" }} /> View Details
                                  </button>

                                  {/* EDIT DOCTOR */}
                                  {isDoctor && (
                                    <button
                                      type="button"
                                      style={{
                                        width: "100%",
                                        padding: "8px 14px",
                                        fontSize: "12px",
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => {
                                        setEditDocModalData(u);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Edit size={14} style={{ color: "#a78bfa" }} /> Edit Doctor
                                    </button>
                                  )}

                                  {/* LINK HOSPITAL ID FOR DOCTOR */}
                                  {isDoctor && (!u.hospitalId || u.idStatus === "NOT_ISSUED") && (
                                    <button
                                      type="button"
                                      style={{
                                        width: "100%",
                                        padding: "8px 14px",
                                        fontSize: "12px",
                                        background: "none",
                                        border: "none",
                                        color: "var(--primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => {
                                        setSelectedDocForIdLink(u);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Link2 size={14} /> Link Hospital ID
                                    </button>
                                  )}

                                  {/* EDIT NURSE */}
                                  {isNurse && (
                                    <button
                                      type="button"
                                      style={{
                                        width: "100%",
                                        padding: "8px 14px",
                                        fontSize: "12px",
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => {
                                        setEditNurseModalData(u);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Edit size={14} style={{ color: "#10b981" }} /> Edit Nurse & Shift
                                    </button>
                                  )}

                                  {/* TOGGLE ENABLE / DISABLE */}
                                  {!isAdmin && (
                                    <button
                                      type="button"
                                      style={{
                                        width: "100%",
                                        padding: "8px 14px",
                                        fontSize: "12px",
                                        background: "none",
                                        border: "none",
                                        color: u.displayStatus === "ACTIVE" ? "#ef4444" : "#10b981",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => {
                                        setConfirmToggleModalData({ item: u, targetType: u.itemType });
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Power size={14} />
                                      {u.displayStatus === "ACTIVE"
                                        ? isNurse
                                          ? "Disable Nurse ID"
                                          : "Disable Account"
                                        : isNurse
                                        ? "Enable Nurse ID"
                                        : "Enable Account"}
                                    </button>
                                  )}

                                  {/* VIEW ACCESS HISTORY */}
                                  <button
                                    type="button"
                                    style={{
                                      width: "100%",
                                      padding: "8px 14px",
                                      fontSize: "12px",
                                      background: "none",
                                      border: "none",
                                      color: "var(--text-muted)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      cursor: "pointer"
                                    }}
                                    onClick={() => {
                                      setHistoryModalData(u);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <HistoryIcon size={14} /> View Session History
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          MODAL 1: ADD DOCTOR ACCOUNT
      ========================================================= */}
      {showAddDoctorModal && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "580px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Register Doctor Account</h2>
              <p>Official physician onboarding and identity documentation</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowAddDoctorModal(false)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleAddDoctorSubmit} style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Doctor Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alex Vance"
                  value={newDocForm.name}
                  onChange={(e) => setNewDocForm({ ...newDocForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Clinical Email *</label>
                <input
                  type="email"
                  placeholder="alex.vance@icu-hospital.org"
                  value={newDocForm.email}
                  onChange={(e) => setNewDocForm({ ...newDocForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={newDocForm.specialization}
                  onChange={(e) => setNewDocForm({ ...newDocForm, specialization: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Professional Title</label>
                <input
                  type="text"
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Medical Registration / License No.</label>
                <input
                  type="text"
                  placeholder="e.g. REG-MC-88021"
                  value={newDocForm.registrationNumber}
                  onChange={(e) => setNewDocForm({ ...newDocForm, registrationNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newDocForm.phone}
                  onChange={(e) => setNewDocForm({ ...newDocForm, phone: e.target.value })}
                />
              </div>
            </div>

            {/* NEW DOCTOR WITHOUT HOSPITAL ID OPTION */}
            <div
              style={{
                background: "var(--bg-main)",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)",
                margin: "12px 0 16px"
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-heading)",
                  margin: 0
                }}
              >
                <input
                  type="checkbox"
                  checked={idNotIssuedYet}
                  onChange={(e) => setIdNotIssuedYet(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                New Doctor - Hospital ID Not Yet Issued
              </label>

              {!idNotIssuedYet ? (
                <div className="form-group" style={{ marginTop: "10px", marginBottom: 0 }}>
                  <label style={{ fontSize: "11px" }}>Hospital ID Card Number</label>
                  <input
                    type="text"
                    placeholder="e.g. HOSP-DOC-9021"
                    value={newDocForm.hospitalId}
                    onChange={(e) => setNewDocForm({ ...newDocForm, hospitalId: e.target.value })}
                  />
                </div>
              ) : (
                <p style={{ fontSize: "11px", color: "var(--warning)", margin: "6px 0 0" }}>
                  Notice: Doctor onboarding can proceed while Hospital ID Card issuance is pending. ID can be linked later.
                </p>
              )}
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAddDoctorModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ width: "auto" }}>
                Submit Doctor Registration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL 2: EDIT DOCTOR ACCOUNT
      ========================================================= */}
      {editDocModalData && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "580px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Edit Doctor Account</h2>
              <p>Update stored credentials for {editDocModalData.name}</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setEditDocModalData(null)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleEditDoctorSubmit} style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Doctor Full Name *</label>
                <input
                  type="text"
                  value={editDocModalData.name || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Clinical Email *</label>
                <input
                  type="email"
                  value={editDocModalData.email || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={editDocModalData.specialization || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, specialization: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Professional Title</label>
                <input
                  type="text"
                  value={editDocModalData.title || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={editDocModalData.department || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Hospital ID Card Number</label>
                <input
                  type="text"
                  placeholder="e.g. HOSP-DOC-9021"
                  value={editDocModalData.hospitalId || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, hospitalId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Medical License Registration</label>
                <input
                  type="text"
                  value={editDocModalData.registrationNumber || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, registrationNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={editDocModalData.phone || ""}
                  onChange={(e) => setEditDocModalData({ ...editDocModalData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" className="btn-secondary" onClick={() => setEditDocModalData(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ width: "auto" }}>
                Save Doctor Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL 3: LINK HOSPITAL ID
      ========================================================= */}
      {selectedDocForIdLink && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "440px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h3>Link Hospital ID Card</h3>
              <p>Update record for {selectedDocForIdLink.name}</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setSelectedDocForIdLink(null)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleLinkHospitalIdSubmit} style={{ padding: "18px 20px" }}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Newly Issued Hospital ID Card Number</label>
              <input
                type="text"
                placeholder="e.g. HOSP-DOC-3042"
                value={linkHospitalIdVal}
                onChange={(e) => setLinkHospitalIdVal(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedDocForIdLink(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ width: "auto" }}>
                <Link2 size={14} /> Link Hospital ID
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL 4: ADD NURSE STAFF REGISTRY RECORD
      ========================================================= */}
      {showAddNurseModal && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "520px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Add Nurse Staff ID Record</h2>
              <p>Register Nurse in Hospital Staff Registry (No application account/password)</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowAddNurseModal(false)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleAddNurseSubmit} style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Nurse Staff ID / Badge No. *</label>
                <input
                  type="text"
                  placeholder="e.g. NUR-8801 or N003"
                  value={newNurseForm.staffId}
                  onChange={(e) => setNewNurseForm({ ...newNurseForm, staffId: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nurse Full Name *</label>
                <input
                  type="text"
                  placeholder="Nurse Full Name, RN"
                  value={newNurseForm.name}
                  onChange={(e) => setNewNurseForm({ ...newNurseForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department / ICU Unit</label>
                <input
                  type="text"
                  value={newNurseForm.department}
                  onChange={(e) => setNewNurseForm({ ...newNurseForm, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Hospital Name</label>
                <input
                  type="text"
                  value={newNurseForm.hospital}
                  onChange={(e) => setNewNurseForm({ ...newNurseForm, hospital: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assigned Shift Start</label>
                <select
                  value={newNurseForm.shiftStart}
                  onChange={(e) => setNewNurseForm({ ...newNurseForm, shiftStart: e.target.value })}
                >
                  <option value="08:00 AM">08:00 AM (Morning Shift)</option>
                  <option value="04:00 PM">04:00 PM (Evening Shift)</option>
                  <option value="12:00 AM">12:00 AM (Night Shift)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Shift End</label>
                <select
                  value={newNurseForm.shiftEnd}
                  onChange={(e) => setNewNurseForm({ ...newNurseForm, shiftEnd: e.target.value })}
                >
                  <option value="04:00 PM">04:00 PM (Morning Shift End)</option>
                  <option value="12:00 AM">12:00 AM (Evening Shift End)</option>
                  <option value="08:00 AM">08:00 AM (Night Shift End)</option>
                </select>
              </div>
            </div>

            <div className="demo-note-box" style={{ marginTop: "12px", marginBottom: "16px", padding: "8px 12px" }}>
              <Info size={14} />
              <span style={{ fontSize: "11px" }}>
                Notice: Nurses have no username/password. Access is validated via Hospital ID Card verification against configured shift hours.
              </span>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAddNurseModal(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "auto", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" }}
              >
                Save Nurse Staff Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL 5: EDIT NURSE STAFF RECORD & SHIFT
      ========================================================= */}
      {editNurseModalData && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "520px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Edit Nurse Record & Shift</h2>
              <p>Staff ID: {editNurseModalData.staffId}</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setEditNurseModalData(null)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleEditNurseSubmit} style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Nurse Full Name *</label>
                <input
                  type="text"
                  value={editNurseModalData.name || ""}
                  onChange={(e) => setEditNurseModalData({ ...editNurseModalData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Staff Badge ID (Read-only)</label>
                <input type="text" value={editNurseModalData.staffId || ""} disabled style={{ opacity: 0.7 }} />
              </div>

              <div className="form-group">
                <label>Department / ICU Unit</label>
                <input
                  type="text"
                  value={editNurseModalData.department || ""}
                  onChange={(e) => setEditNurseModalData({ ...editNurseModalData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Hospital</label>
                <input
                  type="text"
                  value={editNurseModalData.hospital || ""}
                  onChange={(e) => setEditNurseModalData({ ...editNurseModalData, hospital: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assigned Shift Start</label>
                <select
                  value={editNurseModalData.shiftStart || "08:00 AM"}
                  onChange={(e) => setEditNurseModalData({ ...editNurseModalData, shiftStart: e.target.value })}
                >
                  <option value="08:00 AM">08:00 AM (Morning Shift)</option>
                  <option value="04:00 PM">04:00 PM (Evening Shift)</option>
                  <option value="12:00 AM">12:00 AM (Night Shift)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Shift End</label>
                <select
                  value={editNurseModalData.shiftEnd || "04:00 PM"}
                  onChange={(e) => setEditNurseModalData({ ...editNurseModalData, shiftEnd: e.target.value })}
                >
                  <option value="04:00 PM">04:00 PM (Morning Shift End)</option>
                  <option value="12:00 AM">12:00 AM (Evening Shift End)</option>
                  <option value="08:00 AM">08:00 AM (Night Shift End)</option>
                </select>
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" className="btn-secondary" onClick={() => setEditNurseModalData(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "auto", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" }}
              >
                Save Nurse Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL 6: VIEW USER DETAILS CARD
      ========================================================= */}
      {viewUserModalData && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "500px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h2>{viewUserModalData.name}</h2>
              <p>{viewUserModalData.displayRole} Profile Summary</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setViewUserModalData(null)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                background: "var(--bg-main)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-main)",
                marginBottom: "16px"
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Role</span>
                <strong style={{ fontSize: "13px", color: "var(--primary)" }}>{viewUserModalData.displayRole}</strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Status</span>
                <span
                  className={`status-pill ${
                    viewUserModalData.displayStatus === "ACTIVE" || viewUserModalData.displayStatus === "VERIFIED"
                      ? "success"
                      : "warning"
                  }`}
                  style={{ display: "inline-flex", marginTop: "2px" }}
                >
                  {viewUserModalData.displayStatus}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Identifier / ID</span>
                <strong style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                  {viewUserModalData.displayId || viewUserModalData.staffId || "N/A"}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Department</span>
                <span style={{ fontSize: "12px" }}>{viewUserModalData.displayDepartment}</span>
              </div>

              {viewUserModalData.itemType === "DOCTOR" && (
                <>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Specialization</span>
                    <span style={{ fontSize: "12px" }}>{viewUserModalData.specialization || "Critical Care"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>License No.</span>
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                      {viewUserModalData.registrationNumber || "N/A"}
                    </span>
                  </div>
                </>
              )}

              {viewUserModalData.itemType === "NURSE" && (
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Assigned Shift</span>
                  <span style={{ fontSize: "12px" }}>
                    {viewUserModalData.shiftStart} &ndash; {viewUserModalData.shiftEnd}
                  </span>
                </div>
              )}

              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                  {viewUserModalData.lastActivityLabel}
                </span>
                <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                  {viewUserModalData.lastActivityVal}
                </span>
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setViewUserModalData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 7: CONFIRM ENABLE / DISABLE ACTION
      ========================================================= */}
      {confirmToggleModalData && (
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
            border: "1px solid rgba(239, 68, 68, 0.4)"
          }}
        >
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={22} style={{ color: "#ef4444" }} />
              <div>
                <h2>
                  Confirm {confirmToggleModalData.item.displayStatus === "ACTIVE" ? "Disable" : "Enable"}
                </h2>
                <p>Action confirmation required</p>
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setConfirmToggleModalData(null)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "18px 20px" }}>
            <p style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "16px", lineHeight: 1.5 }}>
              Are you sure you want to{" "}
              <strong>
                {confirmToggleModalData.item.displayStatus === "ACTIVE" ? "disable" : "enable"}
              </strong>{" "}
              {confirmToggleModalData.targetType === "NURSE" ? "Nurse Staff ID" : "Doctor Account"}{" "}
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                {confirmToggleModalData.item.name}
              </span>{" "}
              ({confirmToggleModalData.item.displayId})?
            </p>

            {confirmToggleModalData.item.displayStatus === "ACTIVE" && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#ef4444",
                  marginBottom: "16px"
                }}
              >
                Notice: Record will NOT be deleted. When disabled, access authorization will fail.
              </div>
            )}

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setConfirmToggleModalData(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmToggleStatus}
                style={{
                  width: "auto",
                  background:
                    confirmToggleModalData.item.displayStatus === "ACTIVE"
                      ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                      : "var(--primary-gradient)"
                }}
              >
                {confirmToggleModalData.item.displayStatus === "ACTIVE" ? "Yes, Disable" : "Yes, Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 8: VIEW ACCESS SESSION HISTORY FOR USER
      ========================================================= */}
      {historyModalData && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "680px",
            zIndex: 1500,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-main)"
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Access & Session History</h2>
              <p>
                Audit history for {historyModalData.name} ({historyModalData.displayId})
              </p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setHistoryModalData(null)}
              style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "18px 20px" }}>
            {(() => {
              const allHistory = JSON.parse(localStorage.getItem("sepsis_access_history") || "[]");
              const userSessions = allHistory.filter((rec) => {
                const searchKey = (
                  historyModalData.staffId ||
                  historyModalData.id ||
                  historyModalData.hospitalId ||
                  historyModalData.name ||
                  ""
                ).toLowerCase();
                return (
                  String(rec.personName || "").toLowerCase().includes(searchKey) ||
                  String(rec.staffId || rec.personId || rec.accountId || "").toLowerCase().includes(searchKey)
                );
              });

              if (userSessions.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                    <Clock size={24} style={{ margin: "0 auto 8px", display: "block" }} />
                    No session entry/exit records recorded yet for this staff member.
                  </div>
                );
              }

              return (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table style={{ width: "100%", fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userSessions.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{s.date || s.entryDate}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{s.entryTime}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{s.exitTime || "--"}</td>
                          <td>{s.sessionDuration || "Active"}</td>
                          <td>
                            <span className={`status-pill ${s.sessionStatus === "COMPLETED" ? "success" : "warning"}`}>
                              {s.sessionStatus || "ACTIVE"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div className="button-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
              <button className="btn-secondary" onClick={() => setHistoryModalData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
