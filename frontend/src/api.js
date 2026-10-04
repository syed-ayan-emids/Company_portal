async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error(data.detail || "unauthorized");
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

export const api = {
  me: () => request("/api/auth/me"),
  login: (username, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  dashboard: () => request("/api/dashboard"),
  projects: () => request("/api/projects"),
  addAction: (title, extra = {}) =>
    request("/api/actions", {
      method: "POST",
      body: JSON.stringify({ title, ...extra }),
    }),
  setActionStatus: (id, status) =>
    request(`/api/actions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  chat: (message) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message }) }),
  chatHistory: () => request("/api/chat/history"),
  clearChat: () => request("/api/chat/history", { method: "DELETE" }),
};

export function fmtDate(dt) {
  const d = new Date(dt);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function fmtTime(dt) {
  const d = new Date(dt);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function fmtShort(dt) {
  const d = new Date(dt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const prefix = sameDay(d, today) ? "Today" : sameDay(d, tomorrow) ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${prefix} · ${time}`;
}

export function timeAgo(dt) {
  const then = new Date(dt);
  const diff = Math.max(0, Date.now() - then.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins === 0 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
