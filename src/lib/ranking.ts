import type { Faculty, Leaderboard, RankingStatus } from '../types'

export function rankingStatus(reviewCount: number): RankingStatus {
  if (reviewCount < 3) return 'unranked'
  if (reviewCount < 5) return 'provisional'
  return 'regular'
}

export function nonRecommendationScore(score: number | null): number | null {
  return score === null ? null : Number((10 - score).toFixed(1))
}

export function sortFaculty(faculty: Faculty[], leaderboard: Leaderboard): Faculty[] {
  return [...faculty].sort((a, b) => {
    const aStatus = rankingStatus(a.reviewCount)
    const bStatus = rankingStatus(b.reviewCount)
    if (aStatus === 'unranked' && bStatus !== 'unranked') return 1
    if (bStatus === 'unranked' && aStatus !== 'unranked') return -1
    const aScore = leaderboard === 'recommended' ? a.recommendationScore : nonRecommendationScore(a.recommendationScore)
    const bScore = leaderboard === 'recommended' ? b.recommendationScore : nonRecommendationScore(b.recommendationScore)
    if (aScore === null) return 1
    if (bScore === null) return -1
    return bScore - aScore || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name)
  })
}

export function formatScore(score: number | null): string {
  return score === null ? '—' : score.toFixed(1)
}
