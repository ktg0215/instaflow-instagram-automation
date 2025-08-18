import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/context/ToastContext'

// Test component that uses the toast context
const TestComponent = () => {
  const { showToast, toasts, removeToast, clearAllToasts } = useToast()

  return (
    <div>
      <button onClick={() => showToast({ type: 'success', title: 'Success!', message: 'Operation completed' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ type: 'error', title: 'Error!', message: 'Something went wrong' })}>
        Show Error
      </button>
      <button onClick={() => showToast({ type: 'warning', title: 'Warning!' })}>
        Show Warning
      </button>
      <button onClick={() => showToast({ type: 'info', title: 'Info!' })}>
        Show Info
      </button>
      <button onClick={() => removeToast(toasts[0]?.id || '')}>
        Remove First
      </button>
      <button onClick={() => clearAllToasts()}>
        Clear All
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  )
}

describe('ToastContext', () => {
  const renderWithToastProvider = () => {
    return render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
  }

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should show success toast', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))

    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Operation completed')).toBeInTheDocument()
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1')
  })

  it('should show error toast', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Error'))

    expect(screen.getByText('Error!')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should show warning toast without message', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Warning'))

    expect(screen.getByText('Warning!')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should show info toast', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Info'))

    expect(screen.getByText('Info!')).toBeInTheDocument()
  })

  it('should remove toast manually', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1')

    await user.click(screen.getByText('Remove First'))
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
  })

  it('should clear all toasts', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))
    await user.click(screen.getByText('Show Error'))
    expect(screen.getByTestId('toast-count')).toHaveTextContent('2')

    await user.click(screen.getByText('Clear All'))
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
  })

  it('should auto-remove toast after duration', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1')

    // Fast-forward time by 5000ms (default duration)
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
    })
  })

  it('should handle multiple toasts', async () => {
    renderWithToastProvider()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))
    await user.click(screen.getByText('Show Error'))
    await user.click(screen.getByText('Show Warning'))

    expect(screen.getByTestId('toast-count')).toHaveTextContent('3')
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Error!')).toBeInTheDocument()
    expect(screen.getByText('Warning!')).toBeInTheDocument()
  })

  it('should throw error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useToast must be used within a ToastProvider')

    consoleSpy.mockRestore()
  })
})