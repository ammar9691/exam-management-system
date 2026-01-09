import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  FlightTakeoff
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#F59E0B';
      case 'instructor':
        return '#10B981';
      case 'student':
        return '#3E92CC';
      default:
        return '#6C757D';
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #0A2463 0%, #001B3D 100%)',
        boxShadow: '0 2px 8px rgba(10, 36, 99, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: 3 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            '&:hover': {
              backgroundColor: 'rgba(62, 146, 204, 0.15)',
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Aviation Logo & Branding */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <FlightTakeoff
            sx={{
              fontSize: 32,
              color: '#00B4D8',
              transform: 'rotate(-45deg)',
            }}
          />
          <Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: '1.25rem',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                color: 'white'
              }}
            >
              SKYLINE AVIATION ACADEMY
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.85,
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}
            >
              Excellence in Flight Training
            </Typography>
          </Box>
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notifications */}
          <IconButton
            color="inherit"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(62, 146, 204, 0.15)',
              }
            }}
          >
            <Badge
              badgeContent={4}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  minWidth: 18,
                  height: 18,
                }
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Avatar & Menu */}
          <IconButton
            onClick={handleMenu}
            sx={{
              p: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(62, 146, 204, 0.15)',
              }
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                fontSize: '1rem',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${getRoleBadgeColor(user?.role)} 0%, ${getRoleBadgeColor(user?.role)}dd 100%)`,
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(10, 36, 99, 0.15)',
                border: '1px solid #E8F1F5',
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* User info header */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E8F1F5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2C3E50' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6C757D' }}>
                {user?.email}
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
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {user?.role}
                </Typography>
              </Box>
            </Box>

            <MenuItem
              onClick={handleProfile}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(62, 146, 204, 0.08)',
                }
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" sx={{ color: '#3E92CC' }} />
              </ListItemIcon>
              <ListItemText
                primary="My Profile"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                color: '#DC2626',
                '&:hover': {
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#DC2626' }} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
