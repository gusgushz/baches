import { useAuth } from "../contexts/AuthContext";
import React from "react";
import { useNavigate } from "react-router";
import { LoginScreen } from "../screens";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/", { replace: true });
    return null;
  }
  // Si no hay usuario, renderiza los hijos (página pública)

  return <LoginScreen />;
};
