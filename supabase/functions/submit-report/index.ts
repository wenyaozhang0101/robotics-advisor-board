import { consumeLimit, envelope, handleError, options, readJson, requireUser, verifyTurnstile } from '../_shared/core.ts'
import { reportSchema } from '../_shared/schemas.ts'

Deno.serve(async (request) => {
  const preflight=options(request); if(preflight) return preflight; const requestId=crypto.randomUUID()
  try {
    const { user,serviceClient }=await requireUser(request); const parsed=reportSchema.parse(await readJson(request))
    await verifyTurnstile(parsed.turnstileToken,'submit_report'); await consumeLimit(serviceClient,user.id,'report',true,10,20)
    const { data: review }=await serviceClient.from('reviews').select('id').eq('id',parsed.reviewId).eq('moderation_status','approved').maybeSingle()
    if(!review) return envelope(request,404,null,{code:'not_found',message:'Review not found.'},requestId)
    const { error }=await serviceClient.from('reports').insert({ review_id:parsed.reviewId,reporter_id:user.id,reason:parsed.reason,details:parsed.details }); if(error) throw error
    return envelope(request,200,{status:'pending'},null,requestId)
  } catch(error){ return handleError(request,error,requestId) }
})
