import { useState, type FormEvent } from 'react'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { useI18n } from '../i18n'
import { invokePublic } from '../lib/api'

export function RequestFacultyPage() {
  const [status, setStatus] = useState('')
  const { t } = useI18n()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    await invokePublic('request-faculty', data)
    setStatus('Demo validated · request not stored')
  }
  return <div className="form-page"><div className="form-intro"><span className="eyebrow">PROFILE REQUEST</span><h1>{t('requestTitle')}</h1><p>{t('requestHelp')}</p></div><form className="panel compact-form" onSubmit={submit}>
    <label><span>{t('proposedName')}</span><input name="proposedName" maxLength={160} required /></label>
    <label><span>{t('proposedUniversity')}</span><input name="proposedUniversity" maxLength={200} required /></label>
    <label><span>{t('department')}</span><input name="proposedDepartment" maxLength={200} required /></label>
    <label><span>{t('profileUrl')}</span><input name="officialProfileUrl" type="url" maxLength={500} required placeholder="https://…" /></label>
    <TurnstileWidget action="request_faculty" />{status && <p className="success-panel" role="status">{status}</p>}<button className="button primary">{t('sendRequest')}</button>
  </form></div>
}
