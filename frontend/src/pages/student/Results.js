import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  CheckCircle,
  Cancel,
  Visibility,
  Grade,
  Schedule,
  Subject,
  BarChart
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Layout from '../../components/layout/Layout.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';
import { toast } from 'react-toastify';

const StudentResults = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    passedExams: 0,
    failedExams: 0
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await studentService.getResults();
      setResults(response.data);
      calculateStats(response.data);
    } catch (error) {
      toast.error('Error fetching results');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (resultsData) => {
    const totalExams = resultsData.length;
    const scores = resultsData.map(r => (r.score / r.totalMarks) * 100);
    const averageScore = totalExams > 0 ? scores.reduce((a, b) => a + b, 0) / totalExams : 0;
    const highestScore = totalExams > 0 ? Math.max(...scores) : 0;
    const passedExams = resultsData.filter(r => ((r.score / r.totalMarks) * 100) >= 50).length;
    const failedExams = totalExams - passedExams;

    setStats({
      totalExams,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore: Math.round(highestScore * 10) / 10,
      passedExams,
      failedExams
    });
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setDetailDialog(true);
  };

  const handleCloseDialog = () => {
    setDetailDialog(false);
    setSelectedResult(null);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const getStatusColor = (percentage) => {
    return percentage >= 50 ? 'success' : 'error';
  };

  const getStatusText = (percentage) => {
    return percentage >= 50 ? 'Passed' : 'Failed';
  };

  // Chart data
  const performanceData = results.map((result, index) => ({
    exam: `Exam ${index + 1}`,
    score: Math.round((result.score / result.totalMarks) * 100),
    name: result.exam?.title?.substring(0, 10) || `Exam ${index + 1}`
  }));

  const gradeDistribution = [
    { name: 'A+ (90-100)', value: results.filter(r => (r.score/r.totalMarks)*100 >= 90).length, color: '#4caf50' },
    { name: 'A (80-89)', value: results.filter(r => (r.score/r.totalMarks)*100 >= 80 && (r.score/r.totalMarks)*100 < 90).length, color: '#8bc34a' },
    { name: 'B+ (70-79)', value: results.filter(r => (r.score/r.totalMarks)*100 >= 70 && (r.score/r.totalMarks)*100 < 80).length, color: '#ffc107' },
    { name: 'B (60-69)', value: results.filter(r => (r.score/r.totalMarks)*100 >= 60 && (r.score/r.totalMarks)*100 < 70).length, color: '#ff9800' },
    { name: 'C (50-59)', value: results.filter(r => (r.score/r.totalMarks)*100 >= 50 && (r.score/r.totalMarks)*100 < 60).length, color: '#f44336' },
    { name: 'F (0-49)', value: results.filter(r => (r.score/r.totalMarks)*100 < 50).length, color: '#9c27b0' }
  ].filter(item => item.value > 0);

  const subjectWisePerformance = {
    Math: results.filter(r => r.exam?.subject === 'Mathematics').map(r => (r.score/r.totalMarks)*100),
    Physics: results.filter(r => r.exam?.subject === 'Physics').map(r => (r.score/r.totalMarks)*100),
    Chemistry: results.filter(r => r.exam?.subject === 'Chemistry').map(r => (r.score/r.totalMarks)*100),
    Biology: results.filter(r => r.exam?.subject === 'Biology').map(r => (r.score/r.totalMarks)*100)
  };

  const subjectData = Object.keys(subjectWisePerformance)
    .filter(subject => subjectWisePerformance[subject].length > 0)
    .map(subject => ({
      subject,
      average: subjectWisePerformance[subject].reduce((a, b) => a + b, 0) / subjectWisePerformance[subject].length
    }));

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your exam results and performance analytics
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" color="primary">
                      {stats.totalExams}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Exams
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 32, color: 'info.main', mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" color="info.main">
                      {stats.averageScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Grade sx={{ fontSize: 32, color: 'success.main', mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" color="success.main">
                      {stats.highestScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Highest Score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ fontSize: 32, color: 'success.main', mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" color="success.main">
                      {stats.passedExams}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Passed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Cancel sx={{ fontSize: 32, color: 'error.main', mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" color="error.main">
                      {stats.failedExams}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {performanceData.length > 0 && (
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
          
          {gradeDistribution.length > 0 && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Grade Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Subject-wise Performance */}
        {subjectData.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Subject-wise Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#82ca9d" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* Results Table */}
        <Paper>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6">
              Detailed Results
            </Typography>
          </Box>
          {results.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Results Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven't taken any exams yet. Your results will appear here once you complete exams.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => {
                    const percentage = Math.round((result.score / result.totalMarks) * 100);
                    const grade = getGradeLetter(percentage);
                    const status = getStatusText(percentage);
                    
                    return (
                      <TableRow key={result._id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {result.exam?.title || 'Unknown Exam'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={result.exam?.subject || 'General'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {result.score}/{result.totalMarks}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                color={getGradeColor(percentage)}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {percentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={grade}
                            color={getGradeColor(percentage)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status}
                            color={getStatusColor(percentage)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDetails(result)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Result Detail Dialog */}
        <Dialog
          open={detailDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              Exam Result Details
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedResult && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedResult.exam?.title || 'Unknown Exam'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Subject: {selectedResult.exam?.subject || 'General'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Score Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Grade fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Score: ${selectedResult.score}/${selectedResult.totalMarks}`}
                          secondary={`${Math.round((selectedResult.score / selectedResult.totalMarks) * 100)}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Assessment fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Grade: ${getGradeLetter(Math.round((selectedResult.score / selectedResult.totalMarks) * 100))}`}
                          secondary={getStatusText(Math.round((selectedResult.score / selectedResult.totalMarks) * 100))}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Schedule fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Submitted"
                          secondary={new Date(selectedResult.submittedAt).toLocaleString()}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Performance Analysis
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Overall Performance
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round((selectedResult.score / selectedResult.totalMarks) * 100)}
                        color={getGradeColor(Math.round((selectedResult.score / selectedResult.totalMarks) * 100))}
                        sx={{ height: 8, borderRadius: 4, mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        You scored {Math.round((selectedResult.score / selectedResult.totalMarks) * 100)}% in this exam.
                        {Math.round((selectedResult.score / selectedResult.totalMarks) * 100) >= 50 
                          ? ' Congratulations on passing!' 
                          : ' Keep studying and try again next time.'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Question-wise Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed question-wise analysis would be displayed here based on your answers.
                    This includes correct/incorrect answers, time spent per question, and topic-wise performance.
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default StudentResults;