import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Timer,
  Assignment,
  PlayArrow,
  CheckCircle,
  Schedule,
  Info,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';
import { toast } from 'react-toastify';

const StudentExams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [exams, setExams] = useState({
    upcoming: [],
    active: [],
    completed: []
  });
  const [selectedExam, setSelectedExam] = useState(null);
  const [instructionsDialog, setInstructionsDialog] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await studentService.getExams();
      
      // Categorize exams based on their status and timing
      const now = new Date();
      const categorized = {
        upcoming: [],
        active: [],
        completed: []
      };

      response.data.forEach(exam => {
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);
        
        if (exam.status === 'completed' || exam.userAttempted) {
          categorized.completed.push(exam);
        } else if (now >= startTime && now <= endTime && exam.status === 'active') {
          categorized.active.push(exam);
        } else if (now < startTime) {
          categorized.upcoming.push(exam);
        } else {
          categorized.completed.push(exam);
        }
      });

      setExams(categorized);
    } catch (error) {
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

  const handleProceedToExam = () => {
    setInstructionsDialog(false);
    navigate(`/student/exam/${selectedExam._id}`);
    setSelectedExam(null);
  };

  const handleCloseInstructions = () => {
    setInstructionsDialog(false);
    setSelectedExam(null);
  };

  const getTimeRemaining = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (exam.userAttempted) return 'success';
    if (now >= startTime && now <= endTime && exam.status === 'active') return 'warning';
    if (now < startTime) return 'info';
    return 'default';
  };

  const getStatusText = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (exam.userAttempted) return 'Completed';
    if (now >= startTime && now <= endTime && exam.status === 'active') return 'Active';
    if (now < startTime) return 'Upcoming';
    if (now > endTime) return 'Expired';
    return 'Inactive';
  };

  const canStartExam = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    return !exam.userAttempted && 
           now >= startTime && 
           now <= endTime && 
           exam.status === 'active';
  };

  const renderExamCard = (exam) => {
    const statusColor = getStatusColor(exam);
    const statusText = getStatusText(exam);
    const canStart = canStartExam(exam);
    
    return (
      <Grid item xs={12} md={6} lg={4} key={exam._id}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                {exam.title}
              </Typography>
              <Chip 
                label={statusText} 
                color={statusColor} 
                size="small" 
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {exam.description || 'No description available'}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timer sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Duration: {exam.duration} minutes
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Questions: {exam.questions?.length || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Marks: {exam.totalMarks}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <Schedule sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                Start: {new Date(exam.startTime).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Schedule sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                End: {new Date(exam.endTime).toLocaleString()}
              </Typography>
            </Box>
            
            {statusText === 'Upcoming' && (
              <Box sx={{ p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main">
                  Starts in: {getTimeRemaining(exam.startTime)}
                </Typography>
              </Box>
            )}
            
            {exam.userAttempted && exam.userScore !== undefined && (
              <Box sx={{ p: 1, bgcolor: 'success.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="success.main">
                  Your Score: {exam.userScore}/{exam.totalMarks} ({Math.round((exam.userScore/exam.totalMarks)*100)}%)
                </Typography>
              </Box>
            )}
          </CardContent>
          
          <CardActions>
            {canStart ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => handleStartExam(exam)}
                fullWidth
              >
                Start Exam
              </Button>
            ) : exam.userAttempted ? (
              <Button
                size="small"
                variant="outlined"
                disabled
                fullWidth
              >
                Completed
              </Button>
            ) : statusText === 'Upcoming' ? (
              <Button
                size="small"
                variant="outlined"
                disabled
                fullWidth
              >
                Not Yet Started
              </Button>
            ) : (
              <Button
                size="small"
                variant="outlined"
                disabled
                fullWidth
              >
                Unavailable
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Exams
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and take your assigned examinations
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Active (${exams.active.length})`} />
            <Tab label={`Upcoming (${exams.upcoming.length})`} />
            <Tab label={`Completed (${exams.completed.length})`} />
          </Tabs>
        </Box>

        {/* Active Exams Tab */}
        <TabPanel value={tabValue} index={0}>
          {exams.active.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Warning sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Active Exams
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There are no exams currently available to take.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {exams.active.map(renderExamCard)}
            </Grid>
          )}
        </TabPanel>

        {/* Upcoming Exams Tab */}
        <TabPanel value={tabValue} index={1}>
          {exams.upcoming.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Upcoming Exams
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No exams are scheduled for the future.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {exams.upcoming.map(renderExamCard)}
            </Grid>
          )}
        </TabPanel>

        {/* Completed Exams Tab */}
        <TabPanel value={tabValue} index={2}>
          {exams.completed.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Completed Exams
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven't completed any exams yet.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {exams.completed.map(renderExamCard)}
            </Grid>
          )}
        </TabPanel>

        {/* Instructions Dialog */}
        <Dialog
          open={instructionsDialog}
          onClose={handleCloseInstructions}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Info sx={{ mr: 1 }} />
              Exam Instructions
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="h6" gutterBottom>
              {selectedExam?.title}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Duration:</strong> {selectedExam?.duration} minutes
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Total Questions:</strong> {selectedExam?.questions?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Total Marks:</strong> {selectedExam?.totalMarks}
              </Typography>
            </Box>
            
            <Typography variant="h6" gutterBottom>
              General Instructions:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Warning fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Once started, the exam cannot be paused or restarted." />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Timer fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="The exam will automatically submit when time expires." />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Make sure you have a stable internet connection." />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Info fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="You can navigate between questions using Next/Previous buttons." />
              </ListItem>
            </List>
            
            {selectedExam?.instructions && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Specific Instructions:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedExam.instructions}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseInstructions}>
              Cancel
            </Button>
            <Button
              onClick={handleProceedToExam}
              variant="contained"
              color="primary"
            >
              Start Exam
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default StudentExams;