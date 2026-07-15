import { useRef, useState, type FormEvent } from 'react'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { useI18n } from '../i18n'
import { appMode, invokePublic } from '../lib/api'

export function RequestFacultyPage() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const submissionInFlight = useRef(false)
  const { t } = useI18n()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submissionInFlight.current) return
    submissionInFlight.current = true
    setSubmitting(true); setStatus(''); setError('')
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      await invokePublic('request-faculty', data)
      setStatus(appMode === 'demo' ? t('notStored') : t('requestPending'))
      if (appMode === 'live') form.reset()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request failed.')
    } finally {
      if (appMode === 'live') setTurnstileKey((current) => current + 1)
      submissionInFlight.current = false
      setSubmitting(false)
    }
  }
  return <div className="form-page"><div className="form-intro"><span className="eyebrow">PROFILE REQUEST</span><h1>{t('requestTitle')}</h1><p>{t('requestHelp')}</p></div><form className="panel compact-form" onSubmit={submit}>
    {error && <div className="error-panel" role="alert">{error}</div>}
    <label><span>{t('proposedName')}</span><input name="proposedName" maxLength={160} required /></label>
    <label><span>{t('proposedUniversity')}</span><input name="proposedUniversity" maxLength={200} required /></label>
    <label><span>{t('department')}</span><input name="proposedDepartment" maxLength={200} required /></label>
    <label><span>{t('country')}</span><select name="proposedCountry" required><option value="">{t('all')}</option><option>United States</option><option>Canada</option></select></label>
    <label><span>{t('researchAreas')}</span><input name="researchAreas" maxLength={1000} required placeholder="Robot learning, motion planning" /></label>
    <label><span>{t('profileUrl')}</span><input name="officialProfileUrl" type="url" maxLength={500} required placeholder="https://…" /></label>
    <TurnstileWidget key={turnstileKey} action="request_faculty" />{status && <p className="success-panel" role="status">{status}</p>}<button className="button primary" disabled={submitting} aria-busy={submitting}>{t(appMode === 'demo' ? 'sendRequest' : 'sendRequestLive')}</button>
  </form></div>
}
