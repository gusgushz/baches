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
  AssignmentsScreen,
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
            <Route path="assignments" element={<AssignmentsScreen />} />
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

// Register service worker for PWA (served from /sw.js in public)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('ServiceWorker registration successful with scope: ', reg.scope);
    }).catch(err => {
      console.warn('ServiceWorker registration failed: ', err);
    });
  });

  // Optional: capture beforeinstallprompt to show custom UI later
  window.addEventListener('beforeinstallprompt', (e: any) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // You could store `e` and trigger e.prompt() from a custom install button
    (window as any).__deferredPWAInstall = e;
    console.log('beforeinstallprompt captured, store event to trigger later');
  });
}
