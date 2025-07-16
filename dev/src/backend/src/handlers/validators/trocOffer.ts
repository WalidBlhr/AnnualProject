import Joi from "joi";
import { PaginationRequest } from "./user";

// READ (liste)
export interface ListTrocOffersFilters {
    // priceMax?: number;
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
  type: string, // 'offer' ou 'request'
  userId: number // Changer TrocOfferId en userId
}

export const createTrocOfferValidation = Joi.object<CreateTrocOfferRequest>({
  title: Joi.string().required(),
  description: Joi.string().required(),
  creation_date: Joi.date().required(),
  status: Joi.string().valid("open", "closed", "pending").default("open"),
  type: Joi.string().valid("offer", "request").required(),
  userId: Joi.number().required() // Changer TrocOfferId en userId
}).options({ abortEarly: false });

// UPDATE
export const updateTrocOfferValidation = Joi.object({
  id: Joi.number().required(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid("open", "closed", "pending").optional(),
}).options({ abortEarly: false });
