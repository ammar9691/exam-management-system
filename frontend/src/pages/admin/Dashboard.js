import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Skeleton,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  People,
  Quiz,
  Assignment,
  Assessment,
  TrendingUp,
  Refresh,
  Download,
  Analytics
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import Layout from '../../components/layout/Layout.js';
import StatsCard from '../../components/common/StatsCard.js';
import Loader from '../../components/common/Loader.js';
import adminService from '../../services/adminService.js';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalExams: 0,
    totalResults: 0,
    activeUsers: 0,
    students: 0,
    instructors: 0,
    admins: 0
  });
  const [pieData, setPieData] = useState([
    { name: 'Students', value: 0, color: '#0088FE' },
    { name: 'Instructors', value: 0, color: '#00C49F' },
    { name: 'Admins', value: 0, color: '#FFBB28' }
  ]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [detailedStats, setDetailedStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Fetch comprehensive dashboard data
      const [dashboardResponse, performanceResponse] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getPerformanceAnalytics({ period: '30d' })
      ]);
      
      // Handle dashboard stats
      if (dashboardResponse.status === 'fulfilled') {
        const statsData = dashboardResponse.value.data.data?.stats || {};
        
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalQuestions: statsData.totalQuestions || 0,
          totalExams: statsData.totalExams || 0,
          totalResults: statsData.totalResults || 0,
          activeUsers: statsData.activeUsers || 0,
          students: statsData.students || 0,
          instructors: statsData.instructors || 0,
          admins: statsData.admins || 0
        });
        
        // Update pie chart data
        setPieData([
          { name: 'Students', value: statsData.students || 0, color: '#0088FE' },
          { name: 'Instructors', value: statsData.instructors || 0, color: '#00C49F' },
          { name: 'Admins', value: statsData.admins || 0, color: '#FFBB28' }
        ]);
        
        // Set monthly data if available
        if (statsData.monthlyRegistrations) {
          const monthlyChartData = statsData.monthlyRegistrations.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            registrations: item.count,
            year: item._id.year
          }));
          setMonthlyData(monthlyChartData);
        }
        
        setDetailedStats(statsData);
      }
      
      // Handle performance data
      if (performanceResponse.status === 'fulfilled') {
        const perfData = performanceResponse.value.data.analytics;
        if (perfData?.performanceTrends) {
          const perfChartData = perfData.performanceTrends.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            averageScore: Math.round(item.averageScore || 0),
            passRate: Math.round((item.passRate || 0) * 100),
            count: item.count
          }));
          setPerformanceData(perfChartData);
        }
      }
      
      // Set system health (mock data for now)
      setSystemHealth({
        database: 'Healthy',
        server: 'Healthy',
        cache: 'Healthy',
        storage: 'Healthy'
      });
      
      // Set recent activity (mock data for now)
      setRecentActivity([
        { id: 1, action: 'User registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
        { id: 2, action: 'Exam completed', user: 'Jane Smith', time: '5 minutes ago', type: 'exam' },
        { id: 3, action: 'Question added', user: 'Admin User', time: '10 minutes ago', type: 'question' },
        { id: 4, action: 'Result graded', user: 'Instructor', time: '15 minutes ago', type: 'result' }
      ]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalQuestions: 0,
        totalExams: 0,
        totalResults: 0,
        activeUsers: 0,
        students: 0,
        instructors: 0,
        admins: 0
      });
      setPieData([
        { name: 'Students', value: 0, color: '#0088FE' },
        { name: 'Instructors', value: 0, color: '#00C49F' },
        { name: 'Admins', value: 0, color: '#FFBB28' }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchDashboardData(true);
  };
  
  const handleExportDashboard = async () => {
    try {
      // This would export dashboard data
      console.log('Exporting dashboard data...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };


  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's what's happening with your exam system today.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportDashboard}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Analytics />}
              onClick={() => console.log('Advanced analytics')}
            >
              Analytics
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<People sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Questions"
              value={stats.totalQuestions}
              icon={<Quiz sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Exams"
              value={stats.totalExams}
              icon={<Assignment sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Results"
              value={stats.totalResults}
              icon={<Assessment sx={{ fontSize: 40 }} />}
              color="error"
            />
          </Grid>
        </Grid>

        {/* Charts and Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Registrations
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {monthlyData.length > 0 ? (
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends (Last 30 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  {performanceData.length > 0 ? (
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="averageScore" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Average Score"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="passRate" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Pass Rate (%)"
                      />
                    </LineChart>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                      <Typography color="text.secondary">No performance data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* System Health and Recent Activity */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Health
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(systemHealth).map(([key, value]) => (
                    <Grid item xs={6} key={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {key}
                        </Typography>
                        <Chip 
                          label={value} 
                          color={value === 'Healthy' ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {recentActivity.map((activity, index) => (
                    <Box key={activity.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {activity.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {activity.user}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={activity.type} 
                            size="small" 
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                      {index < recentActivity.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Container>
    </Layout>
  );
};

export default AdminDashboard;
