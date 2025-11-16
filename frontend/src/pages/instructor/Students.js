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
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People,
  School,
  TrendingUp,
  Search,
  Assignment,
  CheckCircle,
  Cancel,
  Email,
  Phone
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import instructorService from '../../services/instructorService';
import { toast } from 'react-toastify';

const InstructorStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    averageScore: 0,
    topPerformer: null
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await instructorService.getStudents();
      // Support both plain and wrapped response shapes: { students } or { data: { students } }
      const payload = response.data || {};
      const studentsData = payload.students || payload.data?.students || [];

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      
      // Calculate stats
      const total = studentsData.length;
      const active = studentsData.filter(s => s.status === 'active').length;
      const averageScore = studentsData.length > 0
        ? studentsData.reduce((sum, s) => sum + (s.stats?.averageScore || 0), 0) / studentsData.length
        : 0;
      const topPerformer = studentsData.reduce((top, student) => 
        (student.stats?.averageScore || 0) > (top?.stats?.averageScore || 0) ? student : top, 
        null
      );

      setStats({ total, active, averageScore, topPerformer });
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
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

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Student Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and track your students' performance and progress
            </Typography>
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
                      Total Students
                    </Typography>
                    <Typography variant="h4">
                      {stats.total}
                    </Typography>
                  </Box>
                  <People color="primary" sx={{ fontSize: 40 }} />
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
                      Active Students
                    </Typography>
                    <Typography variant="h4">
                      {stats.active}
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
                      Average Score
                    </Typography>
                    <Typography variant="h4">
                      {Math.round(stats.averageScore)}%
                    </Typography>
                  </Box>
                  <TrendingUp color="info" sx={{ fontSize: 40 }} />
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
                      Top Performer
                    </Typography>
                    <Typography variant="h6" noWrap>
                      {stats.topPerformer?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.topPerformer ? `${Math.round(stats.topPerformer.stats.averageScore)}%` : ''}
                    </Typography>
                  </Box>
                  <School color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Students Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Exams Assigned</TableCell>
                  <TableCell>Exams Completed</TableCell>
                  <TableCell>Average Score</TableCell>
                  <TableCell>Last Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        {students.length === 0 ? 'No students found' : 'No students match your search'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            {student.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {student._id.slice(-8)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {student.email}
                            </Typography>
                          </Box>
                          {student.profile?.phone && (
                            <Box display="flex" alignItems="center">
                              <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {student.profile.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={student.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {student.stats?.examsAssigned || 0}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {student.stats?.examsCompleted || 0}
                          </Typography>
                          {student.stats?.examsAssigned > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              ({Math.round(((student.stats?.examsCompleted || 0) / student.stats.examsAssigned) * 100)}% completion)
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography 
                            variant="body2" 
                            color={getPerformanceColor(student.stats?.averageScore || 0) + '.main'}
                            fontWeight="medium"
                          >
                            {student.stats?.averageScore?.toFixed(1) || 0}%
                          </Typography>
                          <Chip
                            label={
                              (student.stats?.averageScore || 0) >= 80 ? 'Excellent' :
                              (student.stats?.averageScore || 0) >= 60 ? 'Good' : 'Needs Improvement'
                            }
                            color={getPerformanceColor(student.stats?.averageScore || 0)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatLastActivity(student.stats?.lastActivity)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Performance Insights */}
        {students.length > 0 && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Insights
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {students.filter(s => (s.stats?.averageScore || 0) >= 80).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Excellent Performers (80%+)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {students.filter(s => (s.stats?.averageScore || 0) >= 60 && (s.stats?.averageScore || 0) < 80).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Good Performers (60-79%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {students.filter(s => (s.stats?.averageScore || 0) < 60).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Need Support (&lt;60%)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Container>
    </Layout>
  );
};

export default InstructorStudents;