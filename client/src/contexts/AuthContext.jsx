import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // No token stored at all — definitely not logged in
      setLoading(false);
      return;
    }

    // Always validate the token against the server on every page load.
    // This ensures expired tokens, deleted accounts, or stale sessions
    // never bypass the login page.
    api
      .get('/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        // Token is invalid / expired / user no longer exists — force logout
        console.log('[Auth] Token validation failed. Clearing session.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = ({ token, ...userFromApi }) => {
    setUser(userFromApi);
    localStorage.setItem('user', JSON.stringify(userFromApi));
    if (token) localStorage.setItem('token', token);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
