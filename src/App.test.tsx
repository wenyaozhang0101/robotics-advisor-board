import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { FacultyCards } from './components/FacultyViews'
import { I18nProvider } from './i18n'
import type { Faculty } from './types'

function view(route='/'){ return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><I18nProvider><App/></I18nProvider></MemoryRouter>) }
describe('core experience',()=>{
  it('provides accessible leaderboard controls and demo disclosure',async()=>{
    view(); expect(await screen.findByRole('button',{name:'Recommended'})).toHaveAttribute('aria-pressed','true')
    expect(screen.getByRole('status')).toHaveTextContent('submissions are not stored')
    expect(screen.getByRole('link',{name:'Anonymous review'})).toBeVisible()
  })
  it('starts with an empty leaderboard and a faculty request path',async()=>{
    view()
    expect(await screen.findByText('No approved faculty profiles yet.')).toBeVisible()
    expect(screen.getByRole('link',{name:'Request the first faculty profile'})).toHaveAttribute('href','/request-faculty')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('renders backend-supplied faculty text as text, never HTML',()=>{
    const faculty: Faculty = { id:'test-only',name:'<img src=x onerror=alert(1)>',university:'Test-only University',department:'Robotics',country:'Canada',officialProfileUrl:'https://example.edu',researchAreas:[],outreachScore:null,interviewScore:null,studentScore:null,recommendationScore:null,reviewCount:0,distribution:{negative:0,mixed:0,positive:0},lastUpdated:null }
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><I18nProvider><FacultyCards faculty={[faculty]} /></I18nProvider></MemoryRouter>)
    expect(screen.getByRole('link',{name:faculty.name})).toBeVisible()
    expect(document.querySelector('img')).toBeNull()
  })
  it('has labelled form controls and announces validation errors',async()=>{
    view('/submit'); await userEvent.click(screen.getByRole('button',{name:'Preview submission'}))
    expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByLabelText(/Faculty/)).toBeVisible()
  })
  it('collects the public metadata required for a faculty request',()=>{
    view('/request-faculty')
    expect(screen.getByLabelText('Country')).toBeVisible()
    expect(screen.getByLabelText(/Research areas/)).toBeVisible()
  })
  it('keeps demo moderation actions read-only',()=>{
    view('/admin'); expect(screen.getByRole('heading',{name:'Moderation workspace'})).toBeVisible()
    expect(screen.getByText('No pending moderation items.')).toBeVisible()
    expect(screen.queryByRole('button',{name:'Approve'})).not.toBeInTheDocument()
  })
})
