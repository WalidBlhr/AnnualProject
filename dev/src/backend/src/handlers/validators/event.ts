import Joi from "joi";

/**
 * Liste des Events (READ multiple) avec pagination
 */
export interface ListEventsRequest {
  page: number;
  limit: number;
  type?: string;
  category?: string;
}

export const ListEventsValidation = Joi.object<ListEventsRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  type: Joi.string().valid("regular", "community").optional(),
  category: Joi.string().optional()
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
  status: string;
  creatorId?: number;
  type?: string;
  category?: string;
  description?: string;
  equipment_needed?: string;
}

export const createEventValidation = Joi.object<CreateEventRequest>({
  name: Joi.string().required(),
  date: Joi.date().required(),
  location: Joi.string().required(),
  max_participants: Joi.number().min(1).required(),
  min_participants: Joi.number().min(0).optional(),
  status: Joi.string().valid("open", "closed", "draft", "pending", "canceled").default("open"),
  creatorId: Joi.number().optional(),
  type: Joi.string().valid("regular", "community").default("regular"),
  category: Joi.string().when('type', {
    is: 'community',
    then: Joi.string().valid("cleaning", "waste_collection", "neighborhood_party", "other").required(),
    otherwise: Joi.string().allow('').optional()
  }),
  description: Joi.string().optional(),
  equipment_needed: Joi.string().optional()
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
  type?: string;
  category?: string;
  description?: string;
  equipment_needed?: string;
}

export const updateEventValidation = Joi.object<UpdateEventRequest>({
  id: Joi.number().required(),
  name: Joi.string().optional(),
  date: Joi.date().optional(),
  location: Joi.string().optional(),
  max_participants: Joi.number().min(1).optional(),
  min_participants: Joi.number().min(0).optional(),
  status: Joi.string().valid("open", "closed", "draft", "pending", "canceled").optional(),
  type: Joi.string().valid("regular", "community").optional(),
  category: Joi.string().when('type', {
    is: 'community',
    then: Joi.string().valid("cleaning", "waste_collection", "neighborhood_party", "other").required(),
    otherwise: Joi.string().allow('').optional()
  }),
  description: Joi.string().optional(),
  equipment_needed: Joi.string().optional()
}).options({ abortEarly: false });
