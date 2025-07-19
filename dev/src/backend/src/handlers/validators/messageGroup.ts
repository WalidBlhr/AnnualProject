import Joi from "joi";
import { PaginationRequest } from "./user";

export interface MessageGroupId{
  id: number;
}

export interface ListMessageGroupsRequest{
  name?: string;
  ownerFullname?: string;
  ownerId?: number;
  membersMin?: number;
  membersMax?: number;
  messageMin?: number;
  messageMax?: number;
}

export interface CreateMessageGroupRequest{
  name: string;
  description?: string;
  ownerId: number;
  membersIDs?: number[];
}

export interface PatchMessageGroupRequest{
  id: number;
  name?: string;
  description?: string;
  ownerId?: number;
  newMembersIDs?: number[];
  removedMembersIDs?: number[];
  membersIDs?: number[];
}

export const listMessageGroupsValidation = Joi.object<ListMessageGroupsRequest & PaginationRequest>({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  name: Joi.string().max(30),
  ownerFullname: Joi.string(),
  ownerId: Joi.number().min(1),
  membersMin: Joi.number().min(0).default(0),
  membersMax: Joi.number().min(Joi.ref("membersMin")),
  messageMin: Joi.number().min(0).default(0),
  messageMax: Joi.number().min(Joi.ref("messageMin")),
}).options({abortEarly: false});

export const messageGroupIdValidation = Joi.object<MessageGroupId>({
  id: Joi.number().min(1).required(),
}).options({abortEarly: false});

export const createMessageGroupValidation = Joi.object<CreateMessageGroupRequest>({
  name: Joi.string().max(30).required(),
  ownerId: Joi.number().min(1).required(),
  description: Joi.string().max(150),
  membersIDs: Joi.array().items(Joi.number())
}).options({abortEarly: false});

export const patchMessageGroupValidation = Joi.object<PatchMessageGroupRequest>({
  id: Joi.number().required(),
  name: Joi.string().max(30),
  description: Joi.string().max(150),
  ownerId: Joi.number().min(1),
  newMembersIDs: Joi.array().items(Joi.number()),
  removedMembersIDs: Joi.array().items(Joi.number()),
  membersIDs: Joi.array().items(Joi.number()),
}).oxor('membersIDs', 'newMembersIDs')
  .oxor('membersIDs', 'removedMembersIDs')
  .messages({
    'object.oxor': `"membersIDs" ne peut pas être présent en même temps que "newMembersIDs" ou "removedMembersIDs".`
  })
  .options({abortEarly: false});
