CREATE DATABASE IF NOT EXISTS time_check_in
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE time_check_in;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payroll_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  minimum_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 360,
  period_start_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
  period_end_day TINYINT UNSIGNED NOT NULL DEFAULT 31,
  fixed_income DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO payroll_settings (id, minimum_minutes, period_start_day, period_end_day, fixed_income)
VALUES (1, 360, 1, 31, 0)
ON DUPLICATE KEY UPDATE id = id;
