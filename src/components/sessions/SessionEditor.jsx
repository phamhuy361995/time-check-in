import { useState } from 'react'
import { LoaderCircle, Save, X } from 'lucide-react'
import { getDateInput, getTimeInput, getTodayDateInput } from '../../utils/time'

export default function SessionEditor({ editor, onClose, onSave, saving }) {
  const session = editor.session
  const initialDate = editor.date || (session ? (session.workDate || session.projectDate || getDateInput(session.start)) : getTodayDateInput())
  const [date, setDate] = useState(initialDate)
  const [checkIn, setCheckIn] = useState(session ? getTimeInput(session.start) : '08:00')
  const [checkOut, setCheckOut] = useState(session?.end ? getTimeInput(session.end) : '17:00')
  const [isProjectDay, setIsProjectDay] = useState(session ? (session.isProjectDay ?? Boolean(session.projectDate)) : true)
  const [formError, setFormError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const start = new Date(`${date}T${checkIn}:00`)
    const end = new Date(`${date}T${checkOut}:00`)

    if (!date || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFormError('Vui lòng nhập đầy đủ ngày và giờ làm việc.')
      return
    }
    if (end <= start) {
      setFormError('Giờ check out phải sau giờ check in.')
      return
    }
    if (end.getTime() > Date.now() + 60000) {
      setFormError('Không thể bổ sung thời gian trong tương lai.')
      return
    }

    setFormError('')
    const saveError = await onSave({
      date,
      checkIn: start.toISOString(),
      checkOut: end.toISOString(),
      isProjectDay,
    })
    if (saveError) setFormError(saveError)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="session-editor-title">
      <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={saving ? undefined : onClose} aria-label="Đóng form" />
      <form onSubmit={submit} className="custom-scrollbar relative max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[30px] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="session-editor-title" className="text-lg font-bold tracking-tight">{session ? 'Cập nhật giờ làm việc' : 'Bổ sung giờ còn thiếu'}</h2>
            <p className="mt-1 text-xs leading-5 text-stone-400">Thời gian trùng với phiên đã có sẽ không được lưu.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500 disabled:opacity-50" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <label className="mt-6 block text-xs font-semibold text-stone-600">
          Ngày làm việc
          <input type="date" max={getTodayDateInput()} value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10" />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-stone-600">
            Giờ check in
            <input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10" />
          </label>
          <label className="text-xs font-semibold text-stone-600">
            Giờ check out
            <input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10" />
          </label>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isProjectDay}
          onClick={() => setIsProjectDay((current) => !current)}
          className={`mt-4 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${isProjectDay ? 'border-[#f2bcae] bg-[#fff5f0]' : 'border-stone-200 bg-stone-50'}`}
        >
          <span>
            <span className="block text-sm font-bold">Ngày của dự án</span>
            <span className="mt-0.5 block text-[11px] text-stone-500">{isProjectDay ? 'Ngày này tham gia chia income cố định' : 'Chỉ cộng giờ, không tính income'}</span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${isProjectDay ? 'bg-coral' : 'bg-stone-300'}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${isProjectDay ? 'left-6' : 'left-1'}`} />
          </span>
        </button>

        {formError && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{formError}</p>}

        <button type="submit" disabled={saving} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral text-sm font-bold text-white shadow-button transition hover:bg-[#f08469] disabled:cursor-wait disabled:opacity-70">
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Đang lưu...' : session ? 'Lưu thay đổi' : 'Thêm phiên làm việc'}
        </button>
      </form>
    </div>
  )
}
