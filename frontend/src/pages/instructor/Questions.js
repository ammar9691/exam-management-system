import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Add, Upload } from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import InstructorQuestionImport from '../../components/instructor/QuestionImport';
import instructorService from '../../services/instructorService';
import { toast } from 'react-toastify';

const InstructorQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    subject: '',
    difficulty: 'medium',
    marks: 1,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await instructorService.getQuestions();
      // Backend uses sendSuccessResponse({ data: { questions, pagination } })
      const payload = response.data?.data || response.data || {};
      const questionsData = payload.questions || [];
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Error fetching questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (question = null) => {
    if (question) {
      setEditMode(true);
      setSelectedQuestion(question);
      setFormData({
        question: question.question,
        subject: question.subject,
        difficulty: question.difficulty || 'medium',
        marks: question.marks || 1,
        options:
          question.options && question.options.length > 0
            ? question.options
            : [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
              ]
      });
    } else {
      setEditMode(false);
      setSelectedQuestion(null);
      setFormData({
        question: '',
        subject: '',
        difficulty: 'medium',
        marks: 1,
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'isCorrect' && value) {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        question: formData.question,
        type: 'multiple-choice',
        subject: formData.subject,
        difficulty: formData.difficulty,
        marks: formData.marks,
        options: formData.options,
      };

      if (editMode && selectedQuestion?._id) {
        await instructorService.updateQuestion(selectedQuestion._id, payload);
        toast.success('Question updated successfully');
      } else {
        await instructorService.createQuestion(payload);
        toast.success('Question created successfully');
      }
      fetchQuestions();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Error saving question');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await instructorService.deleteQuestion(id);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Error deleting question');
    }
  };

  const handleOpenImportDialog = () => setOpenImportDialog(true);
  const handleCloseImportDialog = () => setOpenImportDialog(false);
  const handleImportSuccess = () => fetchQuestions();

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Question Bank</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              sx={{ mr: 2 }}
              onClick={handleOpenImportDialog}
            >
              Import Questions
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Question
            </Button>
          </Box>
        </Box>

        <Paper>
          <DataTable
            data={questions}
            loading={loading}
            columns={[
              { key: 'question', label: 'Question', type: 'truncate' },
              { key: 'subject', label: 'Subject' },
              { key: 'difficulty', label: 'Difficulty', type: 'badge' },
              { key: 'marks', label: 'Marks' }
            ]}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            emptyMessage="No questions found. Click 'Add Question' to create one."
          />
        </Paper>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Question' : 'Add New Question'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Question"
                  name="question"
                  multiline
                  rows={3}
                  value={formData.question}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Marks"
                  name="marks"
                  value={formData.marks}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Options
                </Typography>
                {formData.options.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      sx={{ mr: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        />
                      }
                      label="Correct"
                    />
                  </Box>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editMode ? 'Update' : 'Add'} Question
            </Button>
          </DialogActions>
        </Dialog>

        <InstructorQuestionImport
          open={openImportDialog}
          onClose={handleCloseImportDialog}
          onSuccess={handleImportSuccess}
        />
      </Container>
    </Layout>
  );
};

export default InstructorQuestions;