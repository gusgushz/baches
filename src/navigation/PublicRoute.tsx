import { useAuth } from "../contexts/AuthContext";
import React from "react";
import { Navigate } from "react-router";
import { LoginScreen } from "../screens";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }
  // Si no hay usuario, renderiza los hijos (página pública)

  return <LoginScreen />;
};
