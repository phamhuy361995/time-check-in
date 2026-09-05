import { AlertCircle, X } from 'lucide-react'

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null

  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="text-red-400 transition hover:text-red-700" aria-label="Đóng thông báo"><X size={17} /></button>
    </div>
  )
}
