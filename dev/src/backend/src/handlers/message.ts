import { Request, Response } from "express";
import { createMessageValidation, updateMessageValidation, MessageIdValidation, ListMessagesValidation } from "./validators/message";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Message } from "../db/models/message";
import { User } from "../db/models/user";
import { jwtDecode } from "jwt-decode";  // Modification de l'import

interface DecodedToken {
  userId: number;
  email: string;
  exp: number;
}

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
      const userRepository = AppDataSource.getRepository(User)

      // Chercher l'expéditeur et le destinataire
      const sender = await userRepository.findOneBy({ id: createMessageRequest.senderId })
      const receiver = await userRepository.findOneBy({ id: createMessageRequest.receiverId })

      if (!sender || !receiver) {
          res.status(400).send({ "message": "Expéditeur ou destinataire non trouvé" })
          return
      }

      // Créer le message avec les relations
      const message = messageRepository.create({ 
          ...createMessageRequest,
          sender: sender,
          receiver: receiver
      })
      
      const messageCreated = await messageRepository.save(message)

      // Recharger le message avec toutes les relations pour la réponse
      const messageWithRelations = await messageRepository.findOne({
          where: { id: messageCreated.id },
          relations: {
              sender: true,
              receiver: true
          }
      })

      res.status(201).send(messageWithRelations)
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
    const validation = ListMessagesValidation.validate(req.query);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details))
      return
    }

    const query = AppDataSource.createQueryBuilder(Message, 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .select([
        'message.id',
        'message.content',
        'message.date_sent',
        'message.status',
        'sender.id',
        'sender.firstname',
        'sender.lastname',
        'receiver.id',
        'receiver.firstname',
        'receiver.lastname'
      ])
      .orderBy('message.date_sent', 'DESC');

    // Si senderId et receiverId sont fournis, filtrer les messages
    if (req.query.senderId && req.query.receiverId) {
      query.where(
        '(message.sender_id = :senderId AND message.receiver_id = :receiverId) OR (message.sender_id = :receiverId AND message.receiver_id = :senderId)',
        { 
          senderId: req.query.senderId,
          receiverId: req.query.receiverId 
        }
      );
    } else {
      // Sinon, récupérer tous les messages de l'utilisateur connecté
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwtDecode<{ userId: number }>(token!);
      query.where(
        'message.sender_id = :userId OR message.receiver_id = :userId',
        { userId: decoded.userId }
      );
    }

    const [messages, totalCount] = await query.getManyAndCount();

    res.send({
      data: messages,
      total_count: totalCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "internal error" });
  }
};

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
      // Modifier cette partie pour inclure les relations
      const message = await messageRepository.findOne({
          where: { id: getMessageRequest.id },
          relations: {
              sender: true,
              receiver: true
          }
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
      // Modifier cette partie pour inclure les relations
      const messageFound = await messageRepository.findOne({
          where: { id: updateMessage.id },
          relations: {
              sender: true,
              receiver: true
          }
      })
      if (messageFound === null) {
          res.status(404).send({ "error": `message ${updateMessage.id} not found` })
          return
      }

      // Mettre à jour les champs
      if (updateMessage.content) {
          messageFound.content = updateMessage.content
      }
      if (updateMessage.status) {
          messageFound.status = updateMessage.status
      }

      const messageUpdate = await messageRepository.save(messageFound)
      
      // Recharger le message avec toutes les relations pour la réponse
      const updatedMessageWithRelations = await messageRepository.findOne({
          where: { id: messageUpdate.id },
          relations: {
              sender: true,
              receiver: true
          }
      })

      res.status(200).send(updatedMessageWithRelations)
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
