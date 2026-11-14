import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/api/client'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it("says it can't connect when the server is unreachable", () => {
    render(<ErrorState error={new ApiError('network')} />)

    expect(screen.getByRole('alert')).toHaveTextContent("Can't connect")
    expect(screen.getByText(/can't reach the one percent server/i)).toBeInTheDocument()
  })

  it('uses a generic title for server errors', () => {
    render(<ErrorState error={new ApiError('server')} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('never shows raw technical errors', () => {
    render(<ErrorState error={new Error('TypeError: x is undefined')} />)

    expect(screen.queryByText(/TypeError/)).not.toBeInTheDocument()
    expect(screen.getByText('Something went wrong. Try again.')).toBeInTheDocument()
  })

  it('retries when "Try again" is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState error={new ApiError('timeout')} onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('has no button without onRetry, and disables it while retrying', () => {
    const { rerender } = render(<ErrorState error={new ApiError('server')} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<ErrorState error={new ApiError('server')} onRetry={() => {}} retrying />)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDisabled()
  })

  it('compact mode keeps the message but drops the title', () => {
    render(<ErrorState compact error={new ApiError('network')} />)

    expect(screen.queryByText("Can't connect")).not.toBeInTheDocument()
    expect(screen.getByText(/can't reach/i)).toBeInTheDocument()
  })
})
