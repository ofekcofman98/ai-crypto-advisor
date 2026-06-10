import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export const OnboardingGuard = () => {
  const hasCompletedOnboarding = useAuthStore((state) => state.user?.hasCompletedOnboarding);  
  
  if (hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }  
    return <Outlet />;
};

export const DashboardGuard = () => {
  const user = useAuthStore((state) => state.user);
  const hasCompletedOnboarding = user?.hasCompletedOnboarding;

  if (user && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (token && user) {
      return user.hasCompletedOnboarding 
        ? <Navigate to="/dashboard" replace /> 
        : <Navigate to="/onboarding" replace />;
  }  
  
  return <Outlet />;
};