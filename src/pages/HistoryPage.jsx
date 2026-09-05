import SessionList from '../components/sessions/SessionList'

export default function HistoryPage({ sessions, now, onAddSession, onEditSession }) {
  return (
    <div className="mt-7">
      <SessionList
        sessions={sessions}
        now={now}
        limit={sessions.length}
        expanded
        onAdd={onAddSession}
        onEdit={onEditSession}
      />
    </div>
  )
}
