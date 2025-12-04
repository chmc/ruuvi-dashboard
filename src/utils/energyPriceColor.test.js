import energyPriceColor from './energyPriceColor'

describe('energyPriceColor', () => {
  const mockColorSet = {
    color1: { main: '#00ff00' }, // Green - <= 5
    color2: { main: '#80ff00' }, // Light green - 5-8
    color3: { main: '#ffff00' }, // Yellow - 8-13
    color4: { main: '#ff8000' }, // Orange - 13-20
    color5: { main: '#ff0000' }, // Red - 20-25
    color6: { main: '#800000' }, // Dark red - > 25
  }

  describe('getByPrice', () => {
    it('should return color1 (green) for price <= 5', () => {
      expect(energyPriceColor.getByPrice(0, mockColorSet)).toBe('#00ff00')
      expect(energyPriceColor.getByPrice(3, mockColorSet)).toBe('#00ff00')
      expect(energyPriceColor.getByPrice(5, mockColorSet)).toBe('#00ff00')
    })

    it('should return color2 (light green) for price > 5 and <= 8', () => {
      expect(energyPriceColor.getByPrice(5.01, mockColorSet)).toBe('#80ff00')
      expect(energyPriceColor.getByPrice(6.5, mockColorSet)).toBe('#80ff00')
      expect(energyPriceColor.getByPrice(8, mockColorSet)).toBe('#80ff00')
    })

    it('should return color3 (yellow) for price > 8 and <= 13', () => {
      expect(energyPriceColor.getByPrice(8.01, mockColorSet)).toBe('#ffff00')
      expect(energyPriceColor.getByPrice(10, mockColorSet)).toBe('#ffff00')
      expect(energyPriceColor.getByPrice(13, mockColorSet)).toBe('#ffff00')
    })

    it('should return color4 (orange) for price > 13 and <= 20', () => {
      expect(energyPriceColor.getByPrice(13.01, mockColorSet)).toBe('#ff8000')
      expect(energyPriceColor.getByPrice(15, mockColorSet)).toBe('#ff8000')
      expect(energyPriceColor.getByPrice(20, mockColorSet)).toBe('#ff8000')
    })

    it('should return color5 (red) for price > 20 and <= 25', () => {
      expect(energyPriceColor.getByPrice(20.01, mockColorSet)).toBe('#ff0000')
      expect(energyPriceColor.getByPrice(22.5, mockColorSet)).toBe('#ff0000')
      expect(energyPriceColor.getByPrice(25, mockColorSet)).toBe('#ff0000')
    })

    it('should return color6 (dark red) for price > 25', () => {
      expect(energyPriceColor.getByPrice(25.01, mockColorSet)).toBe('#800000')
      expect(energyPriceColor.getByPrice(30, mockColorSet)).toBe('#800000')
      expect(energyPriceColor.getByPrice(100, mockColorSet)).toBe('#800000')
    })

    it('should handle negative prices (return green)', () => {
      expect(energyPriceColor.getByPrice(-5, mockColorSet)).toBe('#00ff00')
      expect(energyPriceColor.getByPrice(-0.5, mockColorSet)).toBe('#00ff00')
    })

    it('should handle boundary values correctly', () => {
      // Testing exact boundaries
      expect(energyPriceColor.getByPrice(5, mockColorSet)).toBe('#00ff00')
      expect(energyPriceColor.getByPrice(5.001, mockColorSet)).toBe('#80ff00')
      expect(energyPriceColor.getByPrice(8, mockColorSet)).toBe('#80ff00')
      expect(energyPriceColor.getByPrice(8.001, mockColorSet)).toBe('#ffff00')
      expect(energyPriceColor.getByPrice(13, mockColorSet)).toBe('#ffff00')
      expect(energyPriceColor.getByPrice(13.001, mockColorSet)).toBe('#ff8000')
      expect(energyPriceColor.getByPrice(20, mockColorSet)).toBe('#ff8000')
      expect(energyPriceColor.getByPrice(20.001, mockColorSet)).toBe('#ff0000')
      expect(energyPriceColor.getByPrice(25, mockColorSet)).toBe('#ff0000')
      expect(energyPriceColor.getByPrice(25.001, mockColorSet)).toBe('#800000')
    })
  })
})
