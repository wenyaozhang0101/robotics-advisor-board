import { useEffect, useRef, useState } from 'react'
import { appMode, invokePublic } from '../lib/api'
import { useI18n } from '../i18n'
import { resetTurnstile } from '../lib/turnstile'
import { TurnstileWidget } from './TurnstileWidget'

const reasons = [
  ['personal_information','Personal information'], ['harassment','Harassment'], ['fabricated_experience','Fabricated experience'],
  ['conflict_of_interest','Conflict of interest'], ['incorrect_faculty','Incorrect faculty'], ['duplicate_review','Duplicate review'],
  ['unsupported_serious_allegation','Unsupported serious allegation'], ['other','Other'],
] as const

export function ReportDialog({ reviewId, open, onClose }: { reviewId: string; open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { t } = useI18n()
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby={`report-title-${reviewId}`}>
      <form method="dialog" className="dialog-form" onSubmit={async (event) => {
        event.preventDefault(); setMessage(''); setError('')
        const form = event.currentTarget
        const data = new FormData(form)
        try {
          await invokePublic('submit-report', { reviewId, reason: data.get('reason'), details: data.get('details'), turnstileToken: data.get('turnstileToken') })
          setMessage(appMode === 'demo' ? t('notStored') : t('reportPending'))
          if (appMode === 'live') resetTurnstile(form)
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'The report failed.')
          if (appMode === 'live') resetTurnstile(form)
        }
      }}>
        <div className="dialog-heading"><h2 id={`report-title-${reviewId}`}>{t('reportReview')}</h2><button type="button" className="icon-button" aria-label={t('cancel')} onClick={onClose}>×</button></div>
        <label>{t('reportReason')}<select name="reason">{reasons.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>{t('reportDetails')}<textarea name="details" maxLength={1000} required /></label>
        <TurnstileWidget action="submit_report" />
        {error && <p className="error-panel" role="alert">{error}</p>}
        {message && <p className="status-message" role="status">{message}</p>}
        <div className="dialog-actions"><button type="button" className="button ghost" onClick={onClose}>{t('cancel')}</button><button className="button primary">{t(appMode === 'demo' ? 'sendReport' : 'sendReportLive')}</button></div>
      </form>
    </dialog>
  )
}
