export const DAILY_TARGET_HOURS = 6
export const DAY_TARGET = DAILY_TARGET_HOURS * 60 * 60 * 1000

export function startOfDay(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value.getTime()
}

export function endOfDay(date) {
  return startOfDay(date) + 24 * 60 * 60 * 1000
}

export function overlapDuration(session, rangeStart, rangeEnd, now) {
  const start = Math.max(Number(session.start), rangeStart)
  const end = Math.min(Number(session.end || now), rangeEnd)
  return Math.max(0, end - start)
}

export function formatDuration(ms, showSeconds = false) {
  const safeMs = Math.max(0, ms)
  const hours = Math.floor(safeMs / 3600000)
  const minutes = Math.floor((safeMs % 3600000) / 60000)
  const seconds = Math.floor((safeMs % 60000) / 1000)
  if (showSeconds) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return hours ? `${hours}g ${String(minutes).padStart(2, '0')}p` : `${minutes} phút`
}

export function formatTime(timestamp) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

export function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function getCurrentPeriod() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getTodayDateInput() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function getDateInput(timestamp) {
  const date = new Date(timestamp)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function getTimeInput(timestamp) {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatFullDate(date) {
  const value = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date)
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function dayLabel(date) {
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date)
  const fullDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${fullDate}`
}
