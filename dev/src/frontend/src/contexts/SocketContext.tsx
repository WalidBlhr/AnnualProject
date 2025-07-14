import React, {createContext, useContext, useEffect, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import {useAuth} from './AuthContext';
import axios from 'axios';
import {API_URL, BASE_URL} from '../const';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: number[];
  isOnline: (userId: number) => boolean;
  fetchUserStatus: (userId: number) => Promise<void>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  isOnline: () => false,
  fetchUserStatus: async () => {}
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  // Fonction pour charger le statut initial d'un ou plusieurs utilisateurs
  const fetchUserStatus = async (userId: number) => {
    if (!token) return;

    try {
      // Appel à notre nouvel endpoint
      const response = await axios.get(
        `${API_URL}/api/user-status?userId=${userId}`, // N.B.: on ne traite qu'un utilisateur à la fois
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Si l'utilisateur est en ligne, l'ajouter à notre liste
      if (response.data.status === 'online') {
        setOnlineUsers(prev => {
          if (!prev.includes(response.data.id)) {
            return [...prev, response.data.id];
          }
          return prev;
        });
      }

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      return null;
    }
  };

  useEffect(() => {
    // Créer la connexion socket seulement si l'utilisateur est authentifié
    console.log("Socket context : ", isAuthenticated, token);
    if (isAuthenticated && token) {
      const newSocket = io(BASE_URL, {
        path: "/api/socket.io",
        auth: {
          token
        },
        transports: ["websocket"],
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
    <SocketContext.Provider value={{ socket, onlineUsers, isOnline, fetchUserStatus }}>
      {children}
    </SocketContext.Provider>
  );
};