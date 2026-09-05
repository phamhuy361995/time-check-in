import { useEffect, useState } from 'react'
import { api } from './api'
import ErrorAlert from './components/layout/ErrorAlert'
import Header from './components/layout/Header'
import MobileDrawer from './components/layout/MobileDrawer'
import Sidebar from './components/layout/Sidebar'
import SessionEditor from './components/sessions/SessionEditor'
import HistoryPage from './pages/HistoryPage'
import OverviewPage from './pages/OverviewPage'
import PayrollPage from './pages/PayrollPage'
import StatisticsPage from './pages/StatisticsPage'
import { endOfDay, getCurrentPeriod, getTodayDateInput, overlapDuration, startOfDay } from './utils/time'

const DEFAULT_SETTINGS = {
  minimumMinutes: 360,
  periodStartDay: 1,
  periodEndDay: 31,
  fixedIncome: 0,
}

export default function App() {
  const [sessions, setSessions] = useState([])
  const [now, setNow] = useState(Date.now())
  const [activeView, setActiveView] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [payrollLoading, setPayrollLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [projectDate, setProjectDate] = useState(getTodayDateInput)
  const [isProjectDay, setIsProjectDay] = useState(true)
  const [sessionEditor, setSessionEditor] = useState(null)
  const [sessionSaving, setSessionSaving] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [payroll, setPayroll] = useState(null)

  const activeSession = sessions.find((session) => !session.end)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.getSessions(), api.getSettings(), api.getPayroll(period)])
      .then(([sessionData, settingsData, payrollData]) => {
        if (cancelled) return
        setSessions(sessionData.sessions)
        setSettings(settingsData)
        setPayroll(payrollData)
      })
      .catch((requestError) => {
        if (!cancelled) setError(`${requestError.message} Hãy kiểm tra PostgreSQL và API Node.js.`)
      })
      .finally(() => {
        if (!cancelled) {
          setInitialLoading(false)
          setPayrollLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), activeSession ? 1000 : 30000)
    return () => window.clearInterval(timer)
  }, [activeSession])

  const total = sessions.reduce((sum, session) => sum + Math.max(0, Number(session.end || now) - Number(session.start)), 0)
  const todayStart = startOfDay(now)
  const todayTotal = sessions.reduce((sum, session) => sum + overlapDuration(session, todayStart, endOfDay(now), now), 0)

  const refreshPayroll = async (selectedPeriod = period) => {
    setPayrollLoading(true)
    try {
      const data = await api.getPayroll(selectedPeriod)
      setPayroll(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPayrollLoading(false)
    }
  }

  const toggleSession = async (selectedProjectDate, selectedIsProjectDay) => {
    setActionLoading(true)
    setError('')
    try {
      const data = activeSession ? await api.checkOut() : await api.checkIn(selectedProjectDate, selectedIsProjectDay)
      setNow(Date.now())
      if (activeSession) {
        setSessions((current) => current.map((session) => session.id === data.session.id ? data.session : session))
        setProjectDate(getTodayDateInput())
        setIsProjectDay(true)
      } else {
        setSessions((current) => [...current, data.session])
      }
      await refreshPayroll()
    } catch (requestError) {
      setError(requestError.message)
      try {
        const sessionData = await api.getSessions()
        setSessions(sessionData.sessions)
      } catch {
        // Giữ nguyên giao diện hiện tại nếu API vẫn chưa kết nối lại được.
      }
    } finally {
      setActionLoading(false)
    }
  }

  const changePeriod = (nextPeriod) => {
    if (!nextPeriod) return
    setPeriod(nextPeriod)
    refreshPayroll(nextPeriod)
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    setError('')
    try {
      const data = await api.updateSettings(settings)
      setSettings(data.settings)
      await refreshPayroll(period)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const openNewSession = (date = getTodayDateInput()) => {
    setError('')
    setSessionEditor({ session: null, date })
  }

  const saveSession = async (payload) => {
    setSessionSaving(true)
    setError('')
    try {
      const data = sessionEditor.session
        ? await api.updateSession(sessionEditor.session.id, payload)
        : await api.createSession(payload)

      setSessions((current) => sessionEditor.session
        ? current.map((session) => session.id === data.session.id ? data.session : session)
        : [...current, data.session])
      setNow(Date.now())
      await refreshPayroll()
      setSessionEditor(null)
      return ''
    } catch (requestError) {
      setError(requestError.message)
      return requestError.message
    } finally {
      setSessionSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      {sessionEditor && (
        <SessionEditor
          key={sessionEditor.session?.id || `new-${sessionEditor.date}`}
          editor={sessionEditor}
          onClose={() => setSessionEditor(null)}
          onSave={saveSession}
          saving={sessionSaving}
        />
      )}

      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeView={activeView} setActiveView={setActiveView} />

      <main className="min-h-screen px-4 py-5 sm:px-7 sm:py-7 lg:ml-[238px] lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1250px]">
          <Header activeView={activeView} setMenuOpen={setMenuOpen} />
          <ErrorAlert message={error} onClose={() => setError('')} />

          {activeView === 'overview' && (
            <OverviewPage
              activeSession={activeSession}
              now={now}
              todayTotal={todayTotal}
              total={total}
              sessions={sessions}
              onToggleSession={toggleSession}
              sessionLoading={actionLoading || initialLoading}
              projectDate={projectDate}
              setProjectDate={setProjectDate}
              isProjectDay={isProjectDay}
              setIsProjectDay={setIsProjectDay}
              onViewHistory={() => setActiveView('history')}
              onAddSession={() => openNewSession()}
              onEditSession={(session) => setSessionEditor({ session })}
            />
          )}

          {activeView === 'history' && (
            <HistoryPage
              sessions={sessions}
              now={now}
              onAddSession={() => openNewSession()}
              onEditSession={(session) => setSessionEditor({ session })}
            />
          )}

          {activeView === 'statistics' && <StatisticsPage sessions={sessions} now={now} />}

          {activeView === 'payroll' && (
            <PayrollPage
              settings={settings}
              setSettings={setSettings}
              payroll={payroll}
              period={period}
              onPeriodChange={changePeriod}
              onSave={saveSettings}
              saving={savingSettings}
              loading={payrollLoading}
              onAddSession={openNewSession}
            />
          )}

          <p className="pb-4 pt-8 text-center text-[11px] text-stone-400">Tempo lưu dữ liệu tập trung và an toàn trong cơ sở dữ liệu PostgreSQL.</p>
        </div>
      </main>
    </div>
  )
}
