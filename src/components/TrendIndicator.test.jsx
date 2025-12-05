import { render, screen } from '@testing-library/react'
import TrendIndicator from './TrendIndicator'

describe('TrendIndicator', () => {
  describe('direction arrows', () => {
    it('should render up arrow for rising trend', () => {
      render(<TrendIndicator direction="rising" delta={1.5} />)

      expect(screen.getByTestId('trend-arrow-rising')).toBeInTheDocument()
    })

    it('should render up-right arrow for rising-slightly trend', () => {
      render(<TrendIndicator direction="rising-slightly" delta={0.5} />)

      expect(
        screen.getByTestId('trend-arrow-rising-slightly')
      ).toBeInTheDocument()
    })

    it('should render horizontal arrow for stable trend', () => {
      render(<TrendIndicator direction="stable" delta={0.1} />)

      expect(screen.getByTestId('trend-arrow-stable')).toBeInTheDocument()
    })

    it('should render down-right arrow for falling-slightly trend', () => {
      render(<TrendIndicator direction="falling-slightly" delta={-0.5} />)

      expect(
        screen.getByTestId('trend-arrow-falling-slightly')
      ).toBeInTheDocument()
    })

    it('should render down arrow for falling trend', () => {
      render(<TrendIndicator direction="falling" delta={-1.5} />)

      expect(screen.getByTestId('trend-arrow-falling')).toBeInTheDocument()
    })
  })

  describe('delta value display', () => {
    it('should display positive delta with plus sign', () => {
      render(<TrendIndicator direction="rising" delta={1.5} />)

      expect(screen.getByText('+1.5')).toBeInTheDocument()
    })

    it('should display negative delta with minus sign', () => {
      render(<TrendIndicator direction="falling" delta={-1.5} />)

      expect(screen.getByText('-1.5')).toBeInTheDocument()
    })

    it('should display zero delta without sign', () => {
      render(<TrendIndicator direction="stable" delta={0} />)

      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('should round delta to one decimal place', () => {
      render(<TrendIndicator direction="rising" delta={1.567} />)

      expect(screen.getByText('+1.6')).toBeInTheDocument()
    })
  })

  describe('color styling', () => {
    it('should have green color for rising trend', () => {
      render(<TrendIndicator direction="rising" delta={1.5} />)

      const arrow = screen.getByTestId('trend-arrow-rising')
      expect(arrow).toHaveClass('trend-rising')
    })

    it('should have green color for rising-slightly trend', () => {
      render(<TrendIndicator direction="rising-slightly" delta={0.5} />)

      const arrow = screen.getByTestId('trend-arrow-rising-slightly')
      expect(arrow).toHaveClass('trend-rising')
    })

    it('should have gray color for stable trend', () => {
      render(<TrendIndicator direction="stable" delta={0} />)

      const arrow = screen.getByTestId('trend-arrow-stable')
      expect(arrow).toHaveClass('trend-stable')
    })

    it('should have red color for falling-slightly trend', () => {
      render(<TrendIndicator direction="falling-slightly" delta={-0.5} />)

      const arrow = screen.getByTestId('trend-arrow-falling-slightly')
      expect(arrow).toHaveClass('trend-falling')
    })

    it('should have red color for falling trend', () => {
      render(<TrendIndicator direction="falling" delta={-1.5} />)

      const arrow = screen.getByTestId('trend-arrow-falling')
      expect(arrow).toHaveClass('trend-falling')
    })
  })

  describe('when trend data unavailable', () => {
    it('should not render anything when direction is null', () => {
      const { container } = render(
        <TrendIndicator direction={null} delta={null} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should not render anything when direction is undefined', () => {
      const { container } = render(<TrendIndicator />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('unit suffix', () => {
    it('should display unit suffix when provided', () => {
      render(<TrendIndicator direction="rising" delta={1.5} unit="%" />)

      expect(screen.getByText('+1.5%')).toBeInTheDocument()
    })

    it('should not display unit when not provided', () => {
      render(<TrendIndicator direction="rising" delta={1.5} />)

      expect(screen.getByText('+1.5')).toBeInTheDocument()
    })
  })
})
