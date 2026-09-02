import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Save,
  Sparkles,
  TimerReset,
  X,
} from 'lucide-react'
import { api } from './api'

const DAY_TARGET = 8 * 60 * 60 * 1000

const startOfDay = (date) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value.getTime()
}

const endOfDay = (date) => startOfDay(date) + 24 * 60 * 60 * 1000

function overlapDuration(session, rangeStart, rangeEnd, now) {
  const start = Math.max(Number(session.start), rangeStart)
  const end = Math.min(Number(session.end || now), rangeEnd)
  return Math.max(0, end - start)
}

function formatDuration(ms, showSeconds = false) {
  const safeMs = Math.max(0, ms)
  const hours = Math.floor(safeMs / 3600000)
  const minutes = Math.floor((safeMs % 3600000) / 60000)
  const seconds = Math.floor((safeMs % 60000) / 1000)
  if (showSeconds) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return hours ? `${hours}g ${String(minutes).padStart(2, '0')}p` : `${minutes} phút`
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function getCurrentPeriod() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getTodayDateInput() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function formatProjectDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatFullDate(date) {
  const value = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date)
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function dayLabel(date) {
  if (startOfDay(date) === startOfDay(new Date())) return 'Hôm nay'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-ink text-white shadow-lg shadow-black/10">
        <Clock3 size={21} strokeWidth={2.4} />
      </div>
      <div>
        <div className="text-[19px] font-bold leading-none tracking-[-0.04em]">tempo</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Time tracker</div>
      </div>
    </div>
  )
}

function Sidebar({ activeView, setActiveView }) {
  const items = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'statistics', label: 'Thống kê', icon: BarChart3 },
    { id: 'payroll', label: 'Ngày công', icon: Banknote },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] flex-col border-r border-stone-200/80 bg-white px-5 py-7 lg:flex">
      <div className="px-2"><Logo /></div>
      <nav className="mt-12 space-y-2">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeView === id ? 'bg-ink text-white shadow-lg shadow-black/10' : 'text-stone-500 hover:bg-stone-100 hover:text-ink'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-[24px] bg-[#fff3eb] p-4">
        <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white text-coral shadow-sm">
          <Sparkles size={17} />
        </div>
        <p className="text-sm font-bold">Mỗi phút đều đáng giá</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">Tập trung hôm nay, nhẹ nhàng ngày mai.</p>
      </div>
      <div className="mt-6 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-peach text-sm font-bold text-[#9f503e]">NV</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Nhân viên</p>
          <p className="truncate text-xs text-stone-400">Không gian cá nhân</p>
        </div>
        <MoreHorizontal size={17} className="text-stone-400" />
      </div>
    </aside>
  )
}

function Header({ activeView, setMenuOpen }) {
  const titles = {
    overview: ['Chào buổi làm việc!', 'Sẵn sàng cho một ngày hiệu quả?'],
    history: ['Lịch sử làm việc', 'Xem lại những phiên làm việc gần đây.'],
    statistics: ['Thống kê thời gian', 'Một góc nhìn rõ ràng về hiệu suất của bạn.'],
    payroll: ['Ngày công & thu nhập', 'Thiết lập chu kỳ và theo dõi ngày làm việc đủ điều kiện.'],
  }
  const [title, subtitle] = titles[activeView]

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm lg:hidden" aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-[-0.035em] sm:text-2xl">{title}</h1>
          <p className="mt-1 hidden text-sm text-stone-500 sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm sm:px-4">
        <CalendarDays size={17} className="text-coral" />
        <span className="text-xs font-semibold text-stone-600 sm:text-sm">{formatFullDate(new Date())}</span>
      </div>
    </header>
  )
}

function CheckCard({ activeSession, now, todayTotal, onToggle, loading, projectDate, setProjectDate }) {
  const isActive = Boolean(activeSession)
  const currentDuration = isActive ? now - Number(activeSession.start) : 0
  const targetProgress = Math.min(100, (todayTotal / DAY_TARGET) * 100)

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-ink px-5 py-6 text-white shadow-card sm:px-8 sm:py-8">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-coral/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[#7fe1ae]' : 'bg-white/30'}`} />
            {isActive ? 'Đang trong giờ làm' : 'Chưa bắt đầu'}
          </div>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.17em] text-white/40">Phiên hiện tại</p>
          <p className="mt-1 font-mono text-[39px] font-semibold leading-tight tracking-[-0.045em] sm:text-[50px]">
            {formatDuration(currentDuration, true)}
          </p>
          {isActive ? (
            <p className="mt-2 text-sm text-white/50">Bắt đầu lúc {formatTime(activeSession.start)}</p>
          ) : (
            <p className="mt-2 text-sm text-white/50">Nhấn nút bên dưới để bắt đầu tính giờ</p>
          )}
        </div>
        <div className="relative hidden h-[78px] w-[78px] shrink-0 place-items-center sm:grid">
          <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
          <div className="absolute inset-[7px] rounded-full" style={{ background: `conic-gradient(#ef795e ${targetProgress * 3.6}deg, rgba(255,255,255,.08) 0deg)` }} />
          <div className="absolute inset-[12px] grid place-items-center rounded-full bg-ink text-xs font-bold">{Math.round(targetProgress)}%</div>
        </div>
      </div>

      {isActive ? (
        <div className="relative mt-6 flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3">
          <span className="text-xs text-white/45">Ngày tham gia dự án</span>
          <span className="text-xs font-bold text-white/80">{formatProjectDate(activeSession.projectDate)}</span>
        </div>
      ) : (
        <label className="relative mt-6 block text-xs font-medium text-white/50">
          Ngày tham gia dự án
          <input
            type="date"
            value={projectDate}
            onChange={(event) => setProjectDate(event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-coral focus:ring-4 focus:ring-coral/10"
          />
        </label>
      )}

      <button
        onClick={() => onToggle(projectDate)}
        disabled={loading}
        className={`relative mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-5 text-sm font-bold transition active:scale-[0.985] ${
          isActive ? 'bg-white text-ink hover:bg-stone-100' : 'bg-coral text-white shadow-button hover:bg-[#f08469]'
        } disabled:cursor-wait disabled:opacity-70`}
      >
        {loading ? <LoaderCircle size={19} className="animate-spin" /> : isActive ? <LogOut size={19} /> : <LogIn size={19} />}
        {loading ? 'ĐANG LƯU...' : isActive ? 'CHECK OUT' : 'CHECK IN'}
      </button>
    </section>
  )
}

function TotalCard({ total, todayTotal, sessionsCount }) {
  return (
    <section className="rounded-[30px] bg-[#f5ddca] p-6 shadow-card sm:p-7">
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-[#a95b46]">
          <TimerReset size={21} />
        </div>
        <span className="rounded-full bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9a5d4d]">Tổng cộng</span>
      </div>
      <p className="mt-7 text-sm font-medium text-[#8d665b]">Thời gian đã check in</p>
      <p className="mt-1 text-4xl font-bold tracking-[-0.045em] text-[#603d34]">{formatDuration(total)}</p>
      <div className="mt-7 grid grid-cols-2 divide-x divide-[#c99f8d]/35 border-t border-[#c99f8d]/30 pt-5">
        <div>
          <p className="text-xs text-[#936a5e]">Hôm nay</p>
          <p className="mt-1 text-sm font-bold text-[#603d34]">{formatDuration(todayTotal)}</p>
        </div>
        <div className="pl-5">
          <p className="text-xs text-[#936a5e]">Số phiên</p>
          <p className="mt-1 text-sm font-bold text-[#603d34]">{sessionsCount} phiên</p>
        </div>
      </div>
    </section>
  )
}

function WeekChart({ sessions, now }) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const start = startOfDay(date)
      const total = sessions.reduce((sum, session) => sum + overlapDuration(session, start, endOfDay(date), now), 0)
      return {
        date,
        total,
        label: index === 6 ? 'Nay' : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
      }
    })
  }, [sessions, now])
  const max = Math.max(DAY_TARGET, ...days.map((day) => day.total))
  const weekTotal = days.reduce((sum, day) => sum + day.total, 0)

  return (
    <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold">7 ngày gần nhất</p>
          <p className="mt-1 text-xs text-stone-400">Tổng {formatDuration(weekTotal)}</p>
        </div>
        <div className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">Mục tiêu 8g</div>
      </div>
      <div className="mt-7 flex h-36 items-end justify-between gap-2 sm:gap-3">
        {days.map((day, index) => {
          const height = day.total ? Math.max(10, (day.total / max) * 100) : 4
          return (
            <div key={day.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="group relative flex h-full w-full max-w-8 items-end rounded-full bg-stone-100">
                <div
                  className={`w-full rounded-full transition-all ${index === 6 ? 'bg-coral' : 'bg-[#efc7b4]'}`}
                  style={{ height: `${height}%` }}
                />
                {day.total > 0 && <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[9px] text-white group-hover:block">{formatDuration(day.total)}</span>}
              </div>
              <span className={`text-[10px] font-semibold ${index === 6 ? 'text-coral' : 'text-stone-400'}`}>{day.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-9 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-400"><Coffee size={21} /></div>
      <p className="mt-3 text-sm font-semibold">Chưa có phiên làm việc</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-stone-400">Phiên đầu tiên sẽ xuất hiện tại đây sau khi bạn check out.</p>
    </div>
  )
}

function SessionList({ sessions, now, limit, expanded = false, onViewAll }) {
  const visibleSessions = [...sessions].sort((a, b) => Number(b.start) - Number(a.start)).slice(0, limit)

  return (
    <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">{expanded ? 'Tất cả phiên làm việc' : 'Phiên gần đây'}</h2>
          <p className="mt-1 text-xs text-stone-400">Thời gian vào và ra của bạn</p>
        </div>
        {!expanded && sessions.length > 4 && <button onClick={onViewAll} className="text-xs font-bold text-coral transition hover:text-[#cf5e46]">Xem tất cả</button>}
      </div>
      {visibleSessions.length === 0 ? <EmptyState /> : (
        <div className={`custom-scrollbar mt-5 divide-y divide-stone-100 ${expanded ? '' : 'max-h-[318px] overflow-y-auto pr-1'}`}>
          {visibleSessions.map((session) => {
            const active = !session.end
            const sessionDate = session.projectDate ? new Date(`${session.projectDate}T00:00:00`) : new Date(session.start)
            return (
              <div key={session.id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1 sm:gap-4">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${active ? 'bg-[#e8f7ef] text-[#3a9a68]' : 'bg-[#fff1eb] text-coral'}`}>
                  {active ? <Clock3 size={19} /> : <Check size={19} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{dayLabel(sessionDate)}</p>
                    {active && <span className="rounded-full bg-[#e8f7ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3a9a68]">Đang chạy</span>}
                  </div>
                  <p className="mt-1 truncate text-xs text-stone-400">
                    {formatTime(session.start)} <span className="px-1 text-stone-300">→</span> {session.end ? formatTime(session.end) : 'Bây giờ'}
                    {session.projectDate && <span className="ml-2 text-stone-300">• ngày dự án</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatDuration(Number(session.end || now) - Number(session.start))}</p>
                  <p className="mt-1 text-[10px] text-stone-400">Thời lượng</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function FocusCard({ todayTotal }) {
  const remaining = Math.max(0, DAY_TARGET - todayTotal)
  const progress = Math.min(100, (todayTotal / DAY_TARGET) * 100)
  return (
    <section className="rounded-[30px] bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1eb] text-coral"><Sparkles size={18} /></div>
        <div>
          <p className="text-sm font-bold">Mục tiêu hôm nay</p>
          <p className="text-xs text-stone-400">8 giờ làm việc</p>
        </div>
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-stone-400">Còn lại</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{remaining === 0 ? 'Hoàn thành!' : formatDuration(remaining)}</p>
        </div>
        <span className="text-sm font-bold text-coral">{Math.round(progress)}%</span>
      </div>
    </section>
  )
}

function StatisticsView({ sessions, now }) {
  const completed = sessions.filter((session) => session.end)
  const total = sessions.reduce((sum, session) => sum + (Number(session.end || now) - Number(session.start)), 0)
  const activeDays = new Set(sessions.map((session) => startOfDay(session.start))).size
  const average = activeDays ? total / activeDays : 0
  const longest = completed.reduce((max, session) => Math.max(max, Number(session.end) - Number(session.start)), 0)
  const stats = [
    { label: 'Tổng thời gian', value: formatDuration(total), icon: Clock3, tone: 'bg-[#fff1eb] text-coral' },
    { label: 'Trung bình / ngày', value: formatDuration(average), icon: BarChart3, tone: 'bg-[#eef1ff] text-[#6d78c8]' },
    { label: 'Phiên dài nhất', value: formatDuration(longest), icon: Sparkles, tone: 'bg-[#e8f7ef] text-[#3a9a68]' },
  ]
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="rounded-[28px] bg-white p-6 shadow-card">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></div>
          <p className="mt-6 text-xs text-stone-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
      ))}
      <div className="sm:col-span-2 xl:col-span-3"><WeekChart sessions={sessions} now={now} /></div>
    </div>
  )
}

function PayrollView({ settings, setSettings, payroll, period, onPeriodChange, onSave, saving, loading }) {
  const workedDays = payroll?.days?.filter((day) => day.totalMinutes > 0) || []
  const inputClass = 'mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none transition focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10'
  const formatDay = (date) => new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

  const cards = [
    { label: 'Ngày tham gia', value: `${payroll?.participationDays || 0} ngày`, icon: Check, tone: 'bg-[#e8f7ef] text-[#3a9a68]' },
    { label: 'Income cố định', value: formatMoney(payroll?.fixedIncome), icon: Banknote, tone: 'bg-[#fff1eb] text-coral' },
    { label: 'Tổng thời gian', value: formatDuration((payroll?.totalMinutes || 0) * 60000), icon: Clock3, tone: 'bg-[#eef1ff] text-[#6d78c8]' },
    { label: 'Ngày chưa đủ giờ', value: `${payroll?.unqualifiedWorkedDays || 0} ngày`, icon: AlertCircle, tone: 'bg-[#fff6dc] text-[#af7920]' },
  ]

  return (
    <div className="mt-7 space-y-5">
      <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Kỳ tính công</h2>
            <p className="mt-1 text-xs text-stone-400">Chọn tháng kết thúc của chu kỳ cần xem.</p>
          </div>
          <input
            type="month"
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
            className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-coral"
          />
        </div>
        {payroll?.range && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#fff6f1] px-4 py-3 text-xs font-semibold text-[#9d5a48]">
            <CalendarDays size={16} />
            Chu kỳ: {formatDay(payroll.range.startDate)} → {formatDay(payroll.range.endDate)}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[26px] bg-white p-5 shadow-card">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon size={18} /></div>
            <p className="mt-5 text-xs text-stone-400">{label}</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7 xl:col-span-7">
          <div>
            <h2 className="font-bold">Chi tiết ngày làm việc</h2>
            <p className="mt-1 text-xs text-stone-400">Một ngày đủ công khi tổng thời gian đạt ít nhất {formatDuration(settings.minimumMinutes * 60000)}.</p>
          </div>
          {loading ? (
            <div className="grid h-48 place-items-center text-stone-400"><LoaderCircle className="animate-spin" /></div>
          ) : workedDays.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="custom-scrollbar mt-5 max-h-[430px] divide-y divide-stone-100 overflow-y-auto pr-1">
              {workedDays.map((day) => (
                <div key={day.date} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${day.qualified ? 'bg-[#e8f7ef] text-[#3a9a68]' : 'bg-[#fff6dc] text-[#af7920]'}`}>
                    {day.qualified ? <Check size={19} /> : <Clock3 size={19} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{formatDay(day.date)}</p>
                    <p className={`mt-1 text-xs font-medium ${day.qualified ? 'text-[#3a9a68]' : 'text-[#af7920]'}`}>
                      {day.qualified ? 'Đủ ngày công' : `Còn thiếu ${formatDuration(Math.max(0, settings.minimumMinutes - day.totalMinutes) * 60000)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatDuration(day.totalMinutes * 60000)}</p>
                    <p className="mt-1 text-[10px] text-stone-400">{formatMoney(day.allocatedIncome)} / ngày</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[30px] bg-ink p-5 text-white shadow-card sm:p-7 xl:col-span-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-peach"><Banknote size={19} /></div>
            <div>
              <h2 className="font-bold">Cài đặt tính công</h2>
              <p className="mt-1 text-xs text-white/40">Áp dụng cho mọi kỳ hàng tháng.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <label className="text-xs font-medium text-white/60">
              Từ ngày
              <input type="number" min="1" max="31" value={settings.periodStartDay} onChange={(event) => setSettings({ ...settings, periodStartDay: Number(event.target.value) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
            </label>
            <label className="text-xs font-medium text-white/60">
              Đến ngày
              <input type="number" min="1" max="31" value={settings.periodEndDay} onChange={(event) => setSettings({ ...settings, periodEndDay: Number(event.target.value) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
            </label>
          </div>
          <label className="mt-4 block text-xs font-medium text-white/60">
            Số giờ tối thiểu / ngày
            <input type="number" min="0.5" max="24" step="0.5" value={settings.minimumMinutes / 60} onChange={(event) => setSettings({ ...settings, minimumMinutes: Math.round(Number(event.target.value) * 60) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
          </label>
          <label className="mt-4 block text-xs font-medium text-white/60">
            Tổng income cố định (VNĐ)
            <input type="number" min="0" step="100000" value={settings.fixedIncome} onChange={(event) => setSettings({ ...settings, fixedIncome: Number(event.target.value) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
          </label>
          <div className="mt-4 rounded-2xl bg-white/[0.06] px-4 py-3 text-xs leading-5 text-white/50">
            {payroll?.participationDays
              ? `${formatMoney(payroll.fixedIncome)} ÷ ${payroll.participationDays} ngày = ${formatMoney(payroll.incomePerDay)} mỗi ngày.`
              : 'Income sẽ được chia đều khi có ngày tham gia dự án trong kỳ.'}
          </div>
          <button onClick={onSave} disabled={saving} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral text-sm font-bold shadow-button transition hover:bg-[#f08469] disabled:cursor-wait disabled:opacity-70">
            {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </section>
      </div>
    </div>
  )
}

function MobileDrawer({ open, onClose, activeView, setActiveView }) {
  if (!open) return null
  const items = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'statistics', label: 'Thống kê', icon: BarChart3 },
    { id: 'payroll', label: 'Ngày công', icon: Banknote },
  ]
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} aria-label="Đóng menu" />
      <div className="absolute inset-y-0 left-0 w-[285px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><Logo /><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100"><X size={18} /></button></div>
        <nav className="mt-10 space-y-2">
          {items.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setActiveView(id); onClose() }} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${activeView === id ? 'bg-ink text-white' : 'text-stone-500'}`}>
              <Icon size={18} />{label}<ChevronRight size={15} className="ml-auto opacity-50" />
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default function App() {
  const [sessions, setSessions] = useState([])
  const [now, setNow] = useState(Date.now())
  const [activeView, setActiveView] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [payrollLoading, setPayrollLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [projectDate, setProjectDate] = useState(getTodayDateInput)
  const [settings, setSettings] = useState({
    minimumMinutes: 360,
    periodStartDay: 1,
    periodEndDay: 31,
    fixedIncome: 0,
  })
  const [payroll, setPayroll] = useState(null)

  const activeSession = sessions.find((session) => !session.end)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.getSessions(), api.getSettings(), api.getPayroll(period)])
      .then(([sessionData, settingsData, payrollData]) => {
        if (cancelled) return
        setSessions(sessionData.sessions)
        setSettings(settingsData)
        setPayroll(payrollData)
      })
      .catch((requestError) => {
        if (!cancelled) setError(`${requestError.message} Hãy kiểm tra MySQL và API Node.js.`)
      })
      .finally(() => {
        if (!cancelled) {
          setInitialLoading(false)
          setPayrollLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), activeSession ? 1000 : 30000)
    return () => window.clearInterval(timer)
  }, [activeSession])

  const total = sessions.reduce((sum, session) => sum + Math.max(0, Number(session.end || now) - Number(session.start)), 0)
  const todayStart = startOfDay(now)
  const todayTotal = sessions.reduce((sum, session) => sum + overlapDuration(session, todayStart, endOfDay(now), now), 0)

  const refreshPayroll = async (selectedPeriod = period) => {
    setPayrollLoading(true)
    try {
      const data = await api.getPayroll(selectedPeriod)
      setPayroll(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPayrollLoading(false)
    }
  }

  const toggleSession = async (selectedProjectDate) => {
    setActionLoading(true)
    setError('')
    try {
      const data = activeSession ? await api.checkOut() : await api.checkIn(selectedProjectDate)
      setNow(Date.now())
      if (activeSession) {
        setSessions((current) => current.map((session) => session.id === data.session.id ? data.session : session))
        setProjectDate(getTodayDateInput())
      } else {
        setSessions((current) => [...current, data.session])
      }
      await refreshPayroll()
    } catch (requestError) {
      setError(requestError.message)
      try {
        const sessionData = await api.getSessions()
        setSessions(sessionData.sessions)
      } catch {
        // Giữ nguyên giao diện hiện tại nếu API vẫn chưa kết nối lại được.
      }
    } finally {
      setActionLoading(false)
    }
  }

  const changePeriod = (nextPeriod) => {
    if (!nextPeriod) return
    setPeriod(nextPeriod)
    refreshPayroll(nextPeriod)
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    setError('')
    try {
      const data = await api.updateSettings(settings)
      setSettings(data.settings)
      await refreshPayroll(period)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeView={activeView} setActiveView={setActiveView} />
      <main className="min-h-screen px-4 py-5 sm:px-7 sm:py-7 lg:ml-[238px] lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1250px]">
          <Header activeView={activeView} setMenuOpen={setMenuOpen} />

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 transition hover:text-red-700" aria-label="Đóng thông báo"><X size={17} /></button>
            </div>
          )}

          {activeView === 'overview' && (
            <div className="mt-7 grid gap-5 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <CheckCard
                  activeSession={activeSession}
                  now={now}
                  todayTotal={todayTotal}
                  onToggle={toggleSession}
                  loading={actionLoading || initialLoading}
                  projectDate={projectDate}
                  setProjectDate={setProjectDate}
                />
              </div>
              <div className="xl:col-span-5"><TotalCard total={total} todayTotal={todayTotal} sessionsCount={sessions.length} /></div>
              <div className="xl:col-span-7"><SessionList sessions={sessions} now={now} limit={4} onViewAll={() => setActiveView('history')} /></div>
              <div className="grid gap-5 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
                <WeekChart sessions={sessions} now={now} />
                <FocusCard todayTotal={todayTotal} />
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="mt-7"><SessionList sessions={sessions} now={now} limit={sessions.length} expanded /></div>
          )}

          {activeView === 'statistics' && <StatisticsView sessions={sessions} now={now} />}

          {activeView === 'payroll' && (
            <PayrollView
              settings={settings}
              setSettings={setSettings}
              payroll={payroll}
              period={period}
              onPeriodChange={changePeriod}
              onSave={saveSettings}
              saving={savingSettings}
              loading={payrollLoading}
            />
          )}

          <p className="pb-4 pt-8 text-center text-[11px] text-stone-400">Tempo lưu dữ liệu tập trung và an toàn trong cơ sở dữ liệu MySQL.</p>
        </div>
      </main>
    </div>
  )
}
