import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  GetApp,
  Assessment,
  TrendingUp,
  School,
  CheckCircle,
  Cancel,
  Person
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../../components/layout/Layout.js';
import adminService from '../../services/adminService.js';
import { toast } from 'react-toastify';

const Results = () => {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [analytics, setAnalytics] = useState({
    averageScore: 0,
    passRate: 0,
    totalAttempts: 0,
    topPerformers: []
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
    fetchExams();
    fetchAnalytics();
  }, [selectedExam]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = selectedExam ? { examId: selectedExam } : {};
      const response = await adminService.getResults(params);
      setResults(response.data);
    } catch (error) {
      toast.error('Error fetching results');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      // This would normally fetch from examService
      setExams([
        { _id: '1', title: 'Mathematics Final Exam' },
        { _id: '2', title: 'Physics Quiz' },
        { _id: '3', title: 'Chemistry Test' }
      ]);
    } catch (error) {
      toast.error('Error fetching exams');
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data - would normally come from API
      setAnalytics({
        averageScore: 76.5,
        passRate: 82.3,
        totalAttempts: 156,
        topPerformers: [
          { name: 'John Doe', score: 95 },
          { name: 'Jane Smith', score: 92 },
          { name: 'Mike Johnson', score: 89 }
        ]
      });
    } catch (error) {
      console.log('Error fetching analytics');
    }
  };

  const handleViewResult = (result) => {
    setSelectedResult(result);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedResult(null);
  };

  const handleExportResults = async () => {
    try {
      if (!selectedExam) {
        toast.error('Please select an exam to export results');
        return;
      }
      await adminService.exportResults(selectedExam);
      toast.success('Results exported successfully');
    } catch (error) {
      toast.error('Error exporting results');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // Mock data for charts
  const performanceData = [
    { range: '90-100', count: 12 },
    { range: '80-89', count: 28 },
    { range: '70-79', count: 45 },
    { range: '60-69', count: 32 },
    { range: '50-59', count: 18 },
    { range: '0-49', count: 21 }
  ];

  const subjectPerformance = [
    { subject: 'Math', average: 78 },
    { subject: 'Physics', average: 72 },
    { subject: 'Chemistry', average: 81 },
    { subject: 'Biology', average: 75 }
  ];

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            Results & Analytics
          </Typography>
          <Box>
            <FormControl sx={{ mr: 2, minWidth: 200 }}>
              <InputLabel>Filter by Exam</InputLabel>
              <Select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                label="Filter by Exam"
              >
                <MenuItem value="">All Exams</MenuItem>
                {exams.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<GetApp />}
              onClick={handleExportResults}
              disabled={!selectedExam}
            >
              Export Results
            </Button>
          </Box>
        </Box>

        {/* Analytics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="primary">
                      {analytics.averageScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {analytics.passRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pass Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {analytics.totalAttempts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Attempts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {exams.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Exams
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Individual Results" />
            <Tab label="Performance Analytics" />
            <Tab label="Subject-wise Analysis" />
          </Tabs>
        </Box>

        {/* Individual Results Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Exam</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Mock data - replace with actual results */}
                {[
                  { _id: '1', student: { name: 'John Doe', email: 'john@example.com' }, exam: { title: 'Math Final' }, score: 85, totalMarks: 100, status: 'passed', submittedAt: new Date() },
                  { _id: '2', student: { name: 'Jane Smith', email: 'jane@example.com' }, exam: { title: 'Physics Quiz' }, score: 72, totalMarks: 100, status: 'passed', submittedAt: new Date() },
                  { _id: '3', student: { name: 'Mike Johnson', email: 'mike@example.com' }, exam: { title: 'Chemistry Test' }, score: 45, totalMarks: 100, status: 'failed', submittedAt: new Date() }
                ].map((result) => {
                  const percentage = Math.round((result.score / result.totalMarks) * 100);
                  return (
                    <TableRow key={result._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {result.student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {result.student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{result.exam.title}</TableCell>
                      <TableCell>{result.score}/{result.totalMarks}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              color={getGradeColor(percentage)}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {percentage}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={result.status}
                          color={getStatusColor(result.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {result.submittedAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewResult(result)}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Performance Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Score Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <Box>
                  {analytics.topPerformers.map((performer, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">{performer.name}</Typography>
                      <Chip label={`${performer.score}%`} color="success" size="small" />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Subject-wise Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subject-wise Performance
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>

        {/* Result Detail Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Result Details
          </DialogTitle>
          <DialogContent>
            {selectedResult && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">
                    {selectedResult.student?.name} - {selectedResult.exam?.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Score"
                    value={`${selectedResult.score}/${selectedResult.totalMarks}`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Percentage"
                    value={`${Math.round((selectedResult.score / selectedResult.totalMarks) * 100)}%`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Question-wise Performance
                  </Typography>
                  {/* Would show detailed question-wise results here */}
                  <Typography variant="body2" color="text.secondary">
                    Detailed answer analysis would be displayed here...
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

export default Results;