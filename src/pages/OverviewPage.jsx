import CheckCard from '../components/dashboard/CheckCard'
import FocusCard from '../components/dashboard/FocusCard'
import TotalCard from '../components/dashboard/TotalCard'
import WeekChart from '../components/dashboard/WeekChart'
import SessionList from '../components/sessions/SessionList'

export default function OverviewPage({
  activeSession,
  now,
  todayTotal,
  total,
  sessions,
  onToggleSession,
  sessionLoading,
  projectDate,
  setProjectDate,
  isProjectDay,
  setIsProjectDay,
  onViewHistory,
  onAddSession,
  onEditSession,
}) {
  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <CheckCard
          activeSession={activeSession}
          now={now}
          todayTotal={todayTotal}
          onToggle={onToggleSession}
          loading={sessionLoading}
          projectDate={projectDate}
          setProjectDate={setProjectDate}
          isProjectDay={isProjectDay}
          setIsProjectDay={setIsProjectDay}
        />
      </div>
      <div className="xl:col-span-5">
        <TotalCard total={total} todayTotal={todayTotal} sessionsCount={sessions.length} />
      </div>
      <div className="xl:col-span-7">
        <SessionList
          sessions={sessions}
          now={now}
          limit={4}
          onViewAll={onViewHistory}
          onAdd={onAddSession}
          onEdit={onEditSession}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
        <WeekChart sessions={sessions} now={now} />
        <FocusCard todayTotal={todayTotal} />
      </div>
    </div>
  )
}
