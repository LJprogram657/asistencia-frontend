// Funciones para manejo de tokens JWT
export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

export function getRefreshToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

export function setTokens(accessToken, refreshToken) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
}

export function removeTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  }
}

// Nuevas funciones para manejo de información del usuario
export function setUserInfo(userInfo) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }
}

export function getUserInfo() {
  if (typeof window !== 'undefined') {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }
  return null;
}

export function getUserRole() {
  const userInfo = getUserInfo();
  return userInfo?.rol || null;
}

// Función para obtener información del usuario desde el backend
export async function fetchUserInfo() {
  try {
    const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/asistencia/api/user-status/`);
    if (response && response.ok) {
      const userInfo = await response.json();
      setUserInfo(userInfo);
      return userInfo;
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
  return null;
}

// Función para redirección basada en rol
export function redirectBasedOnRole(router, role) {
  if (role === 'Administrador') {
    router.push('/historial');
  } else if (role === 'Empleado') {
    router.push('/registrar');
  } else {
    // Si no tiene rol definido, redirigir a registrar por defecto
    router.push('/registrar');
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    setTokens(data.access, data.refresh || refreshToken);
    return data.access;
  } catch (error) {
    removeTokens();
    throw error;
  }
}

export async function makeAuthenticatedRequest(url, options = {}) {
  let token = getToken();
  
  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
      // Redirigir al login si no se puede refrescar el token
      window.location.href = '/login';
      return;
    }
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si aún así obtenemos 401, intentar refrescar una vez más
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          'Authorization': `Bearer ${token}`,
        },
      });
      return retryResponse;
    } catch (error) {
      window.location.href = '/login';
      return;
    }
  }

  return response;
}