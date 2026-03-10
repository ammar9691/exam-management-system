import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  FlightTakeoff,
  BadgeOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.js';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await register(formData);

    if (result.success) {
      if (result.pending) {
        setSuccess('Account created! Your account is pending administrator approval. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      } else if (result.user) {
        navigate(`/${result.user.role}/dashboard`);
      }
    } else {
      setErrors({ submit: result.error || 'Registration failed. Please try again.' });
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
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Box sx={{
          position: 'absolute', top: '15%', left: '8%', width: 350, height: 350,
          borderRadius: '50%', background: 'rgba(62, 146, 204, 0.08)', filter: 'blur(60px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(0, 180, 216, 0.06)', filter: 'blur(80px)',
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
            <Box sx={{ mt: 6, maxWidth: 400, mx: 'auto' }}>
              {[
                { title: 'EASA Part-66 Compliant', desc: 'Full compliance with aviation training standards' },
                { title: 'Secure Examinations', desc: 'Randomized questions with time-controlled access' },
                { title: 'Progress Tracking', desc: 'Track your training journey from start to certification' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3, textAlign: 'left' }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(0, 180, 216, 0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: '#00B4D8', fontWeight: 700, fontSize: '0.875rem' }}>
                      {i + 1}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', mb: 0.25 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* Right panel - Register form */}
      <Box
        sx={{
          width: { xs: '100%', md: 520 }, minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          px: { xs: 3, sm: 6 }, py: 4,
          background: '#fff',
          borderRadius: { xs: 0, md: '32px 0 0 32px' },
          boxShadow: { md: '-20px 0 60px rgba(0,0,0,0.15)' },
          position: 'relative', zIndex: 1,
        }}
      >
        <Fade in timeout={600}>
          <Box sx={{ maxWidth: 400, mx: 'auto', width: '100%' }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
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
              Create Account
            </Typography>
            <Typography variant="body1" sx={{ color: '#6C757D', mb: 3 }}>
              Register to start your aviation training
            </Typography>

            {success && (
              <Fade in>
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>
              </Fade>
            )}

            {errors.submit && (
              <Fade in>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errors.submit}</Alert>
              </Fade>
            )}

            <Alert
              severity="info"
              icon={<InfoOutlined fontSize="small" />}
              sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}
            >
              Your account will require administrator approval before access is granted.
            </Alert>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth required autoFocus
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth required
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select fullWidth
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeOutlined sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="student">Student - Pilot Trainee</MenuItem>
                <MenuItem value="instructor">Instructor - Training Professional</MenuItem>
              </TextField>

              <TextField
                fullWidth required
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 2 }}
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

              <TextField
                fullWidth required
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                        {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#6C757D' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography component="span" variant="body2" sx={{ color: '#3E92CC', fontWeight: 600, '&:hover': { color: '#0A2463' } }}>
                      Sign In
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{
              display: 'block', textAlign: 'center', mt: 4, color: '#9CA3AF',
            }}>
              Skyline Aviation Training System v1.0
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default Register;
