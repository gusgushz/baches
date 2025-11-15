import { useState } from "react";
import postLogin from "../api/postLogin";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [warning, setWarning] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    if (!email || !password) {
      setIsLoading(false);
      return setWarning("Por favor, completa todos los campos.");
    }
    try {
      const res = await postLogin(email, password);
      if (res.message === "Login exitoso" && "data" in res) {
        console.log("Login successful:", res);
        console.log("TOKEN******:", res.token);
        login(res, res.token); // Guarda el usuario en el contexto de autenticación
        setIsLoading(false);
      } else {
        setIsLoading(false);
        return setWarning("Correo o contraseña incorrectos.");
      }
    } catch (error: any) {
      setIsLoading(false);
      return setWarning(
        "Error al iniciar sesión. Inténtalo de nuevo más tarde."
      );
    }
  };
  return (
    <div>
      <div className="login-container">
        <h1>Iniciar sesión</h1>
        {warning && <p className="warning">{warning}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
            />
          </div>

          <div className="actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
