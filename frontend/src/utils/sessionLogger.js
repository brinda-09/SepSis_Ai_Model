/**
 * Central Access & Session Logger
 * Stores Doctor Logins/Logouts and Nurse Hospital ID Entries/Exits in `sepsis_access_history`
 */

export const getAccessHistory = () => {
  try {
    const saved = localStorage.getItem("sepsis_access_history");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export const recordAccessSession = (sessionRecord) => {
  try {
    const existing = getAccessHistory();
    const newRecord = {
      id: "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      name: sessionRecord.name || "Staff Member",
      personId: sessionRecord.personId || sessionRecord.staffId || "N/A",
      role: sessionRecord.role || "Nurse",
      accessType: sessionRecord.accessType || "ID Card Entry",
      entryTime: sessionRecord.entryTime || new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      exitTime: sessionRecord.exitTime || "Active Session",
      shift: sessionRecord.shift || "N/A",
      accessStatus: sessionRecord.accessStatus || "Within Shift",
      overrideConfirmation: sessionRecord.overrideConfirmation || "NO",
      sessionDuration: sessionRecord.sessionDuration || "Active",
      sessionStatus: sessionRecord.sessionStatus || "ACTIVE"
    };

    const updated = [newRecord, ...existing];
    localStorage.setItem("sepsis_access_history", JSON.stringify(updated));
    return newRecord;
  } catch (err) {
    console.error("Failed to record access session:", err);
    return null;
  }
};

export const updateNurseSessionExit = (staffId, sessionRecordId) => {
  try {
    const existing = getAccessHistory();
    const now = new Date();
    const exitTimeStr = now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const updated = existing.map((rec) => {
      if ((rec.id === sessionRecordId || (rec.personId === staffId && rec.sessionStatus === "ACTIVE"))) {
        let durationStr = "Session Ended";
        try {
          const entryDate = new Date(rec.entryTime);
          const diffMs = now - entryDate;
          if (!isNaN(diffMs) && diffMs > 0) {
            const mins = Math.floor(diffMs / (1000 * 60));
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            durationStr = hrs > 0 ? `${hrs} hrs ${remMins} mins` : `${remMins} mins`;
          }
        } catch {}

        return {
          ...rec,
          exitTime: exitTimeStr,
          sessionDuration: durationStr,
          sessionStatus: "COMPLETED"
        };
      }
      return rec;
    });

    localStorage.setItem("sepsis_access_history", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to record Nurse exit time:", err);
  }
};
