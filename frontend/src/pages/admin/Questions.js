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
import {
  Add,
  Upload
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout.js';
import DataTable from '../../components/common/DataTable.js';
import DebugInfo from '../../components/common/DebugInfo.js';
import questionService from '../../services/questionService.js';
import { toast } from 'react-toastify';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    subject: '',
    topic: '',
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
      console.log('Fetching questions...');
      const response = await questionService.getAllQuestions();
      console.log('Raw API response:', response);
      console.log('response.data:', response.data);
      console.log('response.data.data:', response.data.data);
      
      // Extract questions array directly from response.data.data
      const questionsData = response.data.data || response.data || [];
      console.log('Extracted questionsData:', questionsData);
      console.log('Is questionsData an array?', Array.isArray(questionsData));
      
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      console.log('Set questions state to:', questionsData.length, 'items');
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Error fetching questions');
      setQuestions([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (question = null) => {
    if (question) {
      setEditMode(true);
      setSelectedQuestion(question);
      setFormData(question);
    } else {
      setEditMode(false);
      setSelectedQuestion(null);
      setFormData({
        question: '',
        subject: '',
        topic: '',
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
    setFormData({
      question: '',
      subject: '',
      topic: '',
      difficulty: 'medium',
      marks: 1,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'isCorrect' && value) {
      // If marking as correct, unmark all others
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await questionService.updateQuestion(selectedQuestion._id, formData);
        toast.success('Question updated successfully');
      } else {
        await questionService.createQuestion(formData);
        toast.success('Question created successfully');
      }
      fetchQuestions();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error saving question');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionService.deleteQuestion(id);
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (error) {
        toast.error('Error deleting question');
      }
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            Question Bank
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              sx={{ mr: 2 }}
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

        {/* Debug Info */}
        <DebugInfo title="Questions Debug" data={questions} />
        
        {/* Questions Table */}
        <DataTable
          data={questions}
          loading={loading}
          columns={[
            { key: 'question', label: 'Question', type: 'truncate' },
            { key: 'subject', label: 'Subject' },
            { key: 'topic', label: 'Topic' },
            { key: 'difficulty', label: 'Difficulty', type: 'badge' },
            { key: 'marks', label: 'Marks' },
            { key: 'type', label: 'Type' }
          ]}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          emptyMessage="No questions found. Click 'Add Question' to create one."
        />

        {/* Question Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
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
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
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
              
              <Grid item xs={12} md={2}>
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
      </Container>
    </Layout>
  );
};

export default Questions;
