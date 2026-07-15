import { Link, NavLink, Outlet } from 'react-router-dom'
import { appMode } from '../lib/api'
import { useI18n } from '../i18n'

export function Layout() {
  const { language, setLanguage, t } = useI18n()
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Advisor Signal home">
            <span className="brand-kicker">Advisor Signal</span>
            <span className="brand-title">Mental Health Is All You Need</span>
            <span className="brand-subtitle">{t('subtitle')}</span>
          </Link>
          <div className="header-actions">
            <button className="language-button" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>
              {t('language')}
            </button>
            <Link className="button primary" to="/submit">{t('submit')}</Link>
          </div>
        </div>
        {appMode === 'demo' && <div className="demo-banner" role="status">● {t('demo')}</div>}
        <nav className="primary-nav" aria-label="Primary navigation">
          <NavLink to="/" end>{t('home')}</NavLink>
          <NavLink to="/request-faculty">{t('requestFaculty')}</NavLink>
          <NavLink to="/admin">{t('admin')}</NavLink>
          <NavLink to="/guidelines">{t('policies')}</NavLink>
        </nav>
      </header>
      <main id="main-content" className="main-content"><Outlet /></main>
      <footer className="site-footer">
        <div><strong>Advisor Signal</strong><p>{t('dataWarning')}</p></div>
        <nav aria-label="Policy links">
          <Link to="/guidelines">{t('guidelines')}</Link>
          <Link to="/privacy">{t('privacy')}</Link>
          <Link to="/moderation-policy">{t('moderation')}</Link>
          <Link to="/corrections">{t('corrections')}</Link>
          <Link to="/methodology">{t('methodology')}</Link>
          <Link to="/limitations">{t('limitations')}</Link>
          <Link to="/contact">{t('contact')}</Link>
        </nav>
      </footer>
    </div>
  )
}
