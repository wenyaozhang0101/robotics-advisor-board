import { createClient, type User } from 'npm:@supabase/supabase-js@2'

export interface ApiError { code: string; message: string }
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? ''
  const allowed = [...defaultOrigins, ...(Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean)]
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
  }
}

export function envelope(request: Request, status: number, data: unknown = null, error: ApiError | null = null, requestId: string = crypto.randomUUID()) {
  return new Response(JSON.stringify({ data, error, requestId }), { status, headers: { ...corsHeaders(request), 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}

export function options(request: Request) {
  return request.method === 'OPTIONS' ? new Response(null, { status: 204, headers: corsHeaders(request) }) : null
}

export function clients(request: Request) {
  const url = Deno.env.get('SUPABASE_URL')!
  const authorization = request.headers.get('authorization') ?? ''
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const serviceClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  return { userClient, serviceClient }
}

type ServiceClient = ReturnType<typeof clients>['serviceClient']

export async function requireUser(request: Request) {
  const { userClient, serviceClient } = clients(request)
  const { data, error } = await userClient.auth.getUser()
  if (error || !data.user) throw new PublicError('unauthorized', 'Authentication is required.', 401)
  return { user: data.user as User, userClient, serviceClient }
}

export class PublicError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message) }
}

export async function readJson(request: Request, maxBytes = 12_000) {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > maxBytes) throw new PublicError('payload_too_large', 'The request is too large.', 413)
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes) throw new PublicError('payload_too_large', 'The request is too large.', 413)
  try { return JSON.parse(text) } catch { throw new PublicError('invalid_json', 'The request body is invalid.') }
}

export async function verifyTurnstile(token: string, action: string) {
  if (!token) throw new PublicError('turnstile_required', 'Human verification is required.')
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) throw new PublicError('service_unconfigured', 'Verification is not configured.', 503)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret, response: token, idempotency_key: crypto.randomUUID() }), signal: AbortSignal.timeout(8_000),
  })
  const result = await response.json()
  const hostnames = (Deno.env.get('TURNSTILE_ALLOWED_HOSTNAMES') ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!result.success || result.action !== action || (hostnames.length > 0 && !hostnames.includes(result.hostname))) {
    throw new PublicError('turnstile_failed', 'Human verification failed. Please try again.')
  }
}

export async function consumeLimit(serviceClient: ServiceClient, userId: string, action: string, succeeded: boolean, hourly: number, daily: number) {
  const { data, error } = await serviceClient.rpc('consume_rate_limit', { p_actor: userId, p_action: action, p_success: succeeded, p_hourly: hourly, p_daily: daily })
  if (error) throw new Error('rate_limit_backend_failed')
  if (!data) throw new PublicError('rate_limited', 'Too many attempts. Please try again later.', 429)
}

export async function facultyAlias(userId: string, facultyId: string) {
  const secret = Deno.env.get('PSEUDONYM_HMAC_SECRET')
  if (!secret) throw new PublicError('service_unconfigured', 'Pseudonym service is not configured.', 503)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${userId}:${facultyId}`)))
  const animals = ['Crane', 'Fox', 'Cat', 'Otter', 'Hare', 'Heron', 'Lynx', 'Robin', 'Marten', 'Finch']
  const palette = ['#b87852','#8b7654','#a96857','#8a6e55','#9b7d48','#7f755d']
  const number = ((digest[1] << 8 | digest[2]) % 1000).toString().padStart(3, '0')
  return { pseudonym: `Anonymous ${animals[digest[0] % animals.length]} ${number}`, color: palette[digest[3] % palette.length] }
}

export function handleError(request: Request, error: unknown, requestId: string) {
  if (error instanceof PublicError) return envelope(request, error.status, null, { code: error.code, message: error.message }, requestId)
  console.error(JSON.stringify({ requestId, code: 'internal_error' }))
  return envelope(request, 500, null, { code: 'internal_error', message: 'The request could not be completed.' }, requestId)
}
