// File: dev/src/backend/src/handlers/event.ts
import { Request, Response } from "express";
import { createEventValidation, updateEventValidation, EventIdValidation, ListEventsValidation } from "./validators/event";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Event } from "../db/models/event";

/**
 * Create a new Event
 * POST /events
 */
export const createEventHandler = async (req: Request, res: Response) => {
  try {
      const validation = createEventValidation.validate(req.body);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const createEventRequest = validation.value
      const eventRepository = AppDataSource.getRepository(Event)
      const event = eventRepository.create({ ...createEventRequest })
      const eventCreated = await eventRepository.save(event);

      res.status(201).send(eventCreated)
  } catch (error) {

      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Lire la liste des events (READ multiple)
 * GET /events
 */
export const listEventHandler = async (req: Request, res: Response) => {
  try {
      console.log((req as any).event)
      const validation = ListEventsValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listEventRequest = validation.value
      console.log(listEventRequest)

      const query = AppDataSource.createQueryBuilder(Event, 'event')

      // if (listEventRequest.priceMax !== undefined) {
      //     query.andWhere("event.price <= :priceMax", { priceMax: listEventRequest.priceMax })
      // }

      query.skip((listEventRequest.page - 1) * listEventRequest.limit);
      query.take(listEventRequest.limit);

      const [events, totalCount] = await query.getManyAndCount();

      const page = listEventRequest.page
      const totalPages = Math.ceil(totalCount / listEventRequest.limit);

      res.send(
          {
              data: events,
              page_size: listEventRequest.limit,
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
 * Récupérer le détail d'une Event par id (READ single)
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
          where: { id: getEventRequest.id }
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
 * Mise à jour d'une Event
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
      const eventFound = await eventRepository.findOneBy({ id: updateEvent.id })
      if (eventFound === null) {
          res.status(404).send({ "error": `event ${updateEvent.id} not found` })
          return
      }

      // if (updateEvent.price) {
      //     eventFound.price = updateEvent.price
      // }

      const eventUpdate = await eventRepository.save(eventFound)
      res.status(200).send(eventUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Suppression d'une Event
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
