import { Request, Response } from "express";
import { createMessageValidation, updateMessageValidation, MessageIdValidation, ListMessagesValidation } from "./validators/message";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Message } from "../db/models/message";
import { User } from "../db/models/user";
import { jwtDecode } from "jwt-decode";  // Modification de l'import
import jwt from 'jsonwebtoken';

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
      console.log('Données reçues pour créer un message:', req.body);
      
      const validation = createMessageValidation.validate(req.body);
      if (validation.error) {
          console.log('Erreur de validation:', validation.error.details);
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const createMessageRequest = validation.value
      console.log('Données validées:', createMessageRequest);
      
      const messageRepository = AppDataSource.getRepository(Message)
      const userRepository = AppDataSource.getRepository(User)

      // Chercher l'expéditeur et le destinataire
      const sender = await userRepository.findOneBy({ id: createMessageRequest.senderId })
      const receiver = await userRepository.findOneBy({ id: createMessageRequest.receiverId })

      console.log('Sender trouvé:', sender ? `${sender.firstname} ${sender.lastname}` : 'null');
      console.log('Receiver trouvé:', receiver ? `${receiver.firstname} ${receiver.lastname}` : 'null');

      if (!sender || !receiver) {
          res.status(400).send({ "message": "Expéditeur ou destinataire non trouvé" })
          return
      }

      // Créer le message avec les relations
      const message = messageRepository.create({ 
          ...createMessageRequest,
          date_sent: new Date(createMessageRequest.date_sent), // Convertir explicitement
          sender: sender,
          receiver: receiver
      })
      
      console.log('Message créé (avant save):', message);
      
      const messageCreated = await messageRepository.save(message)
      console.log('Message sauvegardé:', messageCreated);

      // Recharger le message avec toutes les relations pour la réponse
      const messageWithRelations = await messageRepository.findOne({
          where: { id: messageCreated.id },
          relations: {
              sender: true,
              receiver: true
          }
      })

      console.log('Message avec relations:', messageWithRelations);
      
      res.status(201).send(messageWithRelations)
  } catch (error) {
      console.error('Erreur dans createMessageHandler:', error);
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
    console.log('listMessageHandler called with query:', req.query);
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const validation = ListMessagesValidation.validate(req.query);
    if (validation.error) {
      console.log('Validation error:', validation.error.details);
      res.status(400).send(generateValidationErrorMessage(validation.error.details))
      return
    }

    const query = AppDataSource.createQueryBuilder(Message, 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .leftJoinAndSelect('message.group', 'group')
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
        'receiver.lastname',
        'group.id',
        'group.name',
        'group.createdAt',
      ])
      .where('message.sender IS NOT NULL AND (message.receiver IS NOT NULL OR message.group IS NOT NULL)') // Exclure les messages avec des relations nulles
      .orderBy('message.date_sent', 'ASC');

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
      if (!token) {
        res.status(401).send({ message: "Token manquant" });
        return;
      }

      try {
        const decoded = jwtDecode<{ userId: number }>(token);
        if (!decoded.userId) {
          res.status(401).send({ message: "Token invalide - userId manquant" });
          return;
        }

        query.andWhere(
          'message.sender_id = :userId OR message.receiver_id = :userId',
          { userId: decoded.userId }
        );
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        res.status(401).send({ message: "Token invalide" });
        return;
      }
    }

    query.skip((validation.value.page - 1) * validation.value.limit);
    query.take(validation.value.limit);

    const [messages, totalCount] = await query.getManyAndCount();
    
    // Filtrer les messages qui ont des relations nulles pour plus de sécurité
    const validMessages = messages.filter(msg => {
      const isValid = msg.sender && msg.sender.id && (msg.receiver && msg.receiver.id || msg.group && msg.group.id);
      if (!isValid) {
        console.warn(`Message ${msg.id} has invalid relations:`, {
          hasSender: !!msg.sender,
          hasReceiver: !!msg.receiver,
          hasGroup: !!msg.group,
          senderHasId: !!msg.sender?.id,
          receiverHasId: !!msg.receiver?.id,
          groupHasId: !!msg.group?.id,
        });
      }
      return isValid;
    });
    
    const totalPages = Math.ceil(totalCount / validation.value.limit);

    console.log(`Found ${validMessages.length} valid messages out of ${messages.length} total (user query)`);
    validMessages.forEach(msg => {
      console.log(`Message ${msg.id}: sender=${msg.sender?.id}, receiver=${msg.receiver?.id}, group=${msg.group?.id}, status=${msg.status}`);
    });

    res.send({
      data: validMessages,
      page_size: validation.value.limit,
      page: validation.value.page,
      total_count: validMessages.length, // Utiliser le nombre de messages valides
      total_pages: totalPages,
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
              receiver: true,
              group: true,
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
 * Mise à jour d'un message (marquer comme lu)
 * PUT /messages/:id
 */
export const updateMessageHandler = async (req: Request, res: Response) => {
  try {
    const validation = MessageIdValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const messageId = validation.value;
    const messageRepository = AppDataSource.getRepository(Message);
    const message = await messageRepository.findOne({
      where: { id: messageId.id },
      relations: ['receiver']
    });

    if (!message) {
      res.status(404).send({ error: "Message non trouvé" });
      return;
    }

    // Vérifier que l'utilisateur est bien le destinataire
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (decoded.userId !== message.receiver.id) {
      res.status(403).send({ error: "Vous n'êtes pas autorisé à mettre à jour ce message" });
      return;
    }

    // Mettre à jour le statut
    if (req.body.status) {
      message.status = req.body.status;
    }

    const updatedMessage = await messageRepository.save(message);
    res.status(200).send(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "internal error" });
  }
};

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
