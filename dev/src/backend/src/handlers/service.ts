import { Request, Response } from "express";
import { createServiceValidation, updateServiceValidation, ServiceIdValidation, ListServicesValidation, createBookingValidation, acceptBookingValidation, cancelBookingValidation } from "./validators/service";
import jwt from "jsonwebtoken";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { Service } from "../db/models/service";
import { User } from "../db/models/user";
import { Message } from "../db/models/message";
import { Booking, BookingDay, BookingStatus } from "../db/models/booking";
import { NotificationService } from "../utils/notificationService";

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
      status: 'available'
    });
    
    const serviceCreated = await serviceRepository.save(service);

    // Envoyer une notification pour le nouveau service
    await NotificationService.notifyNewService(
      serviceCreated.id,
      serviceCreated.title,
      provider.id
    );

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
      }
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
      .select([
        'service',
        'provider.id',
        'provider.firstname',
        'provider.lastname'
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
          time_slots: {
            start: true,
            end: true
          }
        },
        provider: {
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
        provider: true
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

/**
 * Lister les réservations (bookings) pour l'utilisateur connecté
 * GET /bookings?role=requester|provider (optionnel)
 */
export const listBookingHandler = async (req: Request, res: Response) => {
  try {
    // Récupérer l'utilisateur depuis le token JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.userId });

    if (!user) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    const bookingRepository = AppDataSource.getRepository(Booking);
    const { role } = req.query;
    
    let whereCondition: any;
    
    if (role === 'requester') {
      // Seules les réservations où l'utilisateur est le demandeur
      whereCondition = { requester: { id: user.id } };
    } else if (role === 'provider') {
      // Seules les réservations où l'utilisateur est le prestataire
      whereCondition = { service: { provider: { id: user.id } } };
    } else {
      // Par défaut, toutes les réservations (requester ET provider)
      whereCondition = [
        { requester: { id: user.id } },
        { service: { provider: { id: user.id } } }
      ];
    }
    
    // Récupérer les réservations selon le filtre
    const bookings = await bookingRepository.find({
      where: whereCondition,
      relations: [
        'service',
        'service.provider',
        'requester'
      ],
      order: { created_at: 'DESC' }
    });

    // Formatter les réservations pour le frontend
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      service: {
        id: booking.service.id,
        title: booking.service.title,
        provider: {
          id: booking.service.provider.id,
          firstname: booking.service.provider.firstname,
          lastname: booking.service.provider.lastname
        }
      },
      requester: {
        id: booking.requester.id,
        firstname: booking.requester.firstname,
        lastname: booking.requester.lastname
      },
      day: booking.day,
      time_slot: booking.time_slot,
      status: booking.status,
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }));

    res.status(200).send({ data: formattedBookings });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "Internal error" });
  }
};

/**
 * Créer une nouvelle réservation (booking)
 * POST /bookings
 */
export const createBookingHandler = async (req: Request, res: Response) => {
  try {
    // Récupérer l'utilisateur depuis le token JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const requester = await userRepository.findOneBy({ id: decoded.userId });

    if (!requester) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Validation de la requête
    const validation = createBookingValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const createBookingRequest = validation.value;

    // Récupérer le service
    const serviceRepository = AppDataSource.getRepository(Service);
    const service = await serviceRepository.findOne({
      where: { id: createBookingRequest.service_id },
      relations: ['provider']
    });

    if (!service) {
      res.status(404).send({ message: "Service non trouvé" });
      return;
    }

    // Vérifier que l'utilisateur ne réserve pas son propre service
    if (service.provider.id === requester.id) {
      res.status(400).send({ message: "Vous ne pouvez pas réserver votre propre service" });
      return;
    }

    // Vérifier que le service est disponible
    if (service.status !== 'available') {
      res.status(400).send({ message: "Ce service n'est pas disponible pour les réservations" });
      return;
    }

    // Convertir le jour en français pour la vérification
    const dayMapping: { [key: string]: string } = {
      'monday': 'Lundi',
      'tuesday': 'Mardi', 
      'wednesday': 'Mercredi',
      'thursday': 'Jeudi',
      'friday': 'Vendredi',
      'saturday': 'Samedi',
      'sunday': 'Dimanche'
    };

    const frenchDay = dayMapping[createBookingRequest.day];
    
    // Vérifier que le jour demandé est dans la disponibilité du service
    if (!service.availability || !service.availability.days.includes(frenchDay)) {
      res.status(400).send({ 
        message: `Le service n'est pas disponible le ${frenchDay}` 
      });
      return;
    }

    // Vérifier que le créneau demandé est dans la disponibilité du service
    const [requestedStart, requestedEnd] = createBookingRequest.time_slot.split('-');
    const isTimeSlotAvailable = service.availability.time_slots.some(slot => 
      slot.start === requestedStart && slot.end === requestedEnd
    );

    if (!isTimeSlotAvailable) {
      res.status(400).send({ 
        message: `Le créneau ${createBookingRequest.time_slot} n'est pas disponible pour ce service` 
      });
      return;
    }

    // Vérifier qu'il n'y a pas déjà une réservation 'accepted' sur le même jour et créneau pour ce service
    const bookingRepository = AppDataSource.getRepository(Booking);
    const existingBooking = await bookingRepository.findOne({
      where: {
        service: { id: service.id },
        day: createBookingRequest.day as BookingDay,
        time_slot: createBookingRequest.time_slot,
        status: BookingStatus.ACCEPTED
      }
    });

    if (existingBooking) {
      res.status(400).send({ 
        message: `Ce créneau ${createBookingRequest.time_slot} le ${frenchDay} est déjà réservé pour ce service` 
      });
      return;
    }

    // Créer la réservation
    const booking = bookingRepository.create({
      service: service,
      requester: requester,
      day: createBookingRequest.day as BookingDay,
      time_slot: createBookingRequest.time_slot,
      status: BookingStatus.PENDING
    });

    const bookingCreated = await bookingRepository.save(booking);

    // Envoyer une notification au provider
    await NotificationService.notifyServiceBooked(
      service.id,
      service.title,
      service.provider.id,
      requester.id,
      frenchDay,
      createBookingRequest.time_slot
    );

    // Retourner la réservation créée
    const response = {
      id: bookingCreated.id,
      service: {
        id: service.id,
        title: service.title,
        provider: {
          id: service.provider.id,
          firstname: service.provider.firstname,
          lastname: service.provider.lastname
        }
      },
      requester: {
        id: requester.id,
        firstname: requester.firstname,
        lastname: requester.lastname
      },
      day: bookingCreated.day,
      time_slot: bookingCreated.time_slot,
      status: bookingCreated.status,
      created_at: bookingCreated.created_at,
      updated_at: bookingCreated.updated_at
    };

    res.status(201).send(response);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "Internal error" });
  }
};

/**
 * Accepter une réservation (booking)
 * PUT /bookings/:booking_id/accept
 */
export const acceptBookingHandler = async (req: Request, res: Response) => {
  try {
    // Récupérer l'utilisateur depuis le token JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.userId });

    if (!user) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Validation de la requête
    const validation = acceptBookingValidation.validate({ booking_id: req.params.booking_id });
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const acceptBookingRequest = validation.value;

    // Récupérer la réservation avec les relations
    const bookingRepository = AppDataSource.getRepository(Booking);
    const booking = await bookingRepository.findOne({
      where: { id: acceptBookingRequest.booking_id },
      relations: ['service', 'service.provider', 'requester']
    });

    if (!booking) {
      res.status(404).send({ message: "Réservation non trouvée" });
      return;
    }

    // Vérifier que l'utilisateur est bien le provider du service
    if (booking.service.provider.id !== user.id) {
      res.status(403).send({ message: "Vous n'êtes pas autorisé à modifier cette réservation" });
      return;
    }

    // Vérifier que la réservation est en statut 'pending'
    if (booking.status !== BookingStatus.PENDING) {
      res.status(400).send({ message: "Cette réservation ne peut plus être acceptée" });
      return;
    }

    // Mettre à jour le statut de la réservation
    booking.status = BookingStatus.ACCEPTED;
    const updatedBooking = await bookingRepository.save(booking);

    // Envoyer une notification au requester
    await NotificationService.notifyBookingAccepted(
      booking.service.id,
      booking.service.title,
      booking.requester.id,
      booking.service.provider.id
    );

    // Retourner la réservation mise à jour
    const response = {
      id: updatedBooking.id,
      service: {
        id: booking.service.id,
        title: booking.service.title,
        provider: {
          id: booking.service.provider.id,
          firstname: booking.service.provider.firstname,
          lastname: booking.service.provider.lastname
        }
      },
      requester: {
        id: booking.requester.id,
        firstname: booking.requester.firstname,
        lastname: booking.requester.lastname
      },
      day: updatedBooking.day,
      time_slot: updatedBooking.time_slot,
      status: updatedBooking.status,
      created_at: updatedBooking.created_at,
      updated_at: updatedBooking.updated_at
    };

    res.status(200).send(response);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "Internal error" });
  }
};

/**
 * Annuler une réservation (booking)
 * PUT /bookings/:booking_id/cancel
 */
export const cancelBookingHandler = async (req: Request, res: Response) => {
  try {
    // Récupérer l'utilisateur depuis le token JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }

    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.userId });

    if (!user) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Validation de la requête
    const validation = cancelBookingValidation.validate({ booking_id: req.params.booking_id });
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const cancelBookingRequest = validation.value;

    // Récupérer la réservation avec les relations
    const bookingRepository = AppDataSource.getRepository(Booking);
    const booking = await bookingRepository.findOne({
      where: { id: cancelBookingRequest.booking_id },
      relations: ['service', 'service.provider', 'requester']
    });

    if (!booking) {
      res.status(404).send({ message: "Réservation non trouvée" });
      return;
    }

    // Vérifier que l'utilisateur est soit le requester soit le provider du service
    const isRequester = booking.requester.id === user.id;
    const isProvider = booking.service.provider.id === user.id;

    if (!isRequester && !isProvider) {
      res.status(403).send({ message: "Vous n'êtes pas autorisé à annuler cette réservation" });
      return;
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (booking.status === BookingStatus.CANCELLED) {
      res.status(400).send({ message: "Cette réservation est déjà annulée" });
      return;
    }

    // Mettre à jour le statut de la réservation
    booking.status = BookingStatus.CANCELLED;
    const updatedBooking = await bookingRepository.save(booking);

    // Envoyer une notification à l'autre partie
    const receiverId = isRequester ? booking.service.provider.id : booking.requester.id;
    await NotificationService.notifyBookingCanceled(
      booking.service.id,
      booking.service.title,
      receiverId,
      user.id
    );

    // Retourner la réservation mise à jour
    const response = {
      id: updatedBooking.id,
      service: {
        id: booking.service.id,
        title: booking.service.title,
        provider: {
          id: booking.service.provider.id,
          firstname: booking.service.provider.firstname,
          lastname: booking.service.provider.lastname
        }
      },
      requester: {
        id: booking.requester.id,
        firstname: booking.requester.firstname,
        lastname: booking.requester.lastname
      },
      day: updatedBooking.day,
      time_slot: updatedBooking.time_slot,
      status: updatedBooking.status,
      created_at: updatedBooking.created_at,
      updated_at: updatedBooking.updated_at
    };

    res.status(200).send(response);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "Internal error" });
  }
};
