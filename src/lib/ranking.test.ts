import { describe, expect, it } from 'vitest'
import type { Faculty } from '../types'
import { formatScore, nonRecommendationScore, rankingStatus, sortFaculty } from './ranking'

function faculty(name: string, recommendationScore: number, reviewCount: number): Faculty {
  return { id:name,name,university:'Test-only University',department:'Robotics',country:'Canada',officialProfileUrl:'https://example.edu',researchAreas:[],outreachScore:null,interviewScore:null,studentScore:null,recommendationScore,reviewCount,distribution:{negative:0,mixed:0,positive:reviewCount},lastUpdated:null }
}

const rankingFixtures = [faculty('High score',8.3,6),faculty('Middle score',7.4,4),faculty('Low score',5.8,7)]

describe('ranking', () => {
  it('sorts recommendation and caution boards in opposite score directions', () => {
    expect(sortFaculty(rankingFixtures, 'recommended').map((item) => item.name)).toEqual(['High score', 'Middle score', 'Low score'])
    expect(sortFaculty(rankingFixtures, 'not-recommended').map((item) => item.name)).toEqual(['Low score', 'Middle score', 'High score'])
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
