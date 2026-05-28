const API_BASE = "http://localhost:8000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export const api = {
  health: {
    check: () => request("/health"),
    full: () => request("/health/full"),
  },

  users: {
    list: (skip = 0, limit = 50) =>
      request(`/api/users?skip=${skip}&limit=${limit}`),
    get: (id) => request(`/api/users/${id}`),
    create: (data) =>
      request("/api/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) =>
      request(`/api/users/${id}`, { method: "DELETE" }),
  },

  rfps: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/rfps?${qs}`);
    },
    get: (id) => request(`/api/rfps/${id}`),
    stats: () => request("/api/rfps/stats/summary"),
  },

  matches: {
    list: (userId, params = {}) => {
      const qs = new URLSearchParams({ user_id: userId, ...params }).toString();
      return request(`/api/matches?${qs}`);
    },
    get: (id) => request(`/api/matches/${id}`),
    markRead: (id) =>
      request(`/api/matches/${id}/read`, { method: "PATCH" }),
    updateStatus: (id, status) =>
      request(`/api/matches/${id}/status?status=${status}`, { method: "PATCH" }),
  },

  drafts: {
    list: (userId, params = {}) => {
      const qs = new URLSearchParams({ user_id: userId, ...params }).toString();
      return request(`/api/drafts?${qs}`);
    },
    get: (id) => request(`/api/drafts/${id}`),
    create: (data) =>
      request("/api/drafts", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/api/drafts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  responses: {
    list: (userId, params = {}) => {
      const qs = new URLSearchParams({ user_id: userId, ...params }).toString();
      return request(`/api/responses?${qs}`);
    },
    get: (id) => request(`/api/responses/${id}`),
    create: (data) =>
      request("/api/responses", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/api/responses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) =>
      request(`/api/responses/${id}`, { method: "DELETE" }),
  },
};
