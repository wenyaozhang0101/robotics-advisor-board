import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetTurnstile } from '../lib/turnstile'
import { TurnstileWidget } from './TurnstileWidget'

vi.mock('../lib/api', () => ({ appMode: 'live' }))

describe('TurnstileWidget live mode', () => {
  let deliverToken: ((token: string) => void) | undefined
  const renderWidget = vi.fn((_container: HTMLElement, options: Record<string, unknown>) => {
    deliverToken = options.callback as (token: string) => void
    return 'widget-1'
  })
  const reset = vi.fn()

  beforeEach(() => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'public-test-site-key')
    window.turnstile = { render: renderWidget, remove: vi.fn(), reset }
  })
  afterEach(() => {
    delete window.turnstile
    vi.unstubAllEnvs(); vi.clearAllMocks(); deliverToken = undefined
  })

  it('renders explicitly, writes the token, and resets a consumed widget', async () => {
    render(<form aria-label="test form"><TurnstileWidget action="request_faculty" /></form>)
    await waitFor(() => expect(renderWidget).toHaveBeenCalled())
    act(() => deliverToken?.('single-use-token'))
    const hidden = document.querySelector<HTMLInputElement>('input[name="turnstileToken"]')
    expect(hidden).toHaveValue('single-use-token')
    resetTurnstile(screen.getByRole('form'))
    expect(hidden).toHaveValue('')
    expect(reset).toHaveBeenCalledWith('widget-1')
  })
})
