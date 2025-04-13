// File: dev/src/backend/src/handlers/validators/auth/create-user.ts
import Joi from "joi";

export interface CreateUserRequest {
    email: string;
    password: string;
    lastname: string;
    firstname: string; 
    role: number;
}


export const createUserValidation = Joi.object<CreateUserRequest>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(20).required(),
    lastname: Joi.string().required(),
    firstname: Joi.string().required(),
    role: Joi.number().valid(0, 1).default(0) // 0 = user, 1 = admin
}).options({ abortEarly: false })

export interface LoginUserValidationRequest {
    email: string
    password: string
}

export const LoginUserValidation = Joi.object<LoginUserValidationRequest>({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
}).options({ abortEarly: false });
