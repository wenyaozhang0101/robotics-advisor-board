import {
  createClient,
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js'
import { demoFaculty, demoReviews } from '../data/demo'
import type { ApiEnvelope, Faculty, PublicReview, ReviewDraft } from '../types'

export const appMode = import.meta.env.VITE_APP_MODE === 'live' ? 'live' : 'demo'
let client: SupabaseClient | null = null

function getClient() {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Live mode requires Supabase public configuration.')
  client = createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
  return client
}

export async function loadFaculty(): Promise<Faculty[]> {
  if (appMode === 'demo') return demoFaculty
  const { data, error } = await getClient().rpc('get_faculty_rankings')
  if (error) throw new Error('The live faculty data could not be loaded. Demo data was not substituted.')
  return data as Faculty[]
}

export async function loadReviews(facultyId: string): Promise<PublicReview[]> {
  if (appMode === 'demo') return demoReviews.filter((review) => review.facultyId === facultyId)
  const { data, error } = await getClient().rpc('get_public_reviews', { requested_faculty_id: facultyId })
  if (error) throw new Error('The live reviews could not be loaded.')
  return data as PublicReview[]
}

async function ensureAnonymousSession() {
  const supabase = getClient()
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error('Anonymous sign-in failed.')
}

function messageWithRequestId(message: string, requestId?: unknown) {
  return typeof requestId === 'string' && /^[0-9a-f-]{36}$/i.test(requestId)
    ? `${message} (Request ID: ${requestId})`
    : message
}

export async function functionErrorMessage(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const response = error.context as Response
      const payload = await response.clone().json() as Partial<ApiEnvelope<unknown>> & { message?: unknown }
      const message = typeof payload.error?.message === 'string'
        ? payload.error.message
        : typeof payload.message === 'string' ? payload.message : null
      if (message) return messageWithRequestId(message, payload.requestId)
    } catch {
      // Fall through to a safe status-based message when the relay body is not JSON.
    }
    const status = (error.context as Response | undefined)?.status
    return status ? `The submission service rejected the request (HTTP ${status}).` : 'The submission service rejected the request.'
  }
  if (error instanceof FunctionsRelayError) return 'The submission service is temporarily unavailable. Please try again.'
  if (error instanceof FunctionsFetchError) return 'The submission service could not be reached. Check your network connection and try again.'
  return 'The submission could not be completed.'
}

export async function invokePublic<T>(name: string, body: unknown): Promise<ApiEnvelope<T>> {
  if (appMode === 'demo') return { data: null, error: null, requestId: crypto.randomUUID() }
  await ensureAnonymousSession()
  const { data, error } = await getClient().functions.invoke(name, { body: body as Record<string, unknown> })
  if (error) throw new Error(await functionErrorMessage(error))
  const response = data as ApiEnvelope<T>
  if (response?.error) throw new Error(messageWithRequestId(response.error.message, response.requestId))
  return response
}

export function submitReview(draft: ReviewDraft) {
  return invokePublic<{ status: 'pending' }>('submit-review', draft)
}

export async function requestAdminLink(email: string) {
  if (appMode === 'demo') return
  const { error } = await getClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback/`, shouldCreateUser: false } })
  if (error) throw new Error(error.message || 'Administrator sign-in link could not be sent.')
}

export async function signInAdminWithPassword(email: string, password: string) {
  if (appMode === 'demo') return true
  const supabase = getClient()
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) throw new Error(signInError.message || 'Administrator sign-in failed.')
  if (!signIn.user || signIn.user.is_anonymous) throw new Error('A non-anonymous administrator account is required.')
  const { data: allowed, error: roleError } = await supabase.rpc('is_admin')
  if (roleError || !allowed) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('This account does not have administrator access.')
  }
  return true
}

export async function completeAdminSignIn() {
  if (appMode === 'demo') return false
  const supabase = getClient()
  const session = await new Promise<Session>((resolve, reject) => {
    let settled = false
    let timer = 0
    let unsubscribe = () => {}
    const fail = (error: Error) => {
      if (settled) return
      settled = true; clearTimeout(timer); unsubscribe(); reject(error)
    }
    const finish = (value: Session | null) => {
      if (settled || !value || value.user.is_anonymous) return
      settled = true; clearTimeout(timer); unsubscribe(); resolve(value)
    }
    const { data } = supabase.auth.onAuthStateChange((_event, value) => finish(value))
    unsubscribe = () => data.subscription.unsubscribe()
    timer = window.setTimeout(() => fail(new Error('No administrator session was returned. Open the newest email link in the same browser used to request it.')), 10_000)
    supabase.auth.getSession().then(({ data: current, error }) => error ? fail(error) : finish(current.session)).catch((error) => fail(error instanceof Error ? error : new Error('Sign-in could not be completed.')))
  })
  if (session.user.is_anonymous) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw new Error('Administrator authorization could not be verified.')
  return Boolean(data)
}

export async function checkAdminAccess() {
  if (appMode === 'demo') return false
  const { data: session } = await getClient().auth.getSession()
  if (!session.session || session.session.user.is_anonymous) return false
  const { data, error } = await getClient().rpc('is_admin')
  if (error) return false
  return Boolean(data)
}

export async function invokeAdmin<T>(body: unknown): Promise<ApiEnvelope<T>> {
  if (appMode === 'demo') return { data: null, error: null, requestId: crypto.randomUUID() }
  const { data, error } = await getClient().functions.invoke('moderate-content', { body: body as Record<string, unknown> })
  if (error) throw new Error(await functionErrorMessage(error))
  const response = data as ApiEnvelope<T>
  if (response?.error) throw new Error(messageWithRequestId(response.error.message, response.requestId))
  return response
}
