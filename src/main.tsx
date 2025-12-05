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
import { SidebarProvider } from "./contexts/SidebarContext.tsx";
import { PublicRoute } from "./navigation/PublicRoute.tsx";
import { ProtectedRoute } from "./navigation/ProtectedRoute.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
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
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// Register service worker in production-like environments if supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/sw.js'
    navigator.serviceWorker.register(swUrl).then(reg => {
      console.log('ServiceWorker registrado:', reg.scope)
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (installing) {
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('Nuevo contenido disponible; refresca para usarlo.')
              } else {
                console.log('Contenido en cache listo para uso offline.')
              }
            }
          })
        }
      })
    }).catch(err => {
      console.warn('Registro de ServiceWorker falló:', err)
    })
  })
}
