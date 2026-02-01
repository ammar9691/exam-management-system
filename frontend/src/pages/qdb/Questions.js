import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Add,
  Upload,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility,
  FilterList,
  Refresh,
  History
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import QuestionForm from '../../components/qdb/QuestionForm';
import BulkImport from '../../components/qdb/BulkImport';
import { useAuth } from '../../context/AuthContext';
import questionService from '../../services/questionService';
import {
  getModuleOptions,
  getCategoriesForModule,
  getModuleName,
  DIFFICULTY_LEVELS,
  KNOWLEDGE_LEVELS,
  STATUS_COLORS,
  canApproveQuestions,
  canSeeInternalReference
} from '../../config/qdbModules';
import { toast } from 'react-toastify';

const QDBQuestions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    module: '',
    category: '',
    difficulty: '',
    knowledgeLevel: '',
    status: '',
    search: ''
  });
  const [categories, setCategories] = useState([]);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [viewQuestion, setViewQuestion] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, questionId: null });
  const [rejectReason, setRejectReason] = useState('');

  // Tabs (for admin/exam_manager)
  const [activeTab, setActiveTab] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const modules = getModuleOptions();
  const canApprove = canApproveQuestions(user?.role);
  const showInternalRef = canSeeInternalReference(user?.role);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      };

      // If on pending tab, filter by pending status
      if (activeTab === 1) {
        params.status = 'pending';
      }

      const response = await questionService.getAllQuestions(params);
      const data = response.data;

      setQuestions(data.data || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, activeTab]);

  const fetchPendingCount = useCallback(async () => {
    if (!canApprove) return;
    try {
      const response = await questionService.getPendingQuestions();
      setPendingCount(response.data.data?.count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  }, [canApprove]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const handleModuleFilterChange = (e) => {
    const moduleId = e.target.value;
    setFilters(prev => ({
      ...prev,
      module: moduleId,
      category: ''
    }));
    setCategories(moduleId ? getCategoriesForModule(moduleId) : []);
    setPage(0);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      module: '',
      category: '',
      difficulty: '',
      knowledgeLevel: '',
      status: '',
      search: ''
    });
    setCategories([]);
    setPage(0);
  };

  const handleOpenForm = (question = null) => {
    setEditQuestion(question);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditQuestion(null);
  };

  const handleSubmitForm = async (data) => {
    try {
      setSaving(true);
      if (editQuestion) {
        await questionService.updateQuestion(editQuestion._id, data);
        toast.success('Question updated successfully');
      } else {
        const response = await questionService.createQuestion(data);
        const result = response.data.data || response.data;
        toast.success(`Question created (${result.serialNo}) - Status: ${result.status}`);
      }
      handleCloseForm();
      fetchQuestions();
      fetchPendingCount();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive this question?')) return;

    try {
      await questionService.deleteQuestion(id);
      toast.success('Question archived');
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const handleApprove = async (id) => {
    try {
      await questionService.approveQuestion(id);
      toast.success('Question approved');
      fetchQuestions();
      fetchPendingCount();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve question');
    }
  };

  const handleOpenReject = (id) => {
    setRejectDialog({ open: true, questionId: id });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await questionService.rejectQuestion(rejectDialog.questionId, rejectReason);
      toast.success('Question rejected');
      setRejectDialog({ open: false, questionId: null });
      setRejectReason('');
      fetchQuestions();
      fetchPendingCount();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject question');
    }
  };

  const handleImportSuccess = () => {
    fetchQuestions();
    fetchPendingCount();
    setImportOpen(false);
  };

  const getStatusChip = (status) => {
    const colors = {
      draft: 'default',
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      archived: 'default'
    };
    return <Chip label={status} size="small" color={colors[status] || 'default'} />;
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Question Database</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => fetchQuestions()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setImportOpen(true)}
            >
              Bulk Import
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenForm()}
            >
              Add Question
            </Button>
          </Box>
        </Box>

        {/* Tabs for Admin/Exam Manager */}
        {canApprove && (
          <Paper sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, v) => { setActiveTab(v); setPage(0); }}>
              <Tab label="All Questions" />
              <Tab
                label={
                  <Badge badgeContent={pendingCount} color="warning">
                    Pending Approval
                  </Badge>
                }
              />
            </Tabs>
          </Paper>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Module"
                name="module"
                value={filters.module}
                onChange={handleModuleFilterChange}
              >
                <MenuItem value="">All Modules</MenuItem>
                {modules.map(m => (
                  <MenuItem key={m.id} value={m.id}>{m.shortName}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                disabled={!filters.module}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Difficulty"
                name="difficulty"
                value={filters.difficulty}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                {DIFFICULTY_LEVELS.map(d => (
                  <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Knowledge Level"
                name="knowledgeLevel"
                value={filters.knowledgeLevel}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                {KNOWLEDGE_LEVELS.map(k => (
                  <MenuItem key={k.value} value={k.value}>{k.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {activeTab === 0 && (
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={2}>
              <Button
                variant="text"
                onClick={handleClearFilters}
                startIcon={<FilterList />}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Questions Table */}
        <TableContainer component={Paper}>
          {loading && <CircularProgress sx={{ m: 2 }} />}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Serial No</TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      No questions found. Click "Add Question" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {questions.map((q) => (
                <TableRow key={q._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {q.serialNo}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Tooltip title={q.question}>
                      <Typography variant="body2" noWrap>
                        {q.question}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {q.module?.replace('MODULE_', 'M')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{q.category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={q.type === 'mcq' ? 'MCQ' : 'T/F'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={q.difficulty}
                      size="small"
                      color={q.difficulty === 'hard' ? 'error' : q.difficulty === 'medium' ? 'warning' : 'success'}
                    />
                  </TableCell>
                  <TableCell>L{q.knowledgeLevel}</TableCell>
                  <TableCell>{getStatusChip(q.status)}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {q.createdBy?.name || q.originatorInstructorName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => setViewQuestion(q)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenForm(q)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canApprove && q.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(q._id)}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenReject(q._id)}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(q._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>

        {/* Question Form Dialog */}
        <QuestionForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          editQuestion={editQuestion}
          loading={saving}
        />

        {/* Bulk Import Dialog */}
        <BulkImport
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onSuccess={handleImportSuccess}
        />

        {/* View Question Dialog */}
        <Dialog open={!!viewQuestion} onClose={() => setViewQuestion(null)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Question Details</Typography>
              {viewQuestion?.serialNo && (
                <Chip label={viewQuestion.serialNo} color="primary" />
              )}
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {viewQuestion && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Question</Typography>
                  <Typography>{viewQuestion.question}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Module</Typography>
                  <Typography variant="body2">{getModuleName(viewQuestion.module)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body2">{viewQuestion.category}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Difficulty</Typography>
                  <Typography variant="body2">{viewQuestion.difficulty}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Knowledge Level</Typography>
                  <Typography variant="body2">Level {viewQuestion.knowledgeLevel}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Options</Typography>
                  {viewQuestion.options?.map((opt, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={String.fromCharCode(65 + idx)}
                        size="small"
                        color={opt.isCorrect ? 'success' : 'default'}
                      />
                      <Typography variant="body2">{opt.text}</Typography>
                      {opt.isCorrect && <CheckCircle color="success" fontSize="small" />}
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Syllabus Reference</Typography>
                  <Typography variant="body2">{viewQuestion.syllabusReference}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Answer Reference</Typography>
                  <Typography variant="body2">{viewQuestion.answerReference}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Originator</Typography>
                  <Typography variant="body2">{viewQuestion.originatorInstructorName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  {getStatusChip(viewQuestion.status)}
                </Grid>
                {showInternalRef && viewQuestion.internalReference && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={false}>
                      <Typography variant="subtitle2">Internal Reference</Typography>
                      <Typography variant="body2">{viewQuestion.internalReference}</Typography>
                    </Alert>
                  </Grid>
                )}
                {viewQuestion.reviewedByName && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Reviewed By</Typography>
                    <Typography variant="body2">
                      {viewQuestion.reviewedByName} on {new Date(viewQuestion.reviewedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {viewQuestion.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2">Rejection Reason</Typography>
                      <Typography variant="body2">{viewQuestion.rejectionReason}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewQuestion(null)}>Close</Button>
            <Button variant="outlined" onClick={() => { setViewQuestion(null); handleOpenForm(viewQuestion); }}>
              Edit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, questionId: null })}>
          <DialogTitle>Reject Question</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please provide a reason for rejecting this question:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialog({ open: false, questionId: null })}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default QDBQuestions;
