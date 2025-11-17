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
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import instructorService from '../../services/instructorService.js';

const InstructorExamCreationDialog = ({ open, onClose, onSuccess, editMode = false, examData = null }) => {
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
      const response = await instructorService.getAvailableSubjects();
      setAvailableSubjects(response.data.data?.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load available subjects');
    }
  };

  const handleInputChange = (field, valuae) => {
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
        await instructorService.updateExam(examData._id, examPayload);
        toast.success('Exam updated successfully!');
      } else {
        await instructorService.createExam(examPayload);
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
            <FormControl fullWidth>
              <InputLabel>Exam Type</InputLabel>
              <Select
                value={formData.type}
                label="Exam Type"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="midterm">Midterm</MenuItem>
                <MenuItem value="final">Final Exam</MenuItem>
                <MenuItem value="practice">Practice</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              multiline
              rows={2}
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

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Total Marks"
              type="number"
              value={formData.totalMarks}
              onChange={(e) => handleInputChange('totalMarks', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Passing Marks"
              type="number"
              value={formData.passingMarks}
              onChange={(e) => handleInputChange('passingMarks', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: formData.totalMarks }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Pass Percentage: {formData.totalMarks > 0 ? Math.round((formData.passingMarks / formData.totalMarks) * 100) : 0}%
            </Typography>
          </Grid>

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
              label="Start Date & Time"
              type="datetime-local"
              value={formData.schedule.startTime.toISOString().slice(0, 16)}
              onChange={(e) => handleScheduleChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="End Date & Time"
              type="datetime-local"
              value={formData.schedule.endTime.toISOString().slice(0, 16)}
              onChange={(e) => handleScheduleChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Subject Configuration */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                🎯 Subject Weightage ({getTotalWeightage()}%)
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addSubject} variant="outlined">
                Add Subject
              </Button>
            </Box>
            {getTotalWeightage() !== 100 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Total weightage must equal 100%. Current: {getTotalWeightage()}%
              </Alert>
            )}
          </Grid>

          {formData.subjects.map((subject, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select
                          value={subject.subject}
                          label="Subject"
                          onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                        >
                          {availableSubjects.map((subj) => (
                            <MenuItem key={subj.subject} value={subj.subject}>
                              {subj.subject} ({subj.totalQuestions} questions)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography gutterBottom>
                        Weightage: {subject.weightage}%
                      </Typography>
                      <Slider
                        value={subject.weightage}
                        onChange={(e, value) => updateSubject(index, 'weightage', value)}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={0}
                        max={100 - (getTotalWeightage() - subject.weightage)}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        ~{Math.round((formData.totalMarks * subject.weightage) / 100)} questions
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton onClick={() => removeSubject(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Question Preview */}
          {previewQuestions.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📊 Question Distribution Preview
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Easy</TableCell>
                      <TableCell>Medium</TableCell>
                      <TableCell>Hard</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewQuestions.map((q) => (
                      <TableRow key={q.subject}>
                        <TableCell>{q.subject}</TableCell>
                        <TableCell>
                          {q.distribution.easy}/{q.available.easy}
                          {q.available.easy < q.distribution.easy && 
                            <Chip label="Insufficient" size="small" color="error" sx={{ ml: 1 }} />
                          }
                        </TableCell>
                        <TableCell>
                          {q.distribution.medium}/{q.available.medium}
                          {q.available.medium < q.distribution.medium && 
                            <Chip label="Insufficient" size="small" color="error" sx={{ ml: 1 }} />
                          }
                        </TableCell>
                        <TableCell>
                          {q.distribution.hard}/{q.available.hard}
                          {q.available.hard < q.distribution.hard && 
                            <Chip label="Insufficient" size="small" color="error" sx={{ ml: 1 }} />
                          }
                        </TableCell>
                        <TableCell><strong>{q.totalQuestions}</strong></TableCell>
                        <TableCell>
                          {q.available.easy >= q.distribution.easy && 
                           q.available.medium >= q.distribution.medium && 
                           q.available.hard >= q.distribution.hard ? (
                            <Chip label="Ready" color="success" size="small" />
                          ) : (
                            <Chip label="Insufficient Questions" color="error" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Settings */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              🔧 Exam Settings
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
              label="Auto Submit on Time"
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
              label="Show Results Immediately"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions (Optional)"
              multiline
              rows={3}
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Enter exam instructions for students..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || !hasEnoughQuestions() || loading}
        >
          {loading ? 'Creating...' : (editMode ? 'Update Exam' : 'Create Exam')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstructorExamCreationDialog;