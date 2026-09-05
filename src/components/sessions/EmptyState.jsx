import { Coffee } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center py-9 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-400"><Coffee size={21} /></div>
      <p className="mt-3 text-sm font-semibold">Chưa có phiên làm việc</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-stone-400">Phiên đầu tiên sẽ xuất hiện tại đây sau khi bạn check out.</p>
    </div>
  )
}
