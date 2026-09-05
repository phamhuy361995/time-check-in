import { CalendarDays, Menu } from 'lucide-react'
import { VIEW_TITLES } from '../../config/navigation'
import { formatFullDate } from '../../utils/time'

export default function Header({ activeView, setMenuOpen }) {
  const [title, subtitle] = VIEW_TITLES[activeView]

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
