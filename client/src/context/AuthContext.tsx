import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api'; // 🚀 FIXED: Imported your Axios API instance

interface UserData {
  _id: string;
  name: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: UserData | null;
  login: (email: string, password: string) => Promise<boolean>; // 🚀 FIXED: Proper types for server calls
  register: (name: string, email: string, password: string) => Promise<boolean>; // 🚀 FIXED: Proper types for server calls
  completeAuth: (userData: UserData) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Lifecycle Hook: Load user from localStorage on boot
  useEffect(() => {
    const storedUser = localStorage.getItem('codesync_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as Partial<UserData>;
        if (parsedUser._id && parsedUser.name && parsedUser.email && parsedUser.token) {
          setUser(parsedUser as UserData);
        } else {
          localStorage.removeItem('codesync_user');
        }
      } catch (error) {
        console.error('Failed to parse local token session:', error);
        localStorage.removeItem('codesync_user');
      }
    }
    setLoading(false);
  }, []);

  // 🚀 FIXED: Real Asynchronous Login API Pipeline
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await API.post('/auth/login', { email, password });
      if (response.data && response.data.token) {
        setUser(response.data);
        localStorage.setItem('codesync_user', JSON.stringify(response.data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  };

  // 🚀 FIXED: Real Asynchronous Register API Pipeline (This connects your forms to Node.js)
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await API.post('/auth/register', { name, email, password });
      if (response.status === 201 && response.data?.token) {
        setUser(response.data);
        localStorage.setItem('codesync_user', JSON.stringify(response.data));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration request failed:', error);
      throw error;
    }
  };

  const completeAuth = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem('codesync_user', JSON.stringify(userData));
  };

  // Logout Teardown action
  const logout = () => {
    setUser(null);
    localStorage.removeItem('codesync_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, completeAuth, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be executed directly inside an AuthProvider boundary context');
  }
  return context;
};
