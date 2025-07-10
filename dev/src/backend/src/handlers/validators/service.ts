import Joi from "joi";

/**
 * Liste des services (READ multiple) avec pagination
 */
export interface ListServicesRequest {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  date_start?: Date;
  date_end?: Date;
}

export const ListServicesValidation = Joi.object<ListServicesRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  type: Joi.string().valid('colis', 'dog_walking', 'shopping', 'cleaning', 'gardening', 'other'),
  status: Joi.string().valid('available', 'booked', 'completed'),
  date_start: Joi.date(),
  date_end: Joi.date().min(Joi.ref('date_start'))
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
 * Le provider_id est récupéré depuis le token JWT, pas depuis le body
 */
export interface CreateServiceRequest {
  title: string;
  description: string;
  type: string;
  date_start: Date;
  date_end: Date;
  availability: {
    days: string[];
    time_slots: {
      start: string;
      end: string;
    }[];
  };
  status?: string;
}

export const createServiceValidation = Joi.object<CreateServiceRequest>({
  title: Joi.string().required(),
  description: Joi.string().required(),
  type: Joi.string().valid('colis', 'dog_walking', 'shopping', 'cleaning', 'gardening', 'other').required(),
  date_start: Joi.date().required(),
  date_end: Joi.date().min(Joi.ref('date_start')).required(),
  availability: Joi.object({
    days: Joi.array().items(
      Joi.string().valid('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')
    ).required(),
    time_slots: Joi.array().items(
      Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
      })
    ).required()
  }).required(),
  status: Joi.string().valid('available', 'booked', 'completed').default('available')
}).options({ abortEarly: false });

/**
 * Mise à jour d'un service
 * Correspond à la structure attendue dans le body (et params) d'un PUT /services/:id
 */
export interface UpdateServiceRequest {
  id: number;
  title?: string;
  description?: string;
  type?: string;
  date_start?: Date;
  date_end?: Date;
  availability?: {
    days: string[];
    time_slots: {
      start: string;
      end: string;
    }[];
  };
  status?: string;
}

export const updateServiceValidation = Joi.object<UpdateServiceRequest>({
  id: Joi.number().required(),
  title: Joi.string(),
  description: Joi.string(),
  type: Joi.string().valid('colis', 'dog_walking', 'shopping', 'cleaning', 'gardening', 'other'),
  date_start: Joi.date(),
  date_end: Joi.date().min(Joi.ref('date_start')),
  availability: Joi.object({
    days: Joi.array().items(
      Joi.string().valid('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')
    ),
    time_slots: Joi.array().items(
      Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      })
    )
  }),
  status: Joi.string().valid('available', 'booked', 'completed')
}).options({ abortEarly: false });
