async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không thể kết nối máy chủ.')
  return data
}

export const api = {
  getSessions: () => request('/api/sessions'),
  checkIn: (projectDate) => request('/api/sessions/check-in', { method: 'POST', body: JSON.stringify({ projectDate }) }),
  checkOut: () => request('/api/sessions/check-out', { method: 'POST' }),
  getSettings: () => request('/api/settings'),
  updateSettings: (settings) => request('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getPayroll: (period) => request(`/api/payroll-summary?period=${encodeURIComponent(period)}`),
}
