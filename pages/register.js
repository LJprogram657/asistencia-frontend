import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: '', // Lo dejamos vacío inicialmente
  });
  const [roles, setRoles] = useState([]); // Nuevo estado para los roles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Efecto para cargar los roles cuando el componente se monta
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/roles/`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los roles.');
        }
        const data = await response.json();
        setRoles(data);
        if (data.length > 0) {
          // Opcional: seleccionar el primer rol por defecto
          setFormData(prev => ({ ...prev, rol: data[0].id }));
        }
      } catch (error) {
        setError(error.message);
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
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Asegúrate de que la URL de la API en tu archivo .env.local sea la correcta
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          rol: formData.rol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Intenta extraer un mensaje de error específico de la respuesta del backend
        const errorMessage = Object.values(data).flat().join(' ');
        throw new Error(errorMessage || 'Ocurrió un error durante el registro.');
      }

      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      // Opcional: Redirigir al login o limpiar el formulario
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'empleado',
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg p-4">
      <div className="form-container">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-32 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800">Crea tu Cuenta</h1>
          <p className="text-gray-600 mt-2">Es rápido y fácil</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Repite la estructura de los inputs como en el login, usando `custom-input` */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input id="username" name="username" type="text" value={formData.username} required onChange={handleChange} className="w-full custom-input" placeholder="Elige un nombre de usuario" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input id="email" name="email" type="email" value={formData.email} required onChange={handleChange} className="w-full custom-input" placeholder="tu@correo.com" />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} required onChange={handleChange} className="w-full custom-input" placeholder="Crea una contraseña" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
              {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} required onChange={handleChange} className="w-full custom-input" placeholder="Confirma tu contraseña" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
              {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select id="rol" name="rol" value={formData.rol} onChange={handleChange} className="w-full custom-input">
              <option value="" disabled>Selecciona un rol</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" disabled={loading || !formData.rol} className="w-full custom-button">
            {loading ? <div className="rounded-full h-5 w-5 border-b-2 border-white"></div> : <><UserPlus className="h-5 w-5"/> Registrarme</>}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}