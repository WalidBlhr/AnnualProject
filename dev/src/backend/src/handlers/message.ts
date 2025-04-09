import { Request, Response } from "express";
import { createMessageValidation, updateMessageValidation, MessageIdValidation, ListMessagesValidation } from "./validators/message";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Message } from "../db/models/message";

/**
 * Create a new Message
 * POST /messages
 */
export const createMessageHandler = async (req: Request, res: Response) => {
  try {
      const validation = createMessageValidation.validate(req.body);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const createMessageRequest = validation.value
      const messageRepository = AppDataSource.getRepository(Message)
      const message = messageRepository.create({ ...createMessageRequest })
      const messageCreated = await messageRepository.save(message);

      res.status(201).send(messageCreated)
  } catch (error) {

      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Lire la liste des messages (READ multiple)
 * GET /messages
 */
export const listMessageHandler = async (req: Request, res: Response) => {
  try {
      console.log((req as any).message)
      const validation = ListMessagesValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listMessageRequest = validation.value
      console.log(listMessageRequest)

      const query = AppDataSource.createQueryBuilder(Message, 'message')

      // if (listMessageRequest.priceMax !== undefined) {
      //     query.andWhere("message.price <= :priceMax", { priceMax: listMessageRequest.priceMax })
      // }

      query.skip((listMessageRequest.page - 1) * listMessageRequest.limit);
      query.take(listMessageRequest.limit);

      const [messages, totalCount] = await query.getManyAndCount();

      const page = listMessageRequest.page
      const totalPages = Math.ceil(totalCount / listMessageRequest.limit);

      res.send(
          {
              data: messages,
              page_size: listMessageRequest.limit,
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
 * Récupérer le détail d’une Message par id (READ single)
 * GET /messages/:id
 */
export const detailedMessageHandler = async (req: Request, res: Response) => {
  try {
      const validation = MessageIdValidation.validate(req.params);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const getMessageRequest = validation.value
      const messageRepository = AppDataSource.getRepository(Message)
      const message = await messageRepository.findOne({
          where: { id: getMessageRequest.id }
      })
      if (message === null) {
          res.status(404).send({ "message": "resource not found" })
          return
      }

      res.status(200).send(message);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Mise à jour d’une Message
 * PUT /messages/:id
 */
export const updateMessageHandler = async (req: Request, res: Response) => {
  try {
      const validation = updateMessageValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateMessage = validation.value
      const messageRepository = AppDataSource.getRepository(Message)
      const messageFound = await messageRepository.findOneBy({ id: updateMessage.id })
      if (messageFound === null) {
          res.status(404).send({ "error": `message ${updateMessage.id} not found` })
          return
      }

      // if (updateMessage.price) {
      //     messageFound.price = updateMessage.price
      // }

      const messageUpdate = await messageRepository.save(messageFound)
      res.status(200).send(messageUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Suppression d’une Message
 * DELETE /messages/:id
 */
export const deleteMessageHandler = async (req: Request, res: Response) => {
  try {
      const validation = MessageIdValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateMessage = validation.value
      const messageRepository = AppDataSource.getRepository(Message)
      const messageFound = await messageRepository.findOneBy({ id: updateMessage.id })
      if (messageFound === null) {
          res.status(404).send({ "error": `message ${updateMessage.id} not found` })
          return
      }

      const messageDeleted = await messageRepository.remove(messageFound)
      res.status(200).send(messageDeleted)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}
