import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2c5530', // Dark Green
      light: '#4a7c59', // Light Green
      dark: '#1e3a21', // Darker Green
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#ff6b35', // Orange
      light: '#ff8a65', // Light Orange
      dark: '#e64a19', // Dark Orange
      contrastText: '#FFFFFF'
    },
    success: {
      main: '#2c5530',
      light: '#4a7c59',
      dark: '#1e3a21'
    },
    warning: {
      main: '#ff6b35',
      light: '#ff8a65',
      dark: '#e64a19'
    },
    background: {
      default: '#f5f5f5',
      paper: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontSize: '0.8rem', fontWeight: 500 }
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          padding: '8px 12px'
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          height: '24px'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          textTransform: 'none'
        }
      }
    }
  }
});

export const formatCurrency = (amount) => {
  return `KSh ${parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export default theme;