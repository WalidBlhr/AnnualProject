// File: dev/src/backend/src/handlers/validators/trocOffer.ts
import Joi from "joi";

// READ (liste)
export interface ListTrocOffersFilters {
    // priceMax?: number;
}

export interface PaginationRequest {
    page: number;
    limit: number;
}

export const ListTrocOffersValidation = Joi.object<ListTrocOffersFilters & PaginationRequest>({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    // priceMax: Joi.number().min(1),
}).options({ abortEarly: false })

// READ (détail)
export const TrocOfferIdValidation = Joi.object<TrocOfferId>({
    id: Joi.number().required()
})

export interface TrocOfferId {
    id: number
}

// CREATE
export interface CreateTrocOfferRequest {
  title: string,
  description: string,
  creation_date: Date,
  status: string,
  TrocOfferId: number
}

export const createTrocOfferValidation = Joi.object<CreateTrocOfferRequest>({
  title: Joi.string().required(),
  description: Joi.string().required(),
  creation_date: Joi.date().required(),
  status: Joi.string().valid("open", "closed", "pending").default("open"),
  TrocOfferId: Joi.number().required(),
}).options({ abortEarly: false });

// UPDATE
export const updateTrocOfferValidation = Joi.object({
  id: Joi.number().required(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid("open", "closed", "pending").optional(),
}).options({ abortEarly: false });
