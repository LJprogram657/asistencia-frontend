import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Mail, Lock, Briefcase } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: '',
  });
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/roles/`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los roles. Asegúrate de que el servidor backend esté funcionando.');
        }
        const data = await response.json();
        setRoles(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, rol: data[0].id }));
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setSuccess('');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          rol: formData.rol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Object.values(data).flat().join(' ');
        throw new Error(errorMessage || 'Ocurrió un error durante el registro.');
      }

      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setFormData({ username: '', email: '', password: '', confirmPassword: '', rol: roles.length > 0 ? roles[0].id : '' });

    } catch (err) {
      setError(err.message);
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
          <h1 className="form-title">Crea tu Cuenta</h1>
          <p className="form-subtitle">Es rápido y fácil</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="form-message error">{error}</p>}
          {success && <p className="form-message success">{success}</p>}

          <div className="input-group">
            <input id="username" name="username" type="text" value={formData.username} required onChange={handleChange} className="auth-input" placeholder="Nombre de usuario" />
            <UserPlus className="input-icon" size={20} />
          </div>

          <div className="input-group">
            <input id="email" name="email" type="email" value={formData.email} required onChange={handleChange} className="auth-input" placeholder="Correo electrónico" />
            <Mail className="input-icon" size={20} />
          </div>

          <div className="input-group">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} required onChange={handleChange} className="auth-input" placeholder="Contraseña" />
            <Lock className="input-icon" size={20} />
            <div onClick={() => setShowPassword(!showPassword)} className="password-toggle">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <div className="input-group">
            <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} required onChange={handleChange} className="auth-input" placeholder="Confirmar contraseña" />
            <Lock className="input-icon" size={20} />
            <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <div className="input-group">
            <select id="rol" name="rol" value={formData.rol} onChange={handleChange} required className="auth-input select-input">
              <option value="" disabled>Selecciona un rol</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
            <Briefcase className="input-icon" size={20} />
          </div>

          <button type="submit" disabled={loading || !formData.rol} className="auth-button">
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <UserPlus size={20} />}
            {!loading && <span>Registrarme</span>}
          </button>
        </form>

        <Link href="/login" className="auth-link">
          ¿Ya tienes una cuenta? Inicia sesión
        </Link>
      </div>
    </div>
  );
}