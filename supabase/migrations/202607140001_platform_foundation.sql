begin;

create extension if not exists pgcrypto with schema extensions;

create type public.faculty_status as enum ('pending', 'approved', 'hidden', 'rejected');
create type public.moderation_status as enum ('pending', 'approved', 'rejected', 'hidden', 'appealed');
create type public.relationship_type as enum ('outreach_only', 'interviewed', 'received_offer', 'current_student', 'former_student', 'left_before_graduation');
create type public.report_reason as enum ('personal_information', 'harassment', 'fabricated_experience', 'conflict_of_interest', 'incorrect_faculty', 'duplicate_review', 'unsupported_serious_allegation', 'other');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
create type public.admin_role as enum ('moderator', 'administrator');

create table public.faculty (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  university text not null check (char_length(university) between 2 and 200),
  department text not null check (char_length(department) between 2 and 200),
  country text not null check (country in ('United States', 'Canada')),
  official_profile_url text not null check (official_profile_url ~ '^https://'),
  photo_url text,
  research_areas text[] not null default '{}',
  status public.faculty_status not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(), faculty_id uuid not null references public.faculty(id), reviewer_id uuid not null references auth.users(id),
  relationship_type public.relationship_type not null, experience_year integer not null check (experience_year between 1990 and extract(year from now())::integer), application_term text check (char_length(application_term) <= 40),
  outreach_score smallint check (outreach_score between 0 and 10), interview_score smallint check (interview_score between 0 and 10), offer_communication_score smallint check (offer_communication_score between 0 and 10), student_experience_score smallint check (student_experience_score between 0 and 10), recommendation_score smallint not null check (recommendation_score between 0 and 10),
  positive_comment text not null default '' check (char_length(positive_comment) <= 2000), concern_comment text not null default '' check (char_length(concern_comment) <= 2000), additional_context text not null default '' check (char_length(additional_context) <= 1000),
  moderation_status public.moderation_status not null default 'pending', internal_moderation_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), moderated_at timestamptz, moderated_by uuid references auth.users(id),
  constraint reviews_one_per_faculty_reviewer unique (faculty_id, reviewer_id),
  constraint reviews_meaningful_text check (char_length(trim(positive_comment || ' ' || concern_comment)) >= 20),
  constraint reviews_relationship_fields check (
    (relationship_type = 'outreach_only' and interview_score is null and offer_communication_score is null and student_experience_score is null)
    or (relationship_type = 'interviewed' and offer_communication_score is null and student_experience_score is null)
    or (relationship_type = 'received_offer' and student_experience_score is null)
    or relationship_type in ('current_student','former_student','left_before_graduation')
  )
);

create table public.student_experience_dimensions (
  review_id uuid not null references public.reviews(id) on delete cascade, dimension text not null check (dimension in ('communication_responsiveness','respect_toward_students','meeting_frequency','funding_stability','clarity_of_graduation_requirements','authorship_expectations','work_life_balance','research_freedom','mentorship_quality','lab_culture','career_support')),
  score smallint check (score between 0 and 10), primary key (review_id, dimension)
);

create table public.faculty_reviewer_aliases (
  faculty_id uuid not null references public.faculty(id) on delete cascade, reviewer_id uuid not null references auth.users(id) on delete cascade,
  pseudonym text not null, color text not null check (color ~ '^#[0-9a-fA-F]{6}$'), created_at timestamptz not null default now(),
  primary key (faculty_id, reviewer_id), unique (faculty_id, pseudonym)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id), reporter_id uuid references auth.users(id), reason public.report_reason not null, details text not null default '' check (char_length(details) <= 1000),
  status public.report_status not null default 'open', created_at timestamptz not null default now(), resolved_at timestamptz, resolved_by uuid references auth.users(id)
);

create table public.faculty_requests (
  id uuid primary key default gen_random_uuid(), proposed_name text not null check (char_length(proposed_name) between 2 and 160), proposed_university text not null check (char_length(proposed_university) between 2 and 200), proposed_department text not null check (char_length(proposed_department) between 2 and 200), official_profile_url text not null check (official_profile_url ~ '^https://'),
  submitted_by uuid not null references auth.users(id), status public.request_status not null default 'pending', created_at timestamptz not null default now(), reviewed_at timestamptz
);

create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade, role public.admin_role not null, created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);

create table public.moderation_events (
  id bigint generated always as identity primary key, entity_type text not null, entity_id uuid not null, action text not null, previous_status text, new_status text, private_note text, actor_id uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table public.rate_limit_events (
  id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id) on delete cascade, action text not null, succeeded boolean not null, created_at timestamptz not null default now()
);
create index rate_limit_lookup_idx on public.rate_limit_events(actor_id, action, created_at desc);
create index approved_reviews_faculty_idx on public.reviews(faculty_id, created_at desc) where moderation_status = 'approved';

alter table public.faculty enable row level security; alter table public.reviews enable row level security;
alter table public.student_experience_dimensions enable row level security; alter table public.faculty_reviewer_aliases enable row level security;
alter table public.reports enable row level security; alter table public.faculty_requests enable row level security;
alter table public.admin_roles enable row level security; alter table public.moderation_events enable row level security; alter table public.rate_limit_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

create or replace function public.get_faculty_rankings()
returns jsonb language sql stable security definer set search_path = '' as $$
  with aggregates as (
    select f.id, avg(r.outreach_score)::numeric(4,1) outreach, avg(r.interview_score)::numeric(4,1) interview,
      avg(r.student_experience_score)::numeric(4,1) student, avg(r.recommendation_score)::numeric(4,1) recommendation,
      count(r.id)::int review_count,
      count(r.id) filter (where r.recommendation_score <= 3)::int negative,
      count(r.id) filter (where r.recommendation_score between 4 and 6)::int mixed,
      count(r.id) filter (where r.recommendation_score >= 7)::int positive,
      max(r.updated_at)::date last_updated
    from public.faculty f left join public.reviews r on r.faculty_id=f.id and r.moderation_status='approved'
    where f.status='approved' group by f.id
  ) select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'name', f.name, 'university', f.university, 'department', f.department, 'country', f.country,
    'officialProfileUrl', f.official_profile_url, 'researchAreas', f.research_areas,
    'outreachScore', a.outreach, 'interviewScore', a.interview, 'studentScore', a.student,
    'recommendationScore', a.recommendation, 'reviewCount', a.review_count,
    'distribution', jsonb_build_object('negative',a.negative,'mixed',a.mixed,'positive',a.positive),
    'lastUpdated', a.last_updated
  ) order by f.name), '[]'::jsonb) from public.faculty f join aggregates a on a.id=f.id where f.status='approved';
$$;

create or replace function public.get_faculty_detail(requested_faculty_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select item from jsonb_array_elements(public.get_faculty_rankings()) item where (item->>'id')::uuid=requested_faculty_id limit 1;
$$;

create or replace function public.get_public_reviews(requested_faculty_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'facultyId', r.faculty_id, 'pseudonym', a.pseudonym, 'color', a.color,
    'relationshipType', r.relationship_type, 'experienceYear', r.experience_year,
    'recommendationScore', r.recommendation_score, 'outreachScore', r.outreach_score,
    'interviewScore', r.interview_score, 'offerCommunicationScore', r.offer_communication_score,
    'studentExperienceScore', r.student_experience_score, 'positiveComment', r.positive_comment,
    'concernComment', r.concern_comment, 'additionalContext', r.additional_context, 'createdAt', r.created_at::date
  ) order by r.created_at desc), '[]'::jsonb)
  from public.reviews r join public.faculty_reviewer_aliases a on a.faculty_id=r.faculty_id and a.reviewer_id=r.reviewer_id
  where r.faculty_id=requested_faculty_id and r.moderation_status='approved';
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_roles where user_id=auth.uid());
$$;

create or replace function public.consume_rate_limit(p_actor uuid, p_action text, p_success boolean, p_hourly int, p_daily int)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare hourly_count int; daily_count int; failed_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text || p_action, 0));
  select count(*) filter(where created_at >= now()-interval '1 hour'), count(*) filter(where created_at >= now()-interval '1 day'), count(*) filter(where not succeeded and created_at >= now()-interval '1 hour')
    into hourly_count,daily_count,failed_count from public.rate_limit_events where actor_id=p_actor and action=p_action;
  if hourly_count >= p_hourly or daily_count >= p_daily or failed_count >= 10 then return false; end if;
  insert into public.rate_limit_events(actor_id,action,succeeded) values(p_actor,p_action,p_success); return true;
end $$;

create or replace function public.moderate_review(p_review uuid, p_status public.moderation_status, p_note text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare old_status public.moderation_status;
begin
  if not exists(select 1 from public.admin_roles where user_id=auth.uid()) then raise exception 'not_authorized'; end if;
  if p_status not in ('approved','rejected','hidden','appealed') then raise exception 'invalid_status'; end if;
  select moderation_status into old_status from public.reviews where id=p_review for update;
  update public.reviews set moderation_status=p_status, internal_moderation_note=p_note, moderated_at=now(), moderated_by=auth.uid(), updated_at=now() where id=p_review;
  insert into public.moderation_events(entity_type,entity_id,action,previous_status,new_status,private_note,actor_id) values('review',p_review,'status_change',old_status,p_status,p_note,auth.uid());
end $$;

create or replace function public.resolve_report(p_report uuid, p_status public.report_status, p_note text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare old_status public.report_status;
begin
  if not exists(select 1 from public.admin_roles where user_id=auth.uid()) then raise exception 'not_authorized'; end if;
  if p_status not in ('resolved','dismissed') then raise exception 'invalid_status'; end if;
  select status into old_status from public.reports where id=p_report for update;
  if old_status is null then raise exception 'not_found'; end if;
  update public.reports set status=p_status,resolved_at=now(),resolved_by=auth.uid() where id=p_report;
  insert into public.moderation_events(entity_type,entity_id,action,previous_status,new_status,private_note,actor_id) values('report',p_report,'resolution',old_status,p_status,p_note,auth.uid());
end $$;

create or replace function public.review_faculty_request(p_request uuid, p_status public.request_status, p_note text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare old_status public.request_status;
begin
  if not exists(select 1 from public.admin_roles where user_id=auth.uid()) then raise exception 'not_authorized'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid_status'; end if;
  select status into old_status from public.faculty_requests where id=p_request for update;
  if old_status is null then raise exception 'not_found'; end if;
  update public.faculty_requests set status=p_status,reviewed_at=now() where id=p_request;
  insert into public.moderation_events(entity_type,entity_id,action,previous_status,new_status,private_note,actor_id) values('faculty_request',p_request,'status_change',old_status,p_status,p_note,auth.uid());
end $$;

grant execute on function public.get_faculty_rankings() to anon, authenticated;
grant execute on function public.get_faculty_detail(uuid) to anon, authenticated;
grant execute on function public.get_public_reviews(uuid) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.consume_rate_limit(uuid,text,boolean,int,int) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid,text,boolean,int,int) to service_role;
grant execute on function public.moderate_review(uuid,public.moderation_status,text) to authenticated;
grant execute on function public.resolve_report(uuid,public.report_status,text) to authenticated;
grant execute on function public.review_faculty_request(uuid,public.request_status,text) to authenticated;

commit;
