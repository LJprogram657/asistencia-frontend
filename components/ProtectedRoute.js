import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getToken, getUserRole, fetchUserInfo } from '../auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Verificar información del usuario
        const userInfo = await fetchUserInfo();
        
        if (!userInfo) {
          router.push('/login');
          return;
        }

        // Si se especifican roles permitidos, verificar
        if (allowedRoles.length > 0) {
          const userRole = userInfo.rol;
          if (!allowedRoles.includes(userRole)) {
            // Redirigir según el rol del usuario
            if (userRole === 'Administrador') {
              router.push('/historial');
            } else {
              router.push('/registrar');
            }
            return;
          }
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
};

export default ProtectedRoute;