/**
 * Central Audit Logger Utility
 * Records real user actions in localStorage under `sepsis_audit_logs`
 */

export const addAuditLog = ({ action, entity = "System", user = null, role = null }) => {
  try {
    const savedUser = user ? { name: user, role } : JSON.parse(localStorage.getItem("sepsis_user") || "{}");
    const userName = savedUser.name || user || "Clinical System";
    const userRole = savedUser.role || role || "System";

    const newLog = {
      id: Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      user: userName,
      role: userRole,
      action: action,
      entity: entity,
      dateTime: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    };

    const existingLogs = JSON.parse(localStorage.getItem("sepsis_audit_logs") || "[]");
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem("sepsis_audit_logs", JSON.stringify(updatedLogs));

    return newLog;
  } catch (err) {
    console.error("Failed to save audit log:", err);
    return null;
  }
};

export const getAuditLogs = () => {
  try {
    return JSON.parse(localStorage.getItem("sepsis_audit_logs") || "[]");
  } catch {
    return [];
  }
};
