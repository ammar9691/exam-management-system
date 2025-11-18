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
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import Layout from '../../components/layout/Layout.js';
import { useAuth } from '../../context/AuthContext.js';
import studentService from '../../services/studentService.js';

const StudentProfile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await studentService.getStats();
        setStats(s || {});
      } catch (e) {
        console.error('Failed to load student stats for profile:', e);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your account information and exam summary.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {user?.name || 'Student'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user?.email}
                  </Typography>
                  <Chip
                    label={user?.role || 'student'}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exam Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Total Exams Taken"
                      secondary={stats?.totalExams ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Completed Exams"
                      secondary={stats?.completedExams ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Average Score"
                      secondary={`${stats?.averageScore ?? 0}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Upcoming Exams"
                      secondary={stats?.upcomingExams ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Time Spent"
                      secondary={`${stats?.totalTimeSpent ?? 0} minutes`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default StudentProfile;