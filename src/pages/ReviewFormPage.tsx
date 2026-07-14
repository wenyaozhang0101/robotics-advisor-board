import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { useI18n } from '../i18n'
import { appMode, loadFaculty, submitReview } from '../lib/api'
import { enabledScores, validateReview } from '../lib/validation'
import type { Faculty, RelationshipType, ReviewDraft } from '../types'

const relationshipTypes: RelationshipType[] = ['outreach_only', 'interviewed', 'received_offer', 'current_student', 'former_student', 'left_before_graduation']
const dimensions = ['Communication responsiveness', 'Respect toward students', 'Meeting frequency', 'Funding stability', 'Clarity of graduation requirements', 'Authorship expectations', 'Work-life balance', 'Research freedom', 'Mentorship quality', 'Lab culture', 'Career support']
const initialDraft: ReviewDraft = {
  facultyId: '', relationshipType: 'outreach_only', experienceYear: new Date().getFullYear(), applicationTerm: '', outreachScore: null,
  interviewScore: null, offerCommunicationScore: null, studentExperienceScore: null, recommendationScore: 5,
  positiveComment: '', concernComment: '', additionalContext: '', dimensions: {}, agreed: false, turnstileToken: '',
}

function ScoreField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <label><span>{label}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}><option value="">Not enough information</option>{Array.from({ length: 11 }, (_, score) => <option key={score} value={score}>{score}</option>)}</select></label>
}

export function ReviewFormPage() {
  const [params] = useSearchParams()
  const [draft, setDraft] = useState<ReviewDraft>({ ...initialDraft, facultyId: params.get('faculty') ?? '' })
  const [errors, setErrors] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const { t } = useI18n()
  const enabled = enabledScores(draft.relationshipType)
  useEffect(() => { loadFaculty().then(setFaculty).catch((error: Error) => setErrors([error.message])) }, [])
  const update = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const changeRelationship = (relationshipType: RelationshipType) => setDraft((current) => ({
    ...current, relationshipType,
    interviewScore: relationshipType === 'outreach_only' ? null : current.interviewScore,
    offerCommunicationScore: enabledScores(relationshipType).offer ? current.offerCommunicationScore : null,
    studentExperienceScore: enabledScores(relationshipType).student ? current.studentExperienceScore : null,
    dimensions: enabledScores(relationshipType).dimensions ? current.dimensions : {},
  }))
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus('')
    const token = new FormData(event.currentTarget).get('turnstileToken')?.toString() ?? ''
    const next = { ...draft, turnstileToken: token }
    const result = validateReview(next)
    if (!result.success) { setErrors([...new Set(result.error.issues.map((issue) => issue.message))]); return }
    setErrors([])
    await submitReview(result.data)
    setStatus(appMode === 'demo' ? t('notStored') : t('pending'))
  }
  return <div className="form-page">
    <Link to="/" className="back-link">← {t('back')}</Link>
    <div className="form-intro"><span className="eyebrow">FIRSTHAND EXPERIENCE ONLY</span><h1>{t('submitReview')}</h1><p>{t('privacyReminder')}</p></div>
    <form className="review-form panel" onSubmit={onSubmit} noValidate>
      {errors.length > 0 && <div className="error-panel" role="alert"><strong>Please review:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <fieldset><legend>1. Context</legend><div className="form-grid">
        <label><span>{t('facultySelect')}</span><select required value={draft.facultyId} onChange={(event) => update('facultyId', event.target.value)}><option value="">Select…</option>{faculty.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.university}</option>)}</select>{faculty.length === 0 && <small className="field-hint">{t('reviewNeedsFaculty')} <Link to="/request-faculty">{t('requestFaculty')}</Link></small>}</label>
        <label><span>{t('relationship')}</span><select value={draft.relationshipType} onChange={(event) => changeRelationship(event.target.value as RelationshipType)}>{relationshipTypes.map((relationship) => <option key={relationship} value={relationship}>{relationship.replaceAll('_', ' ')}</option>)}</select></label>
        <label><span>{t('year')}</span><input type="number" min="1990" max={new Date().getFullYear()} value={draft.experienceYear} onChange={(event) => update('experienceYear', Number(event.target.value))} /></label>
        <label><span>{t('term')}</span><input maxLength={40} value={draft.applicationTerm} onChange={(event) => update('applicationTerm', event.target.value)} placeholder="Fall 2025" /></label>
      </div></fieldset>
      <fieldset><legend>2. Scores</legend><p className="field-hint">{t('scoreHint')}</p><div className="form-grid score-fields">
        <ScoreField label={t('outreach')} value={draft.outreachScore} onChange={(value) => update('outreachScore', value)} />
        {enabled.interview && <ScoreField label={t('interview')} value={draft.interviewScore} onChange={(value) => update('interviewScore', value)} />}
        {enabled.offer && <ScoreField label={t('offer')} value={draft.offerCommunicationScore} onChange={(value) => update('offerCommunicationScore', value)} />}
        {enabled.student && <ScoreField label={t('student')} value={draft.studentExperienceScore} onChange={(value) => update('studentExperienceScore', value)} />}
        <label><span>{t('overall')}</span><input type="range" min="0" max="10" value={draft.recommendationScore} onChange={(event) => update('recommendationScore', Number(event.target.value))} /><output>{draft.recommendationScore}/10</output></label>
      </div></fieldset>
      {enabled.dimensions && <fieldset><legend>3. Optional student-experience dimensions</legend><div className="dimension-grid">{dimensions.map((dimension) => <ScoreField key={dimension} label={dimension} value={draft.dimensions[dimension] ?? null} onChange={(value) => update('dimensions', { ...draft.dimensions, [dimension]: value })} />)}</div></fieldset>}
      <fieldset><legend>{enabled.dimensions ? '4' : '3'}. Written experience</legend><label><span>{t('positive')} · {draft.positiveComment.length}/2000</span><textarea maxLength={2000} value={draft.positiveComment} onChange={(event) => update('positiveComment', event.target.value)} /></label><label><span>{t('concerns')} · {draft.concernComment.length}/2000</span><textarea maxLength={2000} value={draft.concernComment} onChange={(event) => update('concernComment', event.target.value)} /></label><label><span>{t('context')} · {draft.additionalContext.length}/1000</span><textarea maxLength={1000} value={draft.additionalContext} onChange={(event) => update('additionalContext', event.target.value)} /></label></fieldset>
      <div className="privacy-box">🔒 <div><strong>Privacy reminder</strong><p>{t('privacyReminder')}</p></div></div>
      <label className="checkbox-label"><input type="checkbox" checked={draft.agreed} onChange={(event) => update('agreed', event.target.checked)} /><span>{t('consent')}</span></label>
      <TurnstileWidget action="submit_review" />
      {status && <p className="success-panel" role="status">{status}</p>}
      <button className="button primary submit-button" type="submit">{t('demoSubmit')}</button>
    </form>
  </div>
}
