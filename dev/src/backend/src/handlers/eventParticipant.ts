// handlers/eventParticipant.ts
import { Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { EventParticipant } from "../db/models/event_participant";
import { User } from "../db/models/user";
import { Event } from "../db/models/event";

export const createEventParticipantHandler = async (req: Request, res: Response) => {
  try {
    // body = { userId, eventId, date_inscription, status_participation }
    const { userId, eventId, date_inscription, status_participation } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const userFound = await userRepo.findOneBy({ id: userId });
    if (!userFound) {
      return res.status(404).send({ message: `User ${userId} not found` });
    }

    const eventRepo = AppDataSource.getRepository(Event);
    const eventFound = await eventRepo.findOneBy({ id: eventId });
    if (!eventFound) {
      return res.status(404).send({ message: `Event ${eventId} not found` });
    }

    const epRepo = AppDataSource.getRepository(EventParticipant);
    const newEp = epRepo.create({
      user: userFound,
      event: eventFound,
      date_inscription,
      status_participation
    });
    const savedEp = await epRepo.save(newEp);
    return res.status(201).send(savedEp);
  } catch (error) {
    console.error("createEventParticipantHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const listEventParticipantHandler = async (req: Request, res: Response) => {
  try {
    const epRepo = AppDataSource.getRepository(EventParticipant);
    const eps = await epRepo.find({
      relations: ["user", "event"]
    });
    return res.send(eps);
  } catch (error) {
    console.error("listEventParticipantHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const getEventParticipantByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const epRepo = AppDataSource.getRepository(EventParticipant);
    const epFound = await epRepo.findOne({
      where: { id },
      relations: ["user", "event"]
    });
    if (!epFound) {
      return res.status(404).send({ message: `EventParticipant ${id} not found` });
    }

    return res.send(epFound);
  } catch (error) {
    console.error("getEventParticipantByIdHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const updateEventParticipantHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status_participation } = req.body; // etc.

    const epRepo = AppDataSource.getRepository(EventParticipant);
    const epFound = await epRepo.findOneBy({ id });
    if (!epFound) {
      return res.status(404).send({ message: `EventParticipant ${id} not found` });
    }

    if (status_participation !== undefined) epFound.status_participation = status_participation;

    const updatedEp = await epRepo.save(epFound);
    return res.send(updatedEp);
  } catch (error) {
    console.error("updateEventParticipantHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const deleteEventParticipantHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const epRepo = AppDataSource.getRepository(EventParticipant);
    const epFound = await epRepo.findOneBy({ id });
    if (!epFound) {
      return res.status(404).send({ message: `EventParticipant ${id} not found` });
    }

    const removedEp = await epRepo.remove(epFound);
    return res.send(removedEp);
  } catch (error) {
    console.error("deleteEventParticipantHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};
