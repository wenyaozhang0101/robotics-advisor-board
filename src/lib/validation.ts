import { z } from 'zod'
import type { RelationshipType, ReviewDraft } from '../types'

const relationshipTypes: [RelationshipType, ...RelationshipType[]] = [
  'outreach_only', 'interviewed', 'received_offer', 'current_student', 'former_student', 'left_before_graduation',
]
const score = z.number().int().min(0).max(10).nullable()
const studentRelationships: RelationshipType[] = ['current_student', 'former_student', 'left_before_graduation']

export const reviewSchema = z.object({
  facultyId: z.string().min(1),
  relationshipType: z.enum(relationshipTypes),
  experienceYear: z.number().int().min(1990).max(new Date().getFullYear()),
  applicationTerm: z.string().max(40),
  outreachScore: score,
  interviewScore: score,
  offerCommunicationScore: score,
  studentExperienceScore: score,
  recommendationScore: z.number().int().min(0).max(10),
  positiveComment: z.string().trim().max(2000),
  concernComment: z.string().trim().max(2000),
  additionalContext: z.string().trim().max(1000),
  dimensions: z.record(z.string(), score),
  agreed: z.literal(true),
  turnstileToken: z.string(),
}).superRefine((value, context) => {
  const textLength = `${value.positiveComment} ${value.concernComment}`.trim().length
  if (textLength < 20) context.addIssue({ code: 'custom', path: ['positiveComment'], message: 'Provide at least 20 characters of firsthand context.' })
  if (value.relationshipType === 'outreach_only' && (value.interviewScore !== null || value.offerCommunicationScore !== null || value.studentExperienceScore !== null)) {
    context.addIssue({ code: 'custom', path: ['relationshipType'], message: 'Outreach-only reviews cannot include later-stage scores.' })
  }
  if (value.relationshipType === 'interviewed' && (value.offerCommunicationScore !== null || value.studentExperienceScore !== null)) {
    context.addIssue({ code: 'custom', path: ['relationshipType'], message: 'Interview reviews cannot include offer or student scores.' })
  }
  if (value.relationshipType === 'received_offer' && value.studentExperienceScore !== null) {
    context.addIssue({ code: 'custom', path: ['studentExperienceScore'], message: 'Offer recipients cannot score student experience.' })
  }
  if (!studentRelationships.includes(value.relationshipType) && Object.values(value.dimensions).some((dimension) => dimension !== null)) {
    context.addIssue({ code: 'custom', path: ['dimensions'], message: 'Student dimensions require student experience.' })
  }
})

export function validateReview(value: ReviewDraft) {
  return reviewSchema.safeParse(value)
}

export function enabledScores(relationship: RelationshipType) {
  return {
    outreach: true,
    interview: relationship !== 'outreach_only',
    offer: relationship === 'received_offer' || studentRelationships.includes(relationship),
    student: studentRelationships.includes(relationship),
    dimensions: studentRelationships.includes(relationship),
  }
}
