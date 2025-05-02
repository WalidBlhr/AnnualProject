import Joi from "joi";

/**
 * Liste des messages (READ multiple) avec pagination
 */
export interface ListMessagesRequest {
  page: number;
  limit: number;
  senderId?: number;
  receiverId?: number;
}

export const ListMessagesValidation = Joi.object<ListMessagesRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  senderId: Joi.number(),
  receiverId: Joi.number()
}).options({ abortEarly: false });

/**
 * Validation d'ID pour GET unique / DELETE / etc.
 */
export interface MessageId {
  id: number;
}

export const MessageIdValidation = Joi.object<MessageId>({
  id: Joi.number().required(),
}).options({ abortEarly: false });

/**
 * Création d'un message
 * Correspond à la structure attendue dans le body d'un POST /messages
 */
export interface CreateMessageRequest {
  content: string;
  date_sent: Date;
  senderId: number;   // liaison vers l'user (sender)
  receiverId: number; // liaison vers l'user (receiver)
  status: string;     // "lu", "non_lu", ou autre
}

export const createMessageValidation = Joi.object<CreateMessageRequest>({
  content: Joi.string().required(),
  date_sent: Joi.date().required(),
  senderId: Joi.number().required(),
  receiverId: Joi.number().required(),
  status: Joi.string().valid("lu", "non_lu", "read", "unread").default("non_lu"),
}).options({ abortEarly: false });

/**
 * Mise à jour d'un message
 * Correspond à la structure attendue dans le body (et params) d'un PUT /messages/:id
 */
export interface UpdateMessageRequest {
  id: number; 
  content?: string;
  status?: string;
  // Si vous autorisez la mise à jour du receiver, date_sent, etc., ajoutez-les ici
}

export const updateMessageValidation = Joi.object<UpdateMessageRequest>({
  id: Joi.number().required(),
  content: Joi.string().optional(),
  status: Joi.string().valid("lu", "non_lu", "read", "unread").optional(),
}).options({ abortEarly: false });
