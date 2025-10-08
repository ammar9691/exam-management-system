import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Badge
} from '@mui/material';
import {
  PlayCircle,
  PauseCircle,
  Stop,
  People,
  Timer,
  CheckCircle,
  Warning,
  Refresh,
  Notifications,
  Speed,
  TrendingUp
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import instructorService from '../../services/instructorService';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ExamMonitor = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const intervalRef = useRef();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDialog, setStudentDialog] = useState(false);

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      startAutoRefresh();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [examId, autoRefresh]);

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchMonitoringData(true);
    }, refreshInterval);
  };

  const fetchMonitoringData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await instructorService.monitorLiveExam(examId);
      setExamData(response.data.exam);
      setMonitoringData(response.data.monitoring);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      if (!silent) {
        toast.error('Failed to load monitoring data');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setStudentDialog(true);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getRemainingTime = () => {
    if (!examData?.schedule?.endTime) return 'N/A';
    
    const endTime = new Date(examData.schedule.endTime);
    const now = new Date();
    const remaining = endTime - now;
    
    if (remaining <= 0) {
      return 'Exam Ended';
    }
    
    return formatTime(remaining);
  };

  const getProgressPercentage = (student) => {
    if (!student.totalQuestions) return 0;
    return (student.questionsAnswered / student.totalQuestions) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'not-started':
        return 'default';
      default:
        return 'default';
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Typography>Loading exam monitoring...</Typography>
        </Container>
      </Layout>
    );
  }

  if (!examData || !monitoringData) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Alert severity="error">
            Failed to load exam monitoring data
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Live Exam Monitor
            </Typography>
            <Typography variant="h6" color="primary">
              {examData.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {examData.subject} • Duration: {examData.duration} minutes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant={autoRefresh ? 'contained' : 'outlined'}
              color={autoRefresh ? 'success' : 'default'}
              startIcon={autoRefresh ? <PauseCircle /> : <PlayCircle />}
              onClick={toggleAutoRefresh}
            >
              {autoRefresh ? 'Pause' : 'Resume'} Auto-Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => fetchMonitoringData()}
            >
              Refresh Now
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Assigned
                    </Typography>
                    <Typography variant="h4">
                      {monitoringData.totalAssigned}
                    </Typography>
                  </Box>
                  <People color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      In Progress
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {monitoringData.inProgress}
                    </Typography>
                  </Box>
                  <Timer color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {monitoringData.completed}
                    </Typography>
                  </Box>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Not Started
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {monitoringData.notStarted}
                    </Typography>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Exam Status */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Exam Status
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center">
                <Chip
                  label={examData.status}
                  color={examData.status === 'active' ? 'success' : 'default'}
                  icon={examData.status === 'active' ? <PlayCircle /> : <Stop />}
                />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Time Remaining: <strong>{getRemainingTime()}</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Completion Rate: {monitoringData.totalAssigned > 0 
                    ? Math.round((monitoringData.completed / monitoringData.totalAssigned) * 100)
                    : 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={monitoringData.totalAssigned > 0 
                    ? (monitoringData.completed / monitoringData.totalAssigned) * 100
                    : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Students Lists */}
        <Grid container spacing={3}>
          {/* Students in Progress */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400, overflow: 'hidden' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Students In Progress ({monitoringData.inProgress})
                  </Typography>
                  <Badge badgeContent={monitoringData.inProgress} color="primary">
                    <Timer />
                  </Badge>
                </Box>
                <Box sx={{ height: 320, overflow: 'auto' }}>
                  {monitoringData.students.inProgress.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" sx={{ pt: 4 }}>
                      No students currently taking the exam
                    </Typography>
                  ) : (
                    <List>
                      {monitoringData.students.inProgress.map((student, index) => (
                        <ListItem 
                          key={student._id} 
                          button 
                          onClick={() => handleStudentClick(student)}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              {student.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={student.name}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Progress: {student.questionsAnswered}/{student.totalQuestions}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Time elapsed: {formatTime(student.timeElapsed)}
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={getProgressPercentage(student)}
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                          <Chip 
                            size="small" 
                            label={`${Math.round(getProgressPercentage(student))}%`}
                            color="primary"
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Completed Students */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400, overflow: 'hidden' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Completed ({monitoringData.completed})
                  </Typography>
                  <Badge badgeContent={monitoringData.completed} color="success">
                    <CheckCircle />
                  </Badge>
                </Box>
                <Box sx={{ height: 320, overflow: 'auto' }}>
                  {monitoringData.students.completed.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" sx={{ pt: 4 }}>
                      No completed submissions yet
                    </Typography>
                  ) : (
                    <List>
                      {monitoringData.students.completed.map((student, index) => (
                        <ListItem key={student._id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: student.passed ? 'success.main' : 'error.main' }}>
                              {student.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={student.name}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Score: {student.score}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Completed: {new Date(student.completedAt).toLocaleTimeString()}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip 
                            size="small" 
                            label={student.passed ? 'Pass' : 'Fail'}
                            color={student.passed ? 'success' : 'error'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Students Not Started */}
          {monitoringData.notStarted > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Students Not Started ({monitoringData.notStarted})
                  </Typography>
                  <List>
                    {monitoringData.students.notStarted.map((student, index) => (
                      <ListItem key={student._id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'grey.400' }}>
                            {student.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.name}
                          secondary={student.email}
                        />
                        <Chip 
                          size="small" 
                          label="Not Started"
                          color="default"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Student Detail Dialog */}
        <Dialog 
          open={studentDialog} 
          onClose={() => setStudentDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Student Progress Details
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedStudent.name}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Questions Answered
                    </Typography>
                    <Typography variant="h6">
                      {selectedStudent.questionsAnswered} / {selectedStudent.totalQuestions}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(getProgressPercentage(selectedStudent))}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Time Elapsed
                    </Typography>
                    <Typography variant="h6">
                      {formatTime(selectedStudent.timeElapsed)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Started At
                    </Typography>
                    <Typography variant="h6">
                      {new Date(selectedStudent.startTime).toLocaleTimeString()}
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Overall Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressPercentage(selectedStudent)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStudentDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default ExamMonitor;