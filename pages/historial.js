import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Download, Loader, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

// --- Componentes de UI reutilizables ---

const BotonAccion = ({ onClick, children, color, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center font-bold py-2 px-4 rounded-lg transition-colors duration-300 ${color} ${className}`}>
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
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">{asistencia.usuario_nombre || 'Desconocido'}</td>
      <td className="px-6 py-4 whitespace-nowrap">{new Date(asistencia.fecha).toLocaleDateString()}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.entrada_laboral)}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.salida_almuerzo)}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.entrada_almuerzo)}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatearHora(asistencia.salida_laboral)}</td>
    </tr>
  );
};

const HistorialTabla = ({ asistencias }) => (
  <div className="bg-white shadow-md rounded-lg overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <EncabezadoTabla />
      <tbody className="bg-white divide-y divide-gray-200">
        {asistencias.length > 0 ? (
          asistencias.map((asistencia) => (
            <FilaHistorial key={asistencia.id} asistencia={asistencia} />
          ))
        ) : (
          <tr>
            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
              No se encontraron registros de asistencia.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// --- Componente Principal ---

export default function HistorialAsistencias() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchAsistencias = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/historial/`, {
          credentials: 'include',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'No se pudo obtener el historial de asistencias.');
        }
        const data = await response.json();
        // Asumiendo que la API devuelve un array de objetos
        setAsistencias(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAsistencias();
  }, []);

  const handleExportExcel = () => {
    const datosParaExportar = asistencias.map(a => ({
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
    XLSX.writeFile(workbook, 'HistorialAsistencias.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">Historial de Asistencias</h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <BotonAccion onClick={() => router.push('/registrar')} color="bg-blue-500 text-white hover:bg-blue-600">
            <Plus className="h-5 w-5 mr-2" />
            Registrar
          </BotonAccion>
          <BotonAccion onClick={handleExportExcel} color="bg-green-500 text-white hover:bg-green-600" disabled={asistencias.length === 0}>
            <Download className="h-5 w-5 mr-2" />
            Excel
          </BotonAccion>
        </div>
      </header>

      <main>
        {loading && <EstadoCarga />}
        {error && <MensajeError mensaje={error} />}
        {!loading && !error && <HistorialTabla asistencias={asistencias} />}
      </main>
    </div>
  );
}