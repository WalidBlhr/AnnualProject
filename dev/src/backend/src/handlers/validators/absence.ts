import Joi from "joi";
import { PaginationRequest } from "./user";

/**
 * Liste des absences avec pagination
 */
export interface ListAbsencesRequest {
  userId?: number;
  status?: string;
}

export const ListAbsencesValidation = Joi.object<ListAbsencesRequest & PaginationRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  userId: Joi.number().optional(),
  status: Joi.string().optional()
}).options({ abortEarly: false });

/**
 * Validation d'ID pour GET unique / DELETE / etc.
 */
export interface AbsenceId {
  id: number;
}

export const AbsenceIdValidation = Joi.object<AbsenceId>({
  id: Joi.number().required(),
}).options({ abortEarly: false });

/**
 * Création d'une absence
 */
export interface CreateAbsenceRequest {
  userId: number;
  start_date: Date;
  end_date: Date;
  notes?: string;
  trusted_contact_ids?: number[];
}

export const createAbsenceValidation = Joi.object<CreateAbsenceRequest>({
  userId: Joi.number().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().greater(Joi.ref('start_date')).required(),
  notes: Joi.string().allow('').optional(),
  trusted_contact_ids: Joi.array().items(Joi.number()).optional()
}).options({ abortEarly: false });

/**
 * Mise à jour d'une absence
 */
export interface UpdateAbsenceRequest {
  id: number;
  start_date?: Date;
  end_date?: Date;
  notes?: string;
  status?: string;
  trusted_contact_ids?: number[];
}

export const updateAbsenceValidation = Joi.object<UpdateAbsenceRequest>({
  id: Joi.number().required(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().greater(Joi.ref('start_date')).optional(),
  notes: Joi.string().allow('').optional(),
  status: Joi.string().valid('pending', 'accepted', 'completed', 'canceled').optional(),
  trusted_contact_ids: Joi.array().items(Joi.number()).optional()
}).options({ abortEarly: false });

/**
 * Validation pour ajouter un contact de confiance
 */
export interface TrustedContactRequest {
  userId: number;
  trustedUserId: number;
}

export const trustedContactValidation = Joi.object<TrustedContactRequest>({
  userId: Joi.number().required(),
  trustedUserId: Joi.number().required()
}).options({ abortEarly: false });