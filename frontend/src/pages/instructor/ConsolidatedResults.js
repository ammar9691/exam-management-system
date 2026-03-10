/**
 * Consolidated Results Page
 * Shows all candidate results for an exam with statistics and print functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Card,
  CardContent,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  Print,
  Download,
  CheckCircle,
  Cancel,
  TrendingUp,
  TrendingDown,
  People
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import moduleExamService from '../../services/moduleExamService';

const ConsolidatedResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examData, setExamData] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await moduleExamService.getConsolidatedResult(examId);
      setExamData(response.data.exam);
      setResultsData(response.data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const blob = await moduleExamService.downloadConsolidatedPDF(examId);
      moduleExamService.openPDF(blob, `consolidated_results_${examId}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setDownloading(true);
    try {
      const blob = await moduleExamService.downloadConsolidatedPDF(examId);
      moduleExamService.printPDF(blob);
    } catch (err) {
      toast.error('Failed to print');
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      </Layout>
    );
  }

  const stats = resultsData?.stats;
  const candidates = resultsData?.candidates || [];

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mb: 1 }}
            >
              Back
            </Button>
            <Typography variant="h5" fontWeight={600}>
              Consolidated Examination Results
            </Typography>
            <Typography color="text.secondary">
              {examData?.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
              disabled={downloading}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={20} /> : <Download />}
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              Download PDF
            </Button>
          </Box>
        </Box>

        {/* Exam Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Examination Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Module</Typography>
              <Typography fontWeight={500}>{examData?.moduleName}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Exam Type</Typography>
              <Chip
                label={examData?.examType === 'basic' ? 'Basic' : 'Type'}
                size="small"
                color={examData?.examType === 'basic' ? 'primary' : 'secondary'}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Exam Date</Typography>
              <Typography fontWeight={500}>
                {examData?.startAt ? new Date(examData.startAt).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Generated</Typography>
              <Typography fontWeight={500}>
                {new Date().toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics Summary */}
        {stats && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Summary Statistics</Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <People color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {resultsData?.totalCandidates || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Candidates
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2, borderColor: 'success.main' }}>
                  <CheckCircle color="success" sx={{ fontSize: 32 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {stats.passedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passed
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2, borderColor: 'error.main' }}>
                  <Cancel color="error" sx={{ fontSize: 32 }} />
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {stats.failedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {stats.average?.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <TrendingUp color="success" sx={{ fontSize: 24 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.max}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest Score
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <TrendingDown color="error" sx={{ fontSize: 24 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.min}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lowest Score
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Pass Rate Bar */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Pass Rate</Typography>
                <Typography variant="body2" fontWeight="bold">{stats.passRate?.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.passRate || 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'error.light',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'success.main'
                  }
                }}
              />
            </Box>
          </Paper>
        )}

        {/* Candidates Table */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Candidate Results</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Correct</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Wrong</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Unanswered</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Score</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No completed attempts yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((candidate, index) => (
                    <TableRow
                      key={candidate.candidateId}
                      hover
                      sx={{ bgcolor: index % 2 === 0 ? 'grey.50' : 'white' }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{candidate.name}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell align="center">
                        <Typography color="success.main" fontWeight={500}>
                          {candidate.result?.correctCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography color="error.main" fontWeight={500}>
                          {candidate.result?.incorrectCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography color="warning.main" fontWeight={500}>
                          {candidate.result?.unansweredCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {candidate.result?.percentage}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={candidate.result?.passed ? 'PASSED' : 'FAILED'}
                          size="small"
                          color={candidate.result?.passed ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {formatTime(candidate.totalTimeSpent)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Generated by Skyline Aviation Training System | Exam ID: {examId}
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default ConsolidatedResults;
