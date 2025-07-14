import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_URL } from '../const';
import { NotificationParser } from '../utils/NotificationParser';
import { NotificationDebug, NotificationSync } from '../utils/NotificationDebug';

export interface Notification {
  id: string;
  type: 'message' | 'event' | 'troc' | 'service' | 'booking' | 'absence' | 'general';
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
  const markAsRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    NotificationDebug.logNotificationAction('Marking as read', notificationId, notification?.data?.messageId);

    // Marquer localement d'abord
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );

    // Synchroniser avec le backend
    if (notification?.data?.messageId) {
      try {
        const token = localStorage.getItem('token');
        NotificationDebug.logApiCall(`/messages/${notification.data.messageId}`, 'PUT', { status: 'read' });
        
        await NotificationSync.retryApiCall(async () => {
          await axios.put(
            `${API_URL}/messages/${notification.data.messageId}`,
            { status: 'read' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        });
        
        // Rafraîchir les notifications après la mise à jour
        await NotificationSync.delayedRefresh(fetchNotifications, 300);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        // En cas d'erreur, restaurer l'état local
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: false }
              : n
          )
        );
      }
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    NotificationDebug.log(`Marking ${unreadNotifications.length} notifications as read`);

    // Marquer localement d'abord
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    // Synchroniser avec le backend
    try {
      const token = localStorage.getItem('token');
      const messageIds = unreadNotifications
        .filter(n => n.data?.messageId)
        .map(n => n.data.messageId);

      NotificationDebug.log(`Updating ${messageIds.length} messages in backend`);

      // Marquer tous les messages comme lus
      await Promise.all(
        messageIds.map(messageId =>
          NotificationSync.retryApiCall(() =>
            axios.put(
              `${API_URL}/messages/${messageId}`,
              { status: 'read' },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        )
      );
      
      // Rafraîchir les notifications après la mise à jour
      await NotificationSync.delayedRefresh(fetchNotifications, 300);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
      // En cas d'erreur, restaurer l'état local
      setNotifications(prev =>
        prev.map(notification => {
          const wasUnread = unreadNotifications.some(n => n.id === notification.id);
          return wasUnread ? { ...notification, isRead: false } : notification;
        })
      );
    }
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
      NotificationDebug.logApiCall('/messages', 'GET');
      
      // Récupérer tous les messages de l'utilisateur connecté
      const messagesResponse = await axios.get(
        `${API_URL}/messages?page=1&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      NotificationDebug.log('Messages response received', { 
        isArray: Array.isArray(messagesResponse.data),
        hasData: !!messagesResponse.data?.data,
        count: Array.isArray(messagesResponse.data) ? messagesResponse.data.length : messagesResponse.data?.data?.length
      });

      // Convertir les messages en notifications en utilisant le parser
      const messagesData = messagesResponse.data as any;
      // Vérifier si on a une structure avec data ou directement un tableau
      const messages = Array.isArray(messagesData) ? messagesData : messagesData.data || [];
      
      NotificationDebug.log(`Processing ${messages.length} messages for user ${user.userId}`);
      
      // Utiliser le parser pour convertir les messages en notifications
      const messageNotifications = NotificationParser.filterNotifications(messages, Number(user.userId));
      
      NotificationDebug.log(`Created ${messageNotifications.length} notifications`, {
        unread: messageNotifications.filter(n => !n.isRead).length,
        read: messageNotifications.filter(n => n.isRead).length
      });

      // Remplacer toutes les notifications par les nouvelles (pour maintenir l'état synchronisé)
      setNotifications(messageNotifications);

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('URL:', error.config?.url);
      }
      // En cas d'erreur, on garde les notifications existantes
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
