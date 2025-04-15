import { Request, Response } from "express";
import { createEventParticipantValidation, updateEventParticipantValidation, EventParticipantIdValidation, ListEventParticipantsValidation } from "./validators/eventParticipant";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { EventParticipant } from "../db/models/event_participant";

/**
 * Create a new EventParticipant
 * POST /eventParticipants
 */
export const createEventParticipantHandler = async (req: Request, res: Response) => {
  try {
      const validation = createEventParticipantValidation.validate(req.body);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const createEventParticipantRequest = validation.value
      const eventParticipantRepository = AppDataSource.getRepository(EventParticipant)
      const eventParticipant = eventParticipantRepository.create({ ...createEventParticipantRequest })
      const eventParticipantCreated = await eventParticipantRepository.save(eventParticipant);

      res.status(201).send(eventParticipantCreated)
  } catch (error) {

      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Lire la liste des eventParticipants (READ multiple)
 * GET /eventParticipants
 */
export const listEventParticipantHandler = async (req: Request, res: Response) => {
  try {
      console.log((req as any).eventParticipant)
      const validation = ListEventParticipantsValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listEventParticipantRequest = validation.value
      console.log(listEventParticipantRequest)

      const query = AppDataSource.createQueryBuilder(EventParticipant, 'eventParticipant')

      // if (listEventParticipantRequest.priceMax !== undefined) {
      //     query.andWhere("eventParticipant.price <= :priceMax", { priceMax: listEventParticipantRequest.priceMax })
      // }

      query.skip((listEventParticipantRequest.page - 1) * listEventParticipantRequest.limit);
      query.take(listEventParticipantRequest.limit);

      const [eventParticipants, totalCount] = await query.getManyAndCount();

      const page = listEventParticipantRequest.page
      const totalPages = Math.ceil(totalCount / listEventParticipantRequest.limit);

      res.send(
          {
              data: eventParticipants,
              page_size: listEventParticipantRequest.limit,
              page,
              total_count: totalCount,
              total_pages: totalPages,
          }
      )

  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

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
