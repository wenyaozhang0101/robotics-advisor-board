import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n'
import { invokePublic } from '../lib/api'
import { RequestFacultyPage } from './RequestFacultyPage'

vi.mock('../lib/api', () => ({ appMode: 'live', invokePublic: vi.fn() }))
vi.mock('../components/TurnstileWidget', () => ({
  TurnstileWidget: () => <input type="hidden" name="turnstileToken" value="fictional-test-token" readOnly />,
}))

describe('faculty request submission', () => {
  beforeEach(() => {
    vi.mocked(invokePublic).mockReset()
  })

  it('allows only one request while a submission is in flight', async () => {
    let finish: (() => void) | undefined
    vi.mocked(invokePublic).mockImplementation(() => new Promise((resolve) => {
      finish = () => resolve({ data: { status: 'pending' }, error: null, requestId: crypto.randomUUID() })
    }))
    const user = userEvent.setup()
    render(<MemoryRouter><I18nProvider><RequestFacultyPage /></I18nProvider></MemoryRouter>)

    await user.type(screen.getByLabelText('Proposed faculty name'), 'Fictional Connectivity Profile')
    await user.type(screen.getByLabelText('University'), 'Fictional Research University')
    await user.type(screen.getByLabelText('Department'), 'Robotics')
    await user.selectOptions(screen.getByLabelText('Country'), 'United States')
    await user.type(screen.getByLabelText(/Research areas/), 'Robot learning')
    await user.type(screen.getByLabelText('Official university profile URL'), 'https://example.org/fictional-profile')

    const button = screen.getByRole('button', { name: 'Submit request' })
    await user.dblClick(button)
    expect(invokePublic).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    finish?.()
    expect(await screen.findByRole('status')).toHaveTextContent('submitted for moderation')
  })
})
