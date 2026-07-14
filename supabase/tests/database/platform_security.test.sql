begin;
select plan(13);

select has_table('public','reviews','reviews table exists');
select has_function('public','get_public_reviews',array['uuid'],'safe review RPC exists');
select has_function('public','get_faculty_rankings',array[]::text[],'ranking RPC exists');
select has_function('public','resolve_report',array['uuid','report_status','text'],'report moderation RPC exists');
select has_function('public','review_faculty_request',array['uuid','request_status','text'],'faculty request moderation RPC exists');
select is((select relrowsecurity from pg_class where oid='public.reviews'::regclass),true,'reviews RLS enabled');

set local role anon;
select throws_ok('select * from public.reviews','42501',null,'anonymous role cannot select raw reviews');
select lives_ok('select public.get_faculty_rankings()','anonymous role can call safe rankings');
select is(jsonb_typeof(public.get_public_reviews('10000000-0000-4000-8000-000000000001')), 'array', 'public reviews returns an array');
reset role;

select ok(not (public.get_public_reviews('10000000-0000-4000-8000-000000000001')::text ~ 'reviewer_id|moderated_by|internal_moderation_note'), 'public output excludes internal fields');
select col_is_unique('public','reviews',array['faculty_id','reviewer_id'],'duplicate active review is prevented');
select is(public.is_admin(),false,'unauthenticated caller is not administrator');
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
select throws_ok($$select public.moderate_review('30000000-0000-4000-8000-000000000001','approved',null)$$,'P0001','not_authorized','ordinary user cannot approve reviews');
reset role;

select * from finish();
rollback;
