import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { attachDatabasePool } from '@vercel/functions'

const { Client, Pool } = pg

function buildConnectionString() {
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL

  const host = process.env.POSTGRES_HOST
  const database = process.env.POSTGRES_DATABASE || 'postgres'
  const user = process.env.POSTGRES_USER || 'postgres'
  const password = process.env.POSTGRES_PASSWORD

  if (!host || password === undefined) {
    throw new Error('Thiếu POSTGRES_URL hoặc bộ biến POSTGRES_HOST/POSTGRES_USER/POSTGRES_PASSWORD.')
  }

  const port = Number(process.env.POSTGRES_PORT || 5432)
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`
}

function normalizeConnectionString(connectionString) {
  const url = new URL(connectionString)
  const sslMode = url.searchParams.get('sslmode')

  // node-postgres replaces the explicit `ssl` object when these options are
  // present in the URL, so SSL is configured in one place below.
  for (const parameter of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
    url.searchParams.delete(parameter)
  }

  return { connectionString: url.toString(), sslMode }
}

export function connectionConfig(rawConnectionString) {
  const normalized = normalizeConnectionString(rawConnectionString)
  const sslCa = process.env.POSTGRES_SSL_CA?.replace(/\\n/g, '\n')
  const sslMode = (process.env.POSTGRES_SSL_MODE || normalized.sslMode || 'require').toLowerCase()

  if (sslMode === 'disable') {
    return { connectionString: normalized.connectionString, ssl: false }
  }

  if (['verify-ca', 'verify-full'].includes(sslMode) && !sslCa) {
    throw new Error(`POSTGRES_SSL_CA là bắt buộc khi POSTGRES_SSL_MODE=${sslMode}.`)
  }

  return {
    connectionString: normalized.connectionString,
    ssl: sslCa
      ? { ca: sslCa, rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  }
}

export const pool = new Pool({
  ...connectionConfig(buildConnectionString()),
  max: Number(process.env.POSTGRES_POOL_MAX || 5),
  idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT || 10000),
  connectionTimeoutMillis: Number(process.env.POSTGRES_CONNECT_TIMEOUT || 10000),
  allowExitOnIdle: !process.env.VERCEL,
})

if (process.env.VERCEL) {
  attachDatabasePool(pool)
}

export async function initializeDatabase() {
  const migrationUrl = process.env.POSTGRES_URL_NON_POOLING || buildConnectionString()
  const client = new Client(connectionConfig(migrationUrl))
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')

  await client.connect()
  try {
    await client.query(schema)
  } finally {
    await client.end()
  }
}

export function serializeSession(row) {
  const selectedDate = row.project_date
    ? (typeof row.project_date === 'string' ? row.project_date.slice(0, 10) : new Date(row.project_date).toISOString().slice(0, 10))
    : new Date(new Date(row.check_in).getTime() + Number(process.env.APP_TIMEZONE_OFFSET_MINUTES || 420) * 60000).toISOString().slice(0, 10)
  const isProjectDay = row.is_project_day == null ? Boolean(row.project_date) : Boolean(row.is_project_day)

  return {
    id: row.id,
    start: new Date(row.check_in).getTime(),
    end: row.check_out ? new Date(row.check_out).getTime() : null,
    workDate: selectedDate,
    isProjectDay,
    projectDate: isProjectDay ? selectedDate : null,
  }
}
