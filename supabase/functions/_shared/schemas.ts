import { z } from 'npm:zod@3'

const score = z.number().int().min(0).max(10).nullable()
const student = ['current_student','former_student','left_before_graduation']
export const reviewSchema = z.object({
  facultyId: z.string().uuid(), relationshipType: z.enum(['outreach_only','interviewed','received_offer','current_student','former_student','left_before_graduation']),
  experienceYear: z.number().int().min(1990).max(new Date().getUTCFullYear()), applicationTerm: z.string().trim().max(40),
  outreachScore: score, interviewScore: score, offerCommunicationScore: score, studentExperienceScore: score,
  recommendationScore: z.number().int().min(0).max(10), positiveComment: z.string().trim().max(2000), concernComment: z.string().trim().max(2000), additionalContext: z.string().trim().max(1000),
  dimensions: z.record(z.string(), score), agreed: z.literal(true), turnstileToken: z.string().max(2048),
}).superRefine((value, context) => {
  if (`${value.positiveComment} ${value.concernComment}`.trim().length < 20) context.addIssue({ code: 'custom', path: ['positiveComment'], message: 'More firsthand context is required.' })
  if (value.relationshipType === 'outreach_only' && [value.interviewScore,value.offerCommunicationScore,value.studentExperienceScore].some((item) => item !== null)) context.addIssue({ code: 'custom', path: ['relationshipType'], message: 'Invalid relationship fields.' })
  if (value.relationshipType === 'interviewed' && [value.offerCommunicationScore,value.studentExperienceScore].some((item) => item !== null)) context.addIssue({ code: 'custom', path: ['relationshipType'], message: 'Invalid relationship fields.' })
  if (value.relationshipType === 'received_offer' && value.studentExperienceScore !== null) context.addIssue({ code: 'custom', path: ['studentExperienceScore'], message: 'Invalid student score.' })
  if (!student.includes(value.relationshipType) && Object.values(value.dimensions).some((item) => item !== null)) context.addIssue({ code: 'custom', path: ['dimensions'], message: 'Invalid student dimensions.' })
})

export const reportSchema = z.object({ reviewId: z.string().uuid(), reason: z.enum(['personal_information','harassment','fabricated_experience','conflict_of_interest','incorrect_faculty','duplicate_review','unsupported_serious_allegation','other']), details: z.string().trim().max(1000), turnstileToken: z.string().max(2048) })
export const facultyRequestSchema = z.object({ proposedName: z.string().trim().min(2).max(160), proposedUniversity: z.string().trim().min(2).max(200), proposedDepartment: z.string().trim().min(2).max(200), officialProfileUrl: z.string().url().max(500).refine((value) => value.startsWith('https://')), turnstileToken: z.string().max(2048) })
