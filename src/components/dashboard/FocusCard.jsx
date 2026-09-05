import { Sparkles } from 'lucide-react'
import { DAY_TARGET, formatDuration } from '../../utils/time'

export default function FocusCard({ todayTotal }) {
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
