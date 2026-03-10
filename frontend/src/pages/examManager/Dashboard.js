import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Fade,
  IconButton,
  alpha,
} from '@mui/material';
import {
  Quiz,
  Assignment,
  Refresh,
  CheckCircle,
  Schedule,
  InfoOutlined,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import examManagerService from '../../services/examManagerService';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, gradient, delay = 0 }) => (
  <Fade in timeout={600} style={{ transitionDelay: `${delay}ms` }}>
    <Card sx={{
      height: '100%', border: 'none', borderRadius: 3, position: 'relative', overflow: 'hidden',
      background: '#fff', boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)',
      transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(10, 36, 99, 0.12)' },
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ color: '#6C757D', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              {title}
            </Typography>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '2rem', color: '#2C3E50', lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: gradient, boxShadow: `0 4px 14px ${alpha('#0A2463', 0.15)}`,
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 24, color: '#fff' } })}
          </Box>
        </Box>
      </CardContent>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: gradient }} />
    </Card>
  </Fade>
);

const ExamManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await examManagerService.getDashboard();
      setStats(response.data.data.stats);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#8B5CF6' }} />
        </Box>
      </Layout>
    );
  }

  if (error && !stats) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => fetchDashboardData()}>Retry</Button>}>
            {error}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Header Banner */}
        <Fade in timeout={500}>
          <Box sx={{
            mb: 4, p: { xs: 3, md: 4 }, borderRadius: 4, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
            boxShadow: '0 8px 32px rgba(91, 33, 182, 0.25)',
          }}>
            <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <Box sx={{ position: 'absolute', right: -60, top: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <Box sx={{ position: 'absolute', right: 60, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 300, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', mb: 0.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Exam Management
                </Typography>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#fff', mb: 0.5 }}>
                  Exam Manager Dashboard
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
                  Overview of exam system statistics
                </Typography>
              </Box>
              <IconButton onClick={() => fetchDashboardData(true)} disabled={refreshing}
                sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Box>
          </Box>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <StatCard title="Total Questions" value={stats?.totalQuestions || 0} icon={<Quiz />} gradient="linear-gradient(135deg, #0096C7, #00B4D8)" delay={0} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatCard title="Total Exams" value={stats?.totalExams || 0} icon={<Assignment />} gradient="linear-gradient(135deg, #5B21B6, #8B5CF6)" delay={100} />
          </Grid>
        </Grid>

        {/* Info Card */}
        <Fade in timeout={600} style={{ transitionDelay: '200ms' }}>
          <Alert
            severity="info"
            icon={<InfoOutlined />}
            sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: alpha('#00B4D8', 0.2), backgroundColor: alpha('#00B4D8', 0.04) }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#2C3E50', mb: 0.5 }}>
              Module-Based System Coming Soon
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6C757D' }}>
              Question management and exam creation features will be available in the upcoming module-based system update, allowing better organization by categories, modules, and difficulty levels.
            </Typography>
          </Alert>
        </Fade>

        {/* Capabilities */}
        <Fade in timeout={600} style={{ transitionDelay: '300ms' }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 3 }}>
                Role Capabilities
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: alpha('#10B981', 0.2), backgroundColor: alpha('#10B981', 0.03) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#059669' }}>Available</Typography>
                    </Box>
                    {['View dashboard statistics', 'Monitor overall system health', 'Access question database'].map((item) => (
                      <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.85rem', color: '#2C3E50' }}>{item}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Schedule sx={{ color: '#6C757D', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#6C757D' }}>Coming Soon</Typography>
                    </Box>
                    {['Question approval workflow', 'Module-based question management', 'Exam review and oversight'].map((item) => (
                      <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#CBD5E1', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.85rem', color: '#6C757D' }}>{item}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Layout>
  );
};

export default ExamManagerDashboard;
