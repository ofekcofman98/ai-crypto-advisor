import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, OnboardingGuard, DashboardGuard } from './components/RouteGuards';

const LoginPage = () => <div className="p-8 text-center text-xl">Login Page (Coming Soon)</div>;
const RegisterPage = () => <div className="p-8 text-center text-xl">Register Page (Coming Soon)</div>;
const OnboardingPage = () => <div className="p-8 text-center text-xl text-secondary font-bold">Onboarding Questionnaire (Coming Soon)</div>;
const DashboardPage = () => <div className="p-8 text-center text-xl text-primary font-bold">Main AI Crypto Dashboard (Coming Soon)</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public route */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      
        {/* Protected route */}
        <Route element={<ProtectedRoute />}>
          {/* Onboarding guard */}
          <Route element={<OnboardingGuard />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

        {/* Protected route */}
          <Route element={<DashboardGuard />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

      {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />      
      </Routes>
    </BrowserRouter>
  );
}
