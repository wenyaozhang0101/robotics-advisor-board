import { consumeLimit, envelope, handleError, options, PublicError, readJson, requireUser, verifyTurnstile } from '../_shared/core.ts'
import { facultyRequestSchema } from '../_shared/schemas.ts'

Deno.serve(async (request) => {
  const preflight = options(request); if (preflight) return preflight
  const requestId = crypto.randomUUID()
  let limiter: { serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient']; userId: string } | null = null
  let limitRecorded = false
  try {
    if (request.method !== 'POST') return envelope(request,405,null,{code:'method_not_allowed',message:'POST is required.'},requestId)
    const { user,serviceClient } = await requireUser(request); limiter = { serviceClient,userId:user.id }
    const parsed = facultyRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) throw new PublicError('validation_failed','Faculty request fields are invalid.',422)
    await verifyTurnstile(parsed.data.turnstileToken,'request_faculty')
    await consumeLimit(serviceClient,user.id,'faculty_request',true,3,3); limitRecorded = true
    const { error } = await serviceClient.from('faculty_requests').insert({proposed_name:parsed.data.proposedName,proposed_university:parsed.data.proposedUniversity,proposed_department:parsed.data.proposedDepartment,proposed_country:parsed.data.proposedCountry,research_areas:parsed.data.researchAreas,official_profile_url:parsed.data.officialProfileUrl,submitted_by:user.id})
    if (error) throw error
    return envelope(request,200,{status:'pending'},null,requestId)
  } catch (error) {
    let failure = error
    if (limiter && !limitRecorded && !(error instanceof PublicError && error.code === 'rate_limited')) {
      try { await consumeLimit(limiter.serviceClient,limiter.userId,'faculty_request',false,3,3) } catch (limitError) { failure = limitError }
    }
    return handleError(request,failure,requestId)
  }
})
