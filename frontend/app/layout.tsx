'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './globals.css';

const tema = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' },
    secondary: { main: '#6b7280' },
    warning: { main: '#f59e0b' },
    error: { main: '#dc2626' },
    success: { main: '#16a34a' },
    background: { default: '#1e1e1e', paper: '#2a2a2a' },
    text: { primary: '#e5e5e5', secondary: '#a3a3a3' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, marginBottom: '2rem' },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #444444',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#333333',
            fontWeight: 700,
            borderBottom: '2px solid #444444',
          },
        },
      },
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>CRUD com Procedures SQL Server</title>
        <meta name="description" content="Sistema CRUD usando procedures do SQL Server" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={tema}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
