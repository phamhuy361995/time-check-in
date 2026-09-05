import { MoreHorizontal, Sparkles } from 'lucide-react'
import { NAV_ITEMS } from '../../config/navigation'
import Logo from './Logo'

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] flex-col border-r border-stone-200/80 bg-white px-5 py-7 lg:flex">
      <div className="px-2"><Logo /></div>
      <nav className="mt-12 space-y-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
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
