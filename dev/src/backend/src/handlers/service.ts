// handlers/service.ts
import { Request, Response } from "express";
import { CreateProductValidation } from "./validators/create-product";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Service } from "../db/models/service";
import { User } from "../db/models/user";

export const createServiceHandler = async (req: Request, res: Response) => {
  try {
    // body = { type_service, description, date, status, userId }
    const { type_service, description, date, status, userId } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const userFound = await userRepo.findOneBy({ id: userId });
    if (!userFound) {
      res.status(404).send({ message: `User ${userId} not found` });
    }

    const serviceRepo = AppDataSource.getRepository(Service);
    const newService = serviceRepo.create({
      type_service,
      description,
      date,
      status,
      user: userFound
    });
    const savedService = await serviceRepo.save(newService);
    res.send(savedService);
  } catch (error) {
    console.error("createServiceHandler error:", error);
    res.status(500).send({ message: "internal error" });
  }
};

export const listServiceHandler = async (req: Request, res: Response) => {
  try {
    const serviceRepo = AppDataSource.getRepository(Service);
    const services = await serviceRepo.find({
      relations: ["user"]
    });
    return res.send(services);
  } catch (error) {
    console.error("listServiceHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const getServiceByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const serviceRepo = AppDataSource.getRepository(Service);
    const serviceFound = await serviceRepo.findOne({
      where: { id },
      relations: ["user"]
    });
    if (!serviceFound) {
      return res.status(404).send({ message: `Service ${id} not found` });
    }

    return res.send(serviceFound);
  } catch (error) {
    console.error("getServiceByIdHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const updateServiceHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { type_service, description, date, status } = req.body;

    const serviceRepo = AppDataSource.getRepository(Service);
    const serviceFound = await serviceRepo.findOneBy({ id });
    if (!serviceFound) {
      return res.status(404).send({ message: `Service ${id} not found` });
    }

    if (type_service !== undefined) serviceFound.type_service = type_service;
    if (description !== undefined) serviceFound.description = description;
    if (date !== undefined) serviceFound.date = date;
    if (status !== undefined) serviceFound.status = status;

    const updatedService = await serviceRepo.save(serviceFound);
    return res.send(updatedService);
  } catch (error) {
    console.error("updateServiceHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

export const deleteServiceHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const serviceRepo = AppDataSource.getRepository(Service);
    const serviceFound = await serviceRepo.findOneBy({ id });
    if (!serviceFound) {
      return res.status(404).send({ message: `Service ${id} not found` });
    }
    const removedService = await serviceRepo.remove(serviceFound);
    return res.send(removedService);
  } catch (error) {
    console.error("deleteServiceHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};
