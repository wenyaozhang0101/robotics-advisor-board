import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { FacultyPage } from './pages/FacultyPage'
import { HomePage } from './pages/HomePage'
import { PolicyPage } from './pages/PolicyPage'
import { RequestFacultyPage } from './pages/RequestFacultyPage'
import { ReviewFormPage } from './pages/ReviewFormPage'

export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="faculty/:facultyId" element={<FacultyPage />} />
    <Route path="submit" element={<ReviewFormPage />} />
    <Route path="request-faculty" element={<RequestFacultyPage />} />
    <Route path="admin" element={<AdminPage />} />
    <Route path="auth/callback" element={<AuthCallbackPage />} />
    <Route path="guidelines" element={<PolicyPage page="guidelines" />} />
    <Route path="privacy" element={<PolicyPage page="privacy" />} />
    <Route path="moderation-policy" element={<PolicyPage page="moderation" />} />
    <Route path="corrections" element={<PolicyPage page="corrections" />} />
    <Route path="methodology" element={<PolicyPage page="methodology" />} />
    <Route path="limitations" element={<PolicyPage page="limitations" />} />
    <Route path="contact" element={<PolicyPage page="contact" />} />
    <Route path="*" element={<div className="empty-state"><h1>Page not found</h1><a href={import.meta.env.BASE_URL}>Return home</a></div>} />
  </Route></Routes>
}
