import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { I18nProvider } from './i18n'
import './styles.css'

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter basename={base} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><I18nProvider><App /></I18nProvider></BrowserRouter></StrictMode>,
)
