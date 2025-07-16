import { Request, Response } from "express";
import { createGroupMessageValidation, listGroupMessagesValidation } from "./validators/groupMessage";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Message } from "../db/models/message";
import { findUserById } from "./user";
import { findMessageGroupById } from "./messageGroup";

export const listGroupMessages = async (req: Request, res: Response) => {
  try {
    const validated = listGroupMessagesValidation.validate({...req.params, ...req.query});
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const sentQueries = validated.value;
    const messageRepo = AppDataSource.getRepository(Message);
    const query = messageRepo.createQueryBuilder("msg");

    // Queries
    query.andWhere("msg.groupId = :groupId", {groupId: sentQueries.groupId});

    if (sentQueries.senderId !== undefined) {
      query.andWhere("msg.sender_id = :senderId", {senderId: sentQueries.senderId});
    }

    if (sentQueries.sentAfter !== undefined) {
      query.andWhere("msg.date_sent >= :sentAfter", {sentAfter: sentQueries.sentAfter});
    }

    if (sentQueries.sentBefore !== undefined) {
      query.andWhere("msg.date_sent <= :sentBefore", {sentBefore: sentQueries.sentBefore});
    }

    // Pagination
    query.skip((sentQueries.page - 1) * sentQueries.limit);
    query.take(sentQueries.limit);

    const [messages, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / sentQueries.limit);

    res.status(200).send({
      data: messages,
      page_size: sentQueries.limit,
      page: sentQueries.page,
      total_count: total,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "Server Error"});
  }
};

export const createGroupMessage = async (req: Request, res: Response) => {
  try {
    const validated = createGroupMessageValidation.validate({...req.params, ...req.body});
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const sentInfo = validated.value;

    const sender = await findUserById(sentInfo.senderId);
    if (sender === null) {
      res.status(404).send({error: `User with id ${sentInfo.senderId} not found. (senderId)`});
      return;
    }

    const group = await findMessageGroupById(sentInfo.groupId);
    if (group === null) {
      res.status(404).send({error: `Message group with id ${sentInfo.groupId} not found. (groupId)`});
      return;
    }

    const messageRepo = AppDataSource.getRepository(Message);

    const createdMessage = messageRepo.create({
      content: sentInfo.content,
      date_sent: sentInfo.date_sent,
      sender: sender,
      group: group,
      status: sentInfo.status,
    });

    const savedMessage = await messageRepo.save(createdMessage);
    res.status(201).send(savedMessage);
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "Server Error"});
  }
};
