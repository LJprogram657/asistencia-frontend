import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, LogIn, LogOut, Coffee, Briefcase } from 'lucide-react';

export default function RegistrarAsistencia() {
  const [loading, setLoading] = useState(null); // Para saber qué botón está cargando
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegistrar = (tipo) => {
    setLoading(tipo);
    setError('');
    setSuccess('');

    if (!navigator.geolocation) {
      setError('La geolocalización no es soportada por tu navegador.');
      setLoading(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const formData = new FormData();
        formData.append('tipo', tipo);
        formData.append('latitud', latitude);
        formData.append('longitud', longitude);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/historial/`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })
        .then(response => {
            if (!response.ok) {
                // Si el backend envía un mensaje de error en JSON, lo usamos
                return response.json().then(err => { throw new Error(err.detail || 'Error en el registro') });
            }
            return response.json();
        })
        .then(data => {
            setSuccess(data.message || `¡Registro de '${tipo}' exitoso!`);
            setLoading(null);
        })
        .catch(err => {
            setError(err.message || 'No se pudo conectar con el servidor.');
            setLoading(null);
        });
      },
      (err) => {
        setError(`Error al obtener la ubicación: ${err.message}`);
        setLoading(null);
      }
    );
  };

  const opciones = [
    { tipo: 'E', texto: 'Entrada Laboral', Icon: LogIn, color: 'bg-green-500 hover:bg-green-600' },
    { tipo: 'SD', texto: 'Salida Almuerzo', Icon: Coffee, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { tipo: 'VD', texto: 'Entrada Almuerzo', Icon: Coffee, color: 'bg-blue-500 hover:bg-blue-600' },
    { tipo: 'S', texto: 'Salida Laboral', Icon: LogOut, color: 'bg-red-500 hover:bg-red-600' },
  ];

  return (
    <div className="registrar-bg">
      <div className="registrar-card">
        <header className="registrar-header">
          <div className="logo-titulo">
            <img src="/logo.png" alt="Logo Empresa" className="logo-empresa" />
            <h1 className="titulo-registrar">Registrar Asistencia</h1>
          </div>
          <button onClick={() => window.history.back()} className="volver-btn">
            <ArrowLeft className="icon-btn" /> Volver
          </button>
        </header>
        {error && <div className="alerta-error">{error}</div>}
        {success && <div className="alerta-exito">{success}</div>}
        <main className="opciones-grid">
          {opciones.map(({ tipo, texto, Icon, color }) => (
            <button
              key={tipo}
              onClick={() => handleRegistrar(tipo)}
              disabled={loading}
              className={`opcion-btn registrar-btn ${loading ? 'btn-disabled' : ''}`}
            >
              <Icon className="icon-btn-opcion" />
              <span>{texto}</span>
              {loading === tipo && <div className="loader-btn"></div>}
            </button>
          ))}
        </main>
      </div>
      <div className="animated-bg"></div>
    </div>
  );
}