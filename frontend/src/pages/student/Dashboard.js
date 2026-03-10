import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Fade,
  Skeleton,
  IconButton,
  alpha,
} from '@mui/material';
import {
  Assignment,
  Grade,
  Timer,
  CheckCircle,
  PlayArrow,
  ArrowForward,
  CalendarToday,
  TrendingUp,
  EmojiEvents,
  AccessTime,
  BlockOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';
import { formatDate, formatDuration } from '../../utils/helpers.js';

const StatCard = ({ title, value, icon, gradient, delay = 0 }) => (
  <Fade in timeout={600} style={{ transitionDelay: `${delay}ms` }}>
    <Card sx={{
      height: '100%', border: 'none', borderRadius: 3, position: 'relative', overflow: 'hidden',
      background: '#fff', boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)',
      transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(10, 36, 99, 0.12)' },
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ color: '#6C757D', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              {title}
            </Typography>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '2rem', color: '#2C3E50', lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: gradient, boxShadow: `0 4px 14px ${alpha('#0A2463', 0.15)}`,
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 24, color: '#fff' } })}
          </Box>
        </Box>
      </CardContent>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: gradient }} />
    </Card>
  </Fade>
);

const ExamCard = ({ exam, onStart, status }) => {
  const isUpcoming = status === 'upcoming';
  const isExpired = status === 'expired';
  const isActive = status === 'active';

  return (
    <Card sx={{
      height: '100%', borderRadius: 3, border: '1px solid', overflow: 'hidden',
      borderColor: isActive ? alpha('#10B981', 0.3) : '#E8F1F5',
      transition: 'all 0.3s ease',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(10, 36, 99, 0.12)' },
    }}>
      {isActive && (
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
      )}
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 600, fontSize: '1rem', color: '#2C3E50', flex: 1, mr: 1 }}>
            {exam.title}
          </Typography>
          <Chip
            size="small"
            label={isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
            sx={{
              fontWeight: 600, fontSize: '0.7rem', height: 24,
              backgroundColor: isActive ? alpha('#10B981', 0.1) : isUpcoming ? alpha('#F59E0B', 0.1) : alpha('#6C757D', 0.1),
              color: isActive ? '#059669' : isUpcoming ? '#D97706' : '#6C757D',
            }}
          />
        </Box>

        <Typography sx={{ color: '#6C757D', fontSize: '0.85rem', mb: 2, lineHeight: 1.5, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {exam.description || 'No description available'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip icon={<AccessTime sx={{ fontSize: '14px !important' }} />} label={formatDuration(exam.duration)} size="small"
            sx={{ backgroundColor: alpha('#3E92CC', 0.08), color: '#3E92CC', fontWeight: 500, fontSize: '0.75rem', '& .MuiChip-icon': { color: '#3E92CC' } }} />
          <Chip label={`${exam.totalMarks} marks`} size="small"
            sx={{ backgroundColor: alpha('#0A2463', 0.06), color: '#0A2463', fontWeight: 500, fontSize: '0.75rem' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <CalendarToday sx={{ fontSize: 14, color: '#9CA3AF' }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
            {isUpcoming ? 'Starts' : 'Start'}: {formatDate(exam.startTime)}
          </Typography>
        </Box>
        {exam.endTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: '#9CA3AF' }} />
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
              End: {formatDate(exam.endTime)}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ px: 3, pb: 2.5 }}>
        <Button
          fullWidth
          variant={isActive ? 'contained' : 'outlined'}
          startIcon={isActive ? <PlayArrow /> : isExpired ? <BlockOutlined /> : <Timer />}
          onClick={() => onStart(exam._id)}
          disabled={!isActive}
          sx={{
            py: 1, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem',
            ...(isActive && {
              background: 'linear-gradient(135deg, #0A2463, #3E92CC)',
              '&:hover': { background: 'linear-gradient(135deg, #081D4F, #3585B8)' },
            }),
          }}
        >
          {isActive ? 'Start Exam' : isUpcoming ? 'Not Yet Available' : 'Expired'}
        </Button>
      </Box>
    </Card>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalExams: 0, completedExams: 0, averageScore: 0, upcomingExams: 0 });
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [activeExams, setActiveExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, upcomingData, recentData, availableExams] = await Promise.all([
        studentService.getStats(),
        studentService.getUpcomingExams(),
        studentService.getRecentResults(),
        studentService.getExams(),
      ]);
      setStats(statsData || {});
      setUpcomingExams(Array.isArray(upcomingData) ? upcomingData : []);
      setRecentResults(Array.isArray(recentData) ? recentData : []);
      setActiveExams(Array.isArray(availableExams) ? availableExams : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => navigate(`/student/exam/${examId}`);
  const getExamStatus = (exam) => {
    const now = new Date();
    if (new Date(exam.startTime) > now) return 'upcoming';
    if (new Date(exam.endTime) < now) return 'expired';
    return 'active';
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Welcome Banner */}
        <Fade in timeout={500}>
          <Box sx={{
            mb: 4, p: { xs: 3, md: 4 }, borderRadius: 4, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0A2463 0%, #1a3a7a 50%, #3E92CC 100%)',
            boxShadow: '0 8px 32px rgba(10, 36, 99, 0.2)',
          }}>
            <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <Box sx={{ position: 'absolute', right: -60, top: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <Box sx={{ position: 'absolute', right: 60, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 300, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', mb: 0.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Welcome back
              </Typography>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#fff', mb: 1 }}>
                {user?.name}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', maxWidth: 500 }}>
                Track your training progress and upcoming assessment modules
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {[
            { title: 'Total Exams', value: loading ? '-' : stats.totalExams, icon: <Assignment />, gradient: 'linear-gradient(135deg, #0A2463, #3E92CC)', delay: 0 },
            { title: 'Completed', value: loading ? '-' : stats.completedExams, icon: <CheckCircle />, gradient: 'linear-gradient(135deg, #059669, #10B981)', delay: 100 },
            { title: 'Average Score', value: loading ? '-' : `${stats.averageScore}%`, icon: <TrendingUp />, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', delay: 200 },
            { title: 'Upcoming', value: loading ? '-' : stats.upcomingExams, icon: <Timer />, gradient: 'linear-gradient(135deg, #0096C7, #00B4D8)', delay: 300 },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.title}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Active Exams */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.25rem', color: '#0A2463' }}>
                Active Training Modules
              </Typography>
              <Typography sx={{ color: '#6C757D', fontSize: '0.85rem', mt: 0.25 }}>
                Exams available for you to attempt
              </Typography>
            </Box>
          </Box>

          {loading ? (
            <Grid container spacing={2.5}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          ) : activeExams.length === 0 ? (
            <Card sx={{ borderRadius: 3, border: '1px dashed #CBD5E1', boxShadow: 'none', background: alpha('#F8FAFC', 0.5) }}>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <Assignment sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                <Typography sx={{ color: '#6C757D', fontWeight: 500 }}>No active exams available to attempt</Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {activeExams.map((exam) => (
                <Grid item xs={12} sm={6} lg={4} key={exam._id}>
                  <ExamCard exam={exam} onStart={handleStartExam} status={getExamStatus(exam)} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Upcoming Exams */}
        {upcomingExams.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.25rem', color: '#0A2463' }}>
                  Upcoming Assessments
                </Typography>
                <Typography sx={{ color: '#6C757D', fontSize: '0.85rem', mt: 0.25 }}>
                  Scheduled exams you'll be taking soon
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2.5}>
              {upcomingExams.map((exam) => (
                <Grid item xs={12} sm={6} lg={4} key={exam._id}>
                  <ExamCard exam={exam} onStart={handleStartExam} status="upcoming" />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Recent Performance */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.25rem', color: '#0A2463' }}>
                Recent Performance
              </Typography>
              <Typography sx={{ color: '#6C757D', fontSize: '0.85rem', mt: 0.25 }}>
                Your latest exam results and scores
              </Typography>
            </Box>
            {recentResults.length > 0 && (
              <Button endIcon={<ArrowForward />} onClick={() => navigate('/student/results')}
                sx={{ color: '#3E92CC', fontWeight: 600, fontSize: '0.85rem' }}>
                View All
              </Button>
            )}
          </Box>

          {loading ? (
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          ) : recentResults.length === 0 ? (
            <Card sx={{ borderRadius: 3, border: '1px dashed #CBD5E1', boxShadow: 'none', background: alpha('#F8FAFC', 0.5) }}>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                <Typography sx={{ color: '#6C757D', fontWeight: 500 }}>No exam results yet. Complete an exam to see your performance here.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
              {recentResults.map((result, index) => (
                <Box
                  key={result._id}
                  sx={{
                    px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                    borderBottom: index < recentResults.length - 1 ? '1px solid #F1F5F9' : 'none',
                    transition: 'background 0.2s', '&:hover': { background: '#FAFBFC' },
                  }}
                >
                  {/* Score circle */}
                  <Box sx={{
                    width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: result.percentage >= 75 ? alpha('#10B981', 0.1) : result.percentage >= 50 ? alpha('#F59E0B', 0.1) : alpha('#DC2626', 0.1),
                    border: '2px solid', borderColor: result.percentage >= 75 ? '#10B981' : result.percentage >= 50 ? '#F59E0B' : '#DC2626',
                  }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: result.percentage >= 75 ? '#059669' : result.percentage >= 50 ? '#D97706' : '#DC2626' }}>
                      {result.percentage}%
                    </Typography>
                  </Box>

                  {/* Exam info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#2C3E50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.exam?.title || 'Exam'}
                    </Typography>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                      Submitted {formatDate(result.submittedAt)}
                    </Typography>
                  </Box>

                  {/* Progress bar */}
                  <Box sx={{ width: 120, display: { xs: 'none', sm: 'block' } }}>
                    <LinearProgress
                      variant="determinate"
                      value={result.percentage}
                      sx={{
                        height: 6, borderRadius: 3, backgroundColor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: result.percentage >= 75 ? 'linear-gradient(90deg, #10B981, #34D399)' : result.percentage >= 50 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #DC2626, #EF4444)',
                        },
                      }}
                    />
                  </Box>

                  {/* Status chip */}
                  <Chip
                    label={result.status === 'pass' ? 'PASSED' : 'FAILED'}
                    size="small"
                    sx={{
                      fontWeight: 700, fontSize: '0.7rem', height: 26, letterSpacing: '0.03em',
                      backgroundColor: result.status === 'pass' ? alpha('#10B981', 0.1) : alpha('#DC2626', 0.1),
                      color: result.status === 'pass' ? '#059669' : '#DC2626',
                    }}
                  />

                  <IconButton size="small" onClick={() => navigate(`/student/results/${result._id}`)}
                    sx={{ color: '#3E92CC', '&:hover': { backgroundColor: alpha('#3E92CC', 0.08) } }}>
                    <ArrowForward fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Card>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default StudentDashboard;
