CREATE TABLE IF NOT EXISTS public.work_sessions (
  id UUID PRIMARY KEY,
  check_in TIMESTAMPTZ(3) NOT NULL,
  check_out TIMESTAMPTZ(3),
  project_date DATE,
  is_project_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_checkout_after_checkin CHECK (check_out IS NULL OR check_out >= check_in)
);

-- `project_date` được giữ tên để tương thích dữ liệu cũ, nhưng từ phiên bản này
-- nó lưu ngày làm việc được chọn cho cả ngày dự án và ngày thường.
ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS is_project_day BOOLEAN;

UPDATE public.work_sessions
SET is_project_day = (project_date IS NOT NULL)
WHERE is_project_day IS NULL;

ALTER TABLE public.work_sessions
  ALTER COLUMN is_project_day SET DEFAULT FALSE,
  ALTER COLUMN is_project_day SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_only_one_active_session
  ON public.work_sessions ((1))
  WHERE check_out IS NULL;

CREATE INDEX IF NOT EXISTS idx_work_sessions_check_in
  ON public.work_sessions (check_in);

CREATE INDEX IF NOT EXISTS idx_work_sessions_project_date
  ON public.work_sessions (project_date);

CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id SMALLINT PRIMARY KEY,
  minimum_minutes SMALLINT NOT NULL DEFAULT 360 CHECK (minimum_minutes BETWEEN 1 AND 1440),
  period_start_day SMALLINT NOT NULL DEFAULT 1 CHECK (period_start_day BETWEEN 1 AND 31),
  period_end_day SMALLINT NOT NULL DEFAULT 31 CHECK (period_end_day BETWEEN 1 AND 31),
  fixed_income NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (fixed_income >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.payroll_settings (
  id, minimum_minutes, period_start_day, period_end_day, fixed_income
)
VALUES (1, 360, 1, 31, 0)
ON CONFLICT (id) DO NOTHING;

-- Backend kết nối trực tiếp bằng Postgres credentials. Không cấp policy cho
-- anon/authenticated nên browser dùng publishable key không thể sửa bảng này.
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;
