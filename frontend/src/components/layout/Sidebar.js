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
  Typography,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Dashboard,
  People,
  Quiz,
  Assignment,
  Assessment,
  School,
  Grade,
  HelpOutline,
  Speed,
  EmojiEvents,
  Storage
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const adminMenuItems = [
    { text: 'Control Center', icon: <Speed />, path: '/admin/dashboard' },
    { text: 'Users', icon: <People />, path: '/admin/users' },
    { text: 'Question Bank', icon: <Storage />, path: '/qdb/questions' },
    { text: 'Exams', icon: <Assignment />, path: '/admin/exams' },
    { text: 'Module Exams', icon: <Quiz />, path: '/admin/module-exams' },
    { text: 'Results', icon: <Assessment />, path: '/admin/results' },
  ];

  const studentMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/student/dashboard' },
    { text: 'Training Modules', icon: <Assignment />, path: '/student/exams' },
    { text: 'My Results', icon: <EmojiEvents />, path: '/student/results' },
  ];

  const instructorMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/instructor/dashboard' },
    { text: 'Question Bank', icon: <Storage />, path: '/qdb/questions' },
    { text: 'Exams', icon: <Assignment />, path: '/instructor/exams' },
    { text: 'Module Exams', icon: <Quiz />, path: '/instructor/module-exams' },
    { text: 'Grading', icon: <Grade />, path: '/instructor/grading' },
    { text: 'Students', icon: <School />, path: '/instructor/students' },
  ];

  const examManagerMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/exam-manager/dashboard' },
    { text: 'Question Bank', icon: <Storage />, path: '/qdb/questions' },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminMenuItems;
      case 'student':
        return studentMenuItems;
      case 'instructor':
        return instructorMenuItems;
      case 'exam_manager':
        return examManagerMenuItems;
      default:
        return [];
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#F59E0B';
      case 'instructor':
        return '#10B981';
      case 'student':
        return '#3E92CC';
      case 'exam_manager':
        return '#8B5CF6'; // Purple for exam manager
      default:
        return '#6C757D';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'instructor':
        return 'Instructor';
      case 'student':
        return 'Pilot Student';
      case 'exam_manager':
        return 'Exam Manager';
      default:
        return role;
    }
  };

  const menuItems = getMenuItems();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? 260 : 64,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 260 : 64,
          boxSizing: 'border-box',
          top: '72px',
          height: 'calc(100% - 72px)',
          transition: 'width 0.3s ease-in-out',
          overflowX: 'hidden',
          backgroundColor: '#FAFBFC',
          borderRight: '1px solid #E8F1F5',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* User Info Section */}
        {open && (
          <Box
            sx={{
              p: 2.5,
              borderBottom: '1px solid #E8F1F5',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${getRoleBadgeColor(user?.role)} 0%, ${getRoleBadgeColor(user?.role)}dd 100%)`,
                  border: '2px solid #E8F1F5',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#2C3E50',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    mt: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: `${getRoleBadgeColor(user?.role)}20`,
                    border: `1px solid ${getRoleBadgeColor(user?.role)}40`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: getRoleBadgeColor(user?.role),
                      fontWeight: 600,
                      fontSize: '0.625rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {user?.role}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Menu Items */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
          {open && (
            <Box sx={{ px: 2.5, pb: 1 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#6C757D',
                  letterSpacing: '0.08em',
                }}
              >
                Navigation
              </Typography>
            </Box>
          )}

          <List sx={{ px: 1 }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip
                    title={!open ? item.text : ''}
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: 2,
                        mx: 0.5,
                        transition: 'all 0.2s ease-in-out',
                        backgroundColor: isSelected
                          ? 'rgba(62, 146, 204, 0.15)'
                          : 'transparent',
                        borderLeft: isSelected ? '4px solid #3E92CC' : '4px solid transparent',
                        paddingLeft: isSelected ? 'calc(20px - 4px)' : '20px',
                        '&:hover': {
                          backgroundColor: 'rgba(62, 146, 204, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(62, 146, 204, 0.15)',
                          '&:hover': {
                            backgroundColor: 'rgba(62, 146, 204, 0.2)',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: isSelected ? '#3E92CC' : '#6C757D',
                          transition: 'color 0.2s ease-in-out',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#0A2463' : '#2C3E50',
                        }}
                        sx={{ opacity: open ? 1 : 0 }}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Bottom Section - Help */}
        <Box sx={{ borderTop: '1px solid #E8F1F5' }}>
          <List sx={{ px: 1, py: 2 }}>
            <ListItem disablePadding>
              <Tooltip title={!open ? 'Help & Support' : ''} placement="right" arrow>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    mx: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(62, 146, 204, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                      color: '#6C757D',
                    }}
                  >
                    <HelpOutline />
                  </ListItemIcon>
                  <ListItemText
                    primary="Help & Support"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#2C3E50',
                    }}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>

          {open && (
            <Box sx={{ px: 2.5, pb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#9CA3AF',
                  fontSize: '0.65rem',
                }}
              >
                v1.0.0 - Skyline Aviation
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
