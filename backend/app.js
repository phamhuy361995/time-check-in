import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import { pool, serializeSession } from './db.js'
import { calculatePayroll, currentPeriod, getPayrollRange } from './payroll.js'

const app = express()
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

function localDateFor(timestamp) {
  const offsetMinutes = Number(process.env.APP_TIMEZONE_OFFSET_MINUTES || 420)
  return new Date(timestamp.getTime() + offsetMinutes * 60 * 1000).toISOString().slice(0, 10)
}

function parseCompletedSession(body = {}) {
  const workDate = body.date
  const checkIn = new Date(body.checkIn)
  const checkOut = new Date(body.checkOut)

  if (!isValidProjectDate(workDate)) {
    return { error: 'Ngày làm việc không hợp lệ.' }
  }
  if (typeof body.isProjectDay !== 'boolean') {
    return { error: 'Vui lòng xác định đây có phải ngày dự án hay không.' }
  }
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { error: 'Giờ check in hoặc check out không hợp lệ.' }
  }
  if (checkOut <= checkIn) {
    return { error: 'Giờ check out phải sau giờ check in.' }
  }
  if (checkOut.getTime() > Date.now() + 60000) {
    return { error: 'Không thể bổ sung thời gian làm việc trong tương lai.' }
  }
  if (localDateFor(checkIn) !== workDate || localDateFor(checkOut) !== workDate) {
    return { error: 'Check in và check out phải nằm trong ngày đã chọn.' }
  }

  return {
    checkIn,
    checkOut,
    projectDate: body.isProjectDay ? workDate : null,
  }
}

async function hasOverlappingSession(checkIn, checkOut, excludedId = null) {
  const { rowCount } = await pool.query(
    `SELECT 1
       FROM public.work_sessions
      WHERE check_in < $2
        AND COALESCE(check_out, 'infinity'::timestamptz) > $1
        AND ($3::uuid IS NULL OR id <> $3::uuid)
      LIMIT 1`,
    [checkIn, checkOut, excludedId],
  )
  return rowCount > 0
}

app.get('/', (_request, response) => {
  response.json({ name: 'Tempo API', status: 'ok', health: '/api/health' })
})

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
  const body = request.body || {}
  const isProjectDay = body.isProjectDay !== false
  const projectDate = isProjectDay ? body.projectDate : null
  if (isProjectDay && !isValidProjectDate(projectDate)) {
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

app.post('/api/sessions', asyncRoute(async (request, response) => {
  const input = parseCompletedSession(request.body)
  if (input.error) return response.status(400).json({ message: input.error })
  if (await hasOverlappingSession(input.checkIn, input.checkOut)) {
    return response.status(409).json({ message: 'Khoảng thời gian này trùng với một phiên làm việc đã có.' })
  }

  const id = randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO public.work_sessions (id, check_in, check_out, project_date)
     VALUES ($1, $2, $3, $4)
     RETURNING id, check_in, check_out, project_date`,
    [id, input.checkIn, input.checkOut, input.projectDate],
  )
  response.status(201).json({ session: serializeSession(rows[0]) })
}))

app.put('/api/sessions/:id', asyncRoute(async (request, response) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.params.id)) {
    return response.status(400).json({ message: 'Mã phiên làm việc không hợp lệ.' })
  }

  const input = parseCompletedSession(request.body)
  if (input.error) return response.status(400).json({ message: input.error })
  if (await hasOverlappingSession(input.checkIn, input.checkOut, request.params.id)) {
    return response.status(409).json({ message: 'Khoảng thời gian này trùng với một phiên làm việc đã có.' })
  }

  const { rows } = await pool.query(
    `UPDATE public.work_sessions
        SET check_in = $1, check_out = $2, project_date = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, check_in, check_out, project_date`,
    [input.checkIn, input.checkOut, input.projectDate, request.params.id],
  )
  if (!rows.length) return response.status(404).json({ message: 'Không tìm thấy phiên làm việc.' })
  response.json({ session: serializeSession(rows[0]) })
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

export default app
