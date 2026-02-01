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
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Quiz,
  Assignment,
  Refresh
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/common/StatsCard';
import examManagerService from '../../services/examManagerService';
import { toast } from 'react-toastify';

const ExamManagerDashboard = () => {
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

  const handleRefresh = () => {
    fetchDashboardData(true);
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

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Exam Manager Header */}
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(91, 33, 182, 0.15)',
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
                Exam Manager Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#FFFFFF',
                  fontSize: '1.1rem',
                  fontWeight: 400,
                }}
              >
                Overview of exam system statistics
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
            &#9993;
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <StatsCard
              title="Total Questions"
              value={stats?.totalQuestions || 0}
              icon={<Quiz sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatsCard
              title="Total Exams"
              value={stats?.totalExams || 0}
              icon={<Assignment sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
        </Grid>

        {/* Info Card */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Module-Based System Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Question management and exam creation features will be available in the upcoming module-based system update.
            This will allow for better organization of questions by categories, modules, and difficulty levels.
          </Typography>
        </Paper>

        {/* Current Capabilities */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Role Capabilities
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Available
                  </Typography>
                  <Typography variant="body2">- View dashboard statistics</Typography>
                  <Typography variant="body2">- Monitor overall system health</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Coming Soon
                  </Typography>
                  <Typography variant="body2">- Question approval workflow</Typography>
                  <Typography variant="body2">- Module-based question management</Typography>
                  <Typography variant="body2">- Exam review and oversight</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};

export default ExamManagerDashboard;
