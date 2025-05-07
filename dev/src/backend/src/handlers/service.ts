import { Request, Response } from "express";
import { createServiceValidation, updateServiceValidation, ServiceIdValidation, ListServicesValidation, bookServiceValidation } from "./validators/service";
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
    // Validation de la requête
    const validation = createServiceValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details))
      return;
    }

    const createServiceRequest = validation.value;
    const serviceRepository = AppDataSource.getRepository(Service);
    const userRepository = AppDataSource.getRepository(User);

    // Récupérer l'utilisateur qui crée le service (provider)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const provider = await userRepository.findOneBy({ id: decoded.userId });

    if (!provider) {
      res.status(400).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Créer le service avec le provider
    const service = serviceRepository.create({ 
      ...createServiceRequest,
      provider: provider,
      status: 'available',
      requester: null
    });
    
    const serviceCreated = await serviceRepository.save(service);

    // Recharger le service avec les relations pour la réponse
    const serviceWithRelations = await serviceRepository.findOne({
      where: { id: serviceCreated.id },
      relations: {
        provider: true
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
          time_slots: true
        },
        provider: {
          id: true,
          firstname: true,
          lastname: true
        }
      }
    });

    res.status(201).send(serviceWithRelations);
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

// Ajoutez cette nouvelle fonction
export const bookServiceHandler = async (req: Request, res: Response) => {
  try {
    const validation = bookServiceValidation.validate({ 
      ...req.params,
      ...req.body 
    });
    
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const bookingRequest = validation.value;
    const serviceRepository = AppDataSource.getRepository(Service);
    const userRepository = AppDataSource.getRepository(User);
    const messageRepository = AppDataSource.getRepository(Message);

    // Récupérer le service
    const service = await serviceRepository.findOne({
      where: { id: bookingRequest.id },
      relations: ['provider']
    });

    if (!service) {
      res.status(404).send({ error: 'Service non trouvé' });
      return;
    }

    // Vérifier que le service est disponible
    if (service.status !== 'available') {
      res.status(400).send({ error: 'Ce service n\'est pas disponible' });
      return;
    }

    // Vérifier que le jour est disponible
    if (!service.availability.days.includes(bookingRequest.day)) {
      res.status(400).send({ error: 'Ce jour n\'est pas disponible' });
      return;
    }

    // Vérifier que le créneau horaire est disponible
    const [requestedStart, requestedEnd] = bookingRequest.timeSlot.split('-');
    const timeSlotExists = service.availability.time_slots.some(
      slot => slot.start === requestedStart && slot.end === requestedEnd
    );

    if (!timeSlotExists) {
      res.status(400).send({ error: 'Ce créneau horaire n\'est pas disponible' });
      return;
    }

    // Récupérer l'utilisateur qui fait la réservation
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const requester = await userRepository.findOneBy({ id: decoded.userId });

    if (!requester) {
      res.status(404).send({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Mettre à jour le service
    service.status = 'booked';
    service.requester = requester;
    
    const updatedService = await serviceRepository.save(service);

    // Création du message de notification
    const newMessage = messageRepository.create({
      content: `Nouvelle réservation pour le service "${service.title}"
Date : ${bookingRequest.day}
Horaire : ${bookingRequest.timeSlot}
${bookingRequest.note ? `\nNote : ${bookingRequest.note}` : ''}`,
      date_sent: new Date(), // Ajout de la date d'envoi
      sender: requester,
      receiver: service.provider,
      status: 'unread'
    });

    await messageRepository.save(newMessage);

    res.status(200).send(updatedService);
  } catch (error) {
    console.error('Erreur lors de la réservation:', error);
    res.status(500).send({ error: 'Erreur interne du serveur' });
  }
};

// Ajoutez cette nouvelle fonction
export const cancelServiceBookingHandler = async (req: Request, res: Response) => {
  try {
    const validation = ServiceIdValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const serviceRepository = AppDataSource.getRepository(Service);
    const service = await serviceRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['provider', 'requester']
    });

    if (!service) {
      res.status(404).send({ error: 'Service non trouvé' });
      return;
    }

    // Vérifier que le service est bien réservé
    if (service.status !== 'booked') {
      res.status(400).send({ error: 'Ce service n\'est pas réservé' });
      return;
    }

    // Vérifier que l'utilisateur est bien le demandeur ou le prestataire
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (service.requester?.id !== decoded.userId && service.provider.id !== decoded.userId) {
      res.status(403).send({ error: 'Non autorisé à annuler cette réservation' });
      return;
    }

    // Réinitialiser le service
    service.status = 'available';
    service.requester = null;

    const updatedService = await serviceRepository.save(service);
    
    const messageRepository = AppDataSource.getRepository(Message);
    const userRepository = AppDataSource.getRepository(User);
    const requester = await userRepository.findOneBy({ id: decoded.userId });
    if (!requester) {
      res.status(404).send({ error: 'Utilisateur non trouvé' });
      return;
    }
    service.requester = requester;

    // Dans cancelServiceBookingHandler, ajouter la notification d'annulation :
    const newMessage = messageRepository.create({
      content: `Réservation annulée pour le service "${service.title}"
Date : ${service.date_start}`,
      date_sent: new Date(), // Ajout de la date d'envoi
      sender: requester,
      receiver: service.provider,
      status: 'unread'
    });
    await messageRepository.save(newMessage);

    res.status(200).send(updatedService);
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500).send({ error: 'Erreur interne du serveur' });
  }
};
