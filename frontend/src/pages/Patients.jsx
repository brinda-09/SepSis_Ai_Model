import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  X,
  Building2,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  Stethoscope,
  RefreshCw,
  ClipboardList,
  Clock,
  Plus,
  Edit,
  ArrowLeft,
  Check,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { apiGetPatients, apiCreatePatient, apiDeletePatient } from "../api";
import { addAuditLog } from "../utils/auditLogger";

/* =========================================================
   SEED DEFAULT CARE PLANS IF NONE EXIST
========================================================= */
const SEED_CARE_PLANS = {
  "ICU-104": [
    {
      id: "cp-101",
      title: "1. Serum Lactate & Arterial Blood Gas Analysis",
      status: "COMPLETED",
      plannedDate: "2026-09-24",
      plannedTime: "04:30 PM",
      completedDate: "24 Sep 2026",
      completedTime: "05:15 PM",
      completedBy: "Dr. Alex Vance"
    },
    {
      id: "cp-102",
      title: "2. Blood Cultures & IV Fluid Resuscitation (30ml/kg)",
      status: "CURRENT",
      plannedDate: "2026-09-24",
      plannedTime: "06:00 PM",
      assignedDoctor: "Dr. Alex Vance"
    },
    {
      id: "cp-103",
      title: "3. Broad-Spectrum IV Antibiotic Administration",
      status: "UPCOMING",
      plannedDate: "2026-09-24",
      plannedTime: "07:30 PM"
    }
  ],
  "ICU-902": [
    {
      id: "cp-201",
      title: "1. Initial Vitals Assessment & Hemodynamic Monitoring",
      status: "COMPLETED",
      plannedDate: "2026-09-24",
      plannedTime: "03:00 PM",
      completedDate: "24 Sep 2026",
      completedTime: "03:45 PM",
      completedBy: "Dr. Alex Vance"
    },
    {
      id: "cp-202",
      title: "2. Continuous Central Venous Pressure (CVP) Tracking",
      status: "CURRENT",
      plannedDate: "2026-09-24",
      plannedTime: "05:30 PM",
      assignedDoctor: "Dr. Alex Vance"
    }
  ]
};

function Patients() {
  const [currentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_user");
      return saved ? JSON.parse(saved) : { role: "Nurse", name: "ICU Nurse" };
    } catch {
      return { role: "Nurse", name: "ICU Nurse" };
    }
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPatientForCarePlan, setSelectedPatientForCarePlan] = useState(null);

  // Care Plans State by Patient ID
  const [carePlansStore, setCarePlansStore] = useState(() => {
    try {
      const saved = localStorage.getItem("sepsis_care_plans");
      return saved ? JSON.parse(saved) : SEED_CARE_PLANS;
    } catch {
      return SEED_CARE_PLANS;
    }
  });

  const [form, setForm] = useState({
    patientId: "",
    name: "",
    age: "",
    gender: "",
    room: "",
    status: "Monitoring",
  });

  // Doctor Care Plan Add / Edit Form Modal State
  const [showAddCareModal, setShowAddCareModal] = useState(false);
  const [newCareTitle, setNewCareTitle] = useState("");
  const [newCareDate, setNewCareDate] = useState(new Date().toISOString().split("T")[0]);
  const [newCareTime, setNewCareTime] = useState("07:00 PM");

  const isNurse = currentUser?.role === "Nurse";
  const isDoctor = currentUser?.role === "Doctor" || currentUser?.role === "Administrator" || currentUser?.role === "Admin";

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await apiGetPatients();
      setPatients(data);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addPatient = async (e) => {
    e.preventDefault();

    if (!form.patientId || !form.name || !form.age || !form.gender || !form.room) {
      alert("Please fill in all patient details.");
      return;
    }

    const alreadyExists = patients.some(
      (patient) => (patient.patientId || "").toLowerCase() === form.patientId.toLowerCase()
    );

    if (alreadyExists) {
      alert("Patient ID already exists.");
      return;
    }

    const newPatientData = {
      patientId: form.patientId,
      name: form.name,
      age: parseInt(form.age, 10),
      gender: form.gender,
      room: form.room,
      status: form.status,
      admittedBy: currentUser.name || "Staff",
    };

    try {
      await apiCreatePatient(newPatientData);
      await loadPatients();
      addAuditLog({
        action: "Patient Added",
        entity: form.patientId,
        user: currentUser.name,
        role: currentUser.role
      });
    } catch {
      alert("Failed to save patient record.");
    }

    setForm({
      patientId: "",
      name: "",
      age: "",
      gender: "",
      room: "",
      status: "Monitoring",
    });

    setShowForm(false);
  };

  const filteredPatients = (Array.isArray(patients) ? patients : []).filter(
    (patient) => {
      if (!patient) return false;
      const s = (search || "").toLowerCase();
      const pId = String(patient.patientId || "").toLowerCase();
      const pName = String(patient.name || "").toLowerCase();
      const pRoom = String(patient.room || "").toLowerCase();
      return pId.includes(s) || pName.includes(s) || pRoom.includes(s);
    }
  );

  const deletePatient = async (id) => {
    if (isNurse) {
      alert("Permission Notice: Patient record deletion requires Attending Doctor or Administrator authorization.");
      return;
    }

    if (window.confirm("Are you sure you want to remove this patient record?")) {
      await apiDeletePatient(id);
      await loadPatients();
    }
  };

  /* =========================================================
     CARE PLAN HANDLERS (EXACTLY ONE CURRENT TREATMENT RULE)
  ========================================================= */
  const getPatientCarePlan = (pId) => {
    return carePlansStore[pId] || [];
  };

  const savePatientCarePlan = (pId, updatedList) => {
    const newStore = { ...carePlansStore, [pId]: updatedList };
    setCarePlansStore(newStore);
    try {
      localStorage.setItem("sepsis_care_plans", JSON.stringify(newStore));
    } catch (e) {
      console.warn("Could not persist care plan:", e);
    }
  };

  // Doctor Action: Mark current active care activity as COMPLETED
  const handleMarkCareCompleted = (pId, itemIndex) => {
    if (isNurse) return;
    const currentList = [...getPatientCarePlan(pId)];
    const targetItem = currentList[itemIndex];

    if (!targetItem || targetItem.status !== "CURRENT") {
      alert("Only the currently active treatment in progress can be completed.");
      return;
    }

    const now = new Date();
    const completedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const completedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const clinicianName = currentUser.name || "Dr. Alex Vance";

    // 1. Mark target item as COMPLETED
    currentList[itemIndex] = {
      ...targetItem,
      status: "COMPLETED",
      completedDate,
      completedTime,
      completedBy: clinicianName
    };

    // 2. Automatically activate the NEXT upcoming treatment in sequence (if exists)
    if (itemIndex + 1 < currentList.length) {
      currentList[itemIndex + 1] = {
        ...currentList[itemIndex + 1],
        status: "CURRENT",
        assignedDoctor: clinicianName
      };
    }

    savePatientCarePlan(pId, currentList);

    addAuditLog({
      action: "Care Activity Completed",
      entity: `${pId} - ${targetItem.title}`,
      user: clinicianName,
      role: currentUser.role
    });
  };

  // Doctor Action: Add new care activity to sequence
  const handleAddCareActivity = (e) => {
    e.preventDefault();
    if (!newCareTitle.trim()) {
      alert("Please enter a valid care activity description.");
      return;
    }

    const pId = selectedPatientForCarePlan?.patientId;
    if (!pId) return;

    const currentList = [...getPatientCarePlan(pId)];
    const hasCurrentActive = currentList.some((item) => item.status === "CURRENT");

    // If no treatment is currently active, new treatment becomes CURRENT; else UPCOMING
    const newStatus = hasCurrentActive ? "UPCOMING" : "CURRENT";

    const newActivity = {
      id: "cp_" + Date.now(),
      title: `${currentList.length + 1}. ${newCareTitle.trim()}`,
      status: newStatus,
      plannedDate: newCareDate,
      plannedTime: newCareTime,
      assignedDoctor: currentUser.name || "Dr. Alex Vance"
    };

    const updatedList = [...currentList, newActivity];
    savePatientCarePlan(pId, updatedList);

    addAuditLog({
      action: "Care Activity Added",
      entity: `${pId} - ${newCareTitle.trim()}`,
      user: currentUser.name,
      role: currentUser.role
    });

    setNewCareTitle("");
    setShowAddCareModal(false);
  };

  /* =========================================================
     PATIENT CARE PLAN SUB-PAGE / VIEW (SELECTED PATIENT)
  ========================================================= */
  if (selectedPatientForCarePlan) {
    const p = selectedPatientForCarePlan;
    const planItems = getPatientCarePlan(p.patientId);

    const completedItems = planItems.filter((i) => i.status === "COMPLETED");
    const currentItem = planItems.find((i) => i.status === "CURRENT");
    const upcomingItems = planItems.filter((i) => i.status === "UPCOMING");
    const currentItemIndex = planItems.findIndex((i) => i.status === "CURRENT");

    return (
      <div className="page-content">
        {/* PAGE TITLE ROW WITH BACK BUTTON */}
        <div className="page-title-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <button
                className="btn-secondary"
                onClick={() => setSelectedPatientForCarePlan(null)}
                style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <ArrowLeft size={14} /> Back to Patient Registry
              </button>
              <h2 style={{ margin: 0 }}>Patient Care Plan</h2>
            </div>
            <p style={{ margin: 0 }}>
              Treatment and care progress for <strong>{p.name}</strong> ({p.patientId})
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isNurse ? (
              <span className="status-pill warning" style={{ fontSize: "12px" }}>
                <Lock size={13} /> READ ONLY &mdash; Managed by Doctor
              </span>
            ) : (
              <span className="badge badge-ai" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
                <ShieldCheck size={14} /> DOCTOR EDIT & MANAGE
              </span>
            )}
          </div>
        </div>

        {/* PATIENT INFORMATION CARD */}
        <div className="panel" style={{ marginBottom: "20px" }}>
          <div className="panel-header" style={{ marginBottom: "14px" }}>
            <div>
              <h3>Patient Information</h3>
              <p>Demographics and current ICU admission record</p>
            </div>
            <span className={`status-pill ${p.status === "Monitoring" ? "success" : "warning"}`}>
              <CheckCircle2 size={13} /> {p.status || "Monitoring"}
            </span>
          </div>

          <div className="system-info-grid" style={{ padding: "0 0 8px 0" }}>
            <div>
              <span>Patient ID</span>
              <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>{p.patientId}</strong>
            </div>

            <div>
              <span>Patient Name</span>
              <strong>{p.name}</strong>
            </div>

            <div>
              <span>Age / Gender</span>
              <strong>{p.age} yrs / {p.gender}</strong>
            </div>

            <div>
              <span>ICU Location</span>
              <strong>{p.room}</strong>
            </div>

            <div>
              <span>Admitted By</span>
              <strong>{p.admittedBy || "ICU Staff"}</strong>
            </div>
          </div>
        </div>

        {/* CURRENT CARE PLAN (ONE ACTIVE TREATMENT) */}
        <div className="panel" style={{ marginBottom: "20px", border: "1px solid var(--primary-light)", background: "var(--bg-card)" }}>
          <div className="panel-header">
            <div>
              <h3 style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} /> CURRENT CARE PLAN
              </h3>
              <p>Active treatment/care activity requiring immediate clinical monitoring</p>
            </div>

            {isDoctor && (
              <button
                className="btn-primary"
                onClick={() => setShowAddCareModal(true)}
                style={{ padding: "6px 12px", fontSize: "12px", width: "auto" }}
              >
                <Plus size={14} /> Add Care Activity
              </button>
            )}
          </div>

          {!currentItem ? (
            <div className="empty-result" style={{ padding: "24px" }}>
              <div className="empty-icon-wrapper">
                <ClipboardList size={28} />
              </div>
              <h3 style={{ fontSize: "15px" }}>No Current Active Care Activity</h3>
              <p style={{ fontSize: "12px" }}>
                {isNurse
                  ? "Care plan has not yet been documented by the Doctor."
                  : "All current care activities are completed. Click 'Add Care Activity' to document the next plan."}
              </p>
              {isDoctor && (
                <button
                  className="btn-primary"
                  onClick={() => setShowAddCareModal(true)}
                  style={{ width: "auto", marginTop: "12px", fontSize: "12px" }}
                >
                  <Plus size={14} /> Create Care Plan
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: "16px 20px", background: "var(--bg-main)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-main)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Current Active Activity
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-heading)", margin: "4px 0 2px" }}>
                    {currentItem.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                    Assigned Physician: <strong>{currentItem.assignedDoctor || "Dr. Alex Vance"}</strong>
                  </p>
                </div>

                <span className="status-pill danger" style={{ fontSize: "12px", padding: "6px 12px" }}>
                  <span className="pulse-dot red"></span> IN PROGRESS
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", padding: "12px", background: "var(--bg-card)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Planned Date</span>
                  <strong style={{ fontSize: "13px" }}>{currentItem.plannedDate || "Today"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Planned Time</span>
                  <strong style={{ fontSize: "13px" }}>{currentItem.plannedTime || "As Scheduled"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Workflow Rule</span>
                  <strong style={{ fontSize: "13px", color: "var(--primary)" }}>Sequence Enforced</strong>
                </div>
              </div>

              {isDoctor && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleMarkCareCompleted(p.patientId, currentItemIndex)}
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #047857 100%)", width: "auto", fontSize: "13px", padding: "8px 16px" }}
                  >
                    <Check size={16} /> Mark as Completed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARE PROGRESS TRACKER */}
        <div className="panel" style={{ marginBottom: "20px" }}>
          <div className="panel-header">
            <div>
              <h3>Care Progress & Sequence Timeline</h3>
              <p>Strict sequential workflow: Only ONE treatment is active at any given time</p>
            </div>
          </div>

          <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {planItems.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  border:
                    item.status === "CURRENT"
                      ? "1px solid var(--primary)"
                      : item.status === "COMPLETED"
                      ? "1px solid var(--success-border)"
                      : "1px solid var(--border-subtle)",
                  background:
                    item.status === "CURRENT"
                      ? "var(--primary-light)"
                      : item.status === "COMPLETED"
                      ? "var(--success-light)"
                      : "var(--bg-main)",
                  opacity: item.status === "UPCOMING" ? 0.7 : 1
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {item.status === "COMPLETED" ? (
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--success)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={16} />
                    </div>
                  ) : item.status === "CURRENT" ? (
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={16} />
                    </div>
                  ) : (
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--border-main)", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Lock size={15} />
                    </div>
                  )}

                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--text-heading)", display: "block" }}>
                      {item.title}
                    </strong>
                    <small style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {item.status === "COMPLETED"
                        ? `Completed on ${item.completedDate} at ${item.completedTime} by ${item.completedBy || "Doctor"}`
                        : item.status === "CURRENT"
                        ? `In Progress &mdash; Planned: ${item.plannedDate || "Today"} (${item.plannedTime || ""})`
                        : "Locked &mdash; Available after current care activity is completed"}
                    </small>
                  </div>
                </div>

                <div>
                  {item.status === "COMPLETED" && (
                    <span className="status-pill success"><Check size={12} /> Completed</span>
                  )}
                  {item.status === "CURRENT" && (
                    <span className="status-pill danger"><span className="pulse-dot red"></span> Current</span>
                  )}
                  {item.status === "UPCOMING" && (
                    <span className="status-pill warning"><Lock size={12} /> Locked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPLETED CARE HISTORY TABLE */}
        <div className="table-card">
          <div className="table-header">
            <div>
              <h3>Completed Care History</h3>
              <p>Auditable historical record of completed clinical care activities</p>
            </div>
          </div>

          {completedItems.length === 0 ? (
            <div className="empty-result" style={{ padding: "24px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No completed care activities recorded yet for this patient.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Care Activity</th>
                    <th>Status</th>
                    <th>Completed Date</th>
                    <th>Time</th>
                    <th>Completed By</th>
                  </tr>
                </thead>
                <tbody>
                  {completedItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: "var(--text-heading)" }}>{item.title}</strong>
                      </td>
                      <td>
                        <span className="status-pill success"><Check size={12} /> Completed</span>
                      </td>
                      <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>{item.completedDate}</td>
                      <td style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>{item.completedTime}</td>
                      <td><strong>{item.completedBy || "Dr. Alex Vance"}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DOCTOR ADD CARE MODAL */}
        {showAddCareModal && (
          <div className="panel" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "520px", zIndex: 1000, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div className="panel-header">
              <div>
                <h2>Add Care Activity</h2>
                <p>Add a new planned care activity for {p.name}</p>
              </div>
              <button className="btn-secondary" onClick={() => setShowAddCareModal(false)} style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCareActivity}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Care Activity Description</label>
                <input
                  type="text"
                  placeholder="e.g. Broad-Spectrum Antibiotics Administration"
                  value={newCareTitle}
                  onChange={(e) => setNewCareTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div className="form-group">
                  <label>Planned Date</label>
                  <input
                    type="date"
                    value={newCareDate}
                    onChange={(e) => setNewCareDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Planned Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:30 PM"
                    value={newCareTime}
                    onChange={(e) => setNewCareTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="button-row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCareModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: "none" }}>
                  Save Care Activity
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     MAIN PATIENTS REGISTRY TABLE VIEW
  ========================================================= */
  return (
    <div className="page-content">
      {/* PAGE TITLE */}
      <div className="page-title-row">
        <div>
          <h2>Patient Registry & ICU Directory</h2>
          <p>
            {isNurse
              ? "ICU Nursing View — Patient Admission, Room Assignment & Care Plan Tracking"
              : "Active ICU patient admission, care tracking and monitoring records"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isNurse && (
            <span className="badge badge-ai" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <Stethoscope size={13} /> NURSE SHIFT VIEW
            </span>
          )}
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ width: "auto" }}
          >
            {showForm ? <X size={16} /> : <UserPlus size={16} />}
            <span>{showForm ? "Close Form" : "Add New Patient"}</span>
          </button>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <section className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span>Total Registered</span>
            <strong>{patients.length} Patients</strong>
            <small>FastAPI Backend Database</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span>Under Monitoring</span>
            <strong>
              {patients.filter((p) => p.status === "Monitoring").length} Patients
            </strong>
            <small>Real-time Vitals Monitoring</small>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span>High Risk Flag</span>
            <strong>
              {
                (JSON.parse(localStorage.getItem("sepsis_alerts")) || []).filter(
                  (a) => a.status === "Active" || a.status === "NEW"
                ).length
              } Alerts
            </strong>
            <small>Active AI Sepsis Warnings</small>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <span>ICU Station</span>
            <strong>Main Ward</strong>
            <small>Unit Status Active</small>
          </div>
        </div>
      </section>

      {/* ADD PATIENT FORM SLIDE-DOWN */}
      {showForm && (
        <div className="panel patient-form-card" style={{ marginBottom: "28px" }}>
          <div className="panel-header">
            <div>
              <h2>Register New Patient</h2>
              <p>Enter patient demographics and ICU room allocation</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
              style={{ width: "36px", height: "36px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={addPatient}>
            <div className="patient-form-grid">
              <div className="form-group">
                <label>Patient ID</label>
                <input
                  type="text"
                  name="patientId"
                  placeholder="e.g. ICU-005"
                  value={form.patientId}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Patient Full Name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Patient Age (e.g. 54)"
                  value={form.age}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>ICU Room / Bed</label>
                <input
                  type="text"
                  name="room"
                  placeholder="e.g. ICU Bed-12"
                  value={form.room}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Monitoring Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Stable">Stable</option>
                </select>
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: "none" }}>
                Save Patient Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PATIENTS TABLE CARD WITH CARE PLAN COLUMN */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Admitted Patients</h3>
            <p>List of all patient profiles stored in FastAPI backend database</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="btn-secondary" onClick={loadPatients} style={{ padding: "8px 12px", fontSize: "12px" }}>
              <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
            </button>

            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                placeholder="Search ID, Name, Room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="empty-result">
            <div className="empty-icon-wrapper">
              <Users size={32} />
            </div>
            <h3>No Patient Records Found</h3>
            <p>Click "Add New Patient" to register a patient in the ICU system.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>ICU Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th>Care Plan</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id || patient.patientId}>
                    <td>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                        {patient.patientId}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "var(--text-heading)" }}>{patient.name}</strong>
                    </td>
                    <td>{patient.age} yrs</td>
                    <td>{patient.gender}</td>
                    <td>{patient.room}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          patient.status === "Monitoring" ? "success" : "warning"
                        }`}
                      >
                        <CheckCircle2 size={13} /> {patient.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon-danger"
                        onClick={() => deletePatient(patient.id || patient.patientId)}
                        style={isNurse ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                        title={isNurse ? "Deletion restricted for Nurse role" : "Delete patient"}
                      >
                        {isNurse ? <Lock size={13} style={{ marginRight: "4px" }} /> : <Trash2 size={13} style={{ marginRight: "4px" }} />}
                        {isNurse ? "Protected" : "Delete"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        onClick={() => setSelectedPatientForCarePlan(patient)}
                        style={{ padding: "6px 12px", fontSize: "11px", width: "auto" }}
                      >
                        <ClipboardList size={13} /> View Care Plan
                      </button>
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
          Patient records are synchronized live with the FastAPI Python REST API and SQLite database.
        </p>
      </div>
    </div>
  );
}

export default Patients;