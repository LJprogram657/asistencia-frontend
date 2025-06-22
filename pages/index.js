import { useEffect, useState } from 'react';
import { Clock, User, FileDown, ArrowLeft, Briefcase, Filter } from 'lucide-react';

// Función para procesar y agrupar las asistencias
const procesarAsistencias = (asistencias) => {
  const asistenciasAgrupadas = {};

  asistencias.forEach(asistencia => {
    const fecha = new Date(asistencia.fecha_hora).toISOString().split('T')[0];
    const hora = new Date(asistencia.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    const key = `${asistencia.usuario.username}_${fecha}`;

    if (!asistenciasAgrupadas[key]) {
      asistenciasAgrupadas[key] = {
        id: key,
        usuario: asistencia.usuario.username,
        fecha: new Date(asistencia.fecha_hora).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric'}),
        entrada: null,
        salida_descanso: null,
        vuelta_descanso: null,
        salida: null,
      };
    }

    switch (asistencia.tipo) {
      case 'E':
        asistenciasAgrupadas[key].entrada = hora;
        break;
      case 'SD':
        asistenciasAgrupadas[key].salida_descanso = hora;
        break;
      case 'VD':
        asistenciasAgrupadas[key].vuelta_descanso = hora;
        break;
      case 'S':
        asistenciasAgrupadas[key].salida = hora;
        break;
      default:
        break;
    }
  });

  return Object.values(asistenciasAgrupadas).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

export default function Home() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ userId: '', fechaInicio: '', fechaFin: '' });

  useEffect(() => {
    // 1. Verificar el estado del usuario (si es staff)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/usuario/estado/`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setIsStaff(data.is_staff);
        if (data.is_staff) {
          // 2. Si es staff, obtener la lista de usuarios
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/usuarios/`, { credentials: 'include' })
            .then(res => res.json())
            .then(setUsers)
            .catch(error => console.error('Error al obtener usuarios:', error));
        }
      })
      .catch(error => console.error('Error al obtener el estado del usuario:', error));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);

    // 3. Obtener historial con filtros
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/historial/?${params.toString()}`, {
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta de la API');
        }
        return response.json();
      })
      .then(data => {
        const dataProcesada = procesarAsistencias(data);
        setAsistencias(dataProcesada);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error al obtener datos:', error);
        setLoading(false);
      });
  }, [filters]);
 
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getExportUrl = () => {
    const params = new URLSearchParams();
    if (filters.userId) {
        const selectedUser = users.find(u => u.id.toString() === filters.userId);
        if(selectedUser) params.append('usuario', selectedUser.username);
    }
    if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
    return `${process.env.NEXT_PUBLIC_API_URL}/asistencia/exportar/?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
            <div className="flex items-center justify-center h-24 w-48 md:h-32 md:w-64 rounded-lg bg-white p-2 shadow-lg">
              <img src="/logo.png" alt="ArbQuin Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <a href="/registrar" className="flex items-center bg-indigo-500 text-white hover:bg-indigo-600 font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-sm text-sm sm:text-base">
                <Briefcase className="h-5 w-5 mr-2" />
                Registrar Asistencia
              </a>
              <a href="/" className="flex items-center bg-blue-500 text-white hover:bg-blue-600 font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-sm text-sm sm:text-base">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </a>
              {isStaff && (
                <a href={getExportUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center bg-green-500 text-white hover:bg-green-600 font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-sm text-sm sm:text-base">
                  <FileDown className="h-5 w-5 mr-2" />
                  Descargar Excel
                </a>
              )}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">Historial de Asistencias</h1>
            <p className="text-gray-500 mt-2">Un resumen detallado de los registros de entrada y salida.</p>
          </div>
        </header>

        {isStaff && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <h3 className="text-lg font-semibold text-gray-700 col-span-1 md:col-span-4 flex items-center"><Filter className="h-5 w-5 mr-2"/>Filtros de Administrador</h3>
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-600 mb-1">Usuario</label>
                <select name="userId" id="userId" value={filters.userId} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="">Todos los usuarios</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-600 mb-1">Fecha Inicio</label>
                <input type="date" name="fechaInicio" id="fechaInicio" value={filters.fechaInicio} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-600 mb-1">Fecha Fin</label>
                <input type="date" name="fechaFin" id="fechaFin" value={filters.fechaFin} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
              </div>
            </div>
          </div>
        )}

        <main>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="py-3 px-4 sm:px-6 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Usuario</th>
                    <th className="py-3 px-4 sm:px-6 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Fecha</th>
                    <th className="py-3 px-4 sm:px-6 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider">Entrada Laboral</th>
                    <th className="py-3 px-4 sm:px-6 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider">Salida Almuerzo</th>
                    <th className="py-3 px-4 sm:px-6 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider">Entrada Almuerzo</th>
                    <th className="py-3 px-4 sm:px-6 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider">Salida Laboral</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10">
                        <div className="flex justify-center items-center text-sm sm:text-base">
                           <Clock className="animate-spin h-6 w-6 sm:h-8 sm:w-8 mr-3 text-blue-500" />
                           <span className="font-medium">Cargando registros...</span>
                        </div>
                      </td>
                    </tr>
                  ) : asistencias.length > 0 ? (
                    asistencias.map((asistencia, index) => (
                      <tr key={asistencia.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-100 transition-colors duration-200`}>
                        <td className="py-3 px-4 sm:px-6 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <User className="h-5 w-5 mr-2 sm:mr-3 text-gray-500" />
                            <span className="font-medium">{asistencia.usuario}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-6 whitespace-nowrap text-sm">{asistencia.fecha}</td>
                        <td className="py-3 px-4 sm:px-6 text-center whitespace-nowrap text-sm">{asistencia.entrada || '—'}</td>
                        <td className="py-3 px-4 sm:px-6 text-center whitespace-nowrap text-sm">{asistencia.salida_descanso || '—'}</td>
                        <td className="py-3 px-4 sm:px-6 text-center whitespace-nowrap text-sm">{asistencia.vuelta_descanso || '—'}</td>
                        <td className="py-3 px-4 sm:px-6 text-center whitespace-nowrap text-sm">{asistencia.salida || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500 font-medium">
                        No se encontraron registros de asistencia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
