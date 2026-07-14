import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { I18nProvider } from './i18n'

function view(route='/'){ return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><I18nProvider><App/></I18nProvider></MemoryRouter>) }
describe('core experience',()=>{
  it('provides accessible leaderboard controls and demo disclosure',async()=>{
    view(); expect(await screen.findByRole('button',{name:'Recommended'})).toHaveAttribute('aria-pressed','true')
    expect(screen.getByRole('status')).toHaveTextContent('fictional people and data')
    expect(screen.getByRole('link',{name:'Anonymous review'})).toBeVisible()
  })
  it('filters faculty without requiring horizontal mobile interaction',async()=>{
    view(); const search=screen.getByPlaceholderText(/Search name/); await userEvent.type(search,'Mira')
    expect(await screen.findAllByText('Mira Solace')).not.toHaveLength(0); expect(screen.queryByText('Noor Calder')).not.toBeInTheDocument()
  })
  it('renders user review text as text, never HTML',async()=>{
    view('/faculty/f-mira-solace'); expect(await screen.findByText(/Meeting expectations were explained/)).toBeVisible()
    expect(document.querySelector('script')).toBeNull()
  })
  it('has labelled form controls and announces validation errors',async()=>{
    view('/submit'); await userEvent.click(screen.getByRole('button',{name:'Preview submission'}))
    expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByLabelText(/Faculty/)).toBeVisible()
  })
  it('keeps demo moderation actions read-only',()=>{
    view('/admin'); expect(screen.getByRole('heading',{name:'Moderation workspace'})).toBeVisible()
    expect(screen.getAllByRole('button',{name:'Approve'})[0]).toBeDisabled()
  })
})
