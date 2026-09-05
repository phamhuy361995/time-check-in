import { ChevronRight, X } from 'lucide-react'
import { NAV_ITEMS } from '../../config/navigation'
import Logo from './Logo'

export default function MobileDrawer({ open, onClose, activeView, setActiveView }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} aria-label="Đóng menu" />
      <div className="absolute inset-y-0 left-0 w-[285px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><Logo /><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100"><X size={18} /></button></div>
        <nav className="mt-10 space-y-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setActiveView(id); onClose() }} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${activeView === id ? 'bg-ink text-white' : 'text-stone-500'}`}>
              <Icon size={18} />{label}<ChevronRight size={15} className="ml-auto opacity-50" />
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
