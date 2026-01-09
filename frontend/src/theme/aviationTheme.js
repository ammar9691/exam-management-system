import { createTheme } from '@mui/material/styles';

// Aviation Training Institute Theme
const aviationTheme = createTheme({
  palette: {
    primary: {
      main: '#0A2463',      // Navy blue - Professional aviation color
      light: '#3E92CC',     // Sky blue
      dark: '#001B3D',      // Darker navy
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#3E92CC',      // Sky blue - Clear skies
      light: '#00B4D8',     // Bright blue accent
      dark: '#2E7FBC',      // Darker sky blue
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',      // Modern green for passed/success
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',      // Amber for warnings/pending
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',      // Red for critical alerts
      light: '#EF4444',
      dark: '#B91C1C',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#00B4D8',      // Bright blue for information
      light: '#3BCEEB',
      dark: '#0096C7',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',   // Light cloud grey for page background
      paper: '#FFFFFF',      // Pure white for cards/surfaces
    },
    text: {
      primary: '#2C3E50',   // Dark charcoal for primary text
      secondary: '#6C757D', // Steel grey for secondary text
      disabled: '#9CA3AF',  // Light grey for disabled text
    },
    divider: '#E8F1F5',     // Subtle blue-grey for dividers
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E8F1F5',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#6C757D',
      600: '#475569',
      700: '#334155',
      800: '#2C3E50',
      900: '#1E293B',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
      fontSize: '3rem',        // 48px
      lineHeight: 1.17,
      letterSpacing: '-0.02em',
      color: '#0A2463',
    },
    h2: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
      fontSize: '2.25rem',     // 36px
      lineHeight: 1.22,
      letterSpacing: '-0.01em',
      color: '#0A2463',
    },
    h3: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
      fontSize: '1.75rem',     // 28px
      lineHeight: 1.29,
      color: '#0A2463',
    },
    h4: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 500,
      fontSize: '1.25rem',     // 20px
      lineHeight: 1.4,
      color: '#2C3E50',
    },
    h5: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 500,
      fontSize: '1rem',        // 16px
      lineHeight: 1.5,
      color: '#2C3E50',
    },
    h6: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 500,
      fontSize: '0.875rem',    // 14px
      lineHeight: 1.57,
      color: '#2C3E50',
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
      color: '#2C3E50',
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
      fontWeight: 500,
      color: '#6C757D',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 400,
      color: '#2C3E50',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
      fontWeight: 400,
      color: '#6C757D',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.33,
      fontWeight: 400,
      color: '#6C757D',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#6C757D',
    },
  },
  shape: {
    borderRadius: 8,         // Default border radius
  },
  shadows: [
    'none',
    '0 2px 8px rgba(10, 36, 99, 0.08)',                    // Card shadow
    '0 4px 16px rgba(10, 36, 99, 0.10)',                   // Elevated card
    '0 8px 24px rgba(10, 36, 99, 0.15)',                   // Hover state
    '0 12px 32px rgba(10, 36, 99, 0.18)',                  // High elevation
    '0 16px 40px rgba(10, 36, 99, 0.20)',
    '0 20px 60px rgba(10, 36, 99, 0.30)',                  // Modal shadow
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 2px 8px rgba(10, 36, 99, 0.08)',
    '0 4px 16px rgba(10, 36, 99, 0.10)',
    '0 8px 24px rgba(10, 36, 99, 0.15)',
    '0 12px 32px rgba(10, 36, 99, 0.18)',
    '0 16px 40px rgba(10, 36, 99, 0.20)',
    '0 20px 60px rgba(10, 36, 99, 0.30)',
    '0 20px 60px rgba(10, 36, 99, 0.30)',
    '0 20px 60px rgba(10, 36, 99, 0.30)',
    '0 20px 60px rgba(10, 36, 99, 0.30)',
    '0 20px 60px rgba(10, 36, 99, 0.30)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#3E92CC #E8F1F5',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 10,
            height: 10,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            background: '#E8F1F5',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            background: '#3E92CC',
            borderRadius: 5,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            background: '#2E7FBC',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(62, 146, 204, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(62, 146, 204, 0.35)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0A2463 0%, #3E92CC 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #001B3D 0%, #2E7FBC 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(10, 36, 99, 0.08)',
          border: '1px solid #E8F1F5',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(10, 36, 99, 0.15)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(10, 36, 99, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(10, 36, 99, 0.10)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(10, 36, 99, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0A2463 0%, #001B3D 100%)',
          boxShadow: '0 2px 8px rgba(10, 36, 99, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FAFBFC',
          borderRight: '1px solid #E8F1F5',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(62, 146, 204, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(62, 146, 204, 0.15)',
            borderLeft: '4px solid #3E92CC',
            paddingLeft: 'calc(20px - 4px)',
            '&:hover': {
              backgroundColor: 'rgba(62, 146, 204, 0.2)',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#6C757D',
          minWidth: 40,
          '.Mui-selected &': {
            color: '#3E92CC',
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#2C3E50',
          '.Mui-selected &': {
            color: '#0A2463',
            fontWeight: 600,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        filled: {
          border: '1px solid transparent',
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3E92CC',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                borderColor: '#3E92CC',
              },
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3E92CC',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3E92CC',
            borderWidth: 2,
          },
        },
        input: {
          padding: '12px 16px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#2C3E50',
          '&.Mui-focused': {
            color: '#3E92CC',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8FAFC',
            color: '#0A2463',
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '2px solid #3E92CC',
            padding: '16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background-color 0.2s ease-in-out',
            '&:nth-of-type(even)': {
              backgroundColor: '#FAFBFC',
            },
            '&:hover': {
              backgroundColor: '#F0F9FF',
            },
          },
          '& .MuiTableCell-body': {
            padding: '16px',
            fontSize: '0.875rem',
            color: '#2C3E50',
            borderBottom: '1px solid #E8F1F5',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          padding: 8,
          boxShadow: '0 20px 60px rgba(10, 36, 99, 0.30)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
          fontWeight: 600,
          fontFamily: "'Montserrat', sans-serif",
          color: '#0A2463',
          padding: '24px 24px 16px',
          borderBottom: '1px solid #E8F1F5',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
          borderTop: '1px solid #E8F1F5',
          gap: 12,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0A2463',
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '8px 12px',
        },
        arrow: {
          color: '#0A2463',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: '#E8F1F5',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.625rem',
          fontWeight: 600,
          minWidth: 18,
          height: 18,
          padding: '0 5px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #3E92CC 0%, #00B4D8 100%)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
        },
        standardError: {
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          color: '#B91C1C',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#D97706',
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 180, 216, 0.1)',
          color: '#0096C7',
        },
      },
    },
  },
});

export default aviationTheme;
