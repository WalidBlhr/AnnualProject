import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: number[];
  isOnline: (userId: number) => boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  isOnline: () => false
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Créer la connexion socket seulement si l'utilisateur est authentifié
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:3000', {
        auth: {
          token
        }
      });

      setSocket(newSocket);

      // Écouter les changements de statut des utilisateurs
      newSocket.on('user_status_change', (data: { userId: number, status: 'online' | 'offline' }) => {
        setOnlineUsers(prev => {
          if (data.status === 'online' && !prev.includes(data.userId)) {
            return [...prev, data.userId];
          } else if (data.status === 'offline') {
            return prev.filter(id => id !== data.userId);
          }
          return prev;
        });
      });

      // Nettoyer la connexion socket à la déconnexion
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  const isOnline = (userId: number) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
};