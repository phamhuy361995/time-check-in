import { LoaderCircle, LogIn, LogOut } from 'lucide-react'
import { DAY_TARGET, formatDate, formatDuration, formatTime } from '../../utils/time'

export default function CheckCard({ activeSession, now, todayTotal, onToggle, loading, workDate, setWorkDate, isProjectDay, setIsProjectDay }) {
  const isActive = Boolean(activeSession)
  const currentDuration = isActive ? now - Number(activeSession.start) : 0
  const targetProgress = Math.min(100, (todayTotal / DAY_TARGET) * 100)

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-ink px-5 py-6 text-white shadow-card sm:px-8 sm:py-8">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-coral/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[#7fe1ae]' : 'bg-white/30'}`} />
            {isActive ? 'Đang trong giờ làm' : 'Chưa bắt đầu'}
          </div>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.17em] text-white/40">Phiên hiện tại</p>
          <p className="mt-1 font-mono text-[39px] font-semibold leading-tight tracking-[-0.045em] sm:text-[50px]">
            {formatDuration(currentDuration, true)}
          </p>
          {isActive ? (
            <p className="mt-2 text-sm text-white/50">Bắt đầu lúc {formatTime(activeSession.start)}</p>
          ) : (
            <p className="mt-2 text-sm text-white/50">Nhấn nút bên dưới để bắt đầu tính giờ</p>
          )}
        </div>
        <div className="relative hidden h-[78px] w-[78px] shrink-0 place-items-center sm:grid">
          <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
          <div className="absolute inset-[7px] rounded-full" style={{ background: `conic-gradient(#ef795e ${targetProgress * 3.6}deg, rgba(255,255,255,.08) 0deg)` }} />
          <div className="absolute inset-[12px] grid place-items-center rounded-full bg-ink text-xs font-bold">{Math.round(targetProgress)}%</div>
        </div>
      </div>

      {isActive ? (
        <div className="relative mt-6 flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3">
          <span className="text-xs text-white/45">Ngày làm việc</span>
          <span className="text-right text-xs font-bold text-white/80">
            {formatDate(activeSession.workDate || activeSession.projectDate)} · {(activeSession.isProjectDay ?? Boolean(activeSession.projectDate)) ? 'Ngày dự án' : 'Ngày thường'}
          </span>
        </div>
      ) : (
        <div className="relative mt-6 space-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={isProjectDay}
            onClick={() => setIsProjectDay((current) => !current)}
            className="flex w-full items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-xs font-semibold text-white/80">Ngày của dự án</span>
              <span className="mt-0.5 block text-[10px] text-white/40">{isProjectDay ? 'Được tính khi chia income' : 'Chỉ ghi nhận thời gian làm việc'}</span>
            </span>
            <span className={`relative h-6 w-11 rounded-full transition ${isProjectDay ? 'bg-coral' : 'bg-white/15'}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${isProjectDay ? 'left-6' : 'left-1'}`} />
            </span>
          </button>
          <label className="block text-xs font-medium text-white/50">
            Ngày làm việc
            <input
              type="date"
              value={workDate}
              onChange={(event) => setWorkDate(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-coral focus:ring-4 focus:ring-coral/10"
            />
          </label>
        </div>
      )}

      <button
        onClick={() => onToggle(workDate, isProjectDay)}
        disabled={loading}
        className={`relative mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-5 text-sm font-bold transition active:scale-[0.985] ${
          isActive ? 'bg-white text-ink hover:bg-stone-100' : 'bg-coral text-white shadow-button hover:bg-[#f08469]'
        } disabled:cursor-wait disabled:opacity-70`}
      >
        {loading ? <LoaderCircle size={19} className="animate-spin" /> : isActive ? <LogOut size={19} /> : <LogIn size={19} />}
        {loading ? 'ĐANG LƯU...' : isActive ? 'CHECK OUT' : 'CHECK IN'}
      </button>
    </section>
  )
}
