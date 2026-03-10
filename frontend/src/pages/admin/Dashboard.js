import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  Button,
  Divider,
  Fade,
  IconButton,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  People,
  Quiz,
  Assignment,
  Assessment,
  Refresh,
  Download,
  Analytics,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import Layout from '../../components/layout/Layout.js';
import Loader from '../../components/common/Loader.js';
import adminService from '../../services/adminService.js';

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

const CHART_COLORS = ['#3E92CC', '#10B981', '#F59E0B', '#8B5CF6'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0, totalQuestions: 0, totalExams: 0, totalResults: 0,
    activeUsers: 0, students: 0, instructors: 0, admins: 0,
  });
  const [pieData, setPieData] = useState([
    { name: 'Students', value: 0, color: '#3E92CC' },
    { name: 'Instructors', value: 0, color: '#10B981' },
    { name: 'Admins', value: 0, color: '#F59E0B' },
  ]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [dashboardResponse, performanceResponse] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getPerformanceAnalytics({ period: '30d' }),
      ]);

      if (dashboardResponse.status === 'fulfilled') {
        const statsData = dashboardResponse.value?.data?.data?.stats || {};
        const newStats = {
          totalUsers: parseInt(statsData.totalUsers) || 0,
          totalQuestions: parseInt(statsData.totalQuestions) || 0,
          totalExams: parseInt(statsData.totalExams) || 0,
          totalResults: parseInt(statsData.totalResults) || 0,
          activeUsers: parseInt(statsData.activeUsers) || 0,
          students: parseInt(statsData.students) || 0,
          instructors: parseInt(statsData.instructors) || 0,
          admins: parseInt(statsData.admins) || 0,
        };
        setStats(newStats);
        setPieData([
          { name: 'Students', value: parseInt(statsData.students) || 0, color: '#3E92CC' },
          { name: 'Instructors', value: parseInt(statsData.instructors) || 0, color: '#10B981' },
          { name: 'Admins', value: parseInt(statsData.admins) || 0, color: '#F59E0B' },
        ]);
        if (statsData.monthlyRegistrations) {
          setMonthlyData(statsData.monthlyRegistrations.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            registrations: item.count,
          })));
        }
      }

      if (performanceResponse.status === 'fulfilled') {
        const perfData = performanceResponse.value.data.analytics;
        if (perfData?.performanceTrends) {
          setPerformanceData(perfData.performanceTrends.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            averageScore: Math.round(item.averageScore || 0),
            passRate: Math.round((item.passRate || 0) * 100),
            count: item.count,
          })));
        }
      }

      setSystemHealth({ Database: 'Healthy', Server: 'Healthy', Cache: 'Healthy', Storage: 'Healthy' });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Header Banner */}
        <Fade in timeout={500}>
          <Box sx={{
            mb: 4, p: { xs: 3, md: 4 }, borderRadius: 4, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0A2463 0%, #001B3D 60%, #0A2463 100%)',
            boxShadow: '0 8px 32px rgba(10, 36, 99, 0.25)',
          }}>
            <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <Box sx={{ position: 'absolute', right: -80, top: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(62, 146, 204, 0.06)' }} />
              <Box sx={{ position: 'absolute', right: 40, bottom: -100, width: 250, height: 250, borderRadius: '50%', background: 'rgba(0, 180, 216, 0.04)' }} />
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 300, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', mb: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Administration
                </Typography>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#fff', mb: 0.5 }}>
                  Control Center
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                  Aviation Academy Management Dashboard
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <IconButton onClick={() => fetchDashboardData(true)} disabled={refreshing}
                  sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                  <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
                </IconButton>
                <Button variant="contained" startIcon={<Analytics />}
                  sx={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.25)' }, boxShadow: 'none' }}>
                  Analytics
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {[
            { title: 'Total Users', value: stats.totalUsers, icon: <People />, gradient: 'linear-gradient(135deg, #0A2463, #3E92CC)', delay: 0 },
            { title: 'Questions', value: stats.totalQuestions, icon: <Quiz />, gradient: 'linear-gradient(135deg, #059669, #10B981)', delay: 100 },
            { title: 'Exams', value: stats.totalExams, icon: <Assignment />, gradient: 'linear-gradient(135deg, #0096C7, #00B4D8)', delay: 200 },
            { title: 'Results', value: stats.totalResults, icon: <Assessment />, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', delay: 300 },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.title}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Pie Chart */}
          <Grid item xs={12} md={5}>
            <Fade in timeout={600} style={{ transitionDelay: '200ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 1 }}>
                    User Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                        fill="#8884d8" dataKey="value" paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                    {pieData.map((item) => (
                      <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#6C757D', fontWeight: 500 }}>
                          {item.name} ({item.value})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Area Chart */}
          <Grid item xs={12} md={7}>
            <Fade in timeout={600} style={{ transitionDelay: '300ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 1 }}>
                    Monthly Registrations
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    {monthlyData.length > 0 ? (
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3E92CC" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3E92CC" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6C757D' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6C757D' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="registrations" stroke="#3E92CC" strokeWidth={2.5} fill="url(#regGradient)" name="Registrations" />
                      </AreaChart>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                        <Typography sx={{ color: '#6C757D' }}>No data available</Typography>
                      </Box>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Performance Trends */}
        <Fade in timeout={600} style={{ transitionDelay: '400ms' }}>
          <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 1 }}>
                Performance Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                {performanceData.length > 0 ? (
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6C757D' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6C757D' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6C757D' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line yAxisId="left" type="monotone" dataKey="averageScore" stroke="#3E92CC" strokeWidth={2.5} dot={{ fill: '#3E92CC', r: 3 }} name="Average Score" />
                    <Line yAxisId="right" type="monotone" dataKey="passRate" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 3 }} name="Pass Rate (%)" />
                  </LineChart>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                    <Typography sx={{ color: '#6C757D' }}>No performance data available</Typography>
                  </Box>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Fade>

        {/* System Health */}
        <Fade in timeout={600} style={{ transitionDelay: '500ms' }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 2.5 }}>
                System Health
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(systemHealth).map(([key, value]) => (
                  <Grid item xs={6} sm={3} key={key}>
                    <Box sx={{
                      p: 2, borderRadius: 2, border: '1px solid #F1F5F9', textAlign: 'center',
                      transition: 'all 0.3s', '&:hover': { borderColor: '#10B981', boxShadow: `0 4px 12px ${alpha('#10B981', 0.1)}` },
                    }}>
                      <Box sx={{
                        width: 10, height: 10, borderRadius: '50%', mx: 'auto', mb: 1,
                        backgroundColor: value === 'Healthy' ? '#10B981' : '#DC2626',
                        boxShadow: value === 'Healthy' ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(220, 38, 38, 0.4)',
                      }} />
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#2C3E50', mb: 0.25 }}>
                        {key}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: value === 'Healthy' ? '#059669' : '#DC2626', fontWeight: 500 }}>
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Layout>
  );
};

export default AdminDashboard;
