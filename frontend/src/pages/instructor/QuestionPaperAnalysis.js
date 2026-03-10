/**
 * Question Paper Analysis (QPA) Page
 * Shows per-question performance and flags questions answered incorrectly by >50% candidates
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  ArrowBack,
  Print,
  Download,
  Warning,
  CheckCircle,
  Flag,
  ExpandMore,
  ExpandLess,
  ErrorOutline
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import moduleExamService from '../../services/moduleExamService';

const QuestionPaperAnalysis = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchQPA();
  }, [examId]);

  const fetchQPA = async () => {
    setLoading(true);
    try {
      const response = await moduleExamService.getQPA(examId);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load QPA');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const blob = await moduleExamService.downloadQPAPDF(examId);
      moduleExamService.openPDF(blob, `qpa_${examId}.pdf`);
      toast.success('QPA PDF downloaded');
    } catch (err) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setDownloading(true);
    try {
      const blob = await moduleExamService.downloadQPAPDF(examId);
      moduleExamService.printPDF(blob);
    } catch (err) {
      toast.error('Failed to print');
    } finally {
      setDownloading(false);
    }
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
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>Go Back</Button>
        </Box>
      </Layout>
    );
  }

  const { exam, summary, questions, flaggedQuestions, totalCandidates } = data || {};
  const displayQuestions = showFlaggedOnly ? flaggedQuestions : questions;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 1 }}>
              Back
            </Button>
            <Typography variant="h5" fontWeight={600}>
              Question Paper Analysis (QPA)
            </Typography>
            <Typography color="text.secondary">{exam?.title}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} disabled={downloading}>
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

        {/* No data */}
        {totalCandidates === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No completed attempts yet. QPA will be available once candidates complete the exam.
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Analysis Summary</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight="bold">{summary.totalQuestions}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Questions</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight="bold">{summary.totalCandidates}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Candidates</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2, borderColor: summary.flaggedCount > 0 ? 'error.main' : 'success.main' }}>
                  <ErrorOutline color={summary.flaggedCount > 0 ? 'error' : 'success'} sx={{ fontSize: 28 }} />
                  <Typography variant="h4" fontWeight="bold" color={summary.flaggedCount > 0 ? 'error.main' : 'success.main'}>
                    {summary.flaggedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Flagged (&gt;50% Wrong)</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {summary.averageCorrectPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Avg Correct %</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body1" fontWeight="bold" color="error.main">
                    {summary.hardestQuestion?.serialNo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hardest ({summary.hardestQuestion?.incorrectPercentage}% wrong)
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {summary.easiestQuestion?.serialNo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Easiest ({summary.easiestQuestion?.correctPercentage}% correct)
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Flagged Questions Alert */}
        {flaggedQuestions?.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
            <AlertTitle>Attention Required</AlertTitle>
            <strong>{flaggedQuestions.length} question(s)</strong> were answered incorrectly by more than 50% of candidates.
            These questions should be reviewed for clarity, correctness, or difficulty level.
          </Alert>
        )}

        {/* Filter Toggle */}
        {questions?.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Chip
              label="All Questions"
              onClick={() => setShowFlaggedOnly(false)}
              color={!showFlaggedOnly ? 'primary' : 'default'}
              variant={!showFlaggedOnly ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<Flag />}
              label={`Flagged Only (${flaggedQuestions?.length || 0})`}
              onClick={() => setShowFlaggedOnly(true)}
              color={showFlaggedOnly ? 'error' : 'default'}
              variant={showFlaggedOnly ? 'filled' : 'outlined'}
            />
          </Box>
        )}

        {/* Questions Table */}
        {displayQuestions?.length > 0 && (
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Per-Question Analysis</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 40 }}>#</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 90 }}>Serial</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Question</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 60 }}>Level</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 70 }}>Correct</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 70 }}>Wrong</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 70 }}>Skipped</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 100 }}>% Wrong</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 70 }}>Flag</TableCell>
                    <TableCell sx={{ color: 'white', width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayQuestions.map((q, index) => (
                    <React.Fragment key={q.questionId}>
                      <TableRow
                        hover
                        sx={{
                          bgcolor: q.isFlagged ? 'error.50' : (index % 2 === 0 ? 'grey.50' : 'white'),
                          '&:hover': { bgcolor: q.isFlagged ? '#FEE2E2' : undefined }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{q.serialNo}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {q.questionText}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={q.knowledgeLevel} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography color="success.main" fontWeight={500}>{q.correctCount}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography color="error.main" fontWeight={500}>{q.incorrectCount}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography color="warning.main" fontWeight={500}>{q.unansweredCount}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={q.incorrectPercentage}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'success.light',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: q.incorrectPercentage > 50 ? 'error.main' : 'warning.main'
                                }
                              }}
                            />
                            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 40 }}>
                              {q.incorrectPercentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {q.isFlagged ? (
                            <Chip icon={<Flag />} label="YES" size="small" color="error" />
                          ) : (
                            <CheckCircle color="success" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {q.optionDistribution && (
                            <IconButton
                              size="small"
                              onClick={() => setExpandedRow(expandedRow === q.questionId ? null : q.questionId)}
                            >
                              {expandedRow === q.questionId ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Expandable option distribution */}
                      {expandedRow === q.questionId && q.optionDistribution && (
                        <TableRow>
                          <TableCell colSpan={10} sx={{ py: 1, px: 4, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>Option Distribution:</Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              {q.optionDistribution.map((opt, i) => (
                                <Chip
                                  key={i}
                                  label={`${opt.text}: ${opt.count} (${totalCandidates > 0 ? Math.round((opt.count / totalCandidates) * 100) : 0}%)`}
                                  size="small"
                                  color={opt.isCorrect ? 'success' : 'default'}
                                  variant={opt.isCorrect ? 'filled' : 'outlined'}
                                />
                              ))}
                            </Box>
                            {q.averageTimeSpent > 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Avg time spent: {q.averageTimeSpent}s | Category: {q.category} | Syllabus: {q.syllabusReference}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Question Paper Analysis | Exam ID: {examId} | Generated by Skyline Aviation Training System
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default QuestionPaperAnalysis;
