import Joi from "joi";
import { PaginationRequest } from "./user";

/**
 * Liste des EventParticipants (READ multiple) avec pagination
 */
export interface ListEventParticipantsRequest {
  eventId?: number;
  // Ajoutez ici d'autres filtres éventuels (par eventId, userId, status_participation, etc.)
}

export const ListEventParticipantsValidation = Joi.object<ListEventParticipantsRequest & PaginationRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  eventId: Joi.number().optional(), // Accepter le paramètre eventId
  // Ex: eventId: Joi.number().optional(),
  // Ex: userId: Joi.number().optional(),
}).options({ abortEarly: false });

/**
 * Validation d'ID pour GET unique / DELETE / etc.
 */
export interface EventParticipantId {
  id: number;
}

export const EventParticipantIdValidation = Joi.object<EventParticipantId>({
  id: Joi.number().required(),
}).options({ abortEarly: false });

/**
 * Création d'un participant à un event
 * Correspond à la structure attendue dans le body d'un POST /eventParticipants
 */
export interface CreateEventParticipantRequest {
  userId: number; // liaison avec l'user
  eventId: number; // liaison avec l'event
  date_inscription: Date;
  status_participation: string; // ex: "pending", "confirmed", "canceled", etc.
  comment?: string; // commentaire optionnel lors de l'inscription
}

export const createEventParticipantValidation = Joi.object<CreateEventParticipantRequest>({
  userId: Joi.number().required(),
  eventId: Joi.number().required(),
  date_inscription: Joi.date().required(),
  status_participation: Joi.string().valid("pending", "confirmed", "canceled", "approved").default("pending"),
  comment: Joi.string().allow('').optional(),
}).options({ abortEarly: false });

/**
 * Mise à jour d'un EventParticipant
 * Correspond à la structure attendue dans le body (et params) d'un PUT /eventParticipants/:id
 */
export interface UpdateEventParticipantRequest {
  id: number;
  date_inscription?: Date;
  status_participation?: string;
  comment?: string; // commentaire optionnel
  // Selon votre logique, vous pouvez autoriser le changement de userId, eventId, etc. si besoin
}

export const updateEventParticipantValidation = Joi.object<UpdateEventParticipantRequest>({
  id: Joi.number().required(),
  date_inscription: Joi.date().optional(),
  status_participation: Joi.string().valid("pending", "confirmed", "canceled", "approved").optional(),
  comment: Joi.string().allow('').optional(),
}).options({ abortEarly: false });
