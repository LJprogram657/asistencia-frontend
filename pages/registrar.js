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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-800">Registrar Asistencia</h1>
            <button onClick={() => router.push('/')} className="flex items-center bg-gray-500 text-white hover:bg-gray-600 font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Historial
            </button>
        </header>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opciones.map(({ tipo, texto, Icon, color }) => (
            <button 
              key={tipo} 
              onClick={() => handleRegistrar(tipo)}
              disabled={loading}
              className={`p-8 rounded-xl shadow-lg text-white font-bold text-2xl flex flex-col items-center justify-center transition-transform transform hover:scale-105 ${color} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Icon className="h-16 w-16 mb-4" />
              <span>{texto}</span>
              {loading === tipo && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mt-4"></div>}
            </button>
          ))}
        </main>
      </div>
    </div>
  );
}