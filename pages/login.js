import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';

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

    // Aquí irá la lógica para llamar a tu API de login
    console.log('Login attempt with:', { username, password });

    // Simulación de una llamada a la API
    setTimeout(() => {
      setLoading(false);
      // Aquí manejarías la respuesta. Si hay error:
      // setError('Usuario o contraseña incorrectos.');
      // Si es exitoso, redirigirías al usuario.
    }, 2000);
  };

  return (
    <div className="animated-bg p-4">
      <div className="form-container">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-32 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800">Bienvenido</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full custom-input"
              placeholder="Tu nombre de usuario"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full custom-input pr-10"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button type="submit" disabled={loading} className="w-full custom-button">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <><LogIn className="h-5 w-5"/> Ingresar</>
            )}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}