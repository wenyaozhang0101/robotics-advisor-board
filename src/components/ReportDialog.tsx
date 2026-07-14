import { useEffect, useRef, useState } from 'react'
import { invokePublic } from '../lib/api'
import { useI18n } from '../i18n'
import { TurnstileWidget } from './TurnstileWidget'

const reasons = [
  ['personal_information','Personal information'], ['harassment','Harassment'], ['fabricated_experience','Fabricated experience'],
  ['conflict_of_interest','Conflict of interest'], ['incorrect_faculty','Incorrect faculty'], ['duplicate_review','Duplicate review'],
  ['unsupported_serious_allegation','Unsupported serious allegation'], ['other','Other'],
] as const

export function ReportDialog({ reviewId, open, onClose }: { reviewId: string; open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')
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
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        await invokePublic('submit-report', { reviewId, reason: data.get('reason'), details: data.get('details'), turnstileToken: '' })
        setMessage('Demo validated · not stored')
      }}>
        <div className="dialog-heading"><h2 id={`report-title-${reviewId}`}>{t('reportReview')}</h2><button type="button" className="icon-button" aria-label={t('cancel')} onClick={onClose}>×</button></div>
        <label>{t('reportReason')}<select name="reason">{reasons.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>{t('reportDetails')}<textarea name="details" maxLength={1000} required /></label>
        <TurnstileWidget action="submit_report" />
        {message && <p className="status-message" role="status">{message}</p>}
        <div className="dialog-actions"><button type="button" className="button ghost" onClick={onClose}>{t('cancel')}</button><button className="button primary">{t('sendReport')}</button></div>
      </form>
    </dialog>
  )
}
