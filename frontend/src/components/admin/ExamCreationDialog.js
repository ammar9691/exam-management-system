import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Slider,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService.js';

const ExamCreationDialog = ({ open, onClose, onSuccess, editMode = false, examData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjects: [],
    type: 'final',
    duration: 120,
    totalMarks: 100,
    passingMarks: 60,
    schedule: {
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000)
    },
    instructions: '',
    settings: {
      randomizeQuestions: true,
      autoSubmit: true,
      showResults: false
    }
  });

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectStats, setSubjectStats] = useState({});
  const [previewQuestions, setPreviewQuestions] = useState([]);

  useEffect(() => {
    if (open) {
      fetchAvailableSubjects();
      if (editMode && examData) {
        setFormData({
          ...examData,
          schedule: {
            startTime: new Date(examData.schedule?.startTime),
            endTime: new Date(examData.schedule?.endTime)
          }
        });
      }
    }
  }, [open, editMode, examData]);

  const fetchAvailableSubjects = async () => {
    try {
      const response = await adminService.getAvailableSubjects();
      console.log("response: subjects: ",response )
      setAvailableSubjects(response.data.data?.subjects || []);
      console.log("set availbe: ", availableSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load available subjects');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: new Date(value)
      }
    }));
  };

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const addSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { subject: '', weightage: 0 }]
    }));
  };

  const updateSubject = (index, field, value) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index][field] = value;
    
    // Auto-calculate remaining weightage
    if (field === 'weightage') {
      const totalWeightage = newSubjects.reduce((sum, s, i) => i !== index ? sum + s.weightage : sum, 0);
      const maxAllowed = 100 - totalWeightage;
      newSubjects[index].weightage = Math.min(Math.max(0, value), maxAllowed);
    }
    
    setFormData(prev => ({ ...prev, subjects: newSubjects }));
    calculateQuestionPreview(newSubjects);
  };

  const removeSubject = (index) => {
    const newSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, subjects: newSubjects }));
    calculateQuestionPreview(newSubjects);
  };

  const calculateQuestionPreview = (subjects) => {
    const preview = subjects.map(subj => {
      const subjectInfo = availableSubjects.find(s => s.subject === subj.subject);
      const questionsNeeded = Math.round((formData.totalMarks * subj.weightage) / 100);
      const questionsPerDifficulty = Math.floor(questionsNeeded / 3);
      const remainder = questionsNeeded % 3;

      return {
        subject: subj.subject,
        weightage: subj.weightage,
        totalQuestions: questionsNeeded,
        distribution: {
          easy: questionsPerDifficulty + (remainder > 0 ? 1 : 0),
          medium: questionsPerDifficulty + (remainder > 1 ? 1 : 0),
          hard: questionsPerDifficulty
        },
        available: subjectInfo ? {
          easy: subjectInfo.easyCount,
          medium: subjectInfo.mediumCount,
          hard: subjectInfo.hardCount,
          total: subjectInfo.totalQuestions
        } : { easy: 0, medium: 0, hard: 0, total: 0 }
      };
    });

    setPreviewQuestions(preview);
  };

  const getTotalWeightage = () => {
    return formData.subjects.reduce((sum, s) => sum + s.weightage, 0);
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.subjects.length > 0 &&
      getTotalWeightage() === 100 &&
      formData.totalMarks > 0 &&
      formData.duration > 0 &&
      formData.schedule.startTime < formData.schedule.endTime
    );
  };

  const hasEnoughQuestions = () => {
    return previewQuestions.every(q => 
      q.available.easy >= q.distribution.easy &&
      q.available.medium >= q.distribution.medium &&
      q.available.hard >= q.distribution.hard
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Please fill all required fields and ensure weightages total 100%');
      return;
    }

    if (!hasEnoughQuestions()) {
      toast.error('Not enough questions available for the selected subjects and distribution');
      return;
    }

    setLoading(true);
    try {
      const examPayload = {
        ...formData,
        schedule: {
          startTime: formData.schedule.startTime.toISOString(),
          endTime: formData.schedule.endTime.toISOString()
        }
      };

      if (editMode) {
        await adminService.updateExam(examData._id, examPayload);
        toast.success('Exam updated successfully!');
      } else {
        await adminService.createExam(examPayload);
        toast.success('Exam created successfully! Questions have been automatically selected.');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error(error.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      subjects: [],
      type: 'final',
      duration: 120,
      totalMarks: 100,
      passingMarks: 60,
      schedule: {
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000)
      },
      instructions: '',
      settings: {
        randomizeQuestions: true,
        autoSubmit: true,
        showResults: false
      }
    });
    setPreviewQuestions([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">
            {editMode ? 'Edit Exam' : 'Create New Exam'}
          </Typography>
          <Chip 
            label="Smart Question Selection" 
            color="primary" 
            size="small" 
            icon={<InfoIcon />}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              📋 Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Exam Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Exam Type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="practice">Practice</option>
              <option value="mock">Mock</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>

          {/* Exam Configuration */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              ⚙️ Exam Configuration
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Total Marks"
              value={formData.totalMarks}
              onChange={(e) => handleInputChange('totalMarks', parseInt(e.target.value) || 0)}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Duration (minutes)"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Passing Marks"
              value={formData.passingMarks}
              onChange={(e) => handleInputChange('passingMarks', parseInt(e.target.value) || 0)}
            />
          </Grid>

          {/* Subject Weightage */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                📊 Subject Weightage ({getTotalWeightage()}%)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addSubject}
                size="small"
              >
                Add Subject
              </Button>
            </Box>

            {formData.subjects.length === 0 ? (
              <Alert severity="info">
                Add subjects and their weightages. The total must equal 100%.
              </Alert>
            ) : (
              <Box>
                {formData.subjects.map((subj, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            select
                            label="Subject"
                            value={subj.subject}
                            onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                            SelectProps={{ native: true }}
                          >
                            <option value="">Select Subject</option>
                            {availableSubjects.map((s) => (
                              <option key={s.subject} value={s.subject}>
                                {s.subject} ({s.totalQuestions} questions)
                              </option>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" gutterBottom>
                            Weightage: {subj.weightage}%
                          </Typography>
                          <Slider
                            value={subj.weightage}
                            onChange={(_, value) => updateSubject(index, 'weightage', value)}
                            max={100 - getTotalWeightage() + subj.weightage}
                            marks
                            step={5}
                            valueLabelDisplay="auto"
                          />
                        </Grid>

                        <Grid item xs={12} md={2}>
                          <IconButton
                            color="error"
                            onClick={() => removeSubject(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}

                {getTotalWeightage() !== 100 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Total weightage is {getTotalWeightage()}%. It must equal 100%.
                  </Alert>
                )}
              </Box>
            )}
          </Grid>

          {/* Question Preview */}
          {previewQuestions.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                🔍 Question Distribution Preview
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell><strong>Weight</strong></TableCell>
                      <TableCell><strong>Total Questions</strong></TableCell>
                      <TableCell><strong>Easy</strong></TableCell>
                      <TableCell><strong>Medium</strong></TableCell>
                      <TableCell><strong>Hard</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewQuestions.map((q, index) => (
                      <TableRow key={index}>
                        <TableCell>{q.subject}</TableCell>
                        <TableCell>{q.weightage}%</TableCell>
                        <TableCell>{q.totalQuestions}</TableCell>
                        <TableCell>
                          {q.distribution.easy} / {q.available.easy}
                          {q.available.easy < q.distribution.easy && (
                            <Chip size="small" color="error" label="Not enough" />
                          )}
                        </TableCell>
                        <TableCell>
                          {q.distribution.medium} / {q.available.medium}
                          {q.available.medium < q.distribution.medium && (
                            <Chip size="small" color="error" label="Not enough" />
                          )}
                        </TableCell>
                        <TableCell>
                          {q.distribution.hard} / {q.available.hard}
                          {q.available.hard < q.distribution.hard && (
                            <Chip size="small" color="error" label="Not enough" />
                          )}
                        </TableCell>
                        <TableCell>
                          {q.available.easy >= q.distribution.easy &&
                           q.available.medium >= q.distribution.medium &&
                           q.available.hard >= q.distribution.hard ? (
                            <Chip size="small" color="success" label="✓ Ready" />
                          ) : (
                            <Chip size="small" color="error" label="⚠ Issues" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Schedule */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              📅 Schedule
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Start Time"
              value={formData.schedule.startTime.toISOString().slice(0, 16)}
              onChange={(e) => handleScheduleChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="End Time"
              value={formData.schedule.endTime.toISOString().slice(0, 16)}
              onChange={(e) => handleScheduleChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Settings */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              🔧 Settings
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.randomizeQuestions}
                  onChange={(e) => handleSettingsChange('randomizeQuestions', e.target.checked)}
                />
              }
              label="Randomize Questions"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.autoSubmit}
                  onChange={(e) => handleSettingsChange('autoSubmit', e.target.checked)}
                />
              }
              label="Auto Submit"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.showResults}
                  onChange={(e) => handleSettingsChange('showResults', e.target.checked)}
                />
              }
              label="Show Results"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Instructions"
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Enter exam instructions for students..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !isFormValid() || !hasEnoughQuestions()}
        >
          {loading ? 'Saving...' : (editMode ? 'Update Exam' : 'Create Exam')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExamCreationDialog;