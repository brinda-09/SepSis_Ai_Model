const API_BASE_URL = "http://127.0.0.1:8000";

// Shared HTTP request helper.
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}:`, err.message);
    throw err;
  }
}

// DATASET API
export async function apiGetDatasetInfo() {
  try {
    return await request("/api/dataset-info");
  } catch {
    return null;
  }
}

export async function apiGetDatasetSamples(index = null, risk = null) {
  try {
    const params = new URLSearchParams();
    if (index !== null && index !== undefined) params.append("index", index);
    if (risk) params.append("risk", risk);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return await request(`/api/dataset-samples${queryStr}`);
  } catch (err) {
    console.warn("Failed to fetch dataset samples from API:", err);
    return null;
  }
}

// PATIENTS API
export async function apiGetPatients() {
  try {
    return await request("/api/patients");
  } catch {
    const saved = localStorage.getItem("sepsis_patients");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function apiCreatePatient(patient) {
  try {
    const data = await request("/api/patients", {
      method: "POST",
      body: JSON.stringify(patient),
    });
    return data;
  } catch (err) {
    // Fallback local storage update
    const saved = JSON.parse(localStorage.getItem("sepsis_patients")) || [];
    const newP = { ...patient, id: Date.now() };
    localStorage.setItem("sepsis_patients", JSON.stringify([newP, ...saved]));
    return newP;
  }
}

export async function apiDeletePatient(id) {
  try {
    return await request(`/api/patients/${id}`, { method: "DELETE" });
  } catch {
    const saved = JSON.parse(localStorage.getItem("sepsis_patients")) || [];
    const updated = saved.filter((p) => p.id !== id && p.patientId !== id);
    localStorage.setItem("sepsis_patients", JSON.stringify(updated));
    return { message: "Deleted locally" };
  }
}

// ALERTS API
export async function apiGetAlerts() {
  try {
    return await request("/api/alerts");
  } catch {
    const saved = localStorage.getItem("sepsis_alerts");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function apiReviewAlert(id, reviewedBy) {
  try {
    return await request(`/api/alerts/${id}/review`, {
      method: "PUT",
      body: JSON.stringify({ reviewedBy }),
    });
  } catch {
    const saved = JSON.parse(localStorage.getItem("sepsis_alerts")) || [];
    const updated = saved.map((a) => (a.id === id ? { ...a, status: "Reviewed" } : a));
    localStorage.setItem("sepsis_alerts", JSON.stringify(updated));
    return { message: "Reviewed locally" };
  }
}

export async function apiDeleteAlert(id) {
  try {
    return await request(`/api/alerts/${id}`, { method: "DELETE" });
  } catch {
    const saved = JSON.parse(localStorage.getItem("sepsis_alerts")) || [];
    const updated = saved.filter((a) => a.id !== id);
    localStorage.setItem("sepsis_alerts", JSON.stringify(updated));
    return { message: "Deleted locally" };
  }
}

// HISTORY API
export async function apiGetHistory() {
  try {
    return await request("/api/history");
  } catch {
    const saved = localStorage.getItem("sepsis_prediction_history");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function apiClearHistory() {
  try {
    return await request("/api/history", { method: "DELETE" });
  } catch {
    localStorage.removeItem("sepsis_prediction_history");
    return { message: "Cleared history locally" };
  }
}

// USERS & AUTH API
export async function apiGetUsers() {
  try {
    return await request("/api/auth/users");
  } catch {
    const saved = localStorage.getItem("sepsis_registered_users");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function apiUpdateUserRole(userId, role, status = "Active") {
  try {
    return await request(`/api/auth/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role, status }),
    });
  } catch {
    const saved = JSON.parse(localStorage.getItem("sepsis_registered_users")) || [];
    const updated = saved.map((u) => (u.id === userId || u.email === userId ? { ...u, role, status } : u));
    localStorage.setItem("sepsis_registered_users", JSON.stringify(updated));
    return { message: "Updated role locally" };
  }
}

export async function apiLogin(email, password, role) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function apiGithubAuthStart() {
  return request("/api/auth/github/start");
}

export async function apiGithubAuthExchange(code) {
  return request("/api/auth/github/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function apiRegister(userData) {
  try {
    return await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  } catch {
    const saved = JSON.parse(localStorage.getItem("sepsis_registered_users")) || [];
    localStorage.setItem("sepsis_registered_users", JSON.stringify([userData, ...saved]));
    return userData;
  }
}
