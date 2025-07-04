import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_URL } from '../const';

export interface Notification {
  id: string;
  type: 'message' | 'event' | 'troc' | 'service' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: any; // Données supplémentaires (ID du message, etc.)
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Ajouter une nouvelle notification
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Marquer une notification comme lue
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Supprimer toutes les notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Récupérer les notifications depuis le backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('token');
      
      // Récupérer tous les messages de l'utilisateur connecté
      const messagesResponse = await axios.get(
        `${API_URL}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Messages response:', messagesResponse.data);

      // Convertir les messages en notifications
      const messagesData = messagesResponse.data as any;
      // Vérifier si on a une structure avec data ou directement un tableau
      const messages = Array.isArray(messagesData) ? messagesData : messagesData.data || [];
      
      console.log('Messages found:', messages.length, 'messages');
      
      // Filtrer seulement les messages reçus par l'utilisateur connecté qui ne sont pas lus
      const incomingMessages = messages.filter((message: any) => {
        const isIncoming = message.receiver?.id === user.userId;
        const isUnread = message.status === 'unread';
        console.log(`Message ${message.id}: isIncoming=${isIncoming}, isUnread=${isUnread}, status=${message.status}`);
        return isIncoming && isUnread;
      });
      
      console.log('Incoming unread messages:', incomingMessages.length);
      
      const messageNotifications: Notification[] = incomingMessages.map((message: any) => {
        return {
          id: `message-${message.id}`,
          type: 'message' as const,
          title: 'Nouveau message',
          message: `Message de ${message.sender?.firstname || 'Utilisateur'}: ${(message.content || '').substring(0, 100)}${(message.content || '').length > 100 ? '...' : ''}`,
          isRead: false, // Puisqu'on ne prend que les messages non lus
          createdAt: new Date(message.createdAt || message.date_sent || Date.now()),
          data: { messageId: message.id, senderId: message.sender?.id }
        };
      });

      console.log('Message notifications created:', messageNotifications.length);

      // Fusionner avec les notifications existantes (éviter les doublons)
      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const newNotifications = messageNotifications.filter(n => !existingIds.includes(n.id));
        console.log('Adding new notifications:', newNotifications.length);
        return [...newNotifications, ...prev];
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  }, [isAuthenticated, user]);

  // Récupérer les notifications au chargement et périodiquement
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      
      // Actualiser toutes les 30 secondes
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
