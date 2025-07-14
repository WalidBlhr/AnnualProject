import { Request, Response } from "express";
import { createEventValidation, updateEventValidation, EventIdValidation, ListEventsValidation } from "./validators/event";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Event } from "../db/models/event";
import { User } from "../db/models/user";
import jwt from "jsonwebtoken";
import { NotificationService } from "../utils/notificationService";

/**
 * Create a new Event
 * POST /events
 */
export const createEventHandler = async (req: Request, res: Response) => {
  try {
      const validation = createEventValidation.validate(req.body);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details));
          return;
      }

      const { 
          name, date, location, max_participants, min_participants, status, 
          creatorId, type, category, description, equipment_needed 
      } = validation.value;

      // Récupérer le créateur de l'événement
      const userRepository = AppDataSource.getRepository(User);
      
      // Authentification
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
          res.status(401).send({ error: 'Non authentifié' });
          return;
      }
      
      const decoded = jwt.verify(token, "valuerandom") as { userId: number };
      
      const user = await userRepository.findOneBy({ id: creatorId || decoded.userId });
      if (!user) {
          res.status(404).send({ "message": "creator not found" });
          return;
      }

      // Créer l'événement
      const event = new Event(
          0, // ID auto-généré
          name,
          new Date(date),
          location,
          max_participants,
          min_participants || null,
          status,
          user,
          type || "regular",
          category || null,
          description || null,
          equipment_needed || null,
          [] // Empty array for participants
      );

      const eventRepository = AppDataSource.getRepository(Event);
      const eventCreated = await eventRepository.save(event);

      // Envoyer une notification pour le nouvel événement
      await NotificationService.notifyNewEvent(
          eventCreated.id,
          eventCreated.name,
          user.id
      );
      
      res.status(201).send(eventCreated);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`);
      }
      res.status(500).send({ "message": "internal error" });
  }
}

/**
 * Lire la liste des events (READ multiple)
 * GET /events
 */
export const listEventHandler = async (req: Request, res: Response) => {
  try {
      const validation = ListEventsValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listEventRequest = validation.value;
      console.log(listEventRequest);

      const query = AppDataSource.createQueryBuilder(Event, 'event')
                               .leftJoinAndSelect("event.creator", "user")
                               .leftJoin("event.participants", "participants")
                               .addSelect("COUNT(participants.id)", "participantsCount")
                               .groupBy("event.id")
                               .addGroupBy("user.id");

      // Filtrer par type d'événement si spécifié
      if (listEventRequest.type) {
          query.andWhere("event.type = :type", { type: listEventRequest.type });
      }

      // Filtrer par catégorie si spécifiée
      if (listEventRequest.category) {
          query.andWhere("event.category = :category", { category: listEventRequest.category });
      }

      query.skip((listEventRequest.page - 1) * listEventRequest.limit);
      query.take(listEventRequest.limit);

      const eventsWithCount = await query.getRawAndEntities();
      const totalCount = await AppDataSource.createQueryBuilder(Event, 'event').getCount();

      // Mapper les résultats pour inclure le nombre de participants
      const eventsWithParticipantsCount = eventsWithCount.entities.map((event, index) => ({
          ...event,
          participantsCount: parseInt(eventsWithCount.raw[index].participantsCount) || 0
      }));

      const page = listEventRequest.page;
      const totalPages = Math.ceil(totalCount / listEventRequest.limit);

      res.send({
          data: eventsWithParticipantsCount,
          page_size: listEventRequest.limit,
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
}

/**
 * Récupérer le détail d’une Event par id (READ single)
 * GET /events/:id
 */
export const detailedEventHandler = async (req: Request, res: Response) => {
  try {
      const validation = EventIdValidation.validate(req.params);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const getEventRequest = validation.value
      const eventRepository = AppDataSource.getRepository(Event)
      const event = await eventRepository.findOne({
          where: { id: getEventRequest.id },
          relations: ['creator']
      })
      if (event === null) {
          res.status(404).send({ "message": "resource not found" })
          return
      }

      res.status(200).send(event);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Mise à jour d’une Event
 * PUT /events/:id
 */
export const updateEventHandler = async (req: Request, res: Response) => {
  try {
      const validation = updateEventValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateEvent = validation.value
      const eventRepository = AppDataSource.getRepository(Event)
      const eventFound = await eventRepository.findOne({
          where: { id: updateEvent.id },
          relations: ['creator']
      })
      if (eventFound === null) {
          res.status(404).send({ "error": `event ${updateEvent.id} not found` })
          return
      }

      // Vérifier que l'utilisateur connecté est le créateur de l'événement
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
          res.status(401).send({ error: 'Non authentifié' });
          return;
      }
      
      const decoded = jwt.verify(token, "valuerandom") as { userId: number };
      
      if (eventFound.creator.id !== decoded.userId) {
          res.status(403).send({ "error": "You can only modify your own events" })
          return
      }

      // Permettre la modification du statut même pour les événements non-brouillon
      // Mais limiter les autres modifications aux brouillons uniquement
      const isStatusOnlyUpdate = Object.keys(updateEvent).length === 2 && 
                                 updateEvent.id !== undefined && 
                                 updateEvent.status !== undefined;
      
      if (eventFound.status !== 'draft' && !isStatusOnlyUpdate) {
          res.status(400).send({ "error": "Only draft events can be fully modified. Published events can only have their status changed." })
          return
      }

      // Mettre à jour les champs de l'événement
      if (updateEvent.name) {
          eventFound.name = updateEvent.name
      }
      if (updateEvent.date) {
          eventFound.date = new Date(updateEvent.date)
      }
      if (updateEvent.location) {
          eventFound.location = updateEvent.location
      }
      if (updateEvent.max_participants) {
          eventFound.max_participants = updateEvent.max_participants
      }
      if (updateEvent.min_participants !== undefined) {
          eventFound.min_participants = updateEvent.min_participants
      }
      if (updateEvent.status) {
          eventFound.status = updateEvent.status
      }
      if (updateEvent.type) {
          eventFound.type = updateEvent.type
      }
      if (updateEvent.category !== undefined) {
          eventFound.category = updateEvent.category
      }
      if (updateEvent.description !== undefined) {
          eventFound.description = updateEvent.description
      }
      if (updateEvent.equipment_needed !== undefined) {
          eventFound.equipment_needed = updateEvent.equipment_needed
      }

      const eventUpdate = await eventRepository.save(eventFound)
      res.status(200).send(eventUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Suppression d’une Event
 * DELETE /events/:id
 */
export const deleteEventHandler = async (req: Request, res: Response) => {
  try {
      const validation = EventIdValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateEvent = validation.value
      const eventRepository = AppDataSource.getRepository(Event)
      const eventFound = await eventRepository.findOneBy({ id: updateEvent.id })
      if (eventFound === null) {
          res.status(404).send({ "error": `event ${updateEvent.id} not found` })
          return
      }

      const eventDeleted = await eventRepository.remove(eventFound)
      res.status(200).send(eventDeleted)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Fonction utilitaire pour vérifier et annuler automatiquement les événements
 * qui n'ont pas assez de participants
 */
export const checkAndCancelEvents = async () => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    
    // Récupérer tous les événements en attente (pending) avec un minimum de participants
    const pendingEvents = await eventRepository.createQueryBuilder("event")
      .leftJoinAndSelect("event.creator", "creator")
      .where("event.status = :status", { status: "pending" })
      .andWhere("event.min_participants > 0")
      .getMany();

    for (const event of pendingEvents) {
      // Compter le nombre de participants pour cet événement
      const participantCount = await AppDataSource.query(
        "SELECT COUNT(*) as count FROM event_participant WHERE eventId = ?",
        [event.id]
      );
      
      const count = parseInt(participantCount[0].count);
      
      // Si le nombre de participants est inférieur au minimum et que l'événement est dans le passé
      if (count < event.min_participants && new Date(event.date) < new Date()) {
        event.status = "canceled";
        await eventRepository.save(event);
        console.log(`Événement ${event.id} annulé automatiquement - pas assez de participants`);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des événements:", error);
  }
};

/**
 * Annuler manuellement un événement
 * PUT /events/:id/cancel
 */
export const cancelEventHandler = async (req: Request, res: Response) => {
  try {
    const validation = EventIdValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const eventId = validation.value.id;
    const eventRepository = AppDataSource.getRepository(Event);
    
    const event = await eventRepository.findOne({
      where: { id: eventId },
      relations: ['creator']
    });
    
    if (!event) {
      res.status(404).send({ error: "Événement non trouvé" });
      return;
    }

    // Vérifier que l'utilisateur est le créateur
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    
    if (decoded.userId !== event.creator.id) {
      res.status(403).send({ error: 'Seul le créateur peut annuler cet événement' });
      return;
    }

    // Annuler l'événement
    event.status = "canceled";
    const updatedEvent = await eventRepository.save(event);

    // Notifier tous les participants de l'annulation
    const EventParticipant = AppDataSource.getRepository(require("../db/models/event_participant").EventParticipant);
    const participants = await EventParticipant.find({
      where: { event: { id: eventId } },
      relations: ['user']
    });
    
    const participantIds = participants.map(p => p.user.id);
    if (participantIds.length > 0) {
      await NotificationService.notifyEventCanceled(eventId, event.name, participantIds);
    }
    
    res.status(200).send(updatedEvent);
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    res.status(500).send({ error: "Internal error" });
  }
};
