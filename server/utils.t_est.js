// energy.test.js
const { getEnergyPrices } = require('./utils') // Import the function you want to test
const storage = require('./storage') // Import the storage module

describe('getEnergyPrices', () => {
  // Mock the fetch function
  const mockFetch = jest.fn()

  beforeAll(() => {
    global.fetch = mockFetch
  })

  afterAll(() => {
    delete global.fetch
  })

  it('should fetch and return energy prices', async () => {
    // Mock the fetch response
    const mockResponse = {
      text: jest
        .fn()
        .mockResolvedValue(
          '[{"aikaleima_suomi":"2023-10-14T06:00","hinta":"-0.43700"}, /* ... */ ]'
        ),
    }
    mockFetch.mockResolvedValue(mockResponse)

    // Mock the storage functions
    const mockLoadOrDefault = jest.fn().mockReturnValue({})
    const mockSave = jest.fn()

    storage.loadOrDefault = mockLoadOrDefault
    storage.save = mockSave

    // Call the function and test
    const result = await getEnergyPrices()

    expect(result).toEqual(
      '[{"aikaleima_suomi":"2023-10-14T06:00","hinta":"-0.43700"}, /* ... */ ]'
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.sahkohinta-api.fi/api/v1/halpa')
    )
    expect(mockLoadOrDefault).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalled()
  })

  it('should handle errors', async () => {
    // Mock the fetch function to simulate an error
    mockFetch.mockRejectedValue(new Error('Fetch error'))

    // Call the function and test
    const result = await getEnergyPrices()

    expect(result).toBeNull()
  })
})
