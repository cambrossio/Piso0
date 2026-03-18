import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUsuario(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUsuario(res.data.usuario);
    return res.data;
  };

  const register = async (nombre, email, password, telefono, direccion) => {
    const res = await api.post('/auth/register', { nombre, email, password, telefono, direccion });
    localStorage.setItem('token', res.data.token);
    setUsuario(res.data.usuario);
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUsuario(res.data);
    return res.data;
  };

  const loginGoogle = async (googleId, email, nombre) => {
    const res = await api.post('/auth/google', { googleId, email, nombre });
    localStorage.setItem('token', res.data.token);
    setUsuario(res.data.usuario);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, register, loginGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
