import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Header from './Header.js';
import Sidebar from './Sidebar.js';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header onMenuClick={toggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: sidebarOpen ? '240px' : '60px',
          transition: 'margin 0.3s',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
