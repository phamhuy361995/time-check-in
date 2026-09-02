import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import { pool, serializeSession } from './db.js'
import { calculatePayroll, currentPeriod, getPayrollRange } from './payroll.js'

export function configureApp(app) {
  app.disable('x-powered-by')
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true)
      return
    }
    const error = new Error('Origin không được phép truy cập API.')
    error.status = 403
    callback(error)
  },
}))
app.use(express.json())

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}

async function getSettings() {
  const { rows } = await pool.query('SELECT minimum_minutes, period_start_day, period_end_day, fixed_income FROM public.payroll_settings WHERE id = 1')
  return rows[0]
}

function isValidProjectDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

app.get('/api/health', asyncRoute(async (_request, response) => {
  await pool.query('SELECT 1')
  response.json({ status: 'ok', database: 'supabase-postgres-connected' })
}))

app.get('/api/sessions', asyncRoute(async (request, response) => {
  const conditions = []
  const values = []

  if (request.query.from) {
    const from = new Date(request.query.from)
    if (Number.isNaN(from.getTime())) return response.status(400).json({ message: 'Thời gian bắt đầu không hợp lệ.' })
    values.push(from)
    conditions.push(`(check_out IS NULL OR check_out >= $${values.length})`)
  }
  if (request.query.to) {
    const to = new Date(request.query.to)
    if (Number.isNaN(to.getTime())) return response.status(400).json({ message: 'Thời gian kết thúc không hợp lệ.' })
    values.push(to)
    conditions.push(`check_in <= $${values.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(`SELECT id, check_in, check_out, project_date FROM public.work_sessions ${where} ORDER BY check_in DESC`, values)
  response.json({ sessions: rows.map(serializeSession) })
}))

app.post('/api/sessions/check-in', asyncRoute(async (request, response) => {
  const projectDate = request.body.projectDate
  if (!isValidProjectDate(projectDate)) {
    return response.status(400).json({ message: 'Vui lòng chọn ngày tham gia dự án hợp lệ.' })
  }
  const id = randomUUID()
  const checkIn = new Date()
  try {
    await pool.query('INSERT INTO public.work_sessions (id, check_in, project_date) VALUES ($1, $2, $3)', [id, checkIn, projectDate])
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'Bạn đang có một phiên làm việc chưa check out.' })
    }
    throw error
  }
  response.status(201).json({ session: { id, start: checkIn.getTime(), end: null, projectDate } })
}))

app.post('/api/sessions/check-out', asyncRoute(async (_request, response) => {
  const connection = await pool.connect()
  try {
    await connection.query('BEGIN')
    const { rows } = await connection.query('SELECT id, check_in, project_date FROM public.work_sessions WHERE check_out IS NULL LIMIT 1 FOR UPDATE')
    if (!rows.length) {
      await connection.query('ROLLBACK')
      return response.status(409).json({ message: 'Không có phiên làm việc nào đang chạy.' })
    }
    const checkOut = new Date()
    await connection.query('UPDATE public.work_sessions SET check_out = $1, updated_at = NOW() WHERE id = $2', [checkOut, rows[0].id])
    await connection.query('COMMIT')
    const session = serializeSession({ ...rows[0], check_out: checkOut })
    response.json({ session })
  } catch (error) {
    await connection.query('ROLLBACK')
    throw error
  } finally {
    connection.release()
  }
}))

app.get('/api/settings', asyncRoute(async (_request, response) => {
  const settings = await getSettings()
  response.json({
    minimumMinutes: settings.minimum_minutes,
    periodStartDay: settings.period_start_day,
    periodEndDay: settings.period_end_day,
    fixedIncome: Number(settings.fixed_income),
  })
}))

app.put('/api/settings', asyncRoute(async (request, response) => {
  const minimumMinutes = Number(request.body.minimumMinutes)
  const periodStartDay = Number(request.body.periodStartDay)
  const periodEndDay = Number(request.body.periodEndDay)
  const fixedIncome = Number(request.body.fixedIncome)

  if (!Number.isInteger(minimumMinutes) || minimumMinutes < 1 || minimumMinutes > 1440) {
    return response.status(400).json({ message: 'Số phút tối thiểu phải từ 1 đến 1440.' })
  }
  if (![periodStartDay, periodEndDay].every((day) => Number.isInteger(day) && day >= 1 && day <= 31)) {
    return response.status(400).json({ message: 'Ngày bắt đầu và kết thúc phải từ 1 đến 31.' })
  }
  if (!Number.isFinite(fixedIncome) || fixedIncome < 0 || fixedIncome > 99999999999999) {
    return response.status(400).json({ message: 'Khoản income cố định không hợp lệ.' })
  }

  await pool.query(
    'UPDATE public.payroll_settings SET minimum_minutes = $1, period_start_day = $2, period_end_day = $3, fixed_income = $4, updated_at = NOW() WHERE id = 1',
    [minimumMinutes, periodStartDay, periodEndDay, fixedIncome],
  )
  response.json({ settings: { minimumMinutes, periodStartDay, periodEndDay, fixedIncome } })
}))

app.get('/api/payroll-summary', asyncRoute(async (request, response) => {
  const settings = await getSettings()
  const period = request.query.period || currentPeriod()
  const range = getPayrollRange(period, settings.period_start_day, settings.period_end_day)
  const { rows: sessions } = await pool.query(
    `SELECT check_in, check_out, project_date FROM public.work_sessions
     WHERE (project_date BETWEEN $1 AND $2)
        OR (project_date IS NULL AND check_in < $3 AND (check_out IS NULL OR check_out > $4))`,
    [range.startDate, range.endDate, new Date(range.endExclusive), new Date(range.start)],
  )
  const payroll = calculatePayroll(sessions, range, settings)

  response.json({
    period,
    range: { startDate: range.startDate, endDate: range.endDate },
    settings: {
      minimumMinutes: settings.minimum_minutes,
      periodStartDay: settings.period_start_day,
      periodEndDay: settings.period_end_day,
      fixedIncome: Number(settings.fixed_income),
    },
    ...payroll,
  })
}))

app.use((error, _request, response, _next) => {
  if (!error.status || error.status >= 500) console.error(error)
  response.status(error.status || 500).json({
    message: error.status === 403 ? error.message : 'Máy chủ gặp lỗi. Vui lòng thử lại.',
  })
})
}
