import { createTheme } from '@mui/material/styles'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#228B22', // Dark green color
    },
    text: {
      primary: '#228B22', // Font color
      secondary: '#008000',
    },
    energyPriceColors: {
      color1: {
        main: 'rgba(0, 204, 136, 0.5)',
      },
      color2: {
        main: 'rgba(158, 229, 112, 0.5)',
      },
      color3: {
        main: 'rgba(255, 221, 51, 0.5)',
      },
      color4: {
        main: 'rgba(255, 98, 98, 0.8)',
      },
      color5: {
        main: 'rgba(255, 30, 30, 0.7)',
      },
      color6: {
        main: 'rgba(255, 30, 30, 1)',
      },
    },
  },
})

export default darkTheme
