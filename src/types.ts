export type Language = 'en' | 'zh'
export type Leaderboard = 'recommended' | 'not-recommended'
export type Country = 'United States' | 'Canada'
export type RankingStatus = 'unranked' | 'provisional' | 'regular'
export type RelationshipType =
  | 'outreach_only'
  | 'interviewed'
  | 'received_offer'
  | 'current_student'
  | 'former_student'
  | 'left_before_graduation'

export interface ScoreDistribution {
  negative: number
  mixed: number
  positive: number
}

export interface Faculty {
  id: string
  name: string
  university: string
  department: string
  country: Country
  officialProfileUrl: string
  researchAreas: string[]
  outreachScore: number | null
  interviewScore: number | null
  studentScore: number | null
  recommendationScore: number | null
  reviewCount: number
  distribution: ScoreDistribution
  lastUpdated: string | null
}

export interface PublicReview {
  id: string
  facultyId: string
  pseudonym: string
  color: string
  relationshipType: RelationshipType
  experienceYear: number
  recommendationScore: number
  outreachScore: number | null
  interviewScore: number | null
  offerCommunicationScore: number | null
  studentExperienceScore: number | null
  positiveComment: string
  concernComment: string
  additionalContext: string
  createdAt: string
}

export interface ReviewDraft {
  facultyId: string
  relationshipType: RelationshipType
  experienceYear: number
  applicationTerm: string
  outreachScore: number | null
  interviewScore: number | null
  offerCommunicationScore: number | null
  studentExperienceScore: number | null
  recommendationScore: number
  positiveComment: string
  concernComment: string
  additionalContext: string
  dimensions: Record<string, number | null>
  agreed: boolean
  turnstileToken: string
}

export interface ApiEnvelope<T> {
  data: T | null
  error: { code: string; message: string } | null
  requestId: string
}
