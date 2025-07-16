import Joi from "joi";

// READ (liste)
export interface ListUsersFilters {
    // priceMax?: number;
}

export interface PaginationRequest {
    page: number;
    limit: number;
}

export const ListUsersValidation = Joi.object<ListUsersFilters & PaginationRequest>({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    // priceMax: Joi.number().min(1),
}).options({ abortEarly: false });

// READ (détail)
export const UserIdValidation = Joi.object<UserId>({
    id: Joi.number().required(),
})

export interface UserId {
    id: number;
}

// UPDATE - PUT
export interface UpdateUserRequest {
    id: number;
    lastname?: string;
    firstname?: string;
    email?: string;
    role?: number;
}

export const UserUpdateValidation = Joi.object<UpdateUserRequest>({
    id: Joi.number().required(),
    lastname: Joi.string().optional().min(1).max(50),
    firstname: Joi.string().optional().min(1).max(50),
    email: Joi.string().email().optional(),
    role: Joi.number().optional().min(0).max(1),
}).options({ abortEarly: false });

export const UserIdsQueryValidation = Joi.object({
  userIds: Joi.string()
    .required()
    .pattern(/^(\d+)(,\d+)*$/) // Format: "1" ou "1,2,3"
    .message('userIds doit être une liste d\'identifiants numériques séparés par des virgules'),
}).options({ abortEarly: false });