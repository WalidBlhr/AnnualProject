// File: dev/src/backend/src/handlers/service.ts
import { Request, Response } from "express";
import { createServiceValidation, updateServiceValidation, ServiceIdValidation, ListServicesValidation } from "./validators/service";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Service } from "../db/models/service";

/**
 * Create a new Service
 * POST /services
 */
export const createServiceHandler = async (req: Request, res: Response) => {
  try {
      const validation = createServiceValidation.validate(req.body);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const createServiceRequest = validation.value
      const serviceRepository = AppDataSource.getRepository(Service)
      const service = serviceRepository.create({ ...createServiceRequest })
      const serviceCreated = await serviceRepository.save(service);

      res.status(201).send(serviceCreated)
  } catch (error) {

      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Lire la liste des services (READ multiple)
 * GET /services
 */
export const listServiceHandler = async (req: Request, res: Response) => {
  try {
      console.log((req as any).service)
      const validation = ListServicesValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listServiceRequest = validation.value
      console.log(listServiceRequest)

      const query = AppDataSource.createQueryBuilder(Service, 'service')

      // if (listServiceRequest.priceMax !== undefined) {
      //     query.andWhere("service.price <= :priceMax", { priceMax: listServiceRequest.priceMax })
      // }

      query.skip((listServiceRequest.page - 1) * listServiceRequest.limit);
      query.take(listServiceRequest.limit);

      const [services, totalCount] = await query.getManyAndCount();

      const page = listServiceRequest.page
      const totalPages = Math.ceil(totalCount / listServiceRequest.limit);

      res.send(
          {
              data: services,
              page_size: listServiceRequest.limit,
              page,
              total_count: totalCount,
              total_pages: totalPages,
          }
      )

  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Récupérer le détail d'une Service par id (READ single)
 * GET /services/:id
 */
export const detailedServiceHandler = async (req: Request, res: Response) => {
  try {
      const validation = ServiceIdValidation.validate(req.params);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const getServiceRequest = validation.value
      const serviceRepository = AppDataSource.getRepository(Service)
      const service = await serviceRepository.findOne({
          where: { id: getServiceRequest.id }
      })
      if (service === null) {
          res.status(404).send({ "message": "resource not found" })
          return
      }

      res.status(200).send(service);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Mise à jour d'une Service
 * PUT /services/:id
 */
export const updateServiceHandler = async (req: Request, res: Response) => {
  try {
      const validation = updateServiceValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateService = validation.value
      const serviceRepository = AppDataSource.getRepository(Service)
      const serviceFound = await serviceRepository.findOneBy({ id: updateService.id })
      if (serviceFound === null) {
          res.status(404).send({ "error": `service ${updateService.id} not found` })
          return
      }

      // if (updateService.price) {
      //     serviceFound.price = updateService.price
      // }

      const serviceUpdate = await serviceRepository.save(serviceFound)
      res.status(200).send(serviceUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Suppression d'une Service
 * DELETE /services/:id
 */
export const deleteServiceHandler = async (req: Request, res: Response) => {
  try {
      const validation = ServiceIdValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateService = validation.value
      const serviceRepository = AppDataSource.getRepository(Service)
      const serviceFound = await serviceRepository.findOneBy({ id: updateService.id })
      if (serviceFound === null) {
          res.status(404).send({ "error": `service ${updateService.id} not found` })
          return
      }

      const serviceDeleted = await serviceRepository.remove(serviceFound)
      res.status(200).send(serviceDeleted)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}
