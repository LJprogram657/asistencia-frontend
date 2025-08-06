import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { setTokens, fetchUserInfo, redirectBasedOnRole } from '../auth';
import { useRouter } from 'next/router';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [btnPressed, setBtnPressed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnPressed(true);
    setLoading(true);
    setError('');
    setShake(false);
    setSuccess(false);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        
        // Guardar tokens
        setTokens(data.access, data.refresh);
        
        // Obtener información del usuario y redirigir según el rol
        setTimeout(async () => {
          try {
            const userInfo = await fetchUserInfo();
            if (userInfo && userInfo.rol) {
              redirectBasedOnRole(router, userInfo.rol);
            } else {
              // Si no se puede obtener el rol, redirigir a registrar por defecto
              router.push('/registrar');
            }
          } catch (error) {
            console.error('Error fetching user info:', error);
            router.push('/registrar');
          }
        }, 900);
      } else {
        setShake(true);
        setError(data.detail || 'Error al iniciar sesión');
      }
    } catch (err) {
      setShake(true);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
      setTimeout(() => setBtnPressed(false), 250);
      setTimeout(() => setShake(false), 700);
    }
  };

  return (
    <div className="auth-container login-bg">
      <div className="form-wrapper login-card">
        <div className="form-header">
          <div className="logo-login">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1 className="form-title login-title">Bienvenido</h1>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="form-message error">{error}</p>}
          <div className="input-group">
            <input 
              id="username" 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="auth-input" 
              placeholder="Usuario" 
            />
            <Mail className="input-icon" size={20} />
          </div>
          <div className="input-group">
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="auth-input" 
              placeholder="Contraseña" 
            />
            <Lock className="input-icon" size={20} />
            <div onClick={() => setShowPassword(!showPassword)} className="password-toggle">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || success}
            className={`auth-button animated-blue-btn${btnPressed ? ' pressed' : ''}${shake ? ' shake' : ''}${success ? ' success' : ''}`}
          >
            {loading && <div className="spinner"></div>}
            {success && (
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14 27l7 7 16-16"/>
              </svg>
            )}
            {!loading && !success && <LogIn size={20} />}
            {!loading && !success && <span>Ingresar</span>}
          </button>
        </form>
        <Link href="/register" className="auth-link">
          ¿No tienes una cuenta? Regístrate
        </Link>
      </div>
      <div className="animated-bg"></div>
    </div>
  );
}

export default LoginPage;