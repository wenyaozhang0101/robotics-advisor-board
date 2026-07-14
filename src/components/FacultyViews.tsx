import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { formatScore, nonRecommendationScore, rankingStatus } from '../lib/ranking'
import type { Faculty, Leaderboard } from '../types'

function StatusBadge({ faculty }: { faculty: Faculty }) {
  const { t } = useI18n()
  const status = rankingStatus(faculty.reviewCount)
  return <span className={`badge ${status}`}>{t(status)}</span>
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2)
  return <span className="avatar" aria-hidden="true">{initials}</span>
}

function Score({ value }: { value: number | null }) {
  return <span className="score-value">{formatScore(value)}</span>
}

export function FacultyTable({ faculty, leaderboard }: { faculty: Faculty[]; leaderboard: Leaderboard }) {
  const { t } = useI18n()
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">{t(leaderboard === 'recommended' ? 'recommended' : 'notRecommended')}</caption>
        <thead><tr>
          <th>{t('faculty')}</th><th aria-label="Avatar" />
          <th>{t('outreach')}</th><th>{t('interview')}</th><th>{t('student')}</th>
          <th>{t('communityScore')}</th><th>{t('cautionScore')}</th><th>{t('reviews')}</th>
        </tr></thead>
        <tbody>{faculty.map((person) => (
          <tr key={person.id}>
            <td className="identity-cell">
              <Link to={`/faculty/${person.id}`} className="faculty-name">{person.name}</Link>
              <span>{person.university}</span><small>{person.department}</small>
              <div className="tag-row">{person.researchAreas.map((area) => <span className="tag" key={area}>{area}</span>)}</div>
            </td>
            <td><Avatar name={person.name} /></td>
            <td><Score value={person.outreachScore} /></td><td><Score value={person.interviewScore} /></td><td><Score value={person.studentScore} /></td>
            <td><Score value={person.recommendationScore} /></td><td><Score value={nonRecommendationScore(person.recommendationScore)} /></td>
            <td><strong>{person.reviewCount}</strong><StatusBadge faculty={person} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export function FacultyCards({ faculty }: { faculty: Faculty[] }) {
  const { t } = useI18n()
  return <div className="faculty-cards">{faculty.map((person) => (
    <article className="faculty-card" key={person.id}>
      <div className="card-heading"><Avatar name={person.name} /><div>
        <Link to={`/faculty/${person.id}`} className="faculty-name">{person.name}</Link>
        <p>{person.university}</p><small>{person.department}</small>
      </div></div>
      <div className="tag-row">{person.researchAreas.map((area) => <span className="tag" key={area}>{area}</span>)}</div>
      <dl className="score-grid">
        <div><dt>{t('communityScore')}</dt><dd>{formatScore(person.recommendationScore)}</dd></div>
        <div><dt>{t('cautionScore')}</dt><dd>{formatScore(nonRecommendationScore(person.recommendationScore))}</dd></div>
        <div><dt>{t('reviews')}</dt><dd>{person.reviewCount}</dd></div>
      </dl>
      <StatusBadge faculty={person} />
    </article>
  ))}</div>
}
