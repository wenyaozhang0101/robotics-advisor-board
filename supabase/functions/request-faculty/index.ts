import { consumeLimit, envelope, handleError, options, readJson, requireUser, verifyTurnstile } from '../_shared/core.ts'
import { facultyRequestSchema } from '../_shared/schemas.ts'

Deno.serve(async(request)=>{ const preflight=options(request); if(preflight)return preflight; const requestId=crypto.randomUUID(); try{
  const {user,serviceClient}=await requireUser(request); const parsed=facultyRequestSchema.parse(await readJson(request)); await verifyTurnstile(parsed.turnstileToken,'request_faculty'); await consumeLimit(serviceClient,user.id,'faculty_request',true,3,3)
  const {error}=await serviceClient.from('faculty_requests').insert({proposed_name:parsed.proposedName,proposed_university:parsed.proposedUniversity,proposed_department:parsed.proposedDepartment,official_profile_url:parsed.officialProfileUrl,submitted_by:user.id}); if(error)throw error
  return envelope(request,200,{status:'pending'},null,requestId)
}catch(error){return handleError(request,error,requestId)}})
