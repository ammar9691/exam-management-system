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
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Stop,
  MoreVert,
  Assignment,
  School,
  FilterList,
  Refresh,
  Download,
  Share
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import instructorService from '../../services/instructorService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import InstructorExamCreationDialog from '../../components/instructor/ExamCreationDialog';
import ExamPublishDialog from '../../components/instructor/ExamPublishDialog';

const InstructorExams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    subject: '',
    search: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, exam: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, exam: null, newStatus: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dialogExam, setDialogExam] = useState(null);
  const [publishDialog, setPublishDialog] = useState({ open: false, exam: null });

  useEffect(() => {
    fetchExams();
  }, [page, rowsPerPage, filters]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        subject: filters.subject,
        search: filters.search
      };
      // Do not send status="all" to backend, treat it as "no status filter"
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await instructorService.getExams(params);
      // Backend uses sendSuccessResponse({ data: { exams, pagination } })
      const payload = response.data?.data || response.data || {};
      const examsData = payload.exams || [];
      const pagination = payload.pagination || { total: examsData.length };

      setExams(Array.isArray(examsData) ? examsData : []);
      setFilteredExams(Array.isArray(examsData) ? examsData : []);
      setTotalCount(pagination.total || examsData.length);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, exam) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExam(null);
  };

  const handleCreateExam = () => {
    setEditMode(false);
    setDialogExam(null);
    setOpenDialog(true);
  };

  const handleEditExam = (exam) => {
    setEditMode(true);
    setDialogExam(exam);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleViewExam = (exam) => {
    // For now, reuse edit dialog as view; could be extended
    setEditMode(true);
    setDialogExam(exam);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleViewResults = (exam) => {
    navigate(`/instructor/exams/${exam._id}/results`);
    handleMenuClose();
  };

  const handleMonitorExam = (exam) => {
    navigate(`/instructor/exams/${exam._id}/monitor`);
    handleMenuClose();
  };

  const handleDeleteExam = async () => {
    try {
      await instructorService.deleteExam(deleteDialog.exam._id);
      toast.success('Exam deleted successfully');
      fetchExams();
      setDeleteDialog({ open: false, exam: null });
    } catch (error) {
      toast.error('Failed to delete exam: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleStatusChange = async () => {
    try {
      if (statusDialog.newStatus === 'active') {
        // For publishing, open the publish dialog to assign students first
        setPublishDialog({ open: true, exam: statusDialog.exam });
        setStatusDialog({ open: false, exam: null, newStatus: '' });
        return;
      }

      // Unpublish or other status changes can go directly
      await instructorService.updateExamStatus(statusDialog.exam._id, statusDialog.newStatus);
      toast.success(`Exam ${statusDialog.newStatus === 'active' ? 'published' : 'unpublished'} successfully`);
      fetchExams();
      setStatusDialog({ open: false, exam: null, newStatus: '' });
    } catch (error) {
      toast.error('Failed to update exam status: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && exams.length === 0) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditMode(false);
    setDialogExam(null);
  };

  const handleDialogSuccess = () => {
    fetchExams();
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Manage Exams
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create, edit, and monitor your examination papers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateExam}
          >
            Create New Exam
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search exams..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Subject"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchExams}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Exams
                    </Typography>
                    <Typography variant="h4">
                      {totalCount}
                    </Typography>
                  </Box>
                  <Assignment color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Exams
                    </Typography>
                    <Typography variant="h4">
                      {exams.filter(e => e.status === 'active').length}
                    </Typography>
                  </Box>
                  <PlayArrow color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Draft Exams
                    </Typography>
                    <Typography variant="h4">
                      {exams.filter(e => e.status === 'draft').length}
                    </Typography>
                  </Box>
                  <Edit color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Avg. Score
                    </Typography>
                    <Typography variant="h4">
                      {exams.length > 0
                        ? Math.round(exams.reduce((sum, exam) => sum + (exam.stats?.averageScore || 0), 0) / exams.length)
                        : 0}%
                    </Typography>
                  </Box>
                  <School color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Exams Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Average Score</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No exams found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExams.map((exam) => (
                    <TableRow key={exam._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {exam.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {exam.questions?.length || 0} questions • {exam.totalMarks} marks
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>
                        <Chip
                          label={exam.status}
                          color={getStatusColor(exam.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{exam.duration} min</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {exam.stats?.studentsEnrolled || 0} enrolled
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {exam.stats?.studentsCompleted || 0} completed
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={(exam.stats?.averageScore || 0) >= 60 ? 'success.main' : 'error.main'}
                        >
                          {exam.stats?.averageScore?.toFixed(1) || 0}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Start: {formatDate(exam.schedule?.startTime)}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            End: {formatDate(exam.schedule?.endTime)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, exam)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewExam(selectedExam)}>
            <Visibility sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={() => handleEditExam(selectedExam)}>
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => handleViewResults(selectedExam)}>
            <School sx={{ mr: 1 }} />
            View Results
          </MenuItem>
          {selectedExam?.status === 'active' && (
            <MenuItem onClick={() => handleMonitorExam(selectedExam)}>
              <Visibility sx={{ mr: 1 }} />
              Monitor Live
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              setStatusDialog({
                open: true,
                exam: selectedExam,
                newStatus: selectedExam?.status === 'active' ? 'draft' : 'active'
              });
              handleMenuClose();
            }}
          >
            {selectedExam?.status === 'active' ? <Stop sx={{ mr: 1 }} /> : <PlayArrow sx={{ mr: 1 }} />}
            {selectedExam?.status === 'active' ? 'Unpublish' : 'Publish'}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDeleteDialog({ open: true, exam: selectedExam });
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, exam: null })}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete "{deleteDialog.exam?.title}"? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, exam: null })}>Cancel</Button>
            <Button onClick={handleDeleteExam} color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, exam: null, newStatus: '' })}>
          <DialogTitle>
            {statusDialog.newStatus === 'active' ? 'Publish Exam' : 'Unpublish Exam'}
          </DialogTitle>
          <DialogContent>
            Are you sure you want to {statusDialog.newStatus === 'active' ? 'publish' : 'unpublish'} "{statusDialog.exam?.title}"?
            {statusDialog.newStatus === 'active' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Publishing will make this exam available to assigned students.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog({ open: false, exam: null, newStatus: '' })}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} variant="contained">
              {statusDialog.newStatus === 'active' ? 'Publish' : 'Unpublish'}
            </Button>
          </DialogActions>
        </Dialog>

        <InstructorExamCreationDialog
          open={openDialog}
          onClose={handleDialogClose}
          onSuccess={handleDialogSuccess}
          editMode={editMode}
          examData={dialogExam}
        />

        <ExamPublishDialog
          open={publishDialog.open}
          exam={publishDialog.exam}
          onClose={() => setPublishDialog({ open: false, exam: null })}
          onPublished={() => {
            setPublishDialog({ open: false, exam: null });
            fetchExams();
          }}
        />
      </Container>
    </Layout>
  );
};

export default InstructorExams;
