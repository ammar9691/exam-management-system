/**
 * Module Exams Page
 * Create and manage module-driven exams
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Refresh,
  Visibility,
  People,
  Assessment,
  Stop,
  PictureAsPdf,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Analytics,
  Leaderboard
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import moduleExamService from '../../services/moduleExamService';
import userService from '../../services/userService';

const ModuleExams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'admin' ? '/admin' : '/instructor';
  // State
  const [exams, setExams] = useState([]);
  const [modules, setModules] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalExams, setTotalExams] = useState(0);

  // Create Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [sufficiencyData, setSufficiencyData] = useState(null);
  const [checkingQDB, setCheckingQDB] = useState(false);
  const [newExam, setNewExam] = useState({
    moduleId: '',
    examType: '',
    startAt: null,
    endAt: null
  });

  // Assign Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // View Dialog State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewExamData, setViewExamData] = useState(null);

  // Fetch modules and exam types on mount
  useEffect(() => {
    fetchModules();
    fetchExams();
  }, [page, rowsPerPage]);

  const fetchModules = async () => {
    try {
      const response = await moduleExamService.getModules();
      setModules(response.data.modules || []);
      setExamTypes(response.data.examTypes || []);
    } catch (error) {
      toast.error('Failed to load modules');
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await moduleExamService.getExams({
        page: page + 1,
        limit: rowsPerPage
      });
      setExams(response.data.exams || []);
      setTotalExams(response.data.pagination?.total || 0);
    } catch (error) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSufficiency = async () => {
    if (!newExam.moduleId || !newExam.examType) {
      toast.error('Please select module and exam type');
      return;
    }

    setCheckingQDB(true);
    setSufficiencyData(null);

    try {
      const response = await moduleExamService.checkSufficiency(
        newExam.moduleId,
        newExam.examType
      );
      setSufficiencyData(response.data);
    } catch (error) {
      toast.error('Failed to check QDB sufficiency');
    } finally {
      setCheckingQDB(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newExam.moduleId || !newExam.examType || !newExam.startAt || !newExam.endAt) {
      toast.error('Please fill all fields');
      return;
    }

    if (!sufficiencyData?.sufficient) {
      toast.error('QDB sufficiency check must pass before creating exam');
      return;
    }

    setCreateLoading(true);
    try {
      await moduleExamService.createExam({
        moduleId: newExam.moduleId,
        examType: newExam.examType,
        startAt: newExam.startAt.toISOString(),
        endAt: newExam.endAt.toISOString()
      });

      toast.success('Exam created successfully');
      setCreateDialogOpen(false);
      setNewExam({ moduleId: '', examType: '', startAt: null, endAt: null });
      setSufficiencyData(null);
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenAssignDialog = async (exam) => {
    setSelectedExam(exam);
    setSelectedStudents(exam.assignedCandidateIds?.map(c => typeof c === 'object' ? c._id : c) || []);
    setAssignDialogOpen(true);

    try {
      const response = await userService.getUsers({ role: 'student', limit: 1000 });
      setStudents(response.data.users || []);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setAssignLoading(true);
    try {
      await moduleExamService.assignCandidates(selectedExam._id, selectedStudents);
      toast.success('Students assigned successfully');
      setAssignDialogOpen(false);
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign students');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleViewExam = async (exam) => {
    try {
      const response = await moduleExamService.getExamById(exam._id);
      setViewExamData(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load exam details');
    }
  };

  const handleEndExam = async (examId) => {
    if (!window.confirm('Are you sure you want to end this exam? This will force-submit all active attempts.')) {
      return;
    }

    try {
      await moduleExamService.endExam(examId);
      toast.success('Exam ended successfully');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end exam');
    }
  };

  const handleDownloadConsolidated = async (examId) => {
    try {
      const blob = await moduleExamService.downloadConsolidatedPDF(examId);
      moduleExamService.openPDF(blob, `consolidated_results_${examId}.pdf`);
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'active': return 'success';
      case 'ended': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Schedule fontSize="small" />;
      case 'active': return <CheckCircle fontSize="small" />;
      case 'ended': return <Stop fontSize="small" />;
      default: return null;
    }
  };

  const selectedModule = modules.find(m => m.id === newExam.moduleId);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Module-Based Examinations
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchExams}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Exam
            </Button>
          </Box>
        </Box>

        {/* Exams Table */}
        <Paper sx={{ width: '100%' }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam._id} hover>
                    <TableCell>{exam.title}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {exam.moduleName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exam.examType === 'basic' ? 'Basic' : 'Type'}
                        size="small"
                        color={exam.examType === 'basic' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>{exam.blueprintTotalQuestions}</TableCell>
                    <TableCell>{exam.blueprintTotalTimeMinutes} min</TableCell>
                    <TableCell>
                      {exam.startAt ? new Date(exam.startAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(exam.examStatus)}
                        label={exam.examStatus}
                        size="small"
                        color={getStatusColor(exam.examStatus)}
                      />
                    </TableCell>
                    <TableCell>
                      {exam.assignedCandidateIds?.length || 0}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewExam(exam)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign Students">
                        <IconButton size="small" onClick={() => handleOpenAssignDialog(exam)}>
                          <People fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {exam.examStatus === 'ended' && (
                        <>
                          <Tooltip title="Consolidated Results">
                            <IconButton size="small" color="primary" onClick={() => navigate(`${basePath}/module-exams/${exam._id}/results`)}>
                              <Leaderboard fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Question Paper Analysis">
                            <IconButton size="small" color="warning" onClick={() => navigate(`${basePath}/module-exams/${exam._id}/qpa`)}>
                              <Analytics fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Results PDF">
                            <IconButton size="small" onClick={() => handleDownloadConsolidated(exam._id)}>
                              <PictureAsPdf fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {['scheduled', 'active'].includes(exam.examStatus) && (
                        <Tooltip title="End Exam">
                          <IconButton size="small" color="error" onClick={() => handleEndExam(exam._id)}>
                            <Stop fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {exams.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No exams found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalExams}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Create Exam Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Module-Based Exam</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Module"
                  value={newExam.moduleId}
                  onChange={(e) => {
                    setNewExam({ ...newExam, moduleId: e.target.value });
                    setSufficiencyData(null);
                  }}
                >
                  {modules.map((module) => (
                    <MenuItem key={module.id} value={module.id}>
                      {module.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Exam Type"
                  value={newExam.examType}
                  onChange={(e) => {
                    setNewExam({ ...newExam, examType: e.target.value });
                    setSufficiencyData(null);
                  }}
                >
                  {examTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Module Info */}
              {selectedModule && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Module Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Total Questions</Typography>
                          <Typography variant="h6">{selectedModule.totalQuestions}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Total Time</Typography>
                          <Typography variant="h6">{selectedModule.totalTimeMinutes} min</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Categories</Typography>
                          <Typography variant="h6">{selectedModule.categories?.length || 0}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* QDB Sufficiency Check */}
              {newExam.moduleId && newExam.examType && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleCheckSufficiency}
                    disabled={checkingQDB}
                    startIcon={checkingQDB ? <CircularProgress size={20} /> : <Assessment />}
                  >
                    Check QDB Sufficiency
                  </Button>

                  {sufficiencyData && (
                    <Box sx={{ mt: 2 }}>
                      <Alert
                        severity={sufficiencyData.sufficient ? 'success' : 'error'}
                        icon={sufficiencyData.sufficient ? <CheckCircle /> : <Error />}
                      >
                        <AlertTitle>
                          {sufficiencyData.sufficient ? 'Sufficient Questions Available' : 'Insufficient Questions'}
                        </AlertTitle>
                        {sufficiencyData.sufficient ? (
                          <Typography variant="body2">
                            QDB has {sufficiencyData.totalAvailable} eligible questions.
                            Required: {sufficiencyData.totalRequiredInQDB} ({sufficiencyData.multiplier}x multiplier)
                          </Typography>
                        ) : (
                          <>
                            <Typography variant="body2" gutterBottom>
                              {sufficiencyData.error}
                            </Typography>
                            {sufficiencyData.insufficientCategories?.length > 0 && (
                              <List dense>
                                {sufficiencyData.insufficientCategories.map((cat, idx) => (
                                  <ListItem key={idx} sx={{ py: 0 }}>
                                    <ListItemText
                                      primary={`${cat.category}: Need ${cat.needed}, Have ${cat.available} (Shortage: ${cat.shortage})`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </>
                        )}
                      </Alert>
                    </Box>
                  )}
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Schedule */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={newExam.startAt}
                    onChange={(value) => setNewExam({ ...newExam, startAt: value })}
                    slotProps={{ textField: { fullWidth: true } }}
                    minDateTime={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={newExam.endAt}
                    onChange={(value) => setNewExam({ ...newExam, endAt: value })}
                    slotProps={{ textField: { fullWidth: true } }}
                    minDateTime={newExam.startAt || new Date()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateExam}
              disabled={createLoading || !sufficiencyData?.sufficient}
            >
              {createLoading ? <CircularProgress size={24} /> : 'Create Exam'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Students Dialog */}
        <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Students - {selectedExam?.title}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              select
              label="Select Students"
              SelectProps={{
                multiple: true,
                value: selectedStudents,
                onChange: (e) => setSelectedStudents(e.target.value),
                renderValue: (selected) => `${selected.length} students selected`
              }}
              sx={{ mt: 2 }}
            >
              {students.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {student.name} ({student.email})
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Currently assigned: {selectedExam?.assignedCandidateIds?.length || 0} students
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAssignStudents}
              disabled={assignLoading}
            >
              {assignLoading ? <CircularProgress size={24} /> : 'Assign'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Exam Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Exam Details</DialogTitle>
          <DialogContent>
            {viewExamData && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6">{viewExamData.exam?.title}</Typography>
                  <Typography color="text.secondary">{viewExamData.exam?.moduleName}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Exam Type</Typography>
                  <Chip
                    label={viewExamData.exam?.examType === 'basic' ? 'Basic' : 'Type'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={viewExamData.exam?.examStatus}
                    size="small"
                    color={getStatusColor(viewExamData.exam?.examStatus)}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Total Questions</Typography>
                  <Typography>{viewExamData.exam?.blueprintTotalQuestions}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography>{viewExamData.exam?.blueprintTotalTimeMinutes} minutes</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Attempt Statistics</Typography>
                </Grid>

                {viewExamData.attemptStats && (
                  <>
                    <Grid item xs={4} md={2}>
                      <Typography variant="body2" color="text.secondary">Not Started</Typography>
                      <Typography>{viewExamData.attemptStats.notStarted}</Typography>
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <Typography variant="body2" color="text.secondary">In Progress</Typography>
                      <Typography>{viewExamData.attemptStats.inProgress}</Typography>
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <Typography variant="body2" color="text.secondary">Paused</Typography>
                      <Typography>{viewExamData.attemptStats.paused}</Typography>
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <Typography variant="body2" color="text.secondary">Completed</Typography>
                      <Typography color="success.main">{viewExamData.attemptStats.completed}</Typography>
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <Typography variant="body2" color="text.secondary">Timeout</Typography>
                      <Typography color="warning.main">{viewExamData.attemptStats.timeout}</Typography>
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <Typography variant="body2" color="text.secondary">Blocked</Typography>
                      <Typography color="error.main">{viewExamData.attemptStats.blockedLate}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ModuleExams;
