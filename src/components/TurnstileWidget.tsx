import { useEffect } from 'react'
import { appMode } from '../lib/api'

export function TurnstileWidget({ action }: { action: string }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  useEffect(() => {
    if (appMode !== 'live' || document.querySelector('script[data-turnstile]')) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    document.head.append(script)
  }, [])
  if (appMode === 'demo') return <div className="turnstile-demo" role="note">Turnstile · demo bypass (no write occurs)</div>
  if (!siteKey) return <div className="error-panel">Turnstile site key is missing.</div>
  return <div className="cf-turnstile" data-sitekey={siteKey} data-action={action} data-response-field-name="turnstileToken" />
}
