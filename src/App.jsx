/**
 * Main Application Component
 * 
 * Handles routing and authentication guards.
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout
import Layout from './layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Generator from './pages/Generator';
import Analyzer from './pages/Analyzer';
import Competitors from './pages/Competitors';
import History from './pages/History';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Protected Route Wrapper
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Public Route Wrapper
 * Redirects to dashboard if already authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Redirect to the page they tried to visit or dashboard
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
}

/**
 * Main App Component
 */
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - default route */}
        <Route index element={<Dashboard />} />

        {/* Client Management */}
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />

        {/* Comment Generator */}
        <Route path="generator" element={<Generator />} />

        {/* Content Analyzer */}
        <Route path="analyzer" element={<Analyzer />} />

        {/* Competitor Tracking */}
        <Route path="competitors" element={<Competitors />} />

        {/* Comment History */}
        <Route path="history" element={<History />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        <Route path="settings/:tab" element={<Settings />} />
      </Route>

      {/* 404 - catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
