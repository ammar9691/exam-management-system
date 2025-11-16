import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField
} from '@mui/material';
import {
  Add
} from '@mui/icons-material';
// Using native HTML datetime-local input instead of Material-UI date pickers
import Layout from '../../components/layout/Layout.js';
import DataTable from '../../components/common/DataTable.js';
import ExamCreationDialog from '../../components/admin/ExamCreationDialog.js';
import examService from '../../services/examService.js';
import { toast } from 'react-toastify';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    fetchExams();
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


  const handleOpenDialog = (exam = null) => {
    if (exam) {
      setEditMode(true);
      setSelectedExam(exam);
    } else {
      setEditMode(false);
      setSelectedExam(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedExam(null);
  };

  const handleExamSuccess = () => {
    fetchExams(); // Refresh exams list after successful creation/update
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
            renderRowActions={(exam) => (
              <TextField
                select
                size="small"
                variant="standard"
                value={exam.status || 'draft'}
                onChange={(e) => handleStatusChange(exam._id || exam.id, e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mr: 1, minWidth: 110 }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </TextField>
            )}
            emptyMessage="No exams found. Click 'Create Exam' to create one."
          />

          {/* New Smart Exam Creation Dialog */}
          <ExamCreationDialog
            open={openDialog}
            onClose={handleCloseDialog}
            onSuccess={handleExamSuccess}
            editMode={editMode}
            examData={selectedExam}
          />
        </Container>
      </Layout>
  );
};

export default Exams;