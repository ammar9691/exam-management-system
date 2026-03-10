import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, FlightTakeoff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.js';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (result.user?.role) {
        const routes = {
          admin: '/admin/dashboard',
          student: '/student/dashboard',
          instructor: '/instructor/dashboard',
          exam_manager: '/exam-manager/dashboard',
        };
        navigate(routes[result.user.role] || '/');
      } else {
        setError('Login succeeded but user data is incomplete.');
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0A2463 0%, #001B3D 50%, #0A2463 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <Box sx={{
          position: 'absolute', top: '10%', left: '5%', width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(62, 146, 204, 0.08)',
          filter: 'blur(60px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '15%', right: '10%', width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(0, 180, 216, 0.06)',
          filter: 'blur(80px)',
        }} />
      </Box>

      {/* Left panel - Branding */}
      <Box
        sx={{
          flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', position: 'relative', px: 8,
        }}
      >
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '20px', mx: 'auto', mb: 4,
              background: 'linear-gradient(135deg, #3E92CC, #00B4D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 40px rgba(0, 180, 216, 0.3)',
            }}>
              <FlightTakeoff sx={{ fontSize: 40, color: '#fff', transform: 'rotate(-45deg)' }} />
            </Box>
            <Typography variant="h3" sx={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
              color: '#fff', mb: 2, letterSpacing: '-0.5px',
            }}>
              Skyline Aviation
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400, maxWidth: 400 }}>
              Training & Examination Management System
            </Typography>
            <Box sx={{
              mt: 6, display: 'flex', gap: 4, justifyContent: 'center',
            }}>
              {[
                { label: 'Modules', value: '17+' },
                { label: 'Questions', value: '5000+' },
                { label: 'Pass Rate', value: '94%' },
              ].map((stat) => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#00B4D8', fontWeight: 700, fontFamily: "'Montserrat'" }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* Right panel - Login form */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 }, minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          px: { xs: 3, sm: 6 }, py: 4,
          background: '#fff',
          borderRadius: { xs: 0, md: '32px 0 0 32px' },
          boxShadow: { md: '-20px 0 60px rgba(0,0,0,0.15)' },
          position: 'relative', zIndex: 1,
        }}
      >
        <Fade in timeout={600}>
          <Box sx={{ maxWidth: 360, mx: 'auto', width: '100%' }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '16px',
                background: 'linear-gradient(135deg, #0A2463, #3E92CC)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FlightTakeoff sx={{ fontSize: 28, color: '#fff', transform: 'rotate(-45deg)' }} />
              </Box>
            </Box>

            <Typography variant="h4" sx={{
              fontFamily: "'Montserrat'", fontWeight: 700, color: '#0A2463', mb: 0.5,
            }}>
              Welcome back
            </Typography>
            <Typography variant="body1" sx={{ color: '#6C757D', mb: 4 }}>
              Sign in to your account to continue
            </Typography>

            {error && (
              <Fade in>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
              </Fade>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth required autoFocus
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth required
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #0A2463 0%, #3E92CC 100%)',
                  boxShadow: '0 4px 16px rgba(10, 36, 99, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #081D4F 0%, #3585B8 100%)',
                    boxShadow: '0 6px 24px rgba(10, 36, 99, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#6C757D' }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography component="span" variant="body2" sx={{ color: '#3E92CC', fontWeight: 600, '&:hover': { color: '#0A2463' } }}>
                      Sign Up
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{
              display: 'block', textAlign: 'center', mt: 6,
              color: '#9CA3AF',
            }}>
              Skyline Aviation Training System v1.0
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default Login;
