import mysql from 'mysql2/promise'

const databaseName = process.env.DB_DATABASE || 'tempo_checkin'

if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error('DB_DATABASE chỉ được chứa chữ cái, số và dấu gạch dưới.')
}

const connectionOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  timezone: 'Z',
}

export const pool = mysql.createPool({
  ...connectionOptions,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function initializeDatabase() {
  const bootstrap = await mysql.createConnection(connectionOptions)
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await bootstrap.end()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_sessions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      check_in TIMESTAMP(3) NOT NULL,
      check_out TIMESTAMP(3) NULL DEFAULT NULL,
      project_date DATE NULL,
      active_marker TINYINT GENERATED ALWAYS AS (
        CASE WHEN check_out IS NULL THEN 1 ELSE NULL END
      ) STORED,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_only_one_active_session (active_marker),
      INDEX idx_work_sessions_check_in (check_in),
      INDEX idx_work_sessions_project_date (project_date),
      CONSTRAINT chk_checkout_after_checkin CHECK (check_out IS NULL OR check_out >= check_in)
    ) ENGINE=InnoDB
  `)

  const [sessionColumns] = await pool.execute(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [databaseName, 'work_sessions', 'project_date'],
  )
  if (!sessionColumns.length) {
    await pool.query('ALTER TABLE work_sessions ADD COLUMN project_date DATE NULL AFTER check_out')
  }
  const [projectDateIndexes] = await pool.execute(
    'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
    [databaseName, 'work_sessions', 'idx_work_sessions_project_date'],
  )
  if (!projectDateIndexes.length) {
    await pool.query('CREATE INDEX idx_work_sessions_project_date ON work_sessions (project_date)')
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      minimum_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 360,
      period_start_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
      period_end_day TINYINT UNSIGNED NOT NULL DEFAULT 31,
      fixed_income DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `)


  const [incomeColumns] = await pool.execute(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [databaseName, 'payroll_settings', 'fixed_income'],
  )
  if (!incomeColumns.length) {
    await pool.query('ALTER TABLE payroll_settings ADD COLUMN fixed_income DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 0 AFTER period_end_day')
    const [legacyColumns] = await pool.execute(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [databaseName, 'payroll_settings', 'daily_rate'],
    )
    if (legacyColumns.length) {
      await pool.query('UPDATE payroll_settings SET fixed_income = daily_rate WHERE fixed_income = 0')
    }
  }

  await pool.execute(`
    INSERT INTO payroll_settings (id, minimum_minutes, period_start_day, period_end_day, fixed_income)
    VALUES (1, 360, 1, 31, 0)
    ON DUPLICATE KEY UPDATE id = id
  `)
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
