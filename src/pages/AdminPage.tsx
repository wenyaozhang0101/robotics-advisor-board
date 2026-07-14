import { useEffect, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { appMode, checkAdminAccess, invokeAdmin, requestAdminLink } from '../lib/api'

type QueueKind = 'review' | 'report' | 'faculty_request'
interface QueueItem { id: string; kind: QueueKind; type: string; subject: string; submitted: string; risk: string }
interface AdminQueue {
  reviews: Array<{id:string;faculty_id:string;relationship_type:string;recommendation_score:number;created_at:string}>
  reports: Array<{id:string;review_id:string;reason:string;created_at:string}>
  facultyRequests: Array<{id:string;proposed_name:string;proposed_university:string;proposed_department:string;proposed_country:string;research_areas:string[];official_profile_url:string;created_at:string}>
}

function normalizeQueue(queue: AdminQueue): QueueItem[] {
  return [
    ...queue.reviews.map((item)=>({id:item.id,kind:'review' as const,type:'Review',subject:`Faculty ${item.faculty_id.slice(0,8)}…`,submitted:new Date(item.created_at).toLocaleString(),risk:`${item.relationship_type} · ${item.recommendation_score}/10`})),
    ...queue.reports.map((item)=>({id:item.id,kind:'report' as const,type:'Report',subject:`Review ${item.review_id.slice(0,8)}…`,submitted:new Date(item.created_at).toLocaleString(),risk:item.reason.replaceAll('_',' ')})),
    ...queue.facultyRequests.map((item)=>({id:item.id,kind:'faculty_request' as const,type:'Faculty request',subject:`${item.proposed_name} · ${item.proposed_university} · ${item.proposed_department}`,submitted:new Date(item.created_at).toLocaleString(),risk:`${item.proposed_country} · ${item.research_areas.join(', ')} · verify ${item.official_profile_url}`})),
  ]
}

export function AdminPage() {
  const { t } = useI18n()
  const [allowed,setAllowed] = useState(appMode==='demo')
  const [status,setStatus] = useState('')
  const [queue,setQueue] = useState<QueueItem[]>([])
  useEffect(()=>{if(appMode==='live')checkAdminAccess().then(setAllowed)},[])
  useEffect(()=>{if(appMode==='live'&&allowed)invokeAdmin<AdminQueue>({action:'list_queue'}).then((result)=>setQueue(normalizeQueue(result.data!))).catch((error:Error)=>setStatus(error.message))},[allowed])
  async function login(event:FormEvent<HTMLFormElement>){event.preventDefault();const email=new FormData(event.currentTarget).get('email')?.toString()??'';await requestAdminLink(email);setStatus('Check the supplied administrator mailbox for a sign-in link.')}
  async function act(item:QueueItem,positive:boolean){
    if(appMode==='demo')return
    const body=item.kind==='review'?{action:'moderate_review',reviewId:item.id,status:positive?'approved':'rejected'}:item.kind==='report'?{action:'resolve_report',reportId:item.id,status:positive?'resolved':'dismissed'}:positive?{action:'approve_faculty_request',requestId:item.id}:{action:'review_faculty_request',requestId:item.id,status:'rejected'}
    await invokeAdmin(body);setQueue((items)=>items.filter((candidate)=>candidate.id!==item.id));setStatus(`${item.type} updated.`)
  }
  if(!allowed)return <div className="form-page"><div className="form-intro"><h1>{t('adminTitle')}</h1><p>Administrator access is verified against the server-side admin role table.</p></div><form className="panel compact-form" onSubmit={login}><label><span>Administrator email</span><input type="email" name="email" required/></label>{status&&<p role="status" className="status-message">{status}</p>}<button className="button primary">Send sign-in link</button></form></div>
  const reports=queue.filter((item)=>item.kind==='report').length
  return <div><section className="admin-heading"><div><span className="eyebrow">PROTECTED OPERATIONS</span><h1>{t('adminTitle')}</h1><p>{t('adminDemo')}</p></div><button className="button ghost" onClick={()=>invokeAdmin({action:'export'}).then(()=>setStatus(appMode==='demo'?'Demo export preview completed.':'Export data prepared.'))}>Export records</button></section>
    {status&&<p className="status-message" role="status">{status}</p>}
    <section className="admin-stats"><div><span>Pending</span><strong>{queue.length}</strong></div><div><span>Open reports</span><strong>{reports}</strong></div><div><span>Mode</span><strong>{appMode}</strong></div></section>
    <section className="panel moderation-table"><div className="section-heading"><h2>Review queue</h2>{appMode==='demo'&&<span className="badge provisional">Read-only demo</span>}</div>{queue.length === 0 ? <div className="empty-state">{t('emptyModeration')}</div> : <table><thead><tr><th>Type</th><th>Subject</th><th>Submitted</th><th>Attention</th><th>Actions</th></tr></thead><tbody>{queue.map((item)=><tr key={item.id}><td>{item.type}</td><td>{item.subject}</td><td>{item.submitted}</td><td>{item.risk}</td><td><div className="row-actions"><button disabled={appMode==='demo'} onClick={()=>act(item,true)}>{item.kind==='report'?'Resolve':'Approve'}</button><button disabled={appMode==='demo'} onClick={()=>act(item,false)}>{item.kind==='report'?'Dismiss':'Reject'}</button></div></td></tr>)}</tbody></table>}</section>
  </div>
}
