import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50 dark:bg-forest-950 transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-forest-200 dark:border-forest-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-forest-500 animate-spin"></div>
          </div>
          <p className="text-forest-700 dark:text-forest-300 font-medium animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
