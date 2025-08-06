import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Search, Plus, Download, Loader, AlertCircle, LogOut, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import { removeTokens, makeAuthenticatedRequest, getUserInfo, getUserRole } from '../auth';

// --- Componentes de UI reutilizables ---

const BotonAccion = ({ onClick, children, color, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center font-bold py-2 px-4 rounded-lg transition-colors duration-300 ${color} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    {children}
  </button>
);

const EstadoCarga = ({ mensaje = 'Cargando...' }) => (
  <div className="flex items-center justify-center p-8 text-gray-500">
    <Loader className="animate-spin h-6 w-6 mr-3" />
    <span>{mensaje}</span>
  </div>
);

const MensajeError = ({ mensaje }) => (
  <div className="flex items-center justify-center p-8 text-red-600 bg-red-100 rounded-lg">
    <AlertCircle className="h-6 w-6 mr-3" />
    <span>{mensaje}</span>
  </div>
);

const EncabezadoTabla = () => (
  <thead className="bg-gray-800 text-white">
    <tr>
      {['Usuario', 'Fecha', 'Entrada Laboral', 'Salida Almuerzo', 'Entrada Almuerzo', 'Salida Laboral'].map((titulo) => (
        <th key={titulo} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
          {titulo}
        </th>
      ))}
    </tr>
  </thead>
);

const FilaHistorial = ({ asistencia }) => {
  const formatearHora = (fecha) => fecha ? new Date(fecha).toLocaleTimeString() : '--';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap font-medium">{asistencia.usuario_nombre || 'Desconocido'}</td>
      <td className="px-6 py-4 whitespace-nowrap">{new Date(asistencia.fecha).toLocaleDateString()}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.entrada_laboral)}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.salida_almuerzo)}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.entrada_almuerzo)}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.salida_laboral)}</td>
    </tr>
  );
};

// --- Componente Principal ---

function HistorialAsistencias() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  useEffect(() => {
    // Obtener información del usuario
    const info = getUserInfo();
    setUserInfo(info);
    
    const fetchAsistencias = async () => {
      setLoading(true);
      try {
        const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/historial/`);
        
        if (!response) {
          router.push('/login');
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'No se pudo obtener el historial de asistencias.');
        }
        
        const data = await response.json();
        setAsistencias(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAsistencias();
  }, [router]);

  // Memoizar nombres únicos para optimizar rendimiento
  const nombresUnicos = useMemo(() => {
    return Array.from(new Set(asistencias.map(a => a.usuario_nombre).filter(Boolean)));
  }, [asistencias]);

  // Memoizar asistencias filtradas para optimizar rendimiento
  const asistenciasFiltradas = useMemo(() => {
    return asistencias.filter(a => {
      const nombreMatch = filtroNombre === '' || a.usuario_nombre === filtroNombre;
      const fecha = new Date(a.fecha);
      const inicio = filtroFechaInicio ? new Date(filtroFechaInicio) : null;
      const fin = filtroFechaFin ? new Date(filtroFechaFin) : null;
      const fechaMatch = (!inicio || fecha >= inicio) && (!fin || fecha <= fin);
      return nombreMatch && fechaMatch;
    });
  }, [asistencias, filtroNombre, filtroFechaInicio, filtroFechaFin]);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const datosParaExportar = asistenciasFiltradas.map(a => ({
        Usuario: a.usuario_nombre,
        Fecha: new Date(a.fecha).toLocaleDateString(),
        'Entrada Laboral': a.entrada_laboral ? new Date(a.entrada_laboral).toLocaleTimeString() : '',
        'Salida Almuerzo': a.salida_almuerzo ? new Date(a.salida_almuerzo).toLocaleTimeString() : '',
        'Entrada Almuerzo': a.entrada_almuerzo ? new Date(a.entrada_almuerzo).toLocaleTimeString() : '',
        'Salida Laboral': a.salida_laboral ? new Date(a.salida_laboral).toLocaleTimeString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Asistencias');
      
      const fechaActual = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `HistorialAsistencias_${fechaActual}.xlsx`);
    } catch (error) {
      setError('Error al exportar el archivo Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const handleLogout = () => {
    removeTokens();
    router.push('/login');
  };

  const handleRegistrar = () => {
    router.push('/registrar');
  };

  const userRole = getUserRole();
  const isEmployee = userRole === 'Empleado';

  if (loading) return <EstadoCarga mensaje="Cargando historial de asistencias..." />;
  if (error) return <MensajeError mensaje={error} />;

  return (
    <div className="historial-bg">
      <div className="historial-card">
        <div className="historial-header">
          <img src="/logo.png" alt="Logo" className="logo-empresa" />
          <div className="header-content">
            <h1 className="titulo-historial">Historial de Asistencias</h1>
            {userInfo && (
              <div className="user-info">
                <User size={16} />
                <span>{userInfo.username} - {userInfo.rol || 'Sin rol'}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            Salir
          </button>
        </div>

        <div className="button-row">
          <BotonAccion
            onClick={() => setShowFilter(v => !v)}
            color="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Search className="mr-2" size={16} />
            {showFilter ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </BotonAccion>
          
          {isEmployee && (
            <BotonAccion
              onClick={handleRegistrar}
              color="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="mr-2" size={16} />
              Registrar Asistencia
            </BotonAccion>
          )}
          
          <BotonAccion
            onClick={handleExportExcel}
            color="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={exportLoading || asistenciasFiltradas.length === 0}
          >
            {exportLoading ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <Download className="mr-2" size={16} />
            )}
            Exportar Excel
          </BotonAccion>
        </div>

        {showFilter && (
          <div className="filtro-panel-integrado">
            <div className="filtro-grid">
              <select
                value={filtroNombre}
                onChange={e => setFiltroNombre(e.target.value)}
                className="input-filtro-integrado"
              >
                <option value="">Todos los usuarios</option>
                {nombresUnicos.map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
              
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={e => setFiltroFechaInicio(e.target.value)}
                className="input-filtro-integrado"
                placeholder="Fecha inicio"
              />
              
              <input
                type="date"
                value={filtroFechaFin}
                onChange={e => setFiltroFechaFin(e.target.value)}
                className="input-filtro-integrado"
                placeholder="Fecha fin"
              />
              
              <button
                onClick={() => {
                  setFiltroNombre('');
                  setFiltroFechaInicio('');
                  setFiltroFechaFin('');
                }}
                className="btn-limpiar-filtros"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total de registros:</span>
            <span className="stat-value">{asistenciasFiltradas.length}</span>
          </div>
          {filtroNombre && (
            <div className="stat-item">
              <span className="stat-label">Usuario seleccionado:</span>
              <span className="stat-value">{filtroNombre}</span>
            </div>
          )}
        </div>

        <div className="table-container">
          {asistenciasFiltradas.length === 0 ? (
            <div className="no-data-message">
              <AlertCircle size={48} className="text-gray-400 mb-4" />
              <h3>No se encontraron registros</h3>
              <p>No hay registros de asistencia que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <EncabezadoTabla />
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asistenciasFiltradas.map((asistencia) => (
                      <FilaHistorial key={asistencia.id} asistencia={asistencia} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="animated-bg"></div>
    </div>
  );
}

export default HistorialAsistencias;