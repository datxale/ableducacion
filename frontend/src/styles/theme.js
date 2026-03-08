import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#ef9a9a',
      dark: '#c62828',
    },
    warning: {
      main: '#ff9800',
      light: '#ffcc02',
      dark: '#e65100',
    },
    info: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#6a1b9a',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3436',
      secondary: '#636e72',
    },
  },
  typography: {
    fontFamily: "'Nunito', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export const gradeColors = [
  { bg: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', color: '#fff', shadow: 'rgba(255,107,107,0.4)' },
  { bg: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)', color: '#fff', shadow: 'rgba(78,205,196,0.4)' },
  { bg: 'linear-gradient(135deg, #A770EF 0%, #CF8BF3 100%)', color: '#fff', shadow: 'rgba(167,112,239,0.4)' },
  { bg: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', color: '#fff', shadow: 'rgba(247,151,30,0.4)' },
  { bg: 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)', color: '#fff', shadow: 'rgba(86,204,242,0.4)' },
  { bg: 'linear-gradient(135deg, #6FCF97 0%, #219653 100%)', color: '#fff', shadow: 'rgba(111,207,151,0.4)' },
];

export const subjectColors = [
  '#FF6B6B', '#4ECDC4', '#A770EF', '#f7971e',
  '#56CCF2', '#6FCF97', '#FF8E53', '#CF8BF3',
];

export const monthColors = [
  'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  'linear-gradient(135deg, #4ECDC4, #44A08D)',
  'linear-gradient(135deg, #A770EF, #CF8BF3)',
  'linear-gradient(135deg, #f7971e, #ffd200)',
  'linear-gradient(135deg, #56CCF2, #2F80ED)',
  'linear-gradient(135deg, #6FCF97, #219653)',
  'linear-gradient(135deg, #FF6B6B, #A770EF)',
  'linear-gradient(135deg, #4ECDC4, #56CCF2)',
  'linear-gradient(135deg, #f7971e, #FF6B6B)',
  'linear-gradient(135deg, #A770EF, #56CCF2)',
  'linear-gradient(135deg, #6FCF97, #4ECDC4)',
  'linear-gradient(135deg, #FF8E53, #ffd200)',
];

export default theme;
