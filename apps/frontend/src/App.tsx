import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, OnboardingGuard, DashboardGuard } from './components/RouteGuards';
import Register from './pages/Register';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public route */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      
        {/* Protected route */}
        <Route element={<ProtectedRoute />}>
          {/* Onboarding guard */}
          <Route element={<OnboardingGuard />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

        {/* Protected route */}
          <Route element={<DashboardGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>

      {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />      
      </Routes>
    </BrowserRouter>
  );
}
