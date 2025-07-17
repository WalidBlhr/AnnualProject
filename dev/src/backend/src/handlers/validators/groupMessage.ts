import Joi from "joi";
import { PaginationRequest } from "./user";

export interface ListGroupMessagesRequest{
  groupId: number;
  senderId?: number;
  sentAfter?: string;
  sentBefore?: string;
}

export interface CreateGroupMessageRequest{
  content: string;
  senderId: number;
  groupId: number;
  status: string;
  date_sent: string;
}

export interface GroupMessageIds{
  groupId: number;
  messageId: number;
}

export const listGroupMessagesValidation = Joi.object<ListGroupMessagesRequest & PaginationRequest>({
  groupId: Joi.number().positive().required(),
  senderId: Joi.number().positive(),
  sentAfter: Joi.date().iso(),
  sentBefore: Joi.date().iso(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(500).default(10),
}).options({abortEarly: false});

export const createGroupMessageValidation = Joi.object<CreateGroupMessageRequest>({
  content: Joi.string().required(),
  senderId: Joi.number().positive().required(),
  groupId: Joi.number().positive().required(),
  status: Joi.string().valid("lu", "non_lu", "read", "unread").default("non_lu"),
  date_sent: Joi.date().iso().required(),
}).options({abortEarly: false});
