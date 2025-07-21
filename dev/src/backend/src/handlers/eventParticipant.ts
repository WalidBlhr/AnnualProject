import { Request, Response } from "express";
import { createEventParticipantValidation, updateEventParticipantValidation, EventParticipantIdValidation, ListEventParticipantsValidation } from "./validators/eventParticipant";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { EventParticipant } from "../db/models/event_participant";
import { User } from "../db/models/user";
import { Event } from "../db/models/event";
import { Not } from "typeorm";
import { Message } from "../db/models/message";
import { NotificationService } from "../utils/notificationService";
import { AutoInteractionService } from "../services/autoInteractionService";

/**
 * Create a new EventParticipant
 * POST /eventParticipants
 */
export const createEventParticipantHandler = async (req: Request, res: Response) => {
  try {
    const validation = createEventParticipantValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const { userId, eventId, date_inscription, status_participation, comment } = validation.value;

    // Récupérer les entités User et Event
    const userRepository = AppDataSource.getRepository(User);
    const eventRepository = AppDataSource.getRepository(Event);
    const eventParticipantRepository = AppDataSource.getRepository(EventParticipant);

    // Trouver les objets complets
    const user = await userRepository.findOneBy({ id: userId });
    const event = await eventRepository.findOne({where: {id: eventId}, relations: ["creator"] });

    if (!user || !event) {
      res.status(404).send({ message: "Utilisateur ou événement non trouvé" });
      return;
    }

    // Vérifier si l'événement a atteint son quota maximum
    const currentParticipantsCount = await eventParticipantRepository.count({
      where: {
        event: { id: eventId },
        status_participation: Not('canceled')
      }
    });

    if (currentParticipantsCount >= event.max_participants) {
      res.status(400).send({ error: "Le nombre maximum de participants est atteint" });
      return;
    }

    // Créer l'inscription avec le constructeur comme dans vos autres handlers
    const eventParticipant = new EventParticipant(
      0, // L'ID sera généré automatiquement
      user,
      event,
      new Date(date_inscription),
      status_participation || 'pending',
      comment
    );

    const eventParticipantCreated = await eventParticipantRepository.save(eventParticipant);

    // Enregistrer l'interaction de participation à un événement
    await AutoInteractionService.onEventJoined(
      eventId,
      event.name,
      event.category || 'general',
      event.creator.id,
      userId
    );

    // Envoyer une notification au créateur de l'événement
    const eventWithCreator = await eventRepository.findOne({
      where: { id: eventId },
      relations: ['creator']
    });

    if (eventWithCreator && eventWithCreator.creator.id !== userId) {
      await NotificationService.notifyEventParticipation(
        eventId,
        event.name,
        userId,
        eventWithCreator.creator.id
      );
    }

    // Vérifier si l'événement a atteint son quota minimum (pour le marquer comme confirmé)
    if (currentParticipantsCount + 1 >= (event.min_participants ?? 0) && event.status === 'pending') {
      event.status = 'confirmed';
      await eventRepository.save(event);

      // Notifier tous les participants que l'événement est confirmé
      if (event.type === 'community') {
        const messageRepository = AppDataSource.getRepository(Message);
        const newMessage = messageRepository.create({
          content: `Votre événement communautaire "${event.name}" a atteint le nombre minimum de participants et est maintenant confirmé!`,
          date_sent: new Date(),
          sender: { id: 1 } as User,
          receiver: event.creator,
          status: 'unread'
        });
        await messageRepository.save(newMessage);
      }

      await sendEventConfirmationNotifications(event.id);
    }

    res.status(201).send(eventParticipantCreated);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "internal error" });
  }
};

/**
 * Lire la liste des eventParticipants (READ multiple)
 * GET /eventParticipants
 */
export const listEventParticipantHandler = async (req: Request, res: Response) => {
  try {
    const validation = ListEventParticipantsValidation.validate(req.query);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listEventParticipantRequest = validation.value;
    console.log(listEventParticipantRequest);

    // Créer la requête avec des jointures pour obtenir les détails utilisateur
    const query = AppDataSource.createQueryBuilder(EventParticipant, 'eventParticipant')
      .leftJoinAndSelect('eventParticipant.user', 'user')
      .leftJoinAndSelect('eventParticipant.event', 'event')
      .select([
        'eventParticipant',
        'user.id',
        'user.firstname',
        'user.lastname',
        'event.id', 
        'event.name'
      ]);

    // Appliquer le filtre eventId s'il est présent
    if (listEventParticipantRequest.eventId) {
      query.andWhere("eventParticipant.event_id = :eventId", { eventId: listEventParticipantRequest.eventId });
    }

    // Pagination
    query.skip((listEventParticipantRequest.page - 1) * listEventParticipantRequest.limit);
    query.take(listEventParticipantRequest.limit);

    const [eventParticipants, totalCount] = await query.getManyAndCount();

    const page = listEventParticipantRequest.page;
    const totalPages = Math.ceil(totalCount / listEventParticipantRequest.limit);

    res.send({
      data: eventParticipants,
      page_size: listEventParticipantRequest.limit,
      page,
      total_count: totalCount,
      total_pages: totalPages,
    });

  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ "message": "internal error" });
  }
};

/**
 * Récupérer le détail d’une EventParticipant par id (READ single)
 * GET /eventParticipants/:id
 */
export const detailedEventParticipantHandler = async (req: Request, res: Response) => {
  try {
      const validation = EventParticipantIdValidation.validate(req.params);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const getEventParticipantRequest = validation.value
      const eventParticipantRepository = AppDataSource.getRepository(EventParticipant)
      const eventParticipant = await eventParticipantRepository.findOne({
          where: { id: getEventParticipantRequest.id }
      })
      if (eventParticipant === null) {
          res.status(404).send({ "message": "resource not found" })
          return
      }

      res.status(200).send(eventParticipant);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Mise à jour d’une EventParticipant
 * PUT /eventParticipants/:id
 */
export const updateEventParticipantHandler = async (req: Request, res: Response) => {
  try {
      const validation = updateEventParticipantValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateEventParticipant = validation.value
      const eventParticipantRepository = AppDataSource.getRepository(EventParticipant)
      const eventParticipantFound = await eventParticipantRepository.findOne({
          where: { id: updateEventParticipant.id },
          relations: ['event', 'event.creator']
      })
      if (eventParticipantFound === null) {
          res.status(404).send({ "error": `eventParticipant ${updateEventParticipant.id} not found` })
          return
      }

      // Vérifier que l'utilisateur connecté est le créateur de l'événement
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
          res.status(401).send({ error: 'Non authentifié' });
          return;
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, "valuerandom") as { userId: number };
      
      if (eventParticipantFound.event.creator.id !== decoded.userId) {
          res.status(403).send({ "error": "Seul le créateur de l'événement peut modifier les participations" })
          return
      }

      // Mettre à jour les champs spécifiés
      if (updateEventParticipant.status_participation !== undefined) {
          eventParticipantFound.status_participation = updateEventParticipant.status_participation
          console.log(`Mise à jour du statut du participant ${updateEventParticipant.id} vers: ${updateEventParticipant.status_participation}`);
      }
      if (updateEventParticipant.date_inscription !== undefined) {
          eventParticipantFound.date_inscription = updateEventParticipant.date_inscription
      }
      if (updateEventParticipant.comment !== undefined) {
          eventParticipantFound.comment = updateEventParticipant.comment
      }

      const eventParticipantUpdate = await eventParticipantRepository.save(eventParticipantFound)
      console.log(`Participant mis à jour:`, eventParticipantUpdate);
      res.status(200).send(eventParticipantUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Suppression d’une EventParticipant
 * DELETE /eventParticipants/:id
 */
export const deleteEventParticipantHandler = async (req: Request, res: Response) => {
  try {
      const validation = EventParticipantIdValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateEventParticipant = validation.value
      const eventParticipantRepository = AppDataSource.getRepository(EventParticipant)
      const eventParticipantFound = await eventParticipantRepository.findOneBy({ id: updateEventParticipant.id })
      if (eventParticipantFound === null) {
          res.status(404).send({ "error": `eventParticipant ${updateEventParticipant.id} not found` })
          return
      }

      const eventParticipantDeleted = await eventParticipantRepository.remove(eventParticipantFound)
      res.status(200).send(eventParticipantDeleted)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

// Ajouter cette fonction pour envoyer une notification aux participants des événements communautaires
async function sendEventConfirmationNotifications(eventId: number) {
  const eventRepository = AppDataSource.getRepository(Event);
  const participantRepository = AppDataSource.getRepository(EventParticipant);
  const messageRepository = AppDataSource.getRepository(Message);

  const event = await eventRepository.findOne({
    where: { id: eventId },
    relations: ['creator']
  });

  if (!event) return;

  // Récupérer tous les participants
  const participants = await participantRepository.find({
    where: { event: { id: eventId } },
    relations: ['user']
  });

  // Pour chaque participant, envoyer un message
  const messagePromises = participants.map(participant => {
    const messageRepository = AppDataSource.getRepository(Message);
    const newMessage = messageRepository.create({
      content: `L'événement "${event.name}" auquel vous êtes inscrit est maintenant confirmé et aura lieu le ${new Date(event.date).toLocaleDateString()} à ${event.location}.`,
      date_sent: new Date(),
      sender: event.creator,
      receiver: participant.user,
      status: 'unread'
    });
    return messageRepository.save(newMessage);
  });

  await Promise.all(messagePromises);
}

