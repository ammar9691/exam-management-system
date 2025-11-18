import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Assignment,
  Grade,
  Timer,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.js';
import StatsCard from '../../components/common/StatsCard.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';
import { formatDate, formatDuration } from '../../utils/helpers.js';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    upcomingExams: 0
  });
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [activeExams, setActiveExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, upcomingData, recentData, availableExams] = await Promise.all([
        studentService.getStats(),
        studentService.getUpcomingExams(),
        studentService.getRecentResults(),
        studentService.getExams()
      ]);

      setStats(statsData || {});
      setUpcomingExams(Array.isArray(upcomingData) ? upcomingData : []);
      setRecentResults(Array.isArray(recentData) ? recentData : []);
      setActiveExams(Array.isArray(availableExams) ? availableExams : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your exam overview and progress
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Exams"
              value={stats.totalExams}
              icon={<Assignment sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Completed"
              value={stats.completedExams}
              icon={<CheckCircle sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Average Score"
              value={`${stats.averageScore}%`}
              icon={<Grade sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Upcoming"
              value={stats.upcomingExams}
              icon={<Timer sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Active Exams */}
        <Typography variant="h5" sx={{ mb: 2 }}>
          Active Exams
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {activeExams.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No active exams available to attempt.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            activeExams.map((exam) => (
              <Grid item xs={12} md={6} lg={4} key={exam._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {exam.description || 'No description available'}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<Timer />}
                        label={formatDuration(exam.duration)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${exam.totalMarks} marks`}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" display="block">
                      Start: {formatDate(exam.startTime)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      End: {formatDate(exam.endTime)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleStartExam(exam._id)}
                      disabled={new Date(exam.startTime) > new Date() || new Date(exam.endTime) < new Date()}
                    >
                      {new Date(exam.startTime) > new Date()
                        ? 'Not Started'
                        : new Date(exam.endTime) < new Date()
                          ? 'Expired'
                          : 'Start Exam'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Upcoming Exams */}
        <Typography variant="h5" sx={{ mb: 2 }}>
          Upcoming Exams
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {upcomingExams.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No upcoming exams scheduled
                </Typography>
              </Paper>
            </Grid>
          ) : (
            upcomingExams.map((exam) => (
              <Grid item xs={12} md={6} lg={4} key={exam._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {exam.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<Timer />}
                        label={formatDuration(exam.duration)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${exam.totalMarks} marks`}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" display="block">
                      Starts: {formatDate(exam.startTime)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleStartExam(exam._id)}
                      disabled={new Date(exam.startTime) > new Date()}
                    >
                      {new Date(exam.startTime) > new Date() ? 'Not Started' : 'Start Exam'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Recent Results */}
        <Typography variant="h5" sx={{ mb: 2 }}>
          Recent Results
        </Typography>
        <Paper sx={{ p: 2 }}>
          {recentResults.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No exam results yet
            </Typography>
          ) : (
            recentResults.map((result) => (
              <Box key={result._id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                <Grid container alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">{result.exam.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Submitted on {formatDate(result.submittedAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: { xs: 1, md: 0 } }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={result.percentage}
                          color={result.percentage >= 50 ? 'success' : 'error'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {result.percentage}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right' }, mt: { xs: 1, md: 0 } }}>
                    <Chip
                      label={result.status === 'pass' ? 'PASSED' : 'FAILED'}
                      color={result.status === 'pass' ? 'success' : 'error'}
                      size="small"
                    />
                    <Button
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => navigate(`/student/results/${result._id}`)}
                    >
                      View Details
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
        </Paper>
      </Container>
    </Layout>
  );
};

export default StudentDashboard;
