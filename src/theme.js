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
  },
})

export default darkTheme
