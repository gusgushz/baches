import { NavLink } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import "./SideBar.css";
import { useEffect, useRef, useState } from "react";
import type { UserSession } from "../models";

interface SideBar {
  from?: string; // opcional, para manejar rutas específicas
}

export const SideBar: React.FC<SideBar> = ({ from }) => {
  const { user, logout } = useAuth();
  // const navigate = useNavigate();

  return (
    <nav
      className="nav-bar"
      style={{
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        boxSizing: "border-box",
        flex: 1,
        height: "100vh",
      }}
    >
      <NavLink className="nav-link" to="/dashboard">
        Dashboard
      </NavLink>

      <NavLink className="nav-link" to="/employees">
        Empleados
      </NavLink>

      <NavLink className="nav-link" to="/vehicles">
        Vehículos
      </NavLink>

      <NavLink className="nav-link" to="/reports">
        Reportes
      </NavLink>

      <button className="nav-link logout-button" onClick={logout}>
        Cerrar Sesión
      </button>
    </nav>
  );
};
