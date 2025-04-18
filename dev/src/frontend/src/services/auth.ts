import axios from 'axios';
import jwtDecode from 'jwt-decode';

const API_URL = 'http://localhost:3000';

export const login = async (email: string, password: string) => {
    interface LoginResponse {
        token?: string;
    }
    
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
        email,
        password
    });
    
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
};

export const signup = async (data: {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
}) => {
    const response = await axios.post(`${API_URL}/auth/signup`, {
        ...data,
        role: 0 // 0 = user par défaut
    });
    return response.data;
};

interface DecodedToken {
  userId: number;
  email: string;
  role: number;
}

export const getUser = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  }
  return null;
};

export const isAdmin = (): boolean => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        return decoded.role === 1;
      } catch {
        return false;
      }
    }
    return false;
  };