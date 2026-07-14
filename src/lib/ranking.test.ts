import { describe, expect, it } from 'vitest'
import { demoFaculty } from '../data/demo'
import { formatScore, nonRecommendationScore, rankingStatus, sortFaculty } from './ranking'

describe('ranking', () => {
  it('sorts recommendation and caution boards in opposite score directions', () => {
    expect(sortFaculty(demoFaculty, 'recommended').slice(0, 3).map((item) => item.name)).toEqual(['Mira Solace', 'Rowan Vale', 'Noor Calder'])
    expect(sortFaculty(demoFaculty, 'not-recommended').slice(0, 3).map((item) => item.name)).toEqual(['Noor Calder', 'Rowan Vale', 'Mira Solace'])
  })
  it('applies minimum ranking thresholds', () => {
    expect(rankingStatus(0)).toBe('unranked'); expect(rankingStatus(2)).toBe('unranked')
    expect(rankingStatus(3)).toBe('provisional'); expect(rankingStatus(4)).toBe('provisional'); expect(rankingStatus(5)).toBe('regular')
  })
  it('handles inverse, empty, and rounded scores', () => {
    expect(nonRecommendationScore(7.36)).toBe(2.6); expect(nonRecommendationScore(null)).toBeNull()
    expect(formatScore(7)).toBe('7.0'); expect(formatScore(null)).toBe('—')
  })
})
