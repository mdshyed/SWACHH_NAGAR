import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages - Public
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

import NotFoundPage from './pages/public/NotFoundPage';
import PublicDashboardPage from './pages/public/PublicDashboardPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';

// Pages - User
import DashboardPage from './pages/user/DashboardPage';
import ReportComplaintPage from './pages/user/ReportComplaintPage';
import MyComplaintsPage from './pages/user/MyComplaintsPage';
import ComplaintDetailPage from './pages/user/ComplaintDetailPage';
import MapViewPage from './pages/user/MapViewPage';
import LeaderboardPage from './pages/user/LeaderboardPage';
import GarbageSchedulePage from './pages/user/GarbageSchedulePage';
import ProfilePage from './pages/user/ProfilePage';
import NotificationsPage from './pages/user/NotificationsPage';

// Pages - Admin
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ComplaintsManagePage from './pages/admin/ComplaintsManagePage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import UsersManagePage from './pages/admin/UsersManagePage';
import AdminPerformancePage from './pages/admin/AdminPerformancePage';

// Components
import ToastContainer from './components/common/ToastContainer';
import Spinner from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const UserOnlyRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route path="/transparency" element={<PublicDashboardPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Protected User */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/report" element={<ProtectedRoute><UserOnlyRoute><ReportComplaintPage /></UserOnlyRoute></ProtectedRoute>} />
    <Route path="/complaints" element={<ProtectedRoute><MyComplaintsPage /></ProtectedRoute>} />
    <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetailPage /></ProtectedRoute>} />
    <Route path="/map" element={<ProtectedRoute><MapViewPage /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
    <Route path="/schedule" element={<GarbageSchedulePage />} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

    {/* Admin */}
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin/register" element={<AdminRegisterPage />} />
    <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
    <Route path="/admin/complaints" element={<AdminRoute><ComplaintsManagePage /></AdminRoute>} />
    <Route path="/admin/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
    <Route path="/admin/users" element={<AdminRoute><UsersManagePage /></AdminRoute>} />
    <Route path="/admin/performance" element={<AdminRoute><AdminPerformancePage /></AdminRoute>} />

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <ToastContainer />
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
