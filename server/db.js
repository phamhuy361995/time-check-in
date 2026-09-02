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

function connectionConfig(connectionString) {
  const sslCa = process.env.POSTGRES_SSL_CA?.replace(/\\n/g, '\n')
  return {
    connectionString,
    ...(sslCa ? { ssl: { ca: sslCa, rejectUnauthorized: true } } : {}),
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
  const projectDate = row.project_date
    ? (typeof row.project_date === 'string' ? row.project_date.slice(0, 10) : new Date(row.project_date).toISOString().slice(0, 10))
    : null
  return {
    id: row.id,
    start: new Date(row.check_in).getTime(),
    end: row.check_out ? new Date(row.check_out).getTime() : null,
    projectDate,
  }
}
