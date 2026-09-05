import { Check, Clock3, Pencil, Plus } from 'lucide-react'
import { dayLabel, formatDuration, formatTime } from '../../utils/time'
import EmptyState from './EmptyState'

export default function SessionList({ sessions, now, limit, expanded = false, onViewAll, onAdd, onEdit }) {
  const visibleSessions = [...sessions].sort((a, b) => Number(b.start) - Number(a.start)).slice(0, limit)

  return (
    <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">{expanded ? 'Tất cả phiên làm việc' : 'Phiên gần đây'}</h2>
          <p className="mt-1 text-xs text-stone-400">Thời gian vào và ra của bạn</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!expanded && sessions.length > 4 && <button onClick={onViewAll} className="hidden text-xs font-bold text-coral transition hover:text-[#cf5e46] sm:block">Xem tất cả</button>}
          {onAdd && (
            <button onClick={onAdd} className="flex h-10 items-center gap-1.5 rounded-xl bg-[#fff1eb] px-3 text-xs font-bold text-coral transition hover:bg-[#ffe7dc]">
              <Plus size={15} /> <span className="hidden sm:inline">Bổ sung giờ</span><span className="sm:hidden">Thêm</span>
            </button>
          )}
        </div>
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
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">{formatDuration(Number(session.end || now) - Number(session.start))}</p>
                  <p className="mt-1 text-[10px] text-stone-400">Thời lượng</p>
                </div>
                {!active && onEdit && (
                  <button onClick={() => onEdit(session)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-400 transition hover:bg-[#fff1eb] hover:text-coral" aria-label="Chỉnh sửa phiên làm việc">
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
