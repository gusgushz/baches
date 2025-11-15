import { useAuth } from '../contexts/AuthContext';
import React from 'react';
import { useNavigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return children;
};
