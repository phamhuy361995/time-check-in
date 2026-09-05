const offsetMinutes = Number(process.env.APP_TIMEZONE_OFFSET_MINUTES || 420)
const offsetMs = offsetMinutes * 60 * 1000

function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function clampDay(year, monthIndex, day) {
  return Math.min(day, daysInMonth(year, monthIndex))
}

function localMidnightAsUtc(year, monthIndex, day) {
  return Date.UTC(year, monthIndex, day) - offsetMs
}

function localDateLabel(timestamp) {
  return new Date(timestamp + offsetMs).toISOString().slice(0, 10)
}

export function currentPeriod() {
  return new Date(Date.now() + offsetMs).toISOString().slice(0, 7)
}

export function getPayrollRange(period, startDay, endDay) {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error('Kỳ công phải có định dạng YYYY-MM.')
  }

  const [year, month] = period.split('-').map(Number)
  if (month < 1 || month > 12) throw new Error('Tháng không hợp lệ.')
  const endMonthIndex = month - 1
  const crossesMonth = startDay > endDay
  const startMonthIndex = crossesMonth ? endMonthIndex - 1 : endMonthIndex
  const startDate = new Date(Date.UTC(year, startMonthIndex, 1))
  const startYear = startDate.getUTCFullYear()
  const normalizedStartMonth = startDate.getUTCMonth()
  const safeStartDay = clampDay(startYear, normalizedStartMonth, startDay)
  const safeEndDay = clampDay(year, endMonthIndex, endDay)
  const rangeStart = localMidnightAsUtc(startYear, normalizedStartMonth, safeStartDay)
  const rangeEndExclusive = localMidnightAsUtc(year, endMonthIndex, safeEndDay + 1)

  return {
    start: rangeStart,
    endExclusive: rangeEndExclusive,
    startDate: localDateLabel(rangeStart),
    endDate: localDateLabel(rangeEndExclusive - 1),
  }
}

export function calculatePayroll(sessions, range, settings, now = Date.now()) {
  const days = []
  let cursor = range.start

  while (cursor < range.endExclusive) {
    const dayEnd = Math.min(cursor + 24 * 60 * 60 * 1000, range.endExclusive)
    let projectDay = false
    const totalMs = sessions.reduce((sum, session) => {
      const sessionStart = new Date(session.check_in).getTime()
      const sessionEnd = session.check_out ? new Date(session.check_out).getTime() : now
      const projectDate = session.project_date
        ? (typeof session.project_date === 'string' ? session.project_date.slice(0, 10) : new Date(session.project_date).toISOString().slice(0, 10))
        : null
      if (projectDate) {
        if (projectDate !== localDateLabel(cursor)) return sum
        const duration = Math.max(0, sessionEnd - sessionStart)
        if (duration > 0) projectDay = true
        return sum + duration
      }
      return sum + Math.max(0, Math.min(sessionEnd, dayEnd) - Math.max(sessionStart, cursor))
    }, 0)
    const totalMinutes = Math.floor(totalMs / 60000)
    days.push({
      date: localDateLabel(cursor),
      totalMinutes,
      projectDay,
      qualified: totalMinutes >= settings.minimum_minutes,
    })
    cursor = dayEnd
  }

  const participationDays = days.filter((day) => day.projectDay).length
  const qualifiedDays = days.filter((day) => day.qualified).length
  const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0)
  const fixedIncome = Number(settings.fixed_income)
  const incomePerDay = participationDays ? fixedIncome / participationDays : 0

  return {
    days: days.map((day) => ({
      ...day,
      allocatedIncome: day.projectDay ? incomePerDay : 0,
    })),
    participationDays,
    qualifiedDays,
    unqualifiedWorkedDays: days.filter((day) => day.totalMinutes > 0 && !day.qualified).length,
    totalMinutes,
    fixedIncome,
    incomePerDay,
  }
}
