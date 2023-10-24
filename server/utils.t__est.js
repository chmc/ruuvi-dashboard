// // utils.test.js
// const utils = require('./utils') // Import the module you want to test

// // Mock the storage module using a factory function
// jest.mock('./storage', () => {
//   const mockStorage = {
//     loadOrDefault: jest.fn(),
//     save: jest.fn(),
//   }
//   return mockStorage
// })

// // Mock the getEnergyPricesFromApi function
// const getEnergyPricesFromApi = jest.fn()

// describe('getEnergyPrices', () => {
//   it('should fetch and save energy prices to storage', async () => {
//     // Mock the behavior of the storage module
//     // eslint-disable-next-line global-require
//     const storage = require('./storage') // Import the mocked storage module
//     storage.loadOrDefault.mockReturnValue({
//       todayEnergyPrices: null, // Simulate an empty storage
//     })

//     // Mock the behavior of the getEnergyPricesFromApi function
//     const mockApiResponse =
//       '[{"aikaleima_suomi":"2023-10-14T06:00","hinta":"-0.43700"}, /* ... */ ]'
//     getEnergyPricesFromApi.mockReturnValue(mockApiResponse)

//     const result = await utils.getEnergyPrices()

//     // Check that the function correctly returns the API response
//     expect(result).toEqual(mockApiResponse)

//     // Check that the storage functions were called with the expected data
//     expect(storage.loadOrDefault).toHaveBeenCalled()
//     expect(storage.save).toHaveBeenCalledWith(
//       expect.objectContaining({
//         todayEnergyPrices: expect.objectContaining({
//           updatedAt: expect.any(Date),
//           pricesForDate: expect.any(String),
//           data: mockApiResponse,
//         }),
//       })
//     )

//     // Check that getEnergyPricesFromApi was called
//     expect(getEnergyPricesFromApi).toHaveBeenCalled()
//   })

//   it('should handle errors', async () => {
//     // Mock the behavior of the storage module
//     // eslint-disable-next-line global-require
//     const storage = require('./storage') // Import the mocked storage module
//     storage.loadOrDefault.mockReturnValue({
//       todayEnergyPrices: null, // Simulate an empty storage
//     })

//     // Mock an error response from the API
//     getEnergyPricesFromApi.mockRejectedValue(new Error('API error'))

//     const result = await utils.getEnergyPrices()

//     // Check that the function returns null on error
//     expect(result).toBeNull()

//     // Check that the error was logged
//     expect(console.error).toHaveBeenCalledWith(expect.any(Error))

//     // Check that the storage functions were still called
//     expect(storage.loadOrDefault).toHaveBeenCalled()
//     expect(storage.save).toHaveBeenCalled()
//   })
// })
