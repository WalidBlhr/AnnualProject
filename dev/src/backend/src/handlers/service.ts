import { Request, Response } from "express";
import { createServiceValidation, updateServiceValidation, ServiceIdValidation, ListServicesValidation } from "./validators/service";
import jwt from "jsonwebtoken";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Service } from "../db/models/service";
import { User } from "../db/models/user";
import { Message } from "../db/models/message";

/**
 * Create a new Service
 * POST /services
 */
export const createServiceHandler = async (req: Request, res: Response) => {
  try {
    // Récupérer le provider depuis le token JWT (ignore provider_id du body)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const provider = await userRepository.findOneBy({ id: decoded.userId });

    if (!provider) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Extraire les données du body (sans provider_id)
    const { provider_id, ...serviceData } = req.body;

    // Validation de la requête (sans provider_id)
    const validation = createServiceValidation.validate(serviceData);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const createServiceRequest = validation.value;

    // Vérifier que availability est correctement formaté
    if (!createServiceRequest.availability || 
        !Array.isArray(createServiceRequest.availability.days) ||
        !Array.isArray(createServiceRequest.availability.time_slots)) {
      res.status(400).send({ 
        message: "availability doit contenir un objet avec 'days' (array) et 'time_slots' (array)" 
      });
      return;
    }

    // Vérifier la structure des time_slots
    for (const slot of createServiceRequest.availability.time_slots) {
      if (!slot.start || !slot.end) {
        res.status(400).send({ 
          message: "Chaque time_slot doit avoir 'start' et 'end'" 
        });
        return;
      }
    }

    const serviceRepository = AppDataSource.getRepository(Service);

    // Créer le service avec le provider du token et status 'available'
    const service = serviceRepository.create({
      title: createServiceRequest.title,
      description: createServiceRequest.description,
      type: createServiceRequest.type,
      date_start: createServiceRequest.date_start,
      date_end: createServiceRequest.date_end,
      availability: createServiceRequest.availability,
      provider: provider,
      status: 'available',
      requester: null
    });
    
    const serviceCreated = await serviceRepository.save(service);

    // Retourner un JSON clair avec provider info
    const response = {
      id: serviceCreated.id,
      title: serviceCreated.title,
      description: serviceCreated.description,
      type: serviceCreated.type,
      status: serviceCreated.status,
      date_start: serviceCreated.date_start,
      date_end: serviceCreated.date_end,
      availability: serviceCreated.availability,
      provider: {
        id: provider.id,
        firstname: provider.firstname,
        lastname: provider.lastname
      },
      requester: null
    };

    res.status(201).send(response);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ "message": "internal error" });
  }
};

/**
 * Lire la liste des services (READ multiple)
 * GET /services
 */
export const listServiceHandler = async (req: Request, res: Response) => {
  try {
    const validation = ListServicesValidation.validate(req.query);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listServiceRequest = validation.value;
    const query = AppDataSource.createQueryBuilder(Service, 'service')
      .leftJoinAndSelect('service.provider', 'provider')
      .leftJoinAndSelect('service.requester', 'requester')
      .select([
        'service',
        'provider.id',
        'provider.firstname',
        'provider.lastname',
        'requester.id',
        'requester.firstname',
        'requester.lastname'
      ]);

    // Ajout des filtres
    if (listServiceRequest.type) {
      query.andWhere("service.type = :type", { type: listServiceRequest.type });
    }
    if (listServiceRequest.status) {
      query.andWhere("service.status = :status", { status: listServiceRequest.status });
    }
    if (listServiceRequest.date_start) {
      query.andWhere("service.date_start >= :date_start", { date_start: listServiceRequest.date_start });
    }
    if (listServiceRequest.date_end) {
      query.andWhere("service.date_end <= :date_end", { date_end: listServiceRequest.date_end });
    }

    // Pagination
    query.skip((listServiceRequest.page - 1) * listServiceRequest.limit);
    query.take(listServiceRequest.limit);

    const [services, totalCount] = await query.getManyAndCount();

    res.send({
      data: services,
      page_size: listServiceRequest.limit,
      page: listServiceRequest.page,
      total_count: totalCount,
      total_pages: Math.ceil(totalCount / listServiceRequest.limit),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ "message": "internal error" });
  }
};

/**
 * Récupérer le détail d’une Service par id (READ single)
 * GET /services/:id
 */
export const detailedServiceHandler = async (req: Request, res: Response) => {
  try {
    const validation = ServiceIdValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details))
      return;
    }

    const getServiceRequest = validation.value;
    const serviceRepository = AppDataSource.getRepository(Service);
    
    const service = await serviceRepository.findOne({
      where: { id: getServiceRequest.id },
      relations: {
        provider: true,
        requester: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        date_start: true,
        date_end: true,
        availability: {
          days: true,
          time_slots: {
            start: true,
            end: true
          }
        },
        provider: {
          id: true,
          firstname: true,
          lastname: true
        },
        requester: {
          id: true,
          firstname: true,
          lastname: true
        }
      }
    });

    if (!service) {
      res.status(404).send({ "message": "resource not found" });
      return;
    }

    res.status(200).send(service);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ "message": "internal error" });
  }
};

/**
 * Mise à jour d’une Service
 * PUT /services/:id
 */
export const updateServiceHandler = async (req: Request, res: Response) => {
  try {
    const validation = updateServiceValidation.validate({ ...req.params, ...req.body });
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateService = validation.value;
    const serviceRepository = AppDataSource.getRepository(Service);
    const serviceFound = await serviceRepository.findOneBy({ id: updateService.id });
    
    if (serviceFound === null) {
      res.status(404).send({ "error": `service ${updateService.id} not found` });
      return;
    }

    // Mise à jour des champs
    if (updateService.title) {
      serviceFound.title = updateService.title;
    }
    if (updateService.description) {
      serviceFound.description = updateService.description;
    }
    if (updateService.type) {
      serviceFound.type = updateService.type;
    }
    if (updateService.date_start) {
      serviceFound.date_start = updateService.date_start;
    }
    if (updateService.date_end) {
      serviceFound.date_end = updateService.date_end;
    }
    if (updateService.availability) {
      serviceFound.availability = updateService.availability;
    }
    if (updateService.status) {
      serviceFound.status = updateService.status;
    }

    const serviceUpdate = await serviceRepository.save(serviceFound);
    
    // Recharger le service avec les relations
    const updatedServiceWithRelations = await serviceRepository.findOne({
      where: { id: serviceUpdate.id },
      relations: {
        provider: true,
        requester: true
      }
    });

    res.status(200).send(updatedServiceWithRelations);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};

/**
 * Suppression d’une Service
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
