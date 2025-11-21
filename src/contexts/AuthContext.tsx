import { createContext, useContext, useEffect, useState } from "react";
import type { UserSession } from "../models/";
import { useNavigate } from "react-router";

interface AuthContextType {
  user: Partial<UserSession> | undefined;
  token: string | undefined;
  login: (user: Partial<UserSession>, token: string, remember?: boolean) => void;
  logout: () => void;
  isLoading: boolean; // Nuevo estado para indicar si está cargando
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<Partial<UserSession> | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado

  useEffect(() => {
    // Try localStorage first (remembered), otherwise fall back to sessionStorage
    const userStored = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    const tokenStored = localStorage.getItem("token") ?? sessionStorage.getItem("token");
    if (userStored && tokenStored) {
      try { setUser(JSON.parse(userStored)); } catch { setUser(undefined); }
      setToken(tokenStored);
    }
    setIsLoading(false); // Marca que la carga inicial terminó
  }, []);

  const login = (user: Partial<UserSession>, token: string, remember = true) => {
    // Persist according to `remember` flag
    if (remember) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      // Ensure sessionStorage is clean
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", token);
      // Ensure localStorage is clean
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setUser(user);
    setToken(token);
    navigate("/", { replace: true }); // Usa `replace: true`
  };

  const logout = () => {
    // Remove from both storages to be safe
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(undefined);
    setToken(undefined);
    navigate("/login", { replace: true }); // Usa `replace: true`
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
};
