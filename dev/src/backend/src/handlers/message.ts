// handlers/message.ts
import { Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { Message } from "../db/models/message";
import { User } from "../db/models/user";

export const createMessageHandler = async (req: Request, res: Response) => {
  try {
    // body = { content, date_sent, senderId, receiverId, status }
    const { content, date_sent, senderId, receiverId, status } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const sender = await userRepo.findOneBy({ id: senderId });
    if (!sender) {
      return res.status(404).send({ message: `Sender ${senderId} not found` });
    }
    const receiver = await userRepo.findOneBy({ id: receiverId });
    if (!receiver) {
      return res.status(404).send({ message: `Receiver ${receiverId} not found` });
    }

    const msgRepo = AppDataSource.getRepository(Message);
    const newMsg = msgRepo.create({
      content,
      date_sent,
      sender,
      receiver,
      status
    });
    const savedMsg = await msgRepo.save(newMsg);
    return res.status(201).send(savedMsg);
  } catch (error) {
    console.error("createMessageHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const listMessageHandler = async (req: Request, res: Response) => {
  try {
    // Ex: on peut lister tous les messages ou seulement ceux d'un user
    // Filtre user ? ex: /messages?userId=12
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;

    const msgRepo = AppDataSource.getRepository(Message);
    let messages: Message[];

    if (userId) {
      // Tous les messages où userId est sender ou receiver
      messages = await msgRepo.find({
        where: [
          { sender: { id: userId } },
          { receiver: { id: userId } }
        ],
        relations: ["sender", "receiver"]
      });
    } else {
      messages = await msgRepo.find({
        relations: ["sender", "receiver"]
      });
    }

    return res.send(messages);
  } catch (error) {
    console.error("listMessageHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const getMessageByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const msgRepo = AppDataSource.getRepository(Message);
    const messageFound = await msgRepo.findOne({
      where: { id },
      relations: ["sender", "receiver"]
    });
    if (!messageFound) {
      return res.status(404).send({ message: `Message ${id} not found` });
    }

    return res.send(messageFound);
  } catch (error) {
    console.error("getMessageByIdHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const updateMessageHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { content, status } = req.body;

    const msgRepo = AppDataSource.getRepository(Message);
    const msgFound = await msgRepo.findOneBy({ id });
    if (!msgFound) {
      return res.status(404).send({ message: `Message ${id} not found` });
    }

    if (content !== undefined) msgFound.content = content;
    if (status !== undefined) msgFound.status = status;

    const updatedMsg = await msgRepo.save(msgFound);
    return res.send(updatedMsg);
  } catch (error) {
    console.error("updateMessageHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const deleteMessageHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const msgRepo = AppDataSource.getRepository(Message);
    const msgFound = await msgRepo.findOneBy({ id });
    if (!msgFound) {
      return res.status(404).send({ message: `Message ${id} not found` });
    }

    const removedMsg = await msgRepo.remove(msgFound);
    return res.send(removedMsg);
  } catch (error) {
    console.error("deleteMessageHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};
