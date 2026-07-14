import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeAdminSignIn } from '../lib/api'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    completeAdminSignIn().then((allowed) => {
      if (!active) return
      if (allowed) navigate('/admin', { replace: true })
      else setError('This account does not have administrator access.')
    }).catch((caught) => active && setError(caught instanceof Error ? caught.message : 'Sign-in could not be completed.'))
    return () => { active = false }
  }, [navigate])

  return <div className="form-page"><div className="form-intro"><span className="eyebrow">SECURE SIGN-IN</span><h1>正在完成管理员登录</h1><p>Completing administrator sign-in…</p></div>{error && <div className="error-panel" role="alert">{error}</div>}</div>
}
