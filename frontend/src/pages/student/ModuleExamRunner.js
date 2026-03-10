/**
 * Module Exam Runner
 * Student exam taking interface with:
 * - Per-candidate shuffled questions
 * - Server-synced timer with heartbeat
 * - Auto-pause on disconnect
 * - Review popup before submission
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Flag,
  FlagOutlined,
  NavigateBefore,
  NavigateNext,
  Timer,
  Send,
  WifiOff,
  Wifi
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import moduleExamService from '../../services/moduleExamService';

const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const WARNING_TIME = 300; // 5 minutes warning

const ModuleExamRunner = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Exam state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Current state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [remainingTime, setRemainingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Dialogs
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeWarningShown, setTimeWarningShown] = useState(false);

  // Refs
  const heartbeatInterval = useRef(null);
  const timerInterval = useRef(null);
  const submittingRef = useRef(false);

  // Start exam on mount
  useEffect(() => {
    startExam();

    return () => {
      // Cleanup intervals
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [examId]);

  // Start heartbeat after exam loads
  useEffect(() => {
    if (attemptId && !isPaused) {
      startHeartbeat();
      startTimer();
    }

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [attemptId, isPaused]);

  // Time warning
  useEffect(() => {
    if (remainingTime <= WARNING_TIME && remainingTime > 0 && !timeWarningShown) {
      setTimeWarningShown(true);
      toast.warning(`Only ${Math.ceil(remainingTime / 60)} minutes remaining!`, {
        autoClose: 5000
      });
    }
  }, [remainingTime, timeWarningShown]);

  const startExam = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await moduleExamService.startAttempt(examId);
      const data = response.data;

      setAttemptId(data.attemptId);
      setExamTitle(data.examTitle);
      setQuestions(data.questions);
      setTotalQuestions(data.totalQuestions);
      setRemainingTime(data.remainingTimeSeconds);
      setCurrentIndex(data.currentQuestionIndex || 0);

      // Restore answers
      if (data.answers) {
        const answersMap = {};
        const flaggedSet = new Set();
        data.answers.forEach(a => {
          if (a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined) {
            answersMap[a.questionId] = a.selectedOptionIndex;
          }
          if (a.isFlagged) {
            flaggedSet.add(a.questionId);
          }
        });
        setAnswers(answersMap);
        setFlagged(flaggedSet);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to start exam';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const startHeartbeat = () => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

    heartbeatInterval.current = setInterval(async () => {
      try {
        const response = await moduleExamService.heartbeat(attemptId);
        const data = response.data;

        setIsConnected(true);
        if (typeof data.remainingTimeSeconds === 'number') {
          setRemainingTime(data.remainingTimeSeconds);
        }
        setIsPaused(data.isPaused);

        if (data.shouldStop) {
          // Exam ended (timeout or completed elsewhere)
          handleExamEnded(data.status);
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          // Auth error — stop heartbeat and redirect
          if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
          if (timerInterval.current) clearInterval(timerInterval.current);
          toast.error(err.response?.data?.message || 'Session expired');
          navigate('/student/dashboard', { replace: true });
          return;
        }
        setIsConnected(false);
        console.error('Heartbeat failed:', err);
      }
    }, HEARTBEAT_INTERVAL);
  };

  const startTimer = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);

    timerInterval.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

    toast.warning('Time is up! Submitting your exam...');
    handleSubmit(true);
  };

  const handleExamEnded = (status) => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

    navigate(`/student/module-exam/result/${attemptId}`, { replace: true });
  };

  const handleAnswerChange = async (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));

    try {
      await moduleExamService.saveAnswer(attemptId, questionId, optionIndex, currentIndex);
    } catch (err) {
      console.error('Failed to save answer:', err);
      toast.error('Failed to save answer. Please try again.');
    }
  };

  const handleToggleFlag = async (questionId) => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlagged(newFlagged);

    try {
      await moduleExamService.toggleFlag(attemptId, questionId);
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGoToQuestion = (index) => {
    setCurrentIndex(index);
    setReviewDialogOpen(false);
  };

  const handleReviewBeforeSubmit = async () => {
    try {
      const response = await moduleExamService.getReviewData(attemptId);
      setReviewData(response.data);
      setReviewDialogOpen(true);
    } catch (err) {
      toast.error('Failed to load review data');
    }
  };

  const handleConfirmSubmit = () => {
    setReviewDialogOpen(false);
    setSubmitDialogOpen(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submittingRef.current) return; // Prevent double-submit from timer + heartbeat race
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitDialogOpen(false);

    try {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

      await moduleExamService.submitExam(attemptId);
      toast.success('Exam submitted successfully!');
      navigate(`/student/module-exam/result/${attemptId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit exam');
      submittingRef.current = false;
      setSubmitting(false);
      // Restart heartbeat if submission failed
      if (!isAutoSubmit) {
        startHeartbeat();
        startTimer();
      }
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    const question = questions[index];
    if (!question) return 'unanswered';

    const isAnswered = answers[question._id] !== undefined;
    const isFlagged = flagged.has(question._id);

    if (isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Loading exam...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <AlertTitle>Cannot Start Exam</AlertTitle>
          {error}
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/student/dashboard')}>
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ position: 'sticky', top: 0, zIndex: 1000, borderRadius: 0 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" noWrap sx={{ maxWidth: 400 }}>{examTitle}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                label={`${answeredCount}/${totalQuestions} answered`}
                color={answeredCount === totalQuestions ? 'success' : 'default'}
              />
              {flagged.size > 0 && (
                <Chip size="small" label={`${flagged.size} flagged`} color="warning" />
              )}
              <Chip
                size="small"
                icon={isConnected ? <Wifi /> : <WifiOff />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Time Remaining</Typography>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'monospace',
                  color: remainingTime <= WARNING_TIME ? 'error.main' : 'text.primary',
                  fontWeight: 'bold'
                }}
              >
                <Timer sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {formatTime(remainingTime)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReviewBeforeSubmit}
              startIcon={<Send />}
            >
              Submit Exam
            </Button>
          </Box>
        </Box>
        {isPaused && (
          <Alert severity="warning" sx={{ borderRadius: 0 }}>
            Timer paused due to connection loss. It will resume when connection is restored.
          </Alert>
        )}
      </Paper>

      {/* Main Content */}
      <Grid container sx={{ p: 2 }} spacing={2}>
        {/* Question Panel */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            {/* Question Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Question {currentIndex + 1} of {totalQuestions}
              </Typography>
              <Tooltip title={flagged.has(currentQuestion?._id) ? 'Remove flag' : 'Flag for review'}>
                <IconButton
                  onClick={() => handleToggleFlag(currentQuestion?._id)}
                  color={flagged.has(currentQuestion?._id) ? 'warning' : 'default'}
                >
                  {flagged.has(currentQuestion?._id) ? <Flag /> : <FlagOutlined />}
                </IconButton>
              </Tooltip>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Question Text */}
            <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
              {currentQuestion?.question}
            </Typography>

            {/* Options */}
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={answers[currentQuestion?._id] ?? ''}
                onChange={(e) => handleAnswerChange(currentQuestion?._id, parseInt(e.target.value))}
              >
                {currentQuestion?.options.map((option, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      p: 1.5,
                      cursor: 'pointer',
                      bgcolor: answers[currentQuestion?._id] === idx ? 'primary.50' : 'transparent',
                      borderColor: answers[currentQuestion?._id] === idx ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleAnswerChange(currentQuestion?._id, idx)}
                  >
                    <FormControlLabel
                      value={idx}
                      control={<Radio />}
                      label={
                        <Typography sx={{ ml: 1 }}>
                          <strong>{String.fromCharCode(65 + idx)}.</strong> {option.text}
                        </Typography>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={handlePrevQuestion}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                endIcon={<NavigateNext />}
                onClick={handleNextQuestion}
                disabled={currentIndex === totalQuestions - 1}
              >
                Next
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Question Navigator */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Question Navigator</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                return (
                  <Tooltip
                    key={idx}
                    title={`Question ${idx + 1} - ${status}`}
                  >
                    <Badge
                      badgeContent={flagged.has(q._id) ? <Flag sx={{ fontSize: 12 }} /> : null}
                      color="warning"
                    >
                      <Button
                        size="small"
                        variant={idx === currentIndex ? 'contained' : 'outlined'}
                        onClick={() => handleGoToQuestion(idx)}
                        sx={{
                          minWidth: 36,
                          height: 36,
                          bgcolor: idx === currentIndex
                            ? 'primary.main'
                            : status === 'answered'
                              ? 'success.light'
                              : status === 'flagged'
                                ? 'warning.light'
                                : 'transparent',
                          color: idx === currentIndex
                            ? 'white'
                            : status === 'answered'
                              ? 'success.dark'
                              : 'text.primary'
                        }}
                      >
                        {idx + 1}
                      </Button>
                    </Badge>
                  </Tooltip>
                );
              })}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>Legend:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 1 }} />
                  <Typography variant="caption">Answered</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 1 }} />
                  <Typography variant="caption">Flagged</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, border: '1px solid #ccc', borderRadius: 1 }} />
                  <Typography variant="caption">Not answered</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Before Submission</DialogTitle>
        <DialogContent>
          {reviewData && (
            <>
              <Alert severity={reviewData.unansweredCount > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                <AlertTitle>Summary</AlertTitle>
                <Typography>
                  Answered: {reviewData.answeredCount} / {reviewData.totalQuestions}
                </Typography>
                {reviewData.unansweredCount > 0 && (
                  <Typography color="warning.dark">
                    Unanswered: {reviewData.unansweredCount}
                  </Typography>
                )}
                {reviewData.flaggedCount > 0 && (
                  <Typography color="info.dark">
                    Flagged for review: {reviewData.flaggedCount}
                  </Typography>
                )}
              </Alert>

              {reviewData.unansweredCount > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Unanswered Questions:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {reviewData.unansweredIndices.map(idx => (
                      <Button
                        key={idx}
                        size="small"
                        variant="outlined"
                        onClick={() => handleGoToQuestion(idx - 1)}
                      >
                        Q{idx}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              {reviewData.flaggedCount > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Flagged Questions:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {reviewData.flaggedIndices.map(idx => (
                      <Button
                        key={idx}
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => handleGoToQuestion(idx - 1)}
                      >
                        Q{idx}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Continue Exam</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmSubmit}>
            Submit Exam
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Are you sure?</AlertTitle>
            Once submitted, you cannot change your answers.
          </Alert>
          {unansweredCount > 0 && (
            <Typography color="error">
              You have {unansweredCount} unanswered question(s).
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleExamRunner;
