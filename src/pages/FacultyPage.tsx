import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReportDialog } from '../components/ReportDialog'
import { useI18n } from '../i18n'
import { loadFaculty, loadReviews } from '../lib/api'
import { formatScore, nonRecommendationScore, rankingStatus } from '../lib/ranking'
import type { Faculty, PublicReview } from '../types'

export function FacultyPage() {
  const { facultyId = '' } = useParams()
  const [faculty, setFaculty] = useState<Faculty | null | undefined>(undefined)
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [reporting, setReporting] = useState<string | null>(null)
  const { t } = useI18n()
  useEffect(() => {
    loadFaculty().then((items) => setFaculty(items.find((person) => person.id === facultyId) ?? null))
    loadReviews(facultyId).then(setReviews)
  }, [facultyId])
  if (faculty === undefined) return <div className="empty-state" role="status">Loading…</div>
  if (faculty === null) return <div className="empty-state">Faculty not found.</div>
  const total = Math.max(1, faculty.reviewCount)
  return <>
    <Link to="/" className="back-link">← {t('back')}</Link>
    <section className="profile-hero">
      <div className="profile-avatar">{faculty.name.split(' ').map((part) => part[0]).join('')}</div>
      <div className="profile-identity"><span className={`badge ${rankingStatus(faculty.reviewCount)}`}>{t(rankingStatus(faculty.reviewCount))}</span><h1>{faculty.name}</h1><p>{faculty.university} · {faculty.department}</p><div className="tag-row">{faculty.researchAreas.map((area) => <span className="tag" key={area}>{area}</span>)}</div><a href={faculty.officialProfileUrl} rel="noreferrer" target="_blank">{t('officialProfile')} ↗</a></div>
      <div className="profile-score"><span>{t('communityScore')}</span><strong>{formatScore(faculty.recommendationScore)}</strong><small>{faculty.reviewCount} {t('reviews')}</small></div>
    </section>
    <div className="insight-grid">
      <section className="panel"><h2>{t('methodology')}</h2><dl className="detail-scores"><div><dt>{t('outreach')}</dt><dd>{formatScore(faculty.outreachScore)}</dd></div><div><dt>{t('interview')}</dt><dd>{formatScore(faculty.interviewScore)}</dd></div><div><dt>{t('student')}</dt><dd>{formatScore(faculty.studentScore)}</dd></div><div><dt>{t('cautionScore')}</dt><dd>{formatScore(nonRecommendationScore(faculty.recommendationScore))}</dd></div></dl><p className="muted">{t('lastUpdated')}: {faculty.lastUpdated ?? '—'}</p></section>
      <section className="panel"><h2>Score distribution</h2>{(['negative', 'mixed', 'positive'] as const).map((bucket) => <div className="distribution" key={bucket}><span>{bucket}</span><div><i style={{ width: `${faculty.distribution[bucket] / total * 100}%` }} /></div><strong>{faculty.distribution[bucket]}</strong></div>)}<p className="warning-note">{t('dataWarning')}</p></section>
    </div>
    <section className="reviews-section"><div className="section-heading"><div><span className="eyebrow">FIRSTHAND CONTEXT</span><h2>{t('reviews')}</h2></div><Link className="button primary" to={`/submit?faculty=${faculty.id}`}>{t('submit')}</Link></div>
      {reviews.length === 0 ? <div className="empty-state">No approved reviews yet.</div> : reviews.map((review) => <article className="review-card" key={review.id}>
        <div className="review-meta"><span className="reviewer-avatar" style={{ background: review.color }}>{review.pseudonym.charAt(10)}</span><div><strong>{review.pseudonym}</strong><small>{review.relationshipType.replaceAll('_', ' ')} · {review.experienceYear}</small></div><span className="review-score">{review.recommendationScore}/10</span></div>
        <div className="review-copy"><div><h3>{t('positive')}</h3><p>{review.positiveComment}</p></div><div><h3>{t('concerns')}</h3><p>{review.concernComment}</p></div></div>
        {review.additionalContext && <p className="context-note">{review.additionalContext}</p>}
        <button className="text-button" onClick={() => setReporting(review.id)}>⚑ {t('report')}</button>
        <ReportDialog reviewId={review.id} open={reporting === review.id} onClose={() => setReporting(null)} />
      </article>)}
    </section>
  </>
}
