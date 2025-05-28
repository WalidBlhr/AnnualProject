import { Request, Response } from "express";
import { createEventParticipantValidation, updateEventParticipantValidation, EventParticipantIdValidation, ListEventParticipantsValidation } from "./validators/eventParticipant";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { EventParticipant } from "../db/models/event_participant";
import { User } from "../db/models/user";
import { Event } from "../db/models/event";
import { Not } from "typeorm";

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

    const { userId, eventId, date_inscription, status_participation } = validation.value;
    
    // Récupérer les entités User et Event
    const userRepository = AppDataSource.getRepository(User);
    const eventRepository = AppDataSource.getRepository(Event);
    const eventParticipantRepository = AppDataSource.getRepository(EventParticipant);
    
    // Trouver les objets complets
    const user = await userRepository.findOneBy({ id: userId });
    const event = await eventRepository.findOneBy({ id: eventId });
    
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
      status_participation || 'pending'
    );
    
    const eventParticipantCreated = await eventParticipantRepository.save(eventParticipant);

    // Vérifier si l'événement a atteint son quota minimum (pour le marquer comme confirmé)
    if (currentParticipantsCount + 1 >= (event.min_participants ?? 0) && event.status === 'pending') {
      event.status = 'confirmed';
      await eventRepository.save(event);
      
      // Notifier tous les participants que l'événement est confirmé
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
      const eventParticipantFound = await eventParticipantRepository.findOneBy({ id: updateEventParticipant.id })
      if (eventParticipantFound === null) {
          res.status(404).send({ "error": `eventParticipant ${updateEventParticipant.id} not found` })
          return
      }

      // if (updateEventParticipant.price) {
      //     eventParticipantFound.price = updateEventParticipant.price
      // }

      const eventParticipantUpdate = await eventParticipantRepository.save(eventParticipantFound)
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
function sendEventConfirmationNotifications(id: number) {
  throw new Error("Function not implemented.");
}

