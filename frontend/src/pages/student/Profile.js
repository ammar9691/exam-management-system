import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  Fade,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  TrendingUp,
  Timer,
  AccessTime,
  EmailOutlined,
  PersonOutline,
  BadgeOutlined,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';

const StudentProfile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await studentService.getStats();
        setStats(s || {});
      } catch (e) {
        console.error('Failed to load student stats for profile:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getRoleBadgeColor = (role) => {
    const colors = { admin: '#F59E0B', instructor: '#10B981', student: '#3E92CC', exam_manager: '#8B5CF6' };
    return colors[role] || '#6C757D';
  };

  const roleColor = getRoleBadgeColor(user?.role);

  return (
    <Layout>
      <Container maxWidth="md" sx={{ pb: 4 }}>
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.75rem', color: '#0A2463', mb: 0.5 }}>
              My Profile
            </Typography>
            <Typography sx={{ color: '#6C757D', fontSize: '0.95rem' }}>
              View your account information and exam summary
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={600} style={{ transitionDelay: '100ms' }}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)', overflow: 'hidden' }}>
                {/* Header gradient */}
                <Box sx={{ height: 80, background: `linear-gradient(135deg, ${roleColor}, ${roleColor}bb)` }} />
                <CardContent sx={{ textAlign: 'center', mt: -5 }}>
                  <Avatar sx={{
                    width: 80, height: 80, mx: 'auto', mb: 2, fontSize: '2rem', fontWeight: 700,
                    background: `linear-gradient(135deg, ${roleColor}, ${roleColor}dd)`,
                    border: '4px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </Avatar>

                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.15rem', color: '#2C3E50', mb: 0.5 }}>
                    {user?.name || 'Student'}
                  </Typography>

                  <Chip
                    label={user?.role === 'student' ? 'Pilot Student' : user?.role || 'Student'}
                    size="small"
                    sx={{
                      fontWeight: 600, fontSize: '0.7rem', height: 24, mb: 2,
                      backgroundColor: alpha(roleColor, 0.1), color: roleColor,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}
                  />

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ textAlign: 'left' }}>
                    {[
                      { icon: <PersonOutline />, label: 'Name', value: user?.name },
                      { icon: <EmailOutlined />, label: 'Email', value: user?.email },
                      { icon: <BadgeOutlined />, label: 'Role', value: user?.role === 'student' ? 'Pilot Student' : user?.role },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ color: '#9CA3AF' }}>{item.icon}</Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 500 }}>
                            {item.value || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Stats */}
          <Grid item xs={12} md={8}>
            <Fade in timeout={600} style={{ transitionDelay: '200ms' }}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(10, 36, 99, 0.06)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1rem', color: '#0A2463', mb: 3 }}>
                    Exam Summary
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />)}
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {[
                        { icon: <Assignment />, label: 'Total Exams Taken', value: stats?.totalExams ?? 0, gradient: 'linear-gradient(135deg, #0A2463, #3E92CC)' },
                        { icon: <CheckCircle />, label: 'Completed Exams', value: stats?.completedExams ?? 0, gradient: 'linear-gradient(135deg, #059669, #10B981)' },
                        { icon: <TrendingUp />, label: 'Average Score', value: `${stats?.averageScore ?? 0}%`, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)' },
                        { icon: <Timer />, label: 'Upcoming Exams', value: stats?.upcomingExams ?? 0, gradient: 'linear-gradient(135deg, #0096C7, #00B4D8)' },
                        { icon: <AccessTime />, label: 'Total Time Spent', value: `${stats?.totalTimeSpent ?? 0} min`, gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' },
                      ].map((item) => (
                        <Grid item xs={12} key={item.label}>
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2,
                            border: '1px solid #F1F5F9', transition: 'all 0.2s',
                            '&:hover': { borderColor: '#E8F1F5', backgroundColor: '#FAFBFC' },
                          }}>
                            <Box sx={{
                              width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: item.gradient, flexShrink: 0,
                            }}>
                              {React.cloneElement(item.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: '#6C757D', fontWeight: 500 }}>{item.label}</Typography>
                            </Box>
                            <Typography sx={{ fontFamily: "'Montserrat'", fontWeight: 700, fontSize: '1.25rem', color: '#2C3E50' }}>
                              {item.value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default StudentProfile;
