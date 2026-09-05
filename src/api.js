const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không thể kết nối máy chủ.')
  return data
}

export const api = {
  getSessions: () => request('/api/sessions'),
  checkIn: (projectDate, isProjectDay = true) => request('/api/sessions/check-in', { method: 'POST', body: JSON.stringify({ projectDate, isProjectDay }) }),
  checkOut: () => request('/api/sessions/check-out', { method: 'POST' }),
  createSession: (session) => request('/api/sessions', { method: 'POST', body: JSON.stringify(session) }),
  updateSession: (id, session) => request(`/api/sessions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(session) }),
  getSettings: () => request('/api/settings'),
  updateSettings: (settings) => request('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getPayroll: (period) => request(`/api/payroll-summary?period=${encodeURIComponent(period)}`),
}
