import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Clock, MapPin, LogOut, User, History } from 'lucide-react';
import { removeTokens, makeAuthenticatedRequest, getUserInfo, getUserRole } from '../auth';

export default function RegistrarAsistencia() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Obtener información del usuario al cargar la página
    const info = getUserInfo();
    setUserInfo(info);
  }, []);

  const handleLogout = () => {
    removeTokens();
    router.push('/login');
  };

  const handleHistorial = () => {
    router.push('/historial');
  };

  const handleRegistrar = (tipo) => {
    setLoading(tipo);
    setError('');
    setSuccess('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await makeAuthenticatedRequest(
              `${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/asistencias/`,
              {
                method: 'POST',
                body: JSON.stringify({
                  tipo,
                  latitud: latitude,
                  longitud: longitude,
                }),
              }
            );

            if (response && response.ok) {
              const data = await response.json();
              setSuccess(data.message || `${tipo} registrada exitosamente`);
              setTimeout(() => setSuccess(''), 3000);
            } else if (response) {
              const errorData = await response.json();
              setError(errorData.detail || errorData.error || 'Error al registrar asistencia');
            }
          } catch (err) {
            setError('Error de conexión con el servidor');
          } finally {
            setLoading(null);
          }
        },
        (error) => {
          setError('Error al obtener la ubicación. Por favor, permite el acceso a la ubicación.');
          setLoading(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setError('La geolocalización no es compatible con este navegador.');
      setLoading(null);
    }
  };

  const userRole = getUserRole();
  const isAdmin = userRole === 'Administrador';

  return (
    <div className="registrar-bg">
      <div className="registrar-card">
        <div className="registrar-header">
          <img src="/logo.png" alt="Logo" className="logo-empresa" />
          <div className="user-info">
            <h1 className="titulo-registrar">Registro de Asistencia</h1>
            {userInfo && (
              <div className="user-details">
                <User size={16} />
                <span>{userInfo.username} - {userInfo.rol || 'Sin rol'}</span>
              </div>
            )}
          </div>
          <div className="header-buttons">
            {isAdmin && (
              <button className="historial-btn" onClick={handleHistorial}>
                <History size={20} />
                Historial
              </button>
            )}
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              Salir
            </button>
          </div>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        <div className="botones-container">
          <button
            className={`boton-asistencia entrada ${loading === 'Entrada' ? 'loading' : ''}`}
            onClick={() => handleRegistrar('Entrada')}
            disabled={loading}
          >
            <Clock size={24} />
            <span>Entrada Laboral</span>
            {loading === 'Entrada' && <div className="spinner"></div>}
          </button>

          <button
            className={`boton-asistencia salida-almuerzo ${loading === 'Salida a Descanso' ? 'loading' : ''}`}
            onClick={() => handleRegistrar('Salida a Descanso')}
            disabled={loading}
          >
            <MapPin size={24} />
            <span>Salida a Descanso</span>
            {loading === 'Salida a Descanso' && <div className="spinner"></div>}
          </button>

          <button
            className={`boton-asistencia entrada-almuerzo ${loading === 'Entrada de Descanso' ? 'loading' : ''}`}
            onClick={() => handleRegistrar('Entrada de Descanso')}
            disabled={loading}
          >
            <Clock size={24} />
            <span>Entrada de Descanso</span>
            {loading === 'Entrada de Descanso' && <div className="spinner"></div>}
          </button>

          <button
            className={`boton-asistencia salida ${loading === 'Salida' ? 'loading' : ''}`}
            onClick={() => handleRegistrar('Salida')}
            disabled={loading}
          >
            <MapPin size={24} />
            <span>Salida Laboral</span>
            {loading === 'Salida' && <div className="spinner"></div>}
          </button>
        </div>
      </div>
      <div className="animated-bg"></div>
    </div>
  );
}