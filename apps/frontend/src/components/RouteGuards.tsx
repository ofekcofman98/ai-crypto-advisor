import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
    const { token, user } = useAuthStore();
  
    if (!token || !user) {
      return <Navigate to="/login" replace />;
    }
  
    return <Outlet />;
};

export const OnboardingGuard = () => {
    const { user } = useAuthStore();
  
    if (user?.hasCompletedOnboarding) {
      return <Navigate to="/dashboard" replace />;
    }
  
    return <Outlet />;
};

export const DashboardGuard = () => {
    const { user } = useAuthStore();
  
    if (user && !user.hasCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
  
    return <Outlet />;
};

export const PublicRoute = () => {
    const { token, user } = useAuthStore();
  
    if (token && user) {
      return user.hasCompletedOnboarding 
        ? <Navigate to="/dashboard" replace /> 
        : <Navigate to="/onboarding" replace />;
    }
  
    return <Outlet />;
};