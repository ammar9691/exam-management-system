import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext.js';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute.js';

// Auth Pages
import Login from './pages/auth/Login.js';
import Register from './pages/auth/Register.js';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.js';
import AdminUsers from './pages/admin/Users.js';
import AdminQuestions from './pages/admin/Questions.js';
import AdminExams from './pages/admin/Exams.js';
import AdminResults from './pages/admin/Results.js';

// Student Pages
import StudentDashboard from './pages/student/Dashboard.js';
import StudentExams from './pages/student/Exams.js';
import TakeExam from './pages/student/TakeExam.js';
import StudentResults from './pages/student/Results.js';

// Common Pages
import NotFound from './pages/NotFound.js';
import Unauthorized from './pages/Unauthorized.js';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminResults />
                </ProtectedRoute>
              }
            />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exam/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentResults />
                </ProtectedRoute>
              }
            />
            
            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
