// File: dev/src/backend/src/handlers/validators/service.ts
import Joi from "joi";

/**
 * Liste des services (READ multiple) avec pagination
 */
export interface ListServicesRequest {
  page: number;
  limit: number;
  // Ajoutez ici si vous voulez d'autres filtres (ex: status, dateMin, dateMax, etc.)
}

export const ListServicesValidation = Joi.object<ListServicesRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  // Ajoutez ici d'autres filtres si nécessaire
}).options({ abortEarly: false });

/**
 * Validation d'ID pour GET unique / DELETE / etc.
 */
export interface ServiceId {
  id: number;
}

export const ServiceIdValidation = Joi.object<ServiceId>({
  id: Joi.number().required(),
}).options({ abortEarly: false });

/**
 * Création d'un service
 * Correspond à la structure attendue dans le body d'un POST /services
 */
export interface CreateServiceRequest {
  // Selon votre entité Service : type_service, description, date, status, userId, ...
  type_service: string;
  description: string;
  date: Date;
  status: string;
  userId: number; // L'id de l'utilisateur propriétaire (foreign key)
}

export const createServiceValidation = Joi.object<CreateServiceRequest>({
  type_service: Joi.string().required(),
  description: Joi.string().required(),
  date: Joi.date().required(),
  status: Joi.string().valid("open", "closed", "pending").default("open"),
  userId: Joi.number().required(),
}).options({ abortEarly: false });

/**
 * Mise à jour d'un service
 * Correspond à la structure attendue dans le body (et params) d'un PUT /services/:id
 */
export interface UpdateServiceRequest {
  id: number;
  type_service?: string;
  description?: string;
  date?: Date;
  status?: string;
}

export const updateServiceValidation = Joi.object<UpdateServiceRequest>({
  id: Joi.number().required(),
  type_service: Joi.string().optional(),
  description: Joi.string().optional(),
  date: Joi.date().optional(),
  status: Joi.string().valid("open", "closed", "pending").optional(),
}).options({ abortEarly: false });
