import Joi from "joi";

export interface CreateArticleRequest{
    title: string;
    content: string;
    category: string;
    isPublic: boolean;
    imageUrl: string;
}

export interface UpdateArticleRequest{
    title?: string;
    content?: string;
    category?: string;
    isPublic?: boolean;
    imageUrl?: string;
    status?: "draft" | "published" | "archived";
}

export const CreateArticleValidation = Joi.object<CreateArticleRequest>({
  title: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().required(),
  isPublic: Joi.boolean().default(true),
  imageUrl: Joi.string().allow(null, '')
});

export const UpdateArticleValidation = Joi.object<UpdateArticleRequest>({
  title: Joi.string(),
  content: Joi.string(),
  category: Joi.string(),
  status: Joi.string().valid('draft', 'published', 'archived'),
  isPublic: Joi.boolean(),
  imageUrl: Joi.string().allow(null, '')
});