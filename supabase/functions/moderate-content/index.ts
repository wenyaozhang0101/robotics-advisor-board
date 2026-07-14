import { envelope, handleError, options, readJson, requireUser } from '../_shared/core.ts'
import { z } from 'npm:zod@3'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list_queue') }),
  z.object({ action: z.literal('moderate_review'), reviewId: z.string().uuid(), status: z.enum(['approved','rejected','hidden','appealed']), note: z.string().max(2000).nullable().optional() }),
  z.object({ action: z.literal('resolve_report'), reportId: z.string().uuid(), status: z.enum(['resolved','dismissed']), note: z.string().max(2000).nullable().optional() }),
  z.object({ action: z.literal('review_faculty_request'), requestId: z.string().uuid(), status: z.enum(['approved','rejected']), note: z.string().max(2000).nullable().optional() }),
  z.object({ action: z.literal('update_faculty'), facultyId: z.string().uuid(), name: z.string().trim().min(2).max(160), university: z.string().trim().min(2).max(200), department: z.string().trim().min(2).max(200), country: z.enum(['United States','Canada']), officialProfileUrl: z.string().url().startsWith('https://'), researchAreas: z.array(z.string().trim().min(1).max(100)).max(20) }),
  z.object({ action: z.literal('export') }),
])

Deno.serve(async (request) => {
  const preflight = options(request); if (preflight) return preflight
  const requestId = crypto.randomUUID()
  try {
    const { user, userClient, serviceClient } = await requireUser(request)
    if (user.is_anonymous) return envelope(request,403,null,{code:'forbidden',message:'Administrator account required.'},requestId)
    const { data: allowed } = await userClient.rpc('is_admin')
    if (!allowed) return envelope(request,403,null,{code:'forbidden',message:'Administrator role required.'},requestId)
    const input = schema.parse(await readJson(request,12_000))

    if (input.action === 'list_queue') {
      const [reviews, reports, requests] = await Promise.all([
        serviceClient.from('reviews').select('id,faculty_id,relationship_type,experience_year,recommendation_score,positive_comment,concern_comment,additional_context,created_at').eq('moderation_status','pending').order('created_at').limit(100),
        serviceClient.from('reports').select('id,review_id,reason,details,created_at').eq('status','open').order('created_at').limit(100),
        serviceClient.from('faculty_requests').select('id,proposed_name,proposed_university,proposed_department,official_profile_url,created_at').eq('status','pending').order('created_at').limit(100),
      ])
      if (reviews.error || reports.error || requests.error) throw new Error('queue_read_failed')
      return envelope(request,200,{ reviews:reviews.data, reports:reports.data, facultyRequests:requests.data },null,requestId)
    }
    if (input.action === 'moderate_review') {
      const { error } = await userClient.rpc('moderate_review',{p_review:input.reviewId,p_status:input.status,p_note:input.note??null}); if(error)throw error
      return envelope(request,200,{status:input.status},null,requestId)
    }
    if (input.action === 'resolve_report') {
      const { error } = await userClient.rpc('resolve_report',{p_report:input.reportId,p_status:input.status,p_note:input.note??null}); if(error)throw error
      return envelope(request,200,{status:input.status},null,requestId)
    }
    if (input.action === 'review_faculty_request') {
      const { error } = await userClient.rpc('review_faculty_request',{p_request:input.requestId,p_status:input.status,p_note:input.note??null}); if(error)throw error
      return envelope(request,200,{status:input.status},null,requestId)
    }
    if (input.action === 'update_faculty') {
      const { data: previous, error: readError } = await serviceClient.from('faculty').select('status').eq('id',input.facultyId).single(); if(readError)throw readError
      const { error } = await serviceClient.from('faculty').update({name:input.name,university:input.university,department:input.department,country:input.country,official_profile_url:input.officialProfileUrl,research_areas:input.researchAreas,updated_at:new Date().toISOString()}).eq('id',input.facultyId); if(error)throw error
      const { error: auditError } = await serviceClient.from('moderation_events').insert({entity_type:'faculty',entity_id:input.facultyId,action:'metadata_update',previous_status:previous.status,new_status:previous.status,actor_id:user.id}); if(auditError)throw auditError
      return envelope(request,200,{status:'updated'},null,requestId)
    }
    const [events, reportRows, requestRows] = await Promise.all([
      serviceClient.from('moderation_events').select('id,entity_type,entity_id,action,previous_status,new_status,created_at').order('created_at',{ascending:false}).limit(5000),
      serviceClient.from('reports').select('id,review_id,reason,status,created_at,resolved_at').order('created_at',{ascending:false}).limit(5000),
      serviceClient.from('faculty_requests').select('id,proposed_name,proposed_university,status,created_at,reviewed_at').order('created_at',{ascending:false}).limit(5000),
    ])
    if(events.error||reportRows.error||requestRows.error)throw new Error('export_failed')
    return envelope(request,200,{events:events.data,reports:reportRows.data,facultyRequests:requestRows.data},null,requestId)
  } catch (error) { return handleError(request,error,requestId) }
})
