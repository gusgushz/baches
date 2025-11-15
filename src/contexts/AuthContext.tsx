import { createContext, useContext, useEffect, useState } from "react";
import type { UserSession } from "../models/";
import { useNavigate } from "react-router";

interface AuthContextType {
  user: Partial<UserSession> | undefined;
  token: string | undefined;
  login: (user: Partial<UserSession>, token: string) => void;
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
    const userStored = localStorage.getItem("user");
    const tokenStored = localStorage.getItem("token");
    if (userStored && tokenStored) {
      setUser(JSON.parse(userStored));
      setToken(tokenStored);
    }
    setIsLoading(false); // Marca que la carga inicial terminó
  }, []);

  const login = (user: Partial<UserSession>, token: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    setUser(user);
    setToken(token);
    navigate("/", { replace: true }); // Usa `replace: true`
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
