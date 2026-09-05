import { Clock3 } from 'lucide-react'

export default function Logo() {
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
