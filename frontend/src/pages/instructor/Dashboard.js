import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
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
  IconButton,
  Divider
} from '@mui/material';
import {
  School,
  Quiz,
  Assignment,
  People,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  BarChart,
  Timeline,
  Refresh,
  Add,
  Visibility
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/common/StatsCard';
import instructorService from '../../services/instructorService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create-exam':
        // Navigate to exams page and open the exam creation dialog there
        navigate('/instructor/exams', { state: { openCreateExam: true } });
        break;
      case 'create-question':
        // Navigate to questions page and open the question creation dialog there
        navigate('/instructor/questions', { state: { openCreateQuestion: true } });
        break;
      case 'view-students':
        navigate('/instructor/students');
        break;
      case 'view-exams':
        navigate('/instructor/exams');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error && !stats) {
    return (
      <Layout>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => fetchDashboardData()}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Layout>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Aviation-themed Instructor Header */}
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0A2463 0%, #3E92CC 100%)',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(10, 36, 99, 0.15)',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  mb: 1,
                  color: 'white'
                }}
              >
                Instructor Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#FFFFFF',
                  fontSize: '1.1rem',
                  fontWeight: 400,
                }}
              >
                Manage exams, grade students, and track performance
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleQuickAction('create-exam')}
                sx={{
                  backgroundColor: '#00B4D8',
                  '&:hover': {
                    backgroundColor: '#0096C7',
                  }
                }}
              >
                Create Exam
              </Button>
            </Box>
          </Box>

          {/* Decorative element */}
          <Box
            sx={{
              position: 'absolute',
              right: -30,
              top: '50%',
              transform: 'translateY(-50%) rotate(15deg)',
              opacity: 0.08,
              fontSize: '160px',
            }}
          >
            ✈
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Exams"
              value={stats?.totalExams || 0}
              icon={<Assignment sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Active Exams"
              value={stats?.activeExams || 0}
              icon={<PlayCircle sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Questions Bank"
              value={stats?.totalQuestions || 0}
              icon={<Quiz sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Students"
              value={stats?.totalStudents || 0}
              icon={<School sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleQuickAction('create-exam')}
              >
                Create New Exam
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Quiz />}
                onClick={() => handleQuickAction('create-question')}
              >
                Add Questions
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<People />}
                onClick={() => handleQuickAction('view-students')}
              >
                View Students
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BarChart />}
                onClick={() => handleQuickAction('view-exams')}
              >
                Manage Exams
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Recent Activity & Performance Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Student Activity
                </Typography>
                {stats?.recentResults && stats.recentResults.length > 0 ? (
                  <List>
                    {stats.recentResults.slice(0, 5).map((result, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              {result.student?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={result.student?.name || 'Unknown Student'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {result.exam?.title || 'Unknown Exam'}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={result.scoring?.passed ? 'Passed' : 'Failed'}
                                  color={result.scoring?.passed ? 'success' : 'error'}
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                          <Typography variant="h6" color="primary">
                            {result.scoring?.percentage || 0}%
                          </Typography>
                        </ListItem>
                        {index < Math.min(4, stats.recentResults.length - 1) && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No recent activity
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exam Performance Overview
                </Typography>
                {stats?.examPerformance && stats.examPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={stats.examPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="averageScore" fill="#8884d8" />
                      <Bar dataKey="passRate" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: 300 
                  }}>
                    <Typography color="text.secondary">
                      No exam data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary">
                        {stats?.averageScore?.toFixed(1) || '0.0'}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="success.main">
                        {stats?.completedResults || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Exams
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="info.main">
                        {stats?.subjects || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Subjects Taught
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default InstructorDashboard;