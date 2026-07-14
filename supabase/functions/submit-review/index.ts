import { consumeLimit, envelope, facultyAlias, handleError, options, PublicError, readJson, requireUser, verifyTurnstile } from '../_shared/core.ts'
import { reviewSchema } from '../_shared/schemas.ts'

Deno.serve(async (request) => {
  const preflight = options(request); if (preflight) return preflight
  const requestId = crypto.randomUUID()
  let limiter: { serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient']; userId: string } | null = null
  let limitRecorded = false
  try {
    if (request.method !== 'POST') return envelope(request, 405, null, { code: 'method_not_allowed', message: 'POST is required.' }, requestId)
    const { user, serviceClient } = await requireUser(request); limiter = { serviceClient,userId:user.id }
    const parsed = reviewSchema.safeParse(await readJson(request))
    if (!parsed.success) throw new PublicError('validation_failed','Review fields are invalid.',422)
    await verifyTurnstile(parsed.data.turnstileToken, 'submit_review')
    await consumeLimit(serviceClient,user.id,'review',true,3,5); limitRecorded = true
    const { data: faculty } = await serviceClient.from('faculty').select('id').eq('id', parsed.data.facultyId).eq('status', 'approved').maybeSingle()
    if (!faculty) return envelope(request,404,null,{ code:'faculty_not_found',message:'The faculty profile is unavailable.'},requestId)
    const alias = await facultyAlias(user.id, parsed.data.facultyId)
    const { error: aliasError } = await serviceClient.from('faculty_reviewer_aliases').upsert({ faculty_id: parsed.data.facultyId, reviewer_id: user.id, ...alias }, { onConflict: 'faculty_id,reviewer_id' })
    if (aliasError) throw aliasError
    const row = { faculty_id: parsed.data.facultyId, reviewer_id: user.id, relationship_type: parsed.data.relationshipType, experience_year: parsed.data.experienceYear, application_term: parsed.data.applicationTerm || null, outreach_score: parsed.data.outreachScore, interview_score: parsed.data.interviewScore, offer_communication_score: parsed.data.offerCommunicationScore, student_experience_score: parsed.data.studentExperienceScore, recommendation_score: parsed.data.recommendationScore, positive_comment: parsed.data.positiveComment, concern_comment: parsed.data.concernComment, additional_context: parsed.data.additionalContext, moderation_status: 'pending', moderated_at: null, moderated_by: null, internal_moderation_note: null, updated_at: new Date().toISOString() }
    const { data: review, error } = await serviceClient.from('reviews').upsert(row, { onConflict: 'faculty_id,reviewer_id' }).select('id').single()
    if (error) throw error
    await serviceClient.from('student_experience_dimensions').delete().eq('review_id', review.id)
    const dimensions = Object.entries(parsed.data.dimensions).filter(([,score]) => score !== null).map(([dimension,score]) => ({ review_id: review.id, dimension: dimension.toLowerCase().replaceAll(/[^a-z]+/g,'_').replace(/^_|_$/g,''), score }))
    if (dimensions.length) { const { error: dimensionError } = await serviceClient.from('student_experience_dimensions').insert(dimensions); if (dimensionError) throw dimensionError }
    return envelope(request,200,{ status:'pending' },null,requestId)
  } catch (error) {
    let failure = error
    if (limiter && !limitRecorded && !(error instanceof PublicError && error.code === 'rate_limited')) {
      try { await consumeLimit(limiter.serviceClient,limiter.userId,'review',false,3,5) } catch (limitError) { failure = limitError }
    }
    return handleError(request,failure,requestId)
  }
})
