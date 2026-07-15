import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { functionErrorMessage } from './api'

describe('Edge Function error messages', () => {
  it('preserves a safe typed server error and request ID', async () => {
    const response = new Response(JSON.stringify({
      data: null,
      error: { code: 'rate_limited', message: 'Too many attempts. Please try again later.' },
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    }), { status: 429, headers: { 'content-type': 'application/json' } })

    await expect(functionErrorMessage(new FunctionsHttpError(response))).resolves.toBe(
      'Too many attempts. Please try again later. (Request ID: 123e4567-e89b-12d3-a456-426614174000)',
    )
  })

  it('distinguishes network and relay failures', async () => {
    await expect(functionErrorMessage(new FunctionsFetchError(new TypeError('network unavailable')))).resolves.toContain('Check your network connection')
    await expect(functionErrorMessage(new FunctionsRelayError(new Response(null, { status: 503 })))).resolves.toContain('temporarily unavailable')
  })
})
