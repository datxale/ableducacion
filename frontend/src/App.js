import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Layout/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import GradesPage from './pages/Grades/GradesPage';
import GradeDetailPage from './pages/Grades/GradeDetailPage';
import SubjectPage from './pages/Subjects/SubjectPage';
import MonthPage from './pages/Activities/MonthPage';
import WeekPage from './pages/Activities/WeekPage';
import PlanningPage from './pages/Planning/PlanningPage';
import LiveClassesPage from './pages/LiveClasses/LiveClassesPage';
import ProgressPage from './pages/Progress/ProgressPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageActivities from './pages/Admin/ManageActivities';
import ManageClasses from './pages/Admin/ManageClasses';
import ManageTestimonials from './pages/Admin/ManageTestimonials';

const AppContent = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Cargando ABL Educacion..." />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <GradesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grades/:gradeId"
            element={
              <ProtectedRoute>
                <GradeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:subjectId"
            element={
              <ProtectedRoute>
                <SubjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:subjectId/month/:month"
            element={
              <ProtectedRoute>
                <MonthPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:subjectId/month/:month/week/:week"
            element={
              <ProtectedRoute>
                <WeekPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planning"
            element={
              <ProtectedRoute>
                <PlanningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-classes"
            element={
              <ProtectedRoute>
                <LiveClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activities"
            element={
              <ProtectedRoute adminOnly>
                <ManageActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute adminOnly>
                <ManageClasses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/testimonials"
            element={
              <ProtectedRoute adminOnly>
                <ManageTestimonials />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
