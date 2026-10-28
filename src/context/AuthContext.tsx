import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api, getStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (id: string, pass: string) => Promise<User>;
  registerStudent: (params: {
    studentId: string;
    fullName: string;
    email: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  isTechnicianOrAdmin: boolean;
  isAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      refreshMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (id: string, pass: string) => {
    const res = await api.login(id, pass);
    setUser(res.user);
    return res.user;
  };

  const registerStudent = async (params: {
    studentId: string;
    fullName: string;
    email: string;
    password: string;
  }) => {
    const res = await api.registerStudent(params);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const isTechnicianOrAdmin = user?.role === 'technician' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerStudent,
        logout,
        refreshMe,
        isTechnicianOrAdmin,
        isAdmin,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
