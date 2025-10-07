import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard,
  People,
  Quiz,
  Assignment,
  Assessment,
  Settings,
  School,
  Grade
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const adminMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Users', icon: <People />, path: '/admin/users' },
    { text: 'Questions', icon: <Quiz />, path: '/admin/questions' },
    { text: 'Exams', icon: <Assignment />, path: '/admin/exams' },
    { text: 'Results', icon: <Assessment />, path: '/admin/results' },
  ];

  const studentMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/student/dashboard' },
    { text: 'My Exams', icon: <Assignment />, path: '/student/exams' },
    { text: 'Results', icon: <Grade />, path: '/student/results' },
  ];

  const instructorMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/instructor/dashboard' },
    { text: 'Grading', icon: <Grade />, path: '/instructor/grading' },
    { text: 'Students', icon: <School />, path: '/instructor/students' },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminMenuItems;
      case 'student':
        return studentMenuItems;
      case 'instructor':
        return instructorMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? 240 : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 60,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        {open && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {user?.role?.toUpperCase()} PANEL
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
