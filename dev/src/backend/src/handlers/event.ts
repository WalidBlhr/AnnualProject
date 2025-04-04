// handlers/event.ts
import { Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { Event } from "../db/models/event";
import { User } from "../db/models/user";

export const createEventHandler = async (req: Request, res: Response) => {
  try {
    // body = { name, date, location, max_participants, min_participants, status, creatorId }
    const { name, date, location, max_participants, min_participants, status, creatorId } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const creatorFound = await userRepo.findOneBy({ id: creatorId });
    if (!creatorFound) {
      return res.status(404).send({ message: `Creator ${creatorId} not found` });
    }

    const eventRepo = AppDataSource.getRepository(Event);
    const newEvent = eventRepo.create({
      name,
      date,
      location,
      max_participants,
      min_participants,
      status,
      creator: creatorFound
    });
    const savedEvent = await eventRepo.save(newEvent);
    return res.status(201).send(savedEvent);
  } catch (error) {
    console.error("createEventHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const listEventHandler = async (req: Request, res: Response) => {
  try {
    // Optionnel : pagination / filtres
    const eventRepo = AppDataSource.getRepository(Event);
    const events = await eventRepo.find({ relations: ["creator"] });
    return res.send(events);
  } catch (error) {
    console.error("listEventHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const getEventByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const eventRepo = AppDataSource.getRepository(Event);
    const eventFound = await eventRepo.findOne({
      where: { id },
      relations: ["creator", "participants"] // participants = array d’EventParticipant
    });
    if (!eventFound) {
      return res.status(404).send({ message: `Event ${id} not found` });
    }

    return res.send(eventFound);
  } catch (error) {
    console.error("getEventByIdHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const updateEventHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, date, location, max_participants, min_participants, status } = req.body;

    const eventRepo = AppDataSource.getRepository(Event);
    const eventFound = await eventRepo.findOneBy({ id });
    if (!eventFound) {
      return res.status(404).send({ message: `Event ${id} not found` });
    }

    if (name !== undefined) eventFound.name = name;
    if (date !== undefined) eventFound.date = date;
    if (location !== undefined) eventFound.location = location;
    if (max_participants !== undefined) eventFound.max_participants = max_participants;
    if (min_participants !== undefined) eventFound.min_participants = min_participants;
    if (status !== undefined) eventFound.status = status;

    const updatedEvent = await eventRepo.save(eventFound);
    return res.send(updatedEvent);
  } catch (error) {
    console.error("updateEventHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const deleteEventHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const eventRepo = AppDataSource.getRepository(Event);
    const eventFound = await eventRepo.findOneBy({ id });
    if (!eventFound) {
      return res.status(404).send({ message: `Event ${id} not found` });
    }

    const removedEvent = await eventRepo.remove(eventFound);
    return res.send(removedEvent);
  } catch (error) {
    console.error("deleteEventHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};
