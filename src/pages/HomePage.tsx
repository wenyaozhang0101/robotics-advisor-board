import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FacultyCards, FacultyTable } from '../components/FacultyViews'
import { useI18n } from '../i18n'
import { loadFaculty } from '../lib/api'
import { sortFaculty } from '../lib/ranking'
import type { Country, Faculty, Leaderboard } from '../types'

export function HomePage() {
  const [params, setParams] = useSearchParams()
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [error, setError] = useState('')
  const { t } = useI18n()
  const leaderboard = (params.get('board') === 'not-recommended' ? 'not-recommended' : 'recommended') as Leaderboard
  const query = params.get('q') ?? ''
  const university = params.get('university') ?? ''
  const country = (params.get('country') ?? '') as Country | ''
  const minReviews = Number(params.get('minReviews') ?? 0)
  const relationship = params.get('relationship') ?? ''

  useEffect(() => { loadFaculty().then(setFaculty).catch((caught: Error) => setError(caught.message)) }, [])
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  const filtered = useMemo(() => {
    const needle = query.toLowerCase()
    return sortFaculty(faculty.filter((person) => {
      const matchesText = !needle || [person.name, person.university, ...person.researchAreas].some((value) => value.toLowerCase().includes(needle))
      const matchesRelationship = !relationship
        || (relationship === 'outreach' && person.outreachScore !== null)
        || (relationship === 'interview' && person.interviewScore !== null)
        || (relationship === 'student' && person.studentScore !== null)
      return matchesText && (!university || person.university === university) && (!country || person.country === country) && person.reviewCount >= minReviews && matchesRelationship
    }), leaderboard)
  }, [country, faculty, leaderboard, minReviews, query, relationship, university])
  const universities = [...new Set(faculty.map((person) => person.university))].sort()

  return <>
    <section className="hero-panel">
      <div><p className="eyebrow">COMMUNITY SIGNALS, CAREFULLY FRAMED</p><h1>{t('communityScore')}</h1><p>{t('dataWarning')}</p></div>
      <div className="segmented" role="group" aria-label="Leaderboard">
        <button aria-pressed={leaderboard === 'recommended'} onClick={() => update('board', 'recommended')}><span className="signal-dot coral" />{t('recommended')}</button>
        <button aria-pressed={leaderboard === 'not-recommended'} onClick={() => update('board', 'not-recommended')}><span className="signal-dot charcoal" />{t('notRecommended')}</button>
      </div>
    </section>
    <section className="filters" aria-label="Search and filters">
      <label className="search-field"><span className="sr-only">{t('search')}</span><input value={query} onChange={(event) => update('q', event.target.value)} placeholder={`⌕  ${t('search')}`} /></label>
      <label><span>{t('university')}</span><select value={university} onChange={(event) => update('university', event.target.value)}><option value="">{t('all')}</option>{universities.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>{t('country')}</span><select value={country} onChange={(event) => update('country', event.target.value)}><option value="">{t('all')}</option><option>United States</option><option>Canada</option></select></label>
      <label><span>{t('minReviews')}</span><select value={minReviews} onChange={(event) => update('minReviews', event.target.value)}><option value="0">0</option><option value="3">3</option><option value="5">5</option></select></label>
      <label><span>{t('relationship')}</span><select value={relationship} onChange={(event) => update('relationship', event.target.value)}><option value="">{t('all')}</option><option value="outreach">{t('outreach')}</option><option value="interview">{t('interview')}</option><option value="student">{t('student')}</option></select></label>
      <button className="button ghost clear-button" onClick={() => setParams({})}>{t('clear')}</button>
    </section>
    {error && <div className="error-panel" role="alert">{error}</div>}
    {!error && filtered.length === 0 && <div className="empty-state">{t('noResults')}</div>}
    <FacultyTable faculty={filtered} leaderboard={leaderboard} />
    <FacultyCards faculty={filtered} />
  </>
}
