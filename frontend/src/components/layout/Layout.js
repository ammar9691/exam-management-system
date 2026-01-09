import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Header from './Header.js';
import Sidebar from './Sidebar.js';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <CssBaseline />
      <Header onMenuClick={toggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          pt: 4,
          mt: '72px',
          transition: 'margin-left 0.3s ease-in-out, padding 0.3s ease-in-out',
          minHeight: 'calc(100vh - 72px)',
          backgroundColor: '#F8FAFC',
          // Responsive adjustments
          '@media (max-width: 1024px)': {
            p: 3,
          },
          '@media (max-width: 768px)': {
            p: 2,
            ml: 0,
            mt: '72px',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
