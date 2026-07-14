import { useEffect, useRef, useState } from 'react'
import { appMode } from '../lib/api'

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null

function loadScript() {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile could not be loaded.')), { once: true })
    document.head.append(script)
  })
  return scriptPromise
}

export function TurnstileWidget({ action }: { action: string }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  const containerRef = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (appMode !== 'live' || !siteKey) return
    let disposed = false
    let widgetId = ''
    loadScript().then(() => {
      if (disposed || !containerRef.current || !window.turnstile) return
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        callback: (value: string) => { setToken(value); setError('') },
        'expired-callback': () => setToken(''),
        'error-callback': () => { setToken(''); setError('Human verification failed to load. Please retry.') },
      })
      containerRef.current.dataset.turnstileWidgetId = widgetId
    }).catch((caught: Error) => setError(caught.message))
    return () => { disposed = true; if (widgetId) window.turnstile?.remove(widgetId) }
  }, [action, siteKey])

  if (appMode === 'demo') return <div className="turnstile-demo" role="note">Turnstile · demo bypass (no write occurs)</div>
  if (!siteKey) return <div className="error-panel" role="alert">Turnstile site key is missing.</div>
  return <><div ref={containerRef} /><input type="hidden" name="turnstileToken" value={token} readOnly />{error && <div className="error-panel" role="alert">{error}</div>}</>
}
