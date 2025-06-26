import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.rol);

        if (data.rol === 'Administrador') {
          window.location.href = '/historial';
        } else if (data.rol === 'Empleado') {
          window.location.href = '/registrar';
        } else {
          setError('Rol no reconocido.');
        }
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <div className="form-header">
          <div className="logo-container">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1 className="form-title">Bienvenido</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="form-message error">{error}</p>}

          <div className="input-group">
            <input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="auth-input" placeholder="Usuario" />
            <Mail className="input-icon" size={20} />
          </div>

          <div className="input-group">
            <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" placeholder="Contraseña" />
            <Lock className="input-icon" size={20} />
            <div onClick={() => setShowPassword(!showPassword)} className="password-toggle">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <LogIn size={20} />}
            {!loading && <span>Ingresar</span>}
          </button>
        </form>

        <Link href="/register" className="auth-link">
          ¿No tienes una cuenta? Regístrate
        </Link>
      </div>
    </div>
  );
}