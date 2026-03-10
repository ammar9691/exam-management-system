import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme
import aviationTheme from './theme/aviationTheme';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminExams from './pages/admin/Exams';
import AdminResults from './pages/admin/Results';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentExams from './pages/student/Exams';
import TakeExam from './pages/student/TakeExam';
import StudentResults from './pages/student/Results';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorExams from './pages/instructor/Exams';
import InstructorStudents from './pages/instructor/Students';
import InstructorGrading from './pages/instructor/Grading';
import ExamMonitor from './pages/instructor/ExamMonitor';
import ModuleExams from './pages/instructor/ModuleExams';
import ConsolidatedResults from './pages/instructor/ConsolidatedResults';
import QuestionPaperAnalysis from './pages/instructor/QuestionPaperAnalysis';

// Module Exam Pages (Student)
import ModuleExamRunner from './pages/student/ModuleExamRunner';
import ModuleExamResult from './pages/student/ModuleExamResult';

// Exam Manager Pages
import ExamManagerDashboard from './pages/examManager/Dashboard';

// QDB (Question Database) Pages
import QDBQuestions from './pages/qdb/Questions';

// Common Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <ThemeProvider theme={aviationTheme}>
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
            {/* Module-Based Exams (Admin) */}
            <Route
              path="/admin/module-exams"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ModuleExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/module-exams/:examId/results"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConsolidatedResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/module-exams/:examId/qpa"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <QuestionPaperAnalysis />
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
            {/* Module Exam Routes (Student) */}
            <Route
              path="/student/module-exam/:examId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ModuleExamRunner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/module-exam/result/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ModuleExamResult />
                </ProtectedRoute>
              }
            />

            {/* Instructor Routes */}
            <Route
              path="/instructor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/exams"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/students"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/grading"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorGrading />
                </ProtectedRoute>
              }
            />
            {/* Exam creation/edit is handled via dialog inside InstructorExams */}
            <Route
              path="/instructor/exams/:examId/monitor"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <ExamMonitor />
                </ProtectedRoute>
              }
            />
            {/* Module-Based Exams (Instructor) */}
            <Route
              path="/instructor/module-exams"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <ModuleExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/module-exams/:examId/results"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <ConsolidatedResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/module-exams/:examId/qpa"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <QuestionPaperAnalysis />
                </ProtectedRoute>
              }
            />

            {/* Exam Manager Routes */}
            <Route
              path="/exam-manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['exam_manager']}>
                  <ExamManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* QDB (Question Database) Routes */}
            <Route
              path="/qdb/questions"
              element={
                <ProtectedRoute allowedRoles={['admin', 'exam_manager', 'instructor']}>
                  <QDBQuestions />
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
