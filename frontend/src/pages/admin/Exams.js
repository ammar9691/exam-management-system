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
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Stop,
  Assessment
} from '@mui/icons-material';
// Using native HTML datetime-local input instead of Material-UI date pickers
import Layout from '../../components/layout/Layout.js';
import DataTable from '../../components/common/DataTable.js';
import examService from '../../services/examService.js';
import questionService from '../../services/questionService.js';
import { toast } from 'react-toastify';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    instructions: '',
    status: 'draft',
    questions: [],
    difficulty: 'medium',
    randomizeQuestions: true,
    showResults: true
  });

  useEffect(() => {
    fetchExams();
    fetchQuestions();
    fetchSubjects();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await examService.getAllExams();
      const examsData = response.data.data || response.data || [];
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (error) {
      toast.error('Error fetching exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await questionService.getAllQuestions();
      const questionsData = response.data.data || response.data || [];
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (error) {
      toast.error('Error fetching questions');
      setQuestions([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await questionService.getSubjects();
      const subjectsData = response.data.data || response.data || [];
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.log('Error fetching subjects');
      setSubjects([]);
    }
  };

  const handleOpenDialog = (exam = null) => {
    if (exam) {
      setEditMode(true);
      setSelectedExam(exam);
      setFormData({
        ...exam,
        startTime: new Date(exam.startTime),
        endTime: new Date(exam.endTime)
      });
    } else {
      setEditMode(false);
      setSelectedExam(null);
      setFormData({
        title: '',
        description: '',
        subject: '',
        duration: 60,
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        instructions: '',
        status: 'draft',
        questions: [],
        difficulty: 'medium',
        randomizeQuestions: true,
        showResults: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDateChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleQuestionToggle = (questionId) => {
    const currentIndex = formData.questions.indexOf(questionId);
    const newQuestions = [...formData.questions];

    if (currentIndex === -1) {
      newQuestions.push(questionId);
    } else {
      newQuestions.splice(currentIndex, 1);
    }

    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await examService.updateExam(selectedExam._id, formData);
        toast.success('Exam updated successfully');
      } else {
        await examService.createExam(formData);
        toast.success('Exam created successfully');
      }
      fetchExams();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error saving exam');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examService.deleteExam(id);
        toast.success('Exam deleted successfully');
        fetchExams();
      } catch (error) {
        toast.error('Error deleting exam');
      }
    }
  };

  const handleStatusChange = async (examId, status) => {
    try {
      await examService.updateExamStatus(examId, status);
      toast.success(`Exam ${status} successfully`);
      fetchExams();
    } catch (error) {
      toast.error(`Error ${status} exam`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'draft':
        return 'default';
      default:
        return 'default';
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

  const filteredQuestions = Array.isArray(questions) ? questions.filter(q => 
    !formData.subject || q.subject === formData.subject
  ) : [];

  return (
    <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">
              Exam Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Create Exam
            </Button>
          </Box>

          {/* Exams Table */}
          <DataTable
            data={exams}
            loading={loading}
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'subject', label: 'Subject' },
              { key: 'duration', label: 'Duration (min)' },
              { key: 'status', label: 'Status', type: 'badge' },
              { key: 'totalMarks', label: 'Total Marks' },
              { key: 'createdAt', label: 'Created', type: 'date' }
            ]}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            emptyMessage="No exams found. Click 'Create Exam' to create one."
          />

          {/* Exam Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
            <DialogTitle>
              {editMode ? 'Edit Exam' : 'Create New Exam'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Exam Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      label="Subject"
                    >
                      {subjects.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duration (minutes)"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Marks"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Passing Marks"
                    name="passingMarks"
                    value={formData.passingMarks}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime ? formData.startTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleDateChange('startTime', new Date(e.target.value))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    name="endTime"
                    type="datetime-local"
                    value={formData.endTime ? formData.endTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleDateChange('endTime', new Date(e.target.value))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instructions"
                    name="instructions"
                    multiline
                    rows={3}
                    value={formData.instructions}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                {/* Questions Selection */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Select Questions ({formData.questions.length} selected)
                  </Typography>
                  <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                    <List dense>
                      {filteredQuestions.map((question) => (
                        <ListItem
                          key={question._id}
                          button
                          onClick={() => handleQuestionToggle(question._id)}
                        >
                          <ListItemText
                            primary={question.question.substring(0, 80) + '...'}
                            secondary={`${question.subject} • ${question.topic} • ${question.marks} marks`}
                          />
                          <ListItemSecondaryAction>
                            <Checkbox
                              edge="end"
                              checked={formData.questions.indexOf(question._id) !== -1}
                              onChange={() => handleQuestionToggle(question._id)}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editMode ? 'Update' : 'Create'} Exam
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Layout>
  );
};

export default Exams;