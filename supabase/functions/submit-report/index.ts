import { consumeLimit, envelope, handleError, options, PublicError, readJson, requireUser, verifyTurnstile } from '../_shared/core.ts'
import { reportSchema } from '../_shared/schemas.ts'

Deno.serve(async (request) => {
  const preflight=options(request); if(preflight) return preflight
  const requestId=crypto.randomUUID()
  let limiter: { serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient']; userId: string } | null = null
  let limitRecorded = false
  try {
    if (request.method !== 'POST') return envelope(request,405,null,{code:'method_not_allowed',message:'POST is required.'},requestId)
    const { user,serviceClient }=await requireUser(request); limiter = { serviceClient,userId:user.id }
    const parsed=reportSchema.safeParse(await readJson(request))
    if (!parsed.success) throw new PublicError('validation_failed','Report fields are invalid.',422)
    await verifyTurnstile(parsed.data.turnstileToken,'submit_report')
    await consumeLimit(serviceClient,user.id,'report',true,10,20); limitRecorded = true
    const { data: review }=await serviceClient.from('reviews').select('id').eq('id',parsed.data.reviewId).eq('moderation_status','approved').maybeSingle()
    if(!review) return envelope(request,404,null,{code:'not_found',message:'Review not found.'},requestId)
    const { error }=await serviceClient.from('reports').insert({ review_id:parsed.data.reviewId,reporter_id:user.id,reason:parsed.data.reason,details:parsed.data.details }); if(error) throw error
    return envelope(request,200,{status:'pending'},null,requestId)
  } catch(error) {
    let failure = error
    if (limiter && !limitRecorded && !(error instanceof PublicError && error.code === 'rate_limited')) {
      try { await consumeLimit(limiter.serviceClient,limiter.userId,'report',false,10,20) } catch (limitError) { failure = limitError }
    }
    return handleError(request,failure,requestId)
  }
})
