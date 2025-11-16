import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Grid
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import instructorService from '../../services/instructorService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const InstructorGrading = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

  useEffect(() => {
    fetchStats();
    fetchQueue();
    fetchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await instructorService.getGradingStats();
      setStats(response.data?.stats || response.data?.data?.stats || null);
    } catch (error) {
      console.error('Error fetching grading stats:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await instructorService.getGradingQueue();
      const results = response.data?.results || response.data?.data?.results || [];
      setQueue(results);
    } catch (error) {
      console.error('Error fetching grading queue:', error);
      toast.error('Failed to load grading queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await instructorService.getGradingHistory();
      const results = response.data?.results || response.data?.data?.results || [];
      setHistory(results);
    } catch (error) {
      console.error('Error fetching grading history:', error);
    }
  };

  const handleOpenDialog = (result) => {
    setSelectedResult(result);
    setGradeForm({
      score: result.scoring?.marksObtained ?? '',
      feedback: result.feedback?.overall || ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedResult(null);
  };

  const handleGradeChange = (field, value) => {
    setGradeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitGrade = async () => {
    if (!selectedResult) return;
    const score = Number(gradeForm.score);
    if (Number.isNaN(score)) {
      toast.error('Score must be a number');
      return;
    }
    try {
      await instructorService.gradeResult(selectedResult.id || selectedResult._id, {
        score,
        feedback: gradeForm.feedback
      });
      toast.success('Result graded successfully');
      fetchQueue();
      fetchHistory();
      handleCloseDialog();
    } catch (error) {
      console.error('Error grading result:', error);
      toast.error('Failed to grade result');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    return format(new Date(value), 'MMM dd, yyyy HH:mm');
  };

  const TabPanel = ({ children, value, index }) => {
    if (value !== index) return null;
    return <Box sx={{ mt: 3 }}>{children}</Box>;
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Grading & Review
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review submitted exams and update scores/feedback
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Grading Queue" />
            <Tab label="History" />
          </Tabs>
        </Paper>

        <TabPanel value={tab} index={0}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Exam</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : queue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">No results pending grading</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    queue.map(result => (
                      <TableRow key={result.id || result._id} hover>
                        <TableCell>{result.student?.name}</TableCell>
                        <TableCell>{result.exam?.title}</TableCell>
                        <TableCell>
                          <Chip label={result.status} size="small" />
                        </TableCell>
                        <TableCell>{result.scoring?.marksObtained ?? '-'}</TableCell>
                        <TableCell>{formatDateTime(result.submittedAt)}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(result)}>
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Exam</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Reviewed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No grading history yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map(result => (
                      <TableRow key={result._id} hover>
                        <TableCell>{result.student?.name}</TableCell>
                        <TableCell>{result.exam?.title}</TableCell>
                        <TableCell>{result.scoring?.marksObtained ?? '-'}</TableCell>
                        <TableCell>{formatDateTime(result.reviewedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Grade Result</DialogTitle>
          <DialogContent>
            {selectedResult && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    {selectedResult.student?.name} – {selectedResult.exam?.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Score"
                    type="number"
                    value={gradeForm.score}
                    onChange={e => handleGradeChange('score', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Feedback"
                    multiline
                    rows={3}
                    value={gradeForm.feedback}
                    onChange={e => handleGradeChange('feedback', e.target.value)}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitGrade}>
              Save Grade
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default InstructorGrading;