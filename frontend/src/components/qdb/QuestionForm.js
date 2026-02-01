import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Typography,
  Box,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import {
  getModuleOptions,
  getCategoriesForModule,
  DIFFICULTY_LEVELS,
  KNOWLEDGE_LEVELS,
  QUESTION_TYPES,
  canSeeInternalReference
} from '../../config/qdbModules';

const QuestionForm = ({ open, onClose, onSubmit, editQuestion = null, loading = false }) => {
  const { user } = useAuth();
  const isEdit = !!editQuestion;

  const [formData, setFormData] = useState({
    module: '',
    category: '',
    type: 'mcq',
    difficulty: 'medium',
    knowledgeLevel: 2,
    question: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: 'True', // For True/False
    syllabusReference: '',
    answerReference: '',
    originatorInstructorName: user?.name || '',
    internalReference: ''
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const modules = getModuleOptions();

  useEffect(() => {
    if (editQuestion) {
      setFormData({
        module: editQuestion.module || '',
        category: editQuestion.category || '',
        type: editQuestion.type || 'mcq',
        difficulty: editQuestion.difficulty || 'medium',
        knowledgeLevel: editQuestion.knowledgeLevel || 2,
        question: editQuestion.question || '',
        options: editQuestion.options || [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        correctAnswer: editQuestion.type === 'true-false'
          ? (editQuestion.options?.find(o => o.isCorrect)?.text || 'True')
          : 'True',
        syllabusReference: editQuestion.syllabusReference || '',
        answerReference: editQuestion.answerReference || '',
        originatorInstructorName: editQuestion.originatorInstructorName || user?.name || '',
        internalReference: editQuestion.internalReference || ''
      });

      if (editQuestion.module) {
        setCategories(getCategoriesForModule(editQuestion.module));
      }
    } else {
      // Reset form for new question
      setFormData({
        module: '',
        category: '',
        type: 'mcq',
        difficulty: 'medium',
        knowledgeLevel: 2,
        question: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        correctAnswer: 'True',
        syllabusReference: '',
        answerReference: '',
        originatorInstructorName: user?.name || '',
        internalReference: ''
      });
      setCategories([]);
    }
    setErrors({});
  }, [editQuestion, user, open]);

  const handleModuleChange = (e) => {
    const moduleId = e.target.value;
    setFormData(prev => ({
      ...prev,
      module: moduleId,
      category: '' // Reset category when module changes
    }));
    setCategories(getCategoriesForModule(moduleId));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      type: newType,
      options: newType === 'mcq'
        ? [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
        : [
          { text: 'True', isCorrect: prev.correctAnswer === 'True' },
          { text: 'False', isCorrect: prev.correctAnswer === 'False' }
        ]
    }));
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], text: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleCorrectOptionChange = (index) => {
    setFormData(prev => {
      const newOptions = prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index
      }));
      return { ...prev, options: newOptions };
    });
  };

  const handleTrueFalseChange = (value) => {
    setFormData(prev => ({
      ...prev,
      correctAnswer: value,
      options: [
        { text: 'True', isCorrect: value === 'True' },
        { text: 'False', isCorrect: value === 'False' }
      ]
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.module) newErrors.module = 'Module is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.question.trim()) newErrors.question = 'Question text is required';
    if (!formData.syllabusReference.trim()) newErrors.syllabusReference = 'Syllabus reference is required';
    if (!formData.answerReference.trim()) newErrors.answerReference = 'Answer reference is required';
    if (!formData.originatorInstructorName.trim()) newErrors.originatorInstructorName = 'Originator name is required';

    if (formData.type === 'mcq') {
      const emptyOptions = formData.options.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) newErrors.options = 'All options must have text';

      const hasCorrect = formData.options.some(o => o.isCorrect);
      if (!hasCorrect) newErrors.correctOption = 'Please select a correct answer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const submitData = { ...formData };

    // For True/False, set options automatically
    if (formData.type === 'true-false') {
      submitData.options = [
        { text: 'True', isCorrect: formData.correctAnswer === 'True' },
        { text: 'False', isCorrect: formData.correctAnswer === 'False' }
      ];
    }

    onSubmit(submitData);
  };

  const showInternalRef = canSeeInternalReference(user?.role);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isEdit ? 'Edit Question' : 'Add New Question'}
          </Typography>
          {isEdit && editQuestion?.serialNo && (
            <Chip label={editQuestion.serialNo} color="primary" size="small" />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Module & Category */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Module *"
              name="module"
              value={formData.module}
              onChange={handleModuleChange}
              error={!!errors.module}
              helperText={errors.module}
            >
              {modules.map(m => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Category *"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              error={!!errors.category}
              helperText={errors.category}
              disabled={!formData.module}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Type, Difficulty, Knowledge Level */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Question Type"
              name="type"
              value={formData.type}
              onChange={handleTypeChange}
            >
              {QUESTION_TYPES.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
            >
              {DIFFICULTY_LEVELS.map(d => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Knowledge Level"
              name="knowledgeLevel"
              value={formData.knowledgeLevel}
              onChange={handleInputChange}
            >
              {KNOWLEDGE_LEVELS.map(k => (
                <MenuItem key={k.value} value={k.value}>
                  {k.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Question Text */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Question Text *"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              error={!!errors.question}
              helperText={errors.question}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider>
              <Typography variant="caption" color="textSecondary">
                Answer Options
              </Typography>
            </Divider>
          </Grid>

          {/* MCQ Options */}
          {formData.type === 'mcq' && (
            <Grid item xs={12}>
              {errors.options && (
                <Alert severity="error" sx={{ mb: 2 }}>{errors.options}</Alert>
              )}
              {errors.correctOption && (
                <Alert severity="error" sx={{ mb: 2 }}>{errors.correctOption}</Alert>
              )}
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Select the correct answer:</FormLabel>
                <RadioGroup>
                  {formData.options.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FormControlLabel
                        value={index}
                        control={
                          <Radio
                            checked={option.isCorrect}
                            onChange={() => handleCorrectOptionChange(index)}
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                      <TextField
                        fullWidth
                        label={`Option ${String.fromCharCode(65 + index)}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        size="small"
                      />
                    </Box>
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {/* True/False */}
          {formData.type === 'true-false' && (
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Correct Answer:</FormLabel>
                <RadioGroup
                  row
                  value={formData.correctAnswer}
                  onChange={(e) => handleTrueFalseChange(e.target.value)}
                >
                  <FormControlLabel value="True" control={<Radio />} label="True" />
                  <FormControlLabel value="False" control={<Radio />} label="False" />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider>
              <Typography variant="caption" color="textSecondary">
                References
              </Typography>
            </Divider>
          </Grid>

          {/* Syllabus Reference */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Syllabus Reference *"
              name="syllabusReference"
              value={formData.syllabusReference}
              onChange={handleInputChange}
              error={!!errors.syllabusReference}
              helperText={errors.syllabusReference || 'e.g., ANO-066 Regulation Appendix I / III'}
              placeholder="ANO-066 Regulation Appendix I / III"
            />
          </Grid>

          {/* Answer Reference */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Answer Reference *"
              name="answerReference"
              value={formData.answerReference}
              onChange={handleInputChange}
              error={!!errors.answerReference}
              helperText={errors.answerReference || 'Source for correct answer'}
            />
          </Grid>

          {/* Originator Name */}
          <Grid item xs={12} md={showInternalRef ? 6 : 12}>
            <TextField
              fullWidth
              label="Originator Instructor Name *"
              name="originatorInstructorName"
              value={formData.originatorInstructorName}
              onChange={handleInputChange}
              error={!!errors.originatorInstructorName}
              helperText={errors.originatorInstructorName}
            />
          </Grid>

          {/* Internal Reference (Admin/Exam Manager only) */}
          {showInternalRef && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Internal Reference (Admin Only)"
                name="internalReference"
                value={formData.internalReference}
                onChange={handleInputChange}
                helperText="Not visible to students"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Question' : 'Add Question')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionForm;
