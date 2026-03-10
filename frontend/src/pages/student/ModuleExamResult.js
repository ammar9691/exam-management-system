/**
 * Module Exam Result Page
 * Displays immediate exam results with print functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Card,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Print,
  Download,
  Home,
  EmojiEvents,
  SentimentVeryDissatisfied
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import moduleExamService from '../../services/moduleExamService';

const ModuleExamResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    setLoading(true);
    try {
      const response = await moduleExamService.getResult(attemptId);
      setResultData(response.data.attempt);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const blob = await moduleExamService.downloadResultPDF(attemptId);
      moduleExamService.openPDF(blob, `exam_result_${attemptId}.pdf`);
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
      const blob = await moduleExamService.downloadResultPDF(attemptId);
      moduleExamService.printPDF(blob);
    } catch (err) {
      toast.error('Failed to print');
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (seconds) => {
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
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/student/dashboard')}>
            Return to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  const { candidate, exam, result, status, startedAt, activeTimeSeconds } = resultData;
  const isPassed = result.passed;

  return (
    <Layout>
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        {/* Result Header */}
        <Paper
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            background: isPassed
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ mb: 2 }}>
            {isPassed ? (
              <EmojiEvents sx={{ fontSize: 80 }} />
            ) : (
              <SentimentVeryDissatisfied sx={{ fontSize: 80 }} />
            )}
          </Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {result.percentage}%
          </Typography>
          <Typography variant="h5" gutterBottom>
            {isPassed ? 'PASSED' : 'FAILED'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {exam?.title}
          </Typography>
        </Paper>

        {/* Candidate Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Candidate Information</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <Typography variant="body2" color="text.secondary">Name</Typography>
              <Typography fontWeight={500}>{candidate?.name}</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography fontWeight={500}>{candidate?.email}</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography fontWeight={500}>
                {startedAt ? new Date(startedAt).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Exam Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Examination Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <Typography variant="body2" color="text.secondary">Module</Typography>
              <Typography fontWeight={500}>{exam?.moduleName || exam?.moduleId}</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="body2" color="text.secondary">Exam Type</Typography>
              <Chip
                label={exam?.examType === 'basic' ? 'Basic' : 'Type'}
                size="small"
                color={exam?.examType === 'basic' ? 'primary' : 'secondary'}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip
                label={status}
                size="small"
                color={status === 'completed' ? 'success' : status === 'timeout' ? 'warning' : 'default'}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Result Details */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Result Summary</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {result.totalQuestions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Questions
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2, borderColor: 'success.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <CheckCircle color="success" />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {result.correctCount}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Correct
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2, borderColor: 'error.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Cancel color="error" />
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {result.incorrectCount}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Incorrect
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2, borderColor: 'warning.main' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {result.unansweredCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unanswered
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="text.primary" fontWeight="bold">
                  {result.passingPercentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Passing Mark
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="text.primary" fontWeight="bold">
                  {formatTime(result.totalTimeSpentSeconds ?? activeTimeSeconds ?? 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time Spent
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Pass/Fail Message */}
          <Box sx={{ mt: 3 }}>
            <Alert severity={isPassed ? 'success' : 'error'} icon={isPassed ? <CheckCircle /> : <Cancel />}>
              <AlertTitle>{isPassed ? 'Congratulations!' : 'Better luck next time'}</AlertTitle>
              {isPassed ? (
                <>You have successfully passed this examination with a score of <strong>{result.percentage}%</strong>.</>
              ) : (
                <>You scored <strong>{result.percentage}%</strong> which is below the passing mark of <strong>{result.passingPercentage}%</strong>.</>
              )}
            </Alert>
          </Box>
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/student/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
            disabled={downloading}
          >
            Print Result
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

        {/* Footer Note */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            This is a computer-generated result. Reference ID: {attemptId}
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default ModuleExamResult;
