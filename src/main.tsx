import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import {
  DashboardScreen,
  EmployeesScreen,
  ErrorScreen,
  LoginScreen,
  ReportsScreen,
  SettingsScreen,
  VehiclesScreen,
} from "./screens/";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { PublicRoute } from "./navigation/PublicRoute.tsx";
import { ProtectedRoute } from "./navigation/ProtectedRoute.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Layout protegido */}
          <Route
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardScreen />} />
            <Route path="dashboard" element={<DashboardScreen />} />
            <Route path="employees" element={<EmployeesScreen />} />
            <Route path="vehicles" element={<VehiclesScreen />} />
            <Route path="reports" element={<ReportsScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>

          {/* Rutas públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginScreen />
              </PublicRoute>
            }
          />

          {/* Errores */}
          <Route path="*" element={<ErrorScreen />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
