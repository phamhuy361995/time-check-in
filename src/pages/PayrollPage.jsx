import { AlertCircle, Banknote, CalendarDays, Check, Clock3, LoaderCircle, Plus, Save } from 'lucide-react'
import EmptyState from '../components/sessions/EmptyState'
import { formatDuration, formatMoney } from '../utils/time'

export default function PayrollPage({ settings, setSettings, payroll, period, onPeriodChange, onSave, saving, loading, onAddSession }) {
  const workedDays = payroll?.days?.filter((day) => day.totalMinutes > 0) || []
  const inputClass = 'mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none transition focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10'
  const formatDay = (date) => new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

  const cards = [
    { label: 'Ngày tham gia', value: `${payroll?.participationDays || 0} ngày`, icon: Check, tone: 'bg-[#e8f7ef] text-[#3a9a68]' },
    { label: 'Income cố định', value: formatMoney(payroll?.fixedIncome), icon: Banknote, tone: 'bg-[#fff1eb] text-coral' },
    { label: 'Tổng thời gian', value: formatDuration((payroll?.totalMinutes || 0) * 60000), icon: Clock3, tone: 'bg-[#eef1ff] text-[#6d78c8]' },
    { label: 'Ngày chưa đủ giờ', value: `${payroll?.unqualifiedWorkedDays || 0} ngày`, icon: AlertCircle, tone: 'bg-[#fff6dc] text-[#af7920]' },
  ]

  return (
    <div className="mt-7 space-y-5">
      <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Kỳ tính công</h2>
            <p className="mt-1 text-xs text-stone-400">Chọn tháng kết thúc của chu kỳ cần xem.</p>
          </div>
          <input
            type="month"
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
            className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-coral"
          />
        </div>
        {payroll?.range && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#fff6f1] px-4 py-3 text-xs font-semibold text-[#9d5a48]">
            <CalendarDays size={16} />
            Chu kỳ: {formatDay(payroll.range.startDate)} → {formatDay(payroll.range.endDate)}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[26px] bg-white p-5 shadow-card">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon size={18} /></div>
            <p className="mt-5 text-xs text-stone-400">{label}</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-[30px] bg-white p-5 shadow-card sm:p-7 xl:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Chi tiết ngày làm việc</h2>
              <p className="mt-1 text-xs text-stone-400">Một ngày đủ công khi tổng thời gian đạt ít nhất {formatDuration(settings.minimumMinutes * 60000)}.</p>
            </div>
            <button onClick={() => onAddSession()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#fff1eb] px-3 text-xs font-bold text-coral transition hover:bg-[#ffe7dc]">
              <Plus size={15} /> <span className="hidden sm:inline">Bổ sung giờ</span>
            </button>
          </div>
          {loading ? (
            <div className="grid h-48 place-items-center text-stone-400"><LoaderCircle className="animate-spin" /></div>
          ) : workedDays.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="custom-scrollbar mt-5 max-h-[430px] divide-y divide-stone-100 overflow-y-auto pr-1">
              {workedDays.map((day) => (
                <div key={day.date} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${day.qualified ? 'bg-[#e8f7ef] text-[#3a9a68]' : 'bg-[#fff6dc] text-[#af7920]'}`}>
                    {day.qualified ? <Check size={19} /> : <Clock3 size={19} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{formatDay(day.date)}</p>
                    <p className={`mt-1 text-xs font-medium ${day.qualified ? 'text-[#3a9a68]' : 'text-[#af7920]'}`}>
                      {day.qualified ? 'Đủ ngày công' : `Còn thiếu ${formatDuration(Math.max(0, settings.minimumMinutes - day.totalMinutes) * 60000)}`}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">{day.projectDay ? 'Ngày dự án · có tính income' : 'Ngoài dự án · không tính income'}</p>
                    {!day.qualified && (
                      <button onClick={() => onAddSession(day.date)} className="mt-2 text-[11px] font-bold text-coral hover:text-[#cf5e46]">+ Bổ sung giờ ngày này</button>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatDuration(day.totalMinutes * 60000)}</p>
                    <p className="mt-1 text-[10px] text-stone-400">{formatMoney(day.allocatedIncome)} / ngày</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[30px] bg-ink p-5 text-white shadow-card sm:p-7 xl:col-span-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-peach"><Banknote size={19} /></div>
            <div>
              <h2 className="font-bold">Cài đặt tính công</h2>
              <p className="mt-1 text-xs text-white/40">Áp dụng cho mọi kỳ hàng tháng.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <label className="text-xs font-medium text-white/60">
              Từ ngày
              <input type="number" min="1" max="31" value={settings.periodStartDay} onChange={(event) => setSettings({ ...settings, periodStartDay: Number(event.target.value) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
            </label>
            <label className="text-xs font-medium text-white/60">
              Đến ngày
              <input type="number" min="1" max="31" value={settings.periodEndDay} onChange={(event) => setSettings({ ...settings, periodEndDay: Number(event.target.value) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
            </label>
          </div>
          <label className="mt-4 block text-xs font-medium text-white/60">
            Số giờ tối thiểu / ngày
            <input type="number" min="0.5" max="24" step="0.5" value={settings.minimumMinutes / 60} onChange={(event) => setSettings({ ...settings, minimumMinutes: Math.round(Number(event.target.value) * 60) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
          </label>
          <label className="mt-4 block text-xs font-medium text-white/60">
            Tổng income cố định (VNĐ)
            <input type="number" min="0" step="100000" value={settings.fixedIncome} onChange={(event) => setSettings({ ...settings, fixedIncome: Number(event.target.value) })} className={`${inputClass} border-white/10 bg-white/[0.07] text-white focus:bg-white/10`} />
          </label>
          <div className="mt-4 rounded-2xl bg-white/[0.06] px-4 py-3 text-xs leading-5 text-white/50">
            {payroll?.participationDays
              ? `${formatMoney(payroll.fixedIncome)} ÷ ${payroll.participationDays} ngày = ${formatMoney(payroll.incomePerDay)} mỗi ngày.`
              : 'Income sẽ được chia đều khi có ngày tham gia dự án trong kỳ.'}
          </div>
          <button onClick={onSave} disabled={saving} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral text-sm font-bold shadow-button transition hover:bg-[#f08469] disabled:cursor-wait disabled:opacity-70">
            {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </section>
      </div>
    </div>
  )
}
