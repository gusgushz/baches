import React, { useState } from 'react';
import './Login.css';
import { useAuth } from '../contexts/AuthContext';
import postLogin from '../api/postLogin';
import EbyLogo from '../assets/Eby.png';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!navigator.onLine) return setError('No hay conexión a internet');
    setError(null);
    setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!username) errs.username = 'Usuario requerido';
    if (!password) errs.password = 'Contraseña requerida';
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await postLogin(username, password);

      // postLogin returns the parsed JSON from the backend. It may include
      // { message, data: UserSession, token } on success or { message, error } on failure.
      if (!res) {
        setError('Respuesta inválida del servidor');
        return;
      }

      // Prefer token field, fallback to nested data.token
      const token = (res as any).token || (res as any).data?.token;
      const user = (res as any).data || null;

      if (!token || !user) {
        const serverMsg = (res as any).error || (res as any).message || `Error en la autenticación`;
        setError(serverMsg);
        return;
      }

      // Deny access to worker role if backend returned it
      const role = (user as any).role || null;
      if (role && String(role).toLowerCase() === 'worker') {
        setError('Acceso denegado: Los trabajadores no tienen permitido entrar en esta aplicación.');
        return;
      }

      // Use AuthContext login method which now accepts a `remember` flag.
      login(user, token, remember);
    } catch (err: any) {
      if (err?.name === 'AbortError') setError('La petición tardó demasiado. Intente de nuevo.');
      else setError('Error de conexión');
      console.error('Login error:', err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src={EbyLogo} alt="logo" className="auth-logo" />
          <h3>Inicie sesión para continuar</h3>
        </div>

        <div className="auth-body">
          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <input
              className="input"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}

            <div className="password-row">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button type="button" className="small show-btn" onClick={() => setShowPassword((s) => !s)} disabled={loading}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}

            <label className="checkbox"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={loading} /> Recuérdame</label>

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
