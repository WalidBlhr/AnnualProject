import { Notification } from '../contexts/NotificationContext';

interface MessageData {
  id: number;
  content: string;
  date_sent: string;
  sender?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  receiver?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  status: string;
}

export class NotificationParser {
  /**
   * Parse un message pour déterminer s'il s'agit d'une notification système
   * et le convertir en notification appropriée
   */
  static parseMessage(message: MessageData): Notification | null {
    const content = message.content;
    
    // Détecter les notifications par type à partir du contenu
    if (content.startsWith('[TROC]')) {
      return this.parseTrocNotification(message);
    } else if (content.startsWith('[SERVICE]')) {
      return this.parseServiceNotification(message);
    } else if (content.startsWith('[EVENT]')) {
      return this.parseEventNotification(message);
    } else if (content.startsWith('[BOOKING]')) {
      return this.parseBookingNotification(message);
    } else if (content.startsWith('[ABSENCE]')) {
      return this.parseAbsenceNotification(message);
    } else if (content.startsWith('[GENERAL]')) {
      return this.parseGeneralNotification(message);
    } else {
      // Message normal
      return this.parseRegularMessage(message);
    }
  }

  private static parseTrocNotification(message: MessageData): Notification {
    const content = message.content.replace('[TROC]', '').trim();
    const lines = content.split('\n\n');
    const title = lines[0];
    const messageContent = lines[1] || '';

    return {
      id: `troc-${message.id}`,
      type: 'troc',
      title,
      message: messageContent,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  private static parseServiceNotification(message: MessageData): Notification {
    const content = message.content.replace('[SERVICE]', '').trim();
    const lines = content.split('\n\n');
    const title = lines[0];
    const messageContent = lines[1] || '';

    return {
      id: `service-${message.id}`,
      type: 'service',
      title,
      message: messageContent,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  private static parseEventNotification(message: MessageData): Notification {
    const content = message.content.replace('[EVENT]', '').trim();
    const lines = content.split('\n\n');
    const title = lines[0];
    const messageContent = lines[1] || '';

    return {
      id: `event-${message.id}`,
      type: 'event',
      title,
      message: messageContent,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  private static parseBookingNotification(message: MessageData): Notification {
    const content = message.content.replace('[BOOKING]', '').trim();
    const lines = content.split('\n\n');
    const title = lines[0];
    const messageContent = lines[1] || '';

    return {
      id: `booking-${message.id}`,
      type: 'booking',
      title,
      message: messageContent,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  private static parseAbsenceNotification(message: MessageData): Notification {
    const content = message.content.replace('[ABSENCE]', '').trim();
    const lines = content.split('\n\n');
    const title = lines[0];
    const messageContent = lines[1] || '';

    return {
      id: `absence-${message.id}`,
      type: 'absence',
      title,
      message: messageContent,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  private static parseGeneralNotification(message: MessageData): Notification {
    const content = message.content.replace('[GENERAL]', '').trim();
    const lines = content.split('\n\n');
    const title = lines[0];
    const messageContent = lines[1] || '';

    return {
      id: `general-${message.id}`,
      type: 'general',
      title,
      message: messageContent,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  private static parseRegularMessage(message: MessageData): Notification {
    const senderName = message.sender 
      ? `${message.sender.firstname || ''} ${message.sender.lastname || ''}`.trim()
      : 'Utilisateur';

    return {
      id: `message-${message.id}`,
      type: 'message',
      title: 'Nouveau message',
      message: `Message de ${senderName}: ${(message.content || '').substring(0, 100)}${(message.content || '').length > 100 ? '...' : ''}`,
      isRead: message.status === 'read',
      createdAt: new Date(message.date_sent),
      data: { messageId: message.id, senderId: message.sender?.id }
    };
  }

  /**
   * Filtre les messages pour ne retourner que ceux qui correspondent à des notifications
   * pour l'utilisateur connecté
   */
  static filterNotifications(messages: MessageData[], currentUserId: number): Notification[] {
    console.log(`filterNotifications: Processing ${messages.length} messages for user ${currentUserId}`);
    
    return messages
      .filter(message => {
        // Messages reçus par l'utilisateur connecté (incluant lus et non lus)
        const isIncoming = message.receiver?.id === currentUserId;
        if (isIncoming) {
          console.log(`filterNotifications: Message ${message.id} is incoming for user ${currentUserId}`, {
            receiverId: message.receiver?.id,
            status: message.status,
            content: (message.content || '').substring(0, 50)
          });
        }
        return isIncoming;
      })
      .map(message => {
        const notification = this.parseMessage(message);
        if (notification) {
          console.log(`filterNotifications: Parsed notification:`, {
            id: notification.id,
            type: notification.type,
            isRead: notification.isRead,
            title: notification.title
          });
        }
        return notification;
      })
      .filter((notification): notification is Notification => notification !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Trier par date décroissante
  }

  /**
   * Filtre uniquement les notifications non lues
   */
  static filterUnreadNotifications(messages: MessageData[], currentUserId: number): Notification[] {
    return messages
      .filter(message => {
        // Messages reçus par l'utilisateur connecté qui ne sont pas lus
        const isIncoming = message.receiver?.id === currentUserId;
        const isUnread = message.status === 'unread';
        return isIncoming && isUnread;
      })
      .map(message => this.parseMessage(message))
      .filter((notification): notification is Notification => notification !== null);
  }
}
