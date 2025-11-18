import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stepper,
  Step,
  StepButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Timer as TimerIcon,
  NavigateNext,
  NavigateBefore,
  Send,
  Flag
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout.js';
import Timer from '../../components/exam/Timer.js';
import examService from '../../services/examService.js';
import { toast } from 'react-toastify';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitDialog, setSubmitDialog] = useState(false);

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await examService.startExam(id);
      setExam(response.data.exam);
      setTimeRemaining(response.data.exam.duration * 60); // Convert to seconds
      
      // Initialize answers object
      const initialAnswers = {};
      response.data.exam.questions.forEach((q, index) => {
        initialAnswers[index] = null;
      });
      setAnswers(initialAnswers);
    } catch (error) {
      toast.error('Error loading exam');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [currentQuestion]: value
    });
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestion(index);
  };

  const handleNext = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFlagQuestion = () => {
    if (flaggedQuestions.includes(currentQuestion)) {
      setFlaggedQuestions(flaggedQuestions.filter(q => q !== currentQuestion));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQuestion]);
    }
  };

  const handleTimeUp = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    try {
      // Backend expects an array of { question, selectedOptions: [], timeSpent?, textAnswer? }
      const formattedAnswers = Object.entries(answers).map(([questionIndex, answer]) => ({
        question: exam.questions[questionIndex]._id,
        selectedOptions: answer === null || answer === undefined ? [] : [answer]
      }));

      await examService.submitExam(id, formattedAnswers);
      toast.success('Exam submitted successfully!');
      navigate('/student/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Error submitting exam');
    }
  };

  const getQuestionStatus = (index) => {
    if (flaggedQuestions.includes(index)) return 'flagged';
    if (answers[index] !== null) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return 'success';
      case 'flagged':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading || !exam) {
    return <Layout>Loading exam...</Layout>;
  }

  const question = exam.questions[currentQuestion];
  const answeredCount = Object.values(answers).filter(a => a !== null).length;

  return (
    <Layout>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">{exam.title}</Typography>
            <Timer duration={timeRemaining} onTimeUp={handleTimeUp} />
          </Box>

          {/* Progress */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestion + 1} of {exam.questions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {answeredCount} answered, {flaggedQuestions.length} flagged
            </Typography>
          </Box>

          {/* Question Navigation */}
          <Box sx={{ mb: 3 }}>
            <Stepper nonLinear activeStep={currentQuestion}>
              {exam.questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <Step key={index} completed={status === 'answered'}>
                    <StepButton
                      onClick={() => handleQuestionNavigation(index)}
                      icon={
                        <Chip
                          label={index + 1}
                          size="small"
                          color={getStatusColor(status)}
                          variant={index === currentQuestion ? 'filled' : 'outlined'}
                        />
                      }
                    />
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          {/* Question Display */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Question {currentQuestion + 1}
              </Typography>
              <Box>
                <Chip label={`${question.marks} marks`} size="small" sx={{ mr: 1 }} />
                <Button
                  size="small"
                  startIcon={<Flag />}
                  onClick={handleFlagQuestion}
                  color={flaggedQuestions.includes(currentQuestion) ? 'warning' : 'default'}
                >
                  {flaggedQuestions.includes(currentQuestion) ? 'Unflag' : 'Flag'}
                </Button>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ mb: 3 }}>
              {question.question}
            </Typography>

            <FormControl component="fieldset">
              <RadioGroup
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswerChange(parseInt(e.target.value))}
              >
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={index}
                    control={<Radio />}
                    label={option.text}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<NavigateBefore />}
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            <Button
              variant="contained"
              color="error"
              startIcon={<Send />}
              onClick={() => setSubmitDialog(true)}
            >
              Submit Exam
            </Button>

            <Button
              variant="outlined"
              endIcon={<NavigateNext />}
              onClick={handleNext}
              disabled={currentQuestion === exam.questions.length - 1}
            >
              Next
            </Button>
          </Box>
        </Paper>

        {/* Submit Confirmation Dialog */}
        <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)}>
          <DialogTitle>Submit Exam?</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Once submitted, you cannot change your answers!
            </Alert>
            <Typography>
              You have answered {answeredCount} out of {exam.questions.length} questions.
            </Typography>
            {flaggedQuestions.length > 0 && (
              <Typography color="warning.main" sx={{ mt: 1 }}>
                You have {flaggedQuestions.length} flagged questions.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubmitDialog(false)}>
              Continue Exam
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitExam}
            >
              Submit Now
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default TakeExam;
