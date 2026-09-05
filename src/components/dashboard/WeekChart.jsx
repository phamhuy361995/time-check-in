import { useMemo } from 'react'
import { DAY_TARGET, endOfDay, formatDuration, overlapDuration, startOfDay } from '../../utils/time'

export default function WeekChart({ sessions, now }) {
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
