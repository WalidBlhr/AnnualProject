// Utilitaire pour déboguer et gérer la synchronisation des notifications

export class NotificationDebug {
  static log(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NotificationDebug] ${message}`, data || '');
    }
  }

  static logNotificationAction(action: string, notificationId: string, messageId?: number) {
    this.log(`${action} - Notification: ${notificationId}${messageId ? `, Message: ${messageId}` : ''}`);
  }

  static logApiCall(endpoint: string, method: string, data?: any) {
    this.log(`API ${method} ${endpoint}`, data);
  }
}

export class NotificationSync {
  /**
   * Attendre un délai avant de rafraîchir les données
   */
  static async delayedRefresh(refreshFunction: () => Promise<void>, delay: number = 500): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await refreshFunction();
          resolve();
        } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
          resolve();
        }
      }, delay);
    });
  }

  /**
   * Retry logic pour les appels API
   */
  static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries reached');
  }
}
