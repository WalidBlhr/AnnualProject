import Joi from "joi";

export interface RefreshRequest{
    refresh_token: string;
};

export const refreshValidation = Joi.object<RefreshRequest>({
    refresh_token: Joi.string().min(100).required(),
});