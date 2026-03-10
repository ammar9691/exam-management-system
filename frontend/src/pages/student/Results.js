import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  CheckCircle,
  Cancel,
  Grade,
  Schedule,
  EmojiEvents,
  ArrowForward,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import Layout from '../../components/layout/Layout.js';
import studentService from '../../services/studentService.js';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, gradient, delay = 0 }) => (
  <Fade in timeout={600} style={{ transitionDelay: `${delay}ms` }}>
    <Card sx={{
      height: '100%', border: 'none', borderRadius: 3, position: 'relative', overflow: 'hidden',
      background: '#fff', boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)',
      transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(10, 36, 99, 0.12)' },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: gradient, boxShadow: `0 4px 12px ${alpha('#0A2463', 0.12)}`,
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 22, color: '#fff' } })}
          </Box>
          <Box>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.5rem', color: '#2C3E50', lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography sx={{ color: '#6C757D', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: gradient }} />
    </Card>
  </Fade>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ p: 1.5, background: '#fff', borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E8F1F5' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#2C3E50', mb: 0.5 }}>{label}</Typography>
        {payload.map((entry, i) => (
          <Typography key={i} sx={{ color: entry.color, fontSize: '0.75rem' }}>
            {entry.name}: {entry.value}%
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const StudentResults = () => {
  const [loading, setLoading] = useState(false); // eslint-disable-line no-unused-vars
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [stats, setStats] = useState({ totalExams: 0, averageScore: 0, highestScore: 0, passedExams: 0, failedExams: 0 });

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await studentService.getResults();
      const resultsArray = Array.isArray(data) ? data : [];
      setResults(resultsArray);
      calculateStats(resultsArray);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Error fetching results');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (resultsData) => {
    const totalExams = resultsData.length;
    const scores = resultsData.map(r => (r.marksObtained / (r.totalMarks || 1)) * 100);
    const averageScore = totalExams > 0 ? scores.reduce((a, b) => a + b, 0) / totalExams : 0;
    const highestScore = totalExams > 0 ? Math.max(...scores) : 0;
    const passedExams = resultsData.filter(r => ((r.marksObtained / (r.totalMarks || 1)) * 100) >= 50).length;
    setStats({ totalExams, averageScore: Math.round(averageScore * 10) / 10, highestScore: Math.round(highestScore * 10) / 10, passedExams, failedExams: totalExams - passedExams });
  };

  const handleViewDetails = async (row) => {
    try {
      setLoading(true);
      const detailed = await studentService.getResultDetails(row._id);
      setSelectedResult(detailed);
      setDetailDialog(true);
    } catch (error) {
      console.error('Error loading result details:', error);
      toast.error('Failed to load result details');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (p) => p >= 90 ? '#10B981' : p >= 70 ? '#3E92CC' : p >= 50 ? '#F59E0B' : '#DC2626';
  const getGradeLetter = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 50 ? 'C' : 'F';

  const performanceData = results.map((result, index) => ({
    name: result.exam?.title?.substring(0, 12) || `Exam ${index + 1}`,
    score: Math.round((result.marksObtained / (result.totalMarks || 1)) * 100),
  }));

  const gradeDistribution = [
    { name: 'A+ (90-100)', value: results.filter(r => (r.marksObtained/(r.totalMarks || 1))*100 >= 90).length, color: '#10B981' },
    { name: 'A (80-89)', value: results.filter(r => { const p = (r.marksObtained/(r.totalMarks || 1))*100; return p >= 80 && p < 90; }).length, color: '#34D399' },
    { name: 'B+ (70-79)', value: results.filter(r => { const p = (r.marksObtained/(r.totalMarks || 1))*100; return p >= 70 && p < 80; }).length, color: '#3E92CC' },
    { name: 'B (60-69)', value: results.filter(r => { const p = (r.marksObtained/(r.totalMarks || 1))*100; return p >= 60 && p < 70; }).length, color: '#F59E0B' },
    { name: 'C (50-59)', value: results.filter(r => { const p = (r.marksObtained/(r.totalMarks || 1))*100; return p >= 50 && p < 60; }).length, color: '#FB923C' },
    { name: 'F (0-49)', value: results.filter(r => (r.marksObtained/(r.totalMarks || 1))*100 < 50).length, color: '#DC2626' },
  ].filter(item => item.value > 0);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.75rem', color: '#0A2463', mb: 0.5 }}>
              My Results
            </Typography>
            <Typography sx={{ color: '#6C757D', fontSize: '0.95rem' }}>
              View your exam results and performance analytics
            </Typography>
          </Box>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { title: 'Total Exams', value: stats.totalExams, icon: <Assessment />, gradient: 'linear-gradient(135deg, #0A2463, #3E92CC)', delay: 0 },
            { title: 'Average', value: `${stats.averageScore}%`, icon: <TrendingUp />, gradient: 'linear-gradient(135deg, #0096C7, #00B4D8)', delay: 50 },
            { title: 'Highest', value: `${stats.highestScore}%`, icon: <EmojiEvents />, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', delay: 100 },
            { title: 'Passed', value: stats.passedExams, icon: <CheckCircle />, gradient: 'linear-gradient(135deg, #059669, #10B981)', delay: 150 },
            { title: 'Failed', value: stats.failedExams, icon: <Cancel />, gradient: 'linear-gradient(135deg, #B91C1C, #DC2626)', delay: 200 },
          ].map((stat) => (
            <Grid item xs={6} sm={4} md={2.4} key={stat.title}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        {performanceData.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Fade in timeout={600} style={{ transitionDelay: '200ms' }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 2 }}>
                      Performance Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6C757D' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6C757D' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="score" stroke="#3E92CC" strokeWidth={2.5} dot={{ fill: '#3E92CC', r: 4 }} name="Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {gradeDistribution.length > 0 && (
              <Grid item xs={12} md={4}>
                <Fade in timeout={600} style={{ transitionDelay: '300ms' }}>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 2 }}>
                        Grade Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}
                            label={({ name, value }) => `${value}`}>
                            {gradeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                        {gradeDistribution.map(item => (
                          <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                            <Typography sx={{ fontSize: '0.65rem', color: '#6C757D' }}>{item.name}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            )}
          </Grid>
        )}

        {/* Results Table */}
        <Fade in timeout={600} style={{ transitionDelay: '400ms' }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
              <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463' }}>
                Detailed Results
              </Typography>
            </Box>
            {results.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
                <Typography sx={{ fontWeight: 600, color: '#6C757D', mb: 0.5 }}>No Results Yet</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Complete exams to see your results here.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Percentage</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => {
                      const percentage = Math.round((result.marksObtained / (result.totalMarks || 1)) * 100);
                      const grade = getGradeLetter(percentage);
                      const color = getGradeColor(percentage);
                      const passed = percentage >= 50;

                      return (
                        <TableRow key={result._id} sx={{ '&:hover': { backgroundColor: '#FAFBFC' } }}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#2C3E50' }}>
                              {result.exam?.title || 'Unknown Exam'}
                            </Typography>
                            {result.exam?.subject && (
                              <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{result.exam.subject}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                              {result.marksObtained}/{result.totalMarks}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                              <LinearProgress variant="determinate" value={percentage}
                                sx={{
                                  flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F1F5F9',
                                  '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: color },
                                }} />
                              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color, minWidth: 36 }}>{percentage}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={grade} size="small" sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: alpha(color, 0.1), color }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={passed ? 'Passed' : 'Failed'} size="small"
                              sx={{ fontWeight: 600, fontSize: '0.7rem', backgroundColor: alpha(passed ? '#10B981' : '#DC2626', 0.1), color: passed ? '#059669' : '#DC2626' }} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.8rem', color: '#6C757D' }}>
                              {new Date(result.submittedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleViewDetails(result)}
                              sx={{ color: '#3E92CC', '&:hover': { backgroundColor: alpha('#3E92CC', 0.08) } }}>
                              <ArrowForward fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Fade>

        {/* Result Detail Dialog */}
        <Dialog open={detailDialog} onClose={() => { setDetailDialog(false); setSelectedResult(null); }} maxWidth="lg" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: "'Montserrat'", fontWeight: 700, color: '#0A2463' }}>
            <Assessment sx={{ color: '#3E92CC' }} /> Exam Result Details
          </DialogTitle>
          <DialogContent dividers>
            {selectedResult && (() => {
              const pct = Math.round((selectedResult.marksObtained / (selectedResult.totalMarks || 1)) * 100);
              const color = getGradeColor(pct);
              return (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 600, fontSize: '1.15rem', color: '#2C3E50' }}>
                      {selectedResult.exam?.title || 'Unknown Exam'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2.5, borderRadius: 2, backgroundColor: '#F8FAFC', border: '1px solid #E8F1F5' }}>
                      <Typography sx={{ fontWeight: 600, color: '#0A2463', mb: 2, fontSize: '0.9rem' }}>Score Summary</Typography>
                      <List dense disablePadding>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}><Grade fontSize="small" sx={{ color: '#3E92CC' }} /></ListItemIcon>
                          <ListItemText primary={`Score: ${selectedResult.marksObtained}/${selectedResult.totalMarks}`} secondary={`${pct}%`}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}><Assessment fontSize="small" sx={{ color: '#3E92CC' }} /></ListItemIcon>
                          <ListItemText primary={`Grade: ${getGradeLetter(pct)}`} secondary={pct >= 50 ? 'Passed' : 'Failed'}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                            secondaryTypographyProps={{ color: pct >= 50 ? '#059669' : '#DC2626', fontWeight: 600 }} />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}><Schedule fontSize="small" sx={{ color: '#3E92CC' }} /></ListItemIcon>
                          <ListItemText primary="Submitted" secondary={new Date(selectedResult.submittedAt).toLocaleString()}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                        </ListItem>
                      </List>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2.5, borderRadius: 2, backgroundColor: '#F8FAFC', border: '1px solid #E8F1F5' }}>
                      <Typography sx={{ fontWeight: 600, color: '#0A2463', mb: 2, fontSize: '0.9rem' }}>Performance</Typography>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 10, borderRadius: 5, backgroundColor: '#E8F1F5', mb: 2, '& .MuiLinearProgress-bar': { borderRadius: 5, backgroundColor: color } }} />
                      <Typography sx={{ fontSize: '0.85rem', color: '#6C757D' }}>
                        You scored {pct}% in this exam. {pct >= 50 ? 'Congratulations on passing!' : 'Keep studying and try again.'}
                      </Typography>
                    </Box>
                  </Grid>

                  {Array.isArray(selectedResult.questions) && selectedResult.questions.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography sx={{ fontWeight: 600, color: '#0A2463', mb: 2, fontSize: '0.9rem' }}>Question-wise Breakdown</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Question</TableCell>
                              <TableCell>Options</TableCell>
                              <TableCell align="right">Marks</TableCell>
                              <TableCell align="right">Time (s)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedResult.questions.map((q) => (
                              <TableRow key={q.questionId || q.index} hover>
                                <TableCell>{q.index + 1}</TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '0.8rem', mb: 0.5 }}>{q.text || 'Question not available'}</Typography>
                                  <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                    {q.subject && q.subject} {q.topic && `| ${q.topic}`} {q.difficulty && `| ${q.difficulty}`}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {Array.isArray(q.options) && q.options.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {q.options.map((opt) => {
                                        const selected = opt.isSelected;
                                        const correct = opt.isCorrect;
                                        let bg = '#F1F5F9'; let fg = '#6C757D';
                                        if (selected && correct) { bg = alpha('#10B981', 0.15); fg = '#059669'; }
                                        else if (selected && !correct) { bg = alpha('#DC2626', 0.15); fg = '#DC2626'; }
                                        else if (!selected && correct) { bg = alpha('#3E92CC', 0.12); fg = '#3E92CC'; }
                                        return (
                                          <Chip key={opt.index} label={opt.text} size="small"
                                            sx={{ backgroundColor: bg, color: fg, fontWeight: selected ? 600 : 400, fontSize: '0.7rem', border: selected ? `1px solid ${fg}` : 'none' }} />
                                        );
                                      })}
                                    </Box>
                                  ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>No options</Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{q.marksObtained}/{q.marksAssigned || 1}</Typography>
                                  <Typography sx={{ fontSize: '0.7rem', color: q.isCorrect ? '#059669' : '#DC2626', fontWeight: 600 }}>
                                    {q.isCorrect ? 'Correct' : 'Incorrect'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography sx={{ fontSize: '0.8rem' }}>{q.timeSpent || 0}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </Grid>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => { setDetailDialog(false); setSelectedResult(null); }} sx={{ color: '#6C757D' }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default StudentResults;
