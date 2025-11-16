import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import { toast } from 'react-toastify';
import instructorService from '../../services/instructorService';

const ExamPublishDialog = ({ open, exam, onClose, onPublished }) => {
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetch a large page of students; backend is paginated
      const response = await instructorService.getStudents({ page: 1, limit: 1000 });
      const payload = response.data?.data || response.data || {};
      const studentsData = payload.students || [];
      setStudents(Array.isArray(studentsData) ? studentsData : []);

      // Pre-select already assigned students if exam has eligibility.students
      const preselected = new Set();
      if (exam?.eligibility?.students && Array.isArray(exam.eligibility.students)) {
        exam.eligibility.students.forEach(id => preselected.add(String(id)));
      }
      setSelectedIds(preselected);
    } catch (error) {
      console.error('Error fetching students for publish dialog:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!exam?._id) {
      toast.error('Invalid exam');
      return;
    }

    if (selectedIds.size === 0) {
      toast.error('Please select at least one student to assign this exam');
      return;
    }

    try {
      setSubmitting(true);
      const studentIds = Array.from(selectedIds);

      // Assign selected students, then publish the exam
      await instructorService.assignExamToStudents(exam._id, studentIds);
      // Prefer publish endpoint to enforce validation rules
      await instructorService.publishExam(exam._id);

      toast.success('Exam published and assigned successfully');
      if (onPublished) onPublished();
      onClose();
    } catch (error) {
      console.error('Error publishing exam:', error);
      const message = error.response?.data?.message || 'Failed to publish exam';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Publish Exam & Assign Students</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            {exam?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select the students who should be able to access this exam.
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : students.length === 0 ? (
          <Alert severity="info">No students found.</Alert>
        ) : (
          <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
            {students.map(student => {
              const id = student._id || student.id;
              const key = String(id);
              const checked = selectedIds.has(key);
              return (
                <ListItem
                  key={key}
                  button
                  onClick={() => toggleStudent(id)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      tabIndex={-1}
                      disableRipple
                      checked={checked}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={student.name}
                    secondary={student.email}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loading}
        >
          {submitting ? 'Publishing...' : 'Publish Exam'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExamPublishDialog;
