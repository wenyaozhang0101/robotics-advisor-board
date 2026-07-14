import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { demoFaculty, demoReviews } from '../data/demo'
import type { ApiEnvelope, Faculty, PublicReview, ReviewDraft } from '../types'

export const appMode = import.meta.env.VITE_APP_MODE === 'live' ? 'live' : 'demo'
let client: SupabaseClient | null = null

function getClient() {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Live mode requires Supabase public configuration.')
  client = createClient(url, key)
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

export async function invokePublic<T>(name: string, body: unknown): Promise<ApiEnvelope<T>> {
  if (appMode === 'demo') return { data: null, error: null, requestId: crypto.randomUUID() }
  await ensureAnonymousSession()
  const { data, error } = await getClient().functions.invoke(name, { body: body as Record<string, unknown> })
  if (error) throw new Error('The submission service could not be reached.')
  return data as ApiEnvelope<T>
}

export function submitReview(draft: ReviewDraft) {
  return invokePublic<{ status: 'pending' }>('submit-review', draft)
}

export async function requestAdminLink(email: string) {
  if (appMode === 'demo') return
  const { error } = await getClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin` } })
  if (error) throw new Error('Administrator sign-in link could not be sent.')
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
  if (error) throw new Error('Moderation operation failed.')
  return data as ApiEnvelope<T>
}
