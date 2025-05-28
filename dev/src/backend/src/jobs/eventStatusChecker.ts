// Nouveau fichier src/jobs/eventStatusChecker.ts
import { AppDataSource } from "../db/database";
import { Event } from "../db/models/event";
// Update the import path to match the actual file name and casing
import { EventParticipant } from "../db/models/event_participant";
import { LessThan, MoreThanOrEqual, Not } from "typeorm";
import { Message } from "../db/models/message";

// Cette fonction serait appelée périodiquement (par exemple avec node-cron)
export const checkEventStatus = async () => {
  const eventRepository = AppDataSource.getRepository(Event);
  const participantRepository = AppDataSource.getRepository(EventParticipant);
  const messageRepository = AppDataSource.getRepository(Message);
  
  // Date limite pour annuler un événement (par exemple 24h avant)
  const limitDate = new Date();
  limitDate.setHours(limitDate.getHours() + 24);
  
  // Trouver les événements qui:
  // 1. Sont en attente de confirmation
  // 2. Ont lieu dans moins de 24h
  // 3. N'ont pas assez de participants
  const eventsToCancel = await eventRepository.find({
    where: {
      status: 'pending',
      date: LessThan(limitDate)
    },
    relations: ['participants', 'participants.user']
  });
  
  for (const event of eventsToCancel) {
    const participantsCount = await participantRepository.count({
      where: {
        event: { id: event.id },
        status_participation: Not('canceled')
      }
    });
    
    if (participantsCount < (event.min_participants ?? 0)) {
      // Annuler l'événement
      event.status = 'canceled';
      await eventRepository.save(event);
      
      // Notifier tous les participants
      const participants = await participantRepository.find({
        where: { event: { id: event.id } },
        relations: ['user']
      });
      
      for (const participant of participants) {
        // Créer un message pour chaque participant
        const newMessage = messageRepository.create({
          content: `L'événement "${event.name}" prévu le ${new Date(event.date).toLocaleDateString()} a été annulé car le nombre minimum de participants n'a pas été atteint.`,
          date_sent: new Date(),
          sender: { id: 1 }, // Compte système ou organisateur
          receiver: participant.user,
          status: 'unread'
        });
        
        await messageRepository.save(newMessage);
      }
    }
  }
};