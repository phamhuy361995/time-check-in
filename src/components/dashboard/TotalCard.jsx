import { TimerReset } from 'lucide-react'
import { formatDuration } from '../../utils/time'

export default function TotalCard({ total, todayTotal, sessionsCount }) {
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
