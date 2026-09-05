import { BarChart3, Clock3, Sparkles } from 'lucide-react'
import WeekChart from '../components/dashboard/WeekChart'
import { formatDuration, startOfDay } from '../utils/time'

export default function StatisticsPage({ sessions, now }) {
  const completed = sessions.filter((session) => session.end)
  const total = sessions.reduce((sum, session) => sum + (Number(session.end || now) - Number(session.start)), 0)
  const activeDays = new Set(sessions.map((session) => startOfDay(session.start))).size
  const average = activeDays ? total / activeDays : 0
  const longest = completed.reduce((max, session) => Math.max(max, Number(session.end) - Number(session.start)), 0)
  const stats = [
    { label: 'Tổng thời gian', value: formatDuration(total), icon: Clock3, tone: 'bg-[#fff1eb] text-coral' },
    { label: 'Trung bình / ngày', value: formatDuration(average), icon: BarChart3, tone: 'bg-[#eef1ff] text-[#6d78c8]' },
    { label: 'Phiên dài nhất', value: formatDuration(longest), icon: Sparkles, tone: 'bg-[#e8f7ef] text-[#3a9a68]' },
  ]

  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="rounded-[28px] bg-white p-6 shadow-card">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></div>
          <p className="mt-6 text-xs text-stone-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
      ))}
      <div className="sm:col-span-2 xl:col-span-3"><WeekChart sessions={sessions} now={now} /></div>
    </div>
  )
}
