import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Fade,
  IconButton,
  alpha,
} from '@mui/material';
import {
  School,
  Quiz,
  Assignment,
  PlayCircle,
  Refresh,
  Add,
  People,
  BarChart,
  ArrowForward,
  TrendingUp,
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../../components/layout/Layout';
import instructorService from '../../services/instructorService';
import { useNavigate } from 'react-router-dom';
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

const QuickAction = ({ icon, label, onClick, variant = 'outlined' }) => (
  <Button
    fullWidth variant={variant}
    startIcon={icon}
    onClick={onClick}
    sx={{
      py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem',
      borderColor: '#E8F1F5', color: variant === 'outlined' ? '#2C3E50' : undefined,
      '&:hover': { borderColor: '#3E92CC', backgroundColor: alpha('#3E92CC', 0.04) },
      ...(variant === 'contained' && {
        background: 'linear-gradient(135deg, #0A2463, #3E92CC)',
        '&:hover': { background: 'linear-gradient(135deg, #081D4F, #3585B8)' },
      }),
    }}
  >
    {label}
  </Button>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ p: 1.5, background: '#fff', borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E8F1F5' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#2C3E50', mb: 0.5 }}>{label}</Typography>
        {payload.map((entry, i) => (
          <Typography key={i} sx={{ color: entry.color, fontSize: '0.75rem' }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await instructorService.getDashboardStats();
      setStats(response.data.stats);
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

  const handleQuickAction = (action) => {
    const routes = {
      'create-exam': ['/instructor/exams', { state: { openCreateExam: true } }],
      'create-question': ['/instructor/questions', { state: { openCreateQuestion: true } }],
      'view-students': ['/instructor/students'],
      'view-exams': ['/instructor/exams'],
    };
    const route = routes[action];
    if (route) navigate(route[0], route[1]);
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#3E92CC' }} />
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
            background: 'linear-gradient(135deg, #0A2463 0%, #1a3a7a 50%, #3E92CC 100%)',
            boxShadow: '0 8px 32px rgba(10, 36, 99, 0.2)',
          }}>
            <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <Box sx={{ position: 'absolute', right: -60, top: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <Box sx={{ position: 'absolute', right: 60, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 300, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', mb: 0.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Instructor Panel
                </Typography>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#fff', mb: 0.5 }}>
                  Instructor Dashboard
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
                  Manage exams, grade students, and track performance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <IconButton onClick={() => fetchDashboardData(true)} disabled={refreshing}
                  sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                  <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
                </IconButton>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleQuickAction('create-exam')}
                  sx={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.25)' }, boxShadow: 'none' }}>
                  Create Exam
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            { title: 'Total Exams', value: stats?.totalExams || 0, icon: <Assignment />, gradient: 'linear-gradient(135deg, #0A2463, #3E92CC)', delay: 0 },
            { title: 'Active Exams', value: stats?.activeExams || 0, icon: <PlayCircle />, gradient: 'linear-gradient(135deg, #059669, #10B981)', delay: 100 },
            { title: 'Question Bank', value: stats?.totalQuestions || 0, icon: <Quiz />, gradient: 'linear-gradient(135deg, #0096C7, #00B4D8)', delay: 200 },
            { title: 'Students', value: stats?.totalStudents || 0, icon: <School />, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', delay: 300 },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.title}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Fade in timeout={600} style={{ transitionDelay: '200ms' }}>
          <Card sx={{ borderRadius: 3, mb: 4, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 2.5 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><QuickAction icon={<Add />} label="Create Exam" onClick={() => handleQuickAction('create-exam')} variant="contained" /></Grid>
                <Grid item xs={6} md={3}><QuickAction icon={<Quiz />} label="Add Questions" onClick={() => handleQuickAction('create-question')} /></Grid>
                <Grid item xs={6} md={3}><QuickAction icon={<People />} label="View Students" onClick={() => handleQuickAction('view-students')} /></Grid>
                <Grid item xs={6} md={3}><QuickAction icon={<BarChart />} label="Manage Exams" onClick={() => handleQuickAction('view-exams')} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Activity & Charts */}
        <Grid container spacing={3}>
          {/* Recent Student Activity */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={600} style={{ transitionDelay: '300ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 2 }}>
                    Recent Student Activity
                  </Typography>
                  {stats?.recentResults && stats.recentResults.length > 0 ? (
                    <List disablePadding>
                      {stats.recentResults.slice(0, 5).map((result, index) => (
                        <React.Fragment key={index}>
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{
                                width: 40, height: 40, fontSize: '0.85rem', fontWeight: 600,
                                background: result.scoring?.passed
                                  ? 'linear-gradient(135deg, #059669, #10B981)'
                                  : 'linear-gradient(135deg, #DC2626, #EF4444)',
                              }}>
                                {result.student?.name?.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#2C3E50' }}>
                                  {result.student?.name || 'Unknown Student'}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography sx={{ fontSize: '0.8rem', color: '#6C757D' }}>
                                    {result.exam?.title || 'Unknown Exam'}
                                  </Typography>
                                  <Chip size="small"
                                    label={result.scoring?.passed ? 'Passed' : 'Failed'}
                                    sx={{
                                      mt: 0.5, height: 22, fontSize: '0.7rem', fontWeight: 600,
                                      backgroundColor: result.scoring?.passed ? alpha('#10B981', 0.1) : alpha('#DC2626', 0.1),
                                      color: result.scoring?.passed ? '#059669' : '#DC2626',
                                    }}
                                  />
                                </Box>
                              }
                            />
                            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.1rem', color: '#3E92CC' }}>
                              {result.scoring?.percentage || 0}%
                            </Typography>
                          </ListItem>
                          {index < Math.min(4, stats.recentResults.length - 1) && <Divider sx={{ borderColor: '#F1F5F9' }} />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <People sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                      <Typography sx={{ color: '#6C757D' }}>No recent activity</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Performance Chart */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={600} style={{ transitionDelay: '400ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 2 }}>
                    Exam Performance Overview
                  </Typography>
                  {stats?.examPerformance && stats.examPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={stats.examPerformance} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="title" tick={{ fontSize: 11, fill: '#6C757D' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6C757D' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="averageScore" fill="#3E92CC" radius={[4, 4, 0, 0]} name="Avg Score" />
                        <Bar dataKey="passRate" fill="#10B981" radius={[4, 4, 0, 0]} name="Pass Rate" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <BarChart sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                        <Typography sx={{ color: '#6C757D' }}>No exam data available</Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Performance Summary */}
          <Grid item xs={12}>
            <Fade in timeout={600} style={{ transitionDelay: '500ms' }}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 3 }}>
                    Performance Summary
                  </Typography>
                  <Grid container spacing={3}>
                    {[
                      { value: `${stats?.averageScore?.toFixed(1) || '0.0'}%`, label: 'Average Score', color: '#3E92CC', gradient: 'linear-gradient(135deg, #0A2463, #3E92CC)' },
                      { value: stats?.completedResults || 0, label: 'Completed Exams', color: '#10B981', gradient: 'linear-gradient(135deg, #059669, #10B981)' },
                      { value: stats?.subjects || 0, label: 'Subjects Taught', color: '#00B4D8', gradient: 'linear-gradient(135deg, #0096C7, #00B4D8)' },
                    ].map((item) => (
                      <Grid item xs={12} md={4} key={item.label}>
                        <Box sx={{
                          textAlign: 'center', p: 3, borderRadius: 3, border: '1px solid #F1F5F9',
                          transition: 'all 0.3s', '&:hover': { borderColor: item.color, boxShadow: `0 4px 16px ${alpha(item.color, 0.1)}` },
                        }}>
                          <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '2.25rem', background: item.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {item.value}
                          </Typography>
                          <Typography sx={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 500, mt: 0.5 }}>
                            {item.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default InstructorDashboard;
