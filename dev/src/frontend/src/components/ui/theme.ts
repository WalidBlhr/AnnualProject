import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#202C39',
      light: '#5C8D89',
      dark: '#202C39',
    },
    secondary: {
      main: '#E94F37',
      light: '#A7D7C5',
      dark: '#5C8D89',
    },
    background: {
      default: '#F0F7EE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202C39',
      secondary: '#5C8D89',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#202C39',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
        containedPrimary: {
          backgroundColor: '#E94F37',
          '&:hover': {
            backgroundColor: '#5C8D89',
          },
        },
      },
    },
  },
});

export default theme;