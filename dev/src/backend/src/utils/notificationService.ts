import { AppDataSource } from "../db/database";
import { Message } from "../db/models/message";
import { User } from "../db/models/user";

export interface NotificationData {
  type: 'troc' | 'service' | 'event' | 'booking' | 'absence' | 'message' | 'general';
  title: string;
  content: string;
  receiverId: number;
  senderId?: number;
  relatedId?: number; // ID de l'objet lié (troc, service, event, etc.)
}

export class NotificationService {
  private static messageRepository = AppDataSource.getRepository(Message);
  private static userRepository = AppDataSource.getRepository(User);

  /**
   * Envoie une notification sous forme de message système
   */
  static async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Récupérer le destinataire
      const receiver = await this.userRepository.findOneBy({ id: data.receiverId });
      if (!receiver) {
        console.error(`Utilisateur ${data.receiverId} non trouvé`);
        return;
      }

      // Récupérer l'expéditeur (peut être null pour les notifications système)
      let sender = null;
      if (data.senderId) {
        sender = await this.userRepository.findOneBy({ id: data.senderId });
      }

      // Créer le message de notification
      const notification = this.messageRepository.create({
        content: `[${data.type.toUpperCase()}] ${data.title}\n\n${data.content}`,
        date_sent: new Date(),
        sender: sender ?? undefined,
        receiver: receiver,
        status: 'unread'
      });

      await this.messageRepository.save(notification);
      console.log(`Notification envoyée à ${receiver.firstname} ${receiver.lastname}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  }

  /**
   * Notifications pour les trocs
   */
  static async notifyNewTroc(trocId: number, trocTitle: string, trocType: 'offer' | 'request', creatorId: number) {
    // Envoyer une notification à tous les utilisateurs sauf le créateur
    try {
      const users = await this.userRepository.find();
      const promises = users
        .filter(user => user.id !== creatorId)
        .map(user => this.sendNotification({
          type: 'troc',
          title: `Nouveau ${trocType === 'offer' ? 'troc offert' : 'troc demandé'}`,
          content: `${trocType === 'offer' ? 'Une nouvelle offre' : 'Une nouvelle demande'} de troc "${trocTitle}" a été publiée.`,
          receiverId: user.id,
          senderId: creatorId,
          relatedId: trocId
        }));
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications de troc:', error);
    }
  }

  static async notifyTrocStatusChange(trocId: number, trocTitle: string, newStatus: string, ownerId: number) {
    await this.sendNotification({
      type: 'troc',
      title: 'Statut de troc modifié',
      content: `Le statut de votre troc "${trocTitle}" est maintenant: ${newStatus}`,
      receiverId: ownerId,
      relatedId: trocId
    });
  }

  /**
   * Notifications pour les services
   */
  static async notifyNewService(serviceId: number, serviceTitle: string, providerId: number) {
    try {
      const users = await this.userRepository.find();
      const promises = users
        .filter(user => user.id !== providerId)
        .map(user => this.sendNotification({
          type: 'service',
          title: 'Nouveau service disponible',
          content: `Un nouveau service "${serviceTitle}" est maintenant disponible.`,
          receiverId: user.id,
          senderId: providerId,
          relatedId: serviceId
        }));
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications de service:', error);
    }
  }

  static async notifyServiceBooked(serviceId: number, serviceTitle: string, providerId: number, requesterId: number, day: string, timeSlot: string) {
    await this.sendNotification({
      type: 'booking',
      title: 'Nouvelle réservation',
      content: `Votre service "${serviceTitle}" a été réservé pour le ${day} à ${timeSlot}.`,
      receiverId: providerId,
      senderId: requesterId,
      relatedId: serviceId
    });
  }

  static async notifyBookingAccepted(serviceId: number, serviceTitle: string, requesterId: number, providerId: number) {
    await this.sendNotification({
      type: 'booking',
      title: 'Réservation acceptée',
      content: `Votre réservation pour le service "${serviceTitle}" a été acceptée.`,
      receiverId: requesterId,
      senderId: providerId,
      relatedId: serviceId
    });
  }

  static async notifyBookingCanceled(serviceId: number, serviceTitle: string, receiverId: number, canceledBy: number) {
    await this.sendNotification({
      type: 'booking',
      title: 'Réservation annulée',
      content: `La réservation pour le service "${serviceTitle}" a été annulée.`,
      receiverId: receiverId,
      senderId: canceledBy,
      relatedId: serviceId
    });
  }

  /**
   * Notifications pour les événements
   */
  static async notifyNewEvent(eventId: number, eventTitle: string, creatorId: number) {
    try {
      const users = await this.userRepository.find();
      const promises = users
        .filter(user => user.id !== creatorId)
        .map(user => this.sendNotification({
          type: 'event',
          title: 'Nouvel événement',
          content: `Un nouvel événement "${eventTitle}" a été créé. Venez participer !`,
          receiverId: user.id,
          senderId: creatorId,
          relatedId: eventId
        }));
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications d\'événement:', error);
    }
  }

  static async notifyEventParticipation(eventId: number, eventTitle: string, participantId: number, creatorId: number) {
    await this.sendNotification({
      type: 'event',
      title: 'Nouvelle participation',
      content: `Un utilisateur s'est inscrit à votre événement "${eventTitle}".`,
      receiverId: creatorId,
      senderId: participantId,
      relatedId: eventId
    });
  }

  static async notifyEventCanceled(eventId: number, eventTitle: string, participantIds: number[]) {
    const promises = participantIds.map(participantId => 
      this.sendNotification({
        type: 'event',
        title: 'Événement annulé',
        content: `L'événement "${eventTitle}" auquel vous étiez inscrit a été annulé.`,
        receiverId: participantId,
        relatedId: eventId
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Notifications pour les absences
   */
  static async notifyAbsenceRequest(absenceId: number, userId: number, startDate: Date, endDate: Date, trustedContactIds: number[]) {
    const formatDate = (date: Date) => date.toLocaleDateString('fr-FR');
    
    const promises = trustedContactIds.map(contactId => 
      this.sendNotification({
        type: 'absence',
        title: 'Demande de surveillance',
        content: `Un voisin vous demande de surveiller son logement du ${formatDate(startDate)} au ${formatDate(endDate)}.`,
        receiverId: contactId,
        senderId: userId,
        relatedId: absenceId
      })
    );
    
    await Promise.all(promises);
  }

  static async notifyAbsenceResponse(absenceId: number, contactId: number, ownerId: number, response: 'accepted' | 'refused') {
    await this.sendNotification({
      type: 'absence',
      title: `Réponse à votre demande de surveillance`,
      content: `Votre demande de surveillance a été ${response === 'accepted' ? 'acceptée' : 'refusée'}.`,
      receiverId: ownerId,
      senderId: contactId,
      relatedId: absenceId
    });
  }

  /**
   * Notifications générales
   */
  static async notifyWelcome(userId: number) {
    await this.sendNotification({
      type: 'general',
      title: 'Bienvenue sur Quartissimo !',
      content: 'Bienvenue dans votre communauté de quartier ! Explorez les trocs, services et événements disponibles.',
      receiverId: userId
    });
  }

  static async notifyTrustedContactAdded(userId: number, trustedUserId: number) {
    await this.sendNotification({
      type: 'general',
      title: 'Nouveau contact de confiance',
      content: 'Vous avez été ajouté comme contact de confiance par un voisin.',
      receiverId: trustedUserId,
      senderId: userId
    });
  }
}
