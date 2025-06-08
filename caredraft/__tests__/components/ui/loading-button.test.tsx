import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoadingButton } from '@/components/ui/loading-button'

describe('LoadingButton', () => {
  it('renders children when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading text when loading', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Saving...">
        Click me
      </LoadingButton>
    )
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('calls onClick when clicked and not loading', () => {
    const handleClick = jest.fn()
    render(
      <LoadingButton onClick={handleClick}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when loading', () => {
    const handleClick = jest.fn()
    render(
      <LoadingButton isLoading={true} onClick={handleClick}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(
      <LoadingButton className="custom-class">
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('spreads additional props', () => {
    render(
      <LoadingButton data-testid="test-button" type="submit">
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByTestId('test-button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
