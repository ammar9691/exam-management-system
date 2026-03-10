import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  Timer,
  Assignment,
  PlayArrow,
  CheckCircle,
  Schedule,
  Info,
  Warning,
  AccessTime,
  CalendarToday,
  BlockOutlined,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';
import { toast } from 'react-toastify';

const ExamCard = ({ exam, onStart }) => {
  const statusColor = {
    Active: '#10B981', Upcoming: '#F59E0B', Completed: '#3E92CC', Expired: '#6C757D', Inactive: '#6C757D',
  };
  const statusText = getStatusText(exam);
  const canStart = canStartExam(exam);
  const color = statusColor[statusText] || '#6C757D';

  return (
    <Card sx={{
      height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3,
      border: '1px solid', borderColor: canStart ? alpha('#10B981', 0.3) : '#E8F1F5',
      boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)',
      transition: 'all 0.3s ease',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(10, 36, 99, 0.12)' },
    }}>
      {canStart && <Box sx={{ height: 3, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />}
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 600, fontSize: '1rem', color: '#2C3E50', flex: 1, mr: 1 }}>
            {exam.title}
          </Typography>
          <Chip size="small" label={statusText} sx={{
            fontWeight: 600, fontSize: '0.7rem', height: 24,
            backgroundColor: alpha(color, 0.1), color: color,
          }} />
        </Box>

        <Typography sx={{ color: '#6C757D', fontSize: '0.85rem', mb: 2, lineHeight: 1.5, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {exam.description || 'No description available'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {exam.duration && (
            <Chip icon={<AccessTime sx={{ fontSize: '14px !important' }} />} label={`${exam.duration} min`} size="small"
              sx={{ backgroundColor: alpha('#3E92CC', 0.08), color: '#3E92CC', fontWeight: 500, fontSize: '0.75rem', '& .MuiChip-icon': { color: '#3E92CC' } }} />
          )}
          <Chip label={`${exam.totalMarks} marks`} size="small"
            sx={{ backgroundColor: alpha('#0A2463', 0.06), color: '#0A2463', fontWeight: 500, fontSize: '0.75rem' }} />
          {exam.questions?.length > 0 && (
            <Chip label={`${exam.questions.length} Q`} size="small"
              sx={{ backgroundColor: alpha('#F59E0B', 0.08), color: '#D97706', fontWeight: 500, fontSize: '0.75rem' }} />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: '#9CA3AF' }} />
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
              Start: {new Date(exam.startTime).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: '#9CA3AF' }} />
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
              End: {new Date(exam.endTime).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {statusText === 'Upcoming' && (
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: alpha('#3E92CC', 0.06) }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#3E92CC', fontWeight: 500 }}>
              Starts in: {getTimeRemaining(exam.startTime)}
            </Typography>
          </Box>
        )}

        {exam.userAttempted && exam.userScore !== undefined && (
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: alpha('#10B981', 0.06) }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
              Your Score: {exam.userScore}/{exam.totalMarks} ({Math.round((exam.userScore / (exam.totalMarks || 1)) * 100)}%)
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ px: 3, pb: 2.5 }}>
        {canStart ? (
          <Button fullWidth variant="contained" startIcon={<PlayArrow />} onClick={() => onStart(exam)}
            sx={{ py: 1, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem', background: 'linear-gradient(135deg, #0A2463, #3E92CC)', '&:hover': { background: 'linear-gradient(135deg, #081D4F, #3585B8)' } }}>
            Start Exam
          </Button>
        ) : (
          <Button fullWidth variant="outlined" disabled startIcon={
            exam.userAttempted ? <CheckCircle /> : statusText === 'Upcoming' ? <Timer /> : <BlockOutlined />
          } sx={{ py: 1, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem' }}>
            {exam.userAttempted ? 'Completed' : statusText === 'Upcoming' ? 'Not Yet Available' : 'Unavailable'}
          </Button>
        )}
      </Box>
    </Card>
  );
};

function getStatusText(exam) {
  const now = new Date();
  const startTime = exam.startTime ? new Date(exam.startTime) : null;
  const endTime = exam.endTime ? new Date(exam.endTime) : null;
  if (exam.userAttempted) return 'Completed';
  if (startTime && endTime && now >= startTime && now <= endTime && exam.status === 'active') return 'Active';
  if (startTime && now < startTime) return 'Upcoming';
  if (endTime && now > endTime) return 'Expired';
  return 'Inactive';
}

function canStartExam(exam) {
  const now = new Date();
  const startTime = exam.startTime ? new Date(exam.startTime) : null;
  const endTime = exam.endTime ? new Date(exam.endTime) : null;
  return !exam.userAttempted && startTime && endTime && now >= startTime && now <= endTime && exam.status === 'active';
}

function getTimeRemaining(startTime) {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return 'Started';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const EmptyState = ({ icon: Icon, title, desc }) => (
  <Card sx={{ borderRadius: 3, border: '1px dashed #CBD5E1', boxShadow: 'none', background: alpha('#F8FAFC', 0.5) }}>
    <CardContent sx={{ py: 6, textAlign: 'center' }}>
      <Icon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
      <Typography sx={{ fontWeight: 600, color: '#6C757D', mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: '0.85rem', color: '#9CA3AF' }}>{desc}</Typography>
    </CardContent>
  </Card>
);

const StudentExams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [exams, setExams] = useState({ upcoming: [], active: [], completed: [] });
  const [selectedExam, setSelectedExam] = useState(null);
  const [instructionsDialog, setInstructionsDialog] = useState(false);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [availableExamsRaw, upcomingExamsRaw, historyRaw] = await Promise.all([
        studentService.getExams(),
        studentService.getUpcomingExams(),
        studentService.getExamHistory({ page: 1, limit: 1000 }),
      ]);

      const availableExams = Array.isArray(availableExamsRaw) ? availableExamsRaw : [];
      const upcomingExams = Array.isArray(upcomingExamsRaw) ? upcomingExamsRaw : [];
      const historyData = Array.isArray(historyRaw.data) ? historyRaw.data : (Array.isArray(historyRaw) ? historyRaw : []);

      const validResultStatuses = ['completed', 'submitted', 'auto-submitted'];
      const finishedHistory = historyData.filter(h => h && h.status && validResultStatuses.includes(h.status));

      const historyByExam = new Map();
      finishedHistory.forEach(h => {
        const examId = h.exam?._id || h.exam;
        if (examId) historyByExam.set(String(examId), h);
      });

      const now = new Date();
      const categorized = { upcoming: [], active: [], completed: [] };

      availableExams.forEach(exam => {
        const examId = String(exam._id);
        const startTime = exam.startTime ? new Date(exam.startTime) : null;
        const endTime = exam.endTime ? new Date(exam.endTime) : null;
        const inWindow = startTime && endTime && now >= startTime && now <= endTime;
        if (inWindow && exam.status === 'active' && !historyByExam.has(examId)) {
          categorized.active.push({ ...exam, userAttempted: false });
        }
      });

      upcomingExams.forEach(exam => {
        const examId = String(exam._id);
        categorized.upcoming.push({ ...exam, status: 'upcoming', userAttempted: historyByExam.has(examId) });
      });

      finishedHistory.forEach(h => {
        if (!h.exam) return;
        categorized.completed.push({
          _id: h.exam._id || h.exam, title: h.exam.title, description: '',
          subject: h.exam.subject, duration: null, totalMarks: h.exam.totalMarks || h.totalMarks,
          startTime: h.submittedAt, endTime: h.submittedAt, instructions: '',
          status: h.status || 'completed', userAttempted: true,
          userScore: h.marksObtained, percentage: h.percentage, questions: [],
        });
      });

      setExams(categorized);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Error fetching exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam) => {
    if (exam.instructions) {
      setSelectedExam(exam);
      setInstructionsDialog(true);
    } else {
      navigate(`/student/exam/${exam._id}`);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>{value === index && <Box sx={{ py: 3 }}>{children}</Box>}</div>
  );

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.75rem', color: '#0A2463', mb: 0.5 }}>
              My Exams
            </Typography>
            <Typography sx={{ color: '#6C757D', fontSize: '0.95rem' }}>
              View and take your assigned examinations
            </Typography>
          </Box>
        </Fade>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#E8F1F5', mb: 1 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}
            sx={{
              '& .MuiTab-root': { fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', minHeight: 48 },
              '& .Mui-selected': { color: '#0A2463' },
              '& .MuiTabs-indicator': { backgroundColor: '#3E92CC', height: 3, borderRadius: '3px 3px 0 0' },
            }}>
            <Tab label={`Active (${exams.active.length})`} />
            <Tab label={`Upcoming (${exams.upcoming.length})`} />
            <Tab label={`Completed (${exams.completed.length})`} />
          </Tabs>
        </Box>

        {loading ? (
          <Grid container spacing={2.5} sx={{ py: 3 }}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {exams.active.length === 0 ? (
                <EmptyState icon={Warning} title="No Active Exams" desc="There are no exams currently available to take." />
              ) : (
                <Grid container spacing={2.5}>{exams.active.map(e => <Grid item xs={12} sm={6} lg={4} key={e._id}><ExamCard exam={e} onStart={handleStartExam} /></Grid>)}</Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {exams.upcoming.length === 0 ? (
                <EmptyState icon={Schedule} title="No Upcoming Exams" desc="No exams are scheduled for the future." />
              ) : (
                <Grid container spacing={2.5}>{exams.upcoming.map(e => <Grid item xs={12} sm={6} lg={4} key={e._id}><ExamCard exam={e} onStart={handleStartExam} /></Grid>)}</Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {exams.completed.length === 0 ? (
                <EmptyState icon={EmojiEvents} title="No Completed Exams" desc="You haven't completed any exams yet." />
              ) : (
                <Grid container spacing={2.5}>{exams.completed.map(e => <Grid item xs={12} sm={6} lg={4} key={e._id}><ExamCard exam={e} onStart={handleStartExam} /></Grid>)}</Grid>
              )}
            </TabPanel>
          </>
        )}

        {/* Instructions Dialog */}
        <Dialog open={instructionsDialog} onClose={() => { setInstructionsDialog(false); setSelectedExam(null); }} maxWidth="md" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: "'Montserrat'", fontWeight: 700, color: '#0A2463' }}>
            <Info sx={{ color: '#3E92CC' }} /> Exam Instructions
          </DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 600, fontSize: '1.1rem', color: '#2C3E50', mb: 2 }}>
              {selectedExam?.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              {selectedExam?.duration && (
                <Chip icon={<Timer />} label={`${selectedExam.duration} minutes`} sx={{ backgroundColor: alpha('#3E92CC', 0.08), color: '#3E92CC' }} />
              )}
              <Chip label={`${selectedExam?.totalMarks} marks`} sx={{ backgroundColor: alpha('#0A2463', 0.06), color: '#0A2463' }} />
            </Box>

            <Typography sx={{ fontWeight: 600, color: '#2C3E50', mb: 1.5 }}>General Instructions:</Typography>
            <List dense>
              {[
                { icon: <Warning fontSize="small" sx={{ color: '#F59E0B' }} />, text: 'Once started, the exam cannot be paused or restarted.' },
                { icon: <Timer fontSize="small" sx={{ color: '#3E92CC' }} />, text: 'The exam will automatically submit when time expires.' },
                { icon: <CheckCircle fontSize="small" sx={{ color: '#10B981' }} />, text: 'Make sure you have a stable internet connection.' },
                { icon: <Info fontSize="small" sx={{ color: '#6C757D' }} />, text: 'You can navigate between questions using Next/Previous buttons.' },
              ].map((item, i) => (
                <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', color: '#2C3E50' }} />
                </ListItem>
              ))}
            </List>

            {selectedExam?.instructions && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: '#F8FAFC', border: '1px solid #E8F1F5' }}>
                <Typography sx={{ fontWeight: 600, color: '#2C3E50', mb: 1, fontSize: '0.9rem' }}>Specific Instructions:</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#6C757D', whiteSpace: 'pre-wrap' }}>{selectedExam.instructions}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => { setInstructionsDialog(false); setSelectedExam(null); }} sx={{ color: '#6C757D' }}>Cancel</Button>
            <Button variant="contained" startIcon={<PlayArrow />}
              onClick={() => { setInstructionsDialog(false); navigate(`/student/exam/${selectedExam._id}`); setSelectedExam(null); }}
              sx={{ background: 'linear-gradient(135deg, #0A2463, #3E92CC)', '&:hover': { background: 'linear-gradient(135deg, #081D4F, #3585B8)' } }}>
              Start Exam
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default StudentExams;
