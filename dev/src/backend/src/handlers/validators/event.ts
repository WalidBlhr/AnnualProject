import Joi from "joi";

/**
 * Liste des Events (READ multiple) avec pagination
 */
export interface ListEventsRequest {
  page: number;
  limit: number;
  // Ajoutez ici d'autres filtres (par ex. status, location, date range, etc.)
}

export const ListEventsValidation = Joi.object<ListEventsRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  // Ex: status: Joi.string().optional()
}).options({ abortEarly: false });

/**
 * Validation d'ID pour GET unique / DELETE / etc.
 */
export interface EventId {
  id: number;
}

export const EventIdValidation = Joi.object<EventId>({
  id: Joi.number().required(),
}).options({ abortEarly: false });

/**
 * Création d'un Event
 * Correspond à la structure attendue dans le body d'un POST /events
 */
export interface CreateEventRequest {
  name: string;
  date: Date;
  location: string;
  max_participants: number;
  min_participants?: number;
  status: string;      // "open", "closed", etc.
  creatorId?: number;  // si vous associez directement le créateur
}

export const createEventValidation = Joi.object<CreateEventRequest>({
  name: Joi.string().required(),
  date: Joi.date().required(),
  location: Joi.string().required(),
  max_participants: Joi.number().min(1).required(),
  min_participants: Joi.number().min(1).optional(),
  status: Joi.string().valid("open", "closed", "draft", "pending").default("open"),
  creatorId: Joi.number().optional(), // si vous gérez la liaison à l'utilisateur
}).options({ abortEarly: false });

/**
 * Mise à jour d'un Event
 * Correspond à la structure attendue dans le body (et params) d'un PUT /events/:id
 */
export interface UpdateEventRequest {
  id: number;
  name?: string;
  date?: Date;
  location?: string;
  max_participants?: number;
  min_participants?: number;
  status?: string;
}

export const updateEventValidation = Joi.object<UpdateEventRequest>({
  id: Joi.number().required(),
  name: Joi.string().optional(),
  date: Joi.date().optional(),
  location: Joi.string().optional(),
  max_participants: Joi.number().min(1).optional(),
  min_participants: Joi.number().min(1).optional(),
  status: Joi.string().valid("open", "closed", "draft", "pending").optional(),
}).options({ abortEarly: false });
