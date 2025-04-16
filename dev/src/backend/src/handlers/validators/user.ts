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
}).options({ abortEarly: false })

// READ (détail)
export const UserIdValidation = Joi.object<UserId>({
    id: Joi.number().required()
})

export interface UserId {
    id: number
}

// UPDATE - PUT
export interface UpdateUserRequest {
    id: number
    lastname: string
}

export const UserUpdateValidation = Joi.object<UpdateUserRequest>({
    id: Joi.number().required(),
    lastname: Joi.string().required()
})