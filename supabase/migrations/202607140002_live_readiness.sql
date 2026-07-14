begin;

alter table public.faculty_requests
  add column proposed_country text check (proposed_country in ('United States', 'Canada')),
  add column research_areas text[] not null default '{}';

create unique index faculty_official_profile_url_unique_idx on public.faculty (lower(official_profile_url));

create or replace function public.review_faculty_request(p_request uuid, p_status public.request_status, p_note text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare old_status public.request_status;
begin
  if not exists(select 1 from public.admin_roles where user_id=auth.uid()) then raise exception 'not_authorized'; end if;
  if p_status <> 'rejected' then raise exception 'use_approve_faculty_request'; end if;
  select status into old_status from public.faculty_requests where id=p_request for update;
  if old_status is null then raise exception 'not_found'; end if;
  if old_status <> 'pending' then raise exception 'request_already_reviewed'; end if;
  update public.faculty_requests set status='rejected',reviewed_at=now() where id=p_request;
  insert into public.moderation_events(entity_type,entity_id,action,previous_status,new_status,private_note,actor_id)
    values('faculty_request',p_request,'status_change',old_status,'rejected',p_note,auth.uid());
end $$;

create or replace function public.approve_faculty_request(p_request uuid, p_note text default null)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare request_row public.faculty_requests%rowtype; new_faculty_id uuid;
begin
  if not exists(select 1 from public.admin_roles where user_id=auth.uid()) then raise exception 'not_authorized'; end if;
  select * into request_row from public.faculty_requests where id=p_request for update;
  if request_row.id is null then raise exception 'not_found'; end if;
  if request_row.status <> 'pending' then raise exception 'request_already_reviewed'; end if;
  if request_row.proposed_country is null or cardinality(request_row.research_areas)=0 then raise exception 'request_missing_public_metadata'; end if;

  insert into public.faculty(name,university,department,country,official_profile_url,research_areas,status)
    values(request_row.proposed_name,request_row.proposed_university,request_row.proposed_department,request_row.proposed_country,request_row.official_profile_url,request_row.research_areas,'approved')
    returning id into new_faculty_id;
  update public.faculty_requests set status='approved',reviewed_at=now() where id=p_request;
  insert into public.moderation_events(entity_type,entity_id,action,previous_status,new_status,private_note,actor_id)
    values('faculty_request',p_request,'status_change','pending','approved',p_note,auth.uid());
  insert into public.moderation_events(entity_type,entity_id,action,previous_status,new_status,private_note,actor_id)
    values('faculty',new_faculty_id,'created_from_request',null,'approved',p_note,auth.uid());
  return new_faculty_id;
end $$;

revoke execute on function public.approve_faculty_request(uuid,text) from public, anon;
grant execute on function public.approve_faculty_request(uuid,text) to authenticated;

commit;
