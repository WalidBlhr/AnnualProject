import { Application, Request, Response } from "express";
import { createUser, login, logout } from "./auth";
import { authMiddleware, isOwnerOrAdmin, isAdmin } from "../middleware/auth";
import { upload } from '../config/multer';

import { deleteUserHandler, detailedUserHandler, listUserHandler, updateUserHandler, getUserStatusHandler } from "./user";
import { bookServiceHandler, createServiceHandler, deleteServiceHandler, detailedServiceHandler, listServiceHandler, updateServiceHandler, cancelServiceBookingHandler } from "./service";
import { createTrocOfferHandler, deleteTrocOfferHandler, detailedTrocOfferHandler, listTrocOfferHandler, updateTrocOfferHandler } from "./trocOffer";
import { createMessageHandler, deleteMessageHandler, listMessageHandler, detailedMessageHandler, updateMessageHandler } from "./message";
import { createEventHandler, deleteEventHandler, detailedEventHandler, listEventHandler, updateEventHandler } from "./event";
import { createEventParticipantHandler, deleteEventParticipantHandler, detailedEventParticipantHandler, listEventParticipantHandler, updateEventParticipantHandler } from "./eventParticipant";
import {
  createAbsenceHandler,
  listAbsencesHandler,
  detailedAbsenceHandler,
  updateAbsenceHandler,
  deleteAbsenceHandler,
  addTrustedContactHandler,
  removeTrustedContactHandler,
  listTrustedContactsHandler
} from "./absence";
import { 
    createArticleHandler, 
    listArticlesHandler, 
    getArticleHandler, 
    updateArticleHandler, 
    deleteArticleHandler 
} from './article';
import { createCategoryHandler, listCategoriesHandler, deleteCategoryHandler } from "./category";

export const initHandlers = (app: Application) => {
  // Commencez par les routes statiques
  /**
   * @openapi
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check
   *     description: Vérifie que l'API fonctionne
   *     responses:
   *       200:
   *         description: OK
   */
  app.get("/health", (_: Request, res: Response) => {
    res.send({ message: "pingyes" });
  });
  
  // Ensuite les routes d'authentification
  /**
   * @openapi
   * /auth/signup:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Créer un nouvel utilisateur
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserRequest'
   *     responses:
   *       '201':
   *         description: Utilisateur créé avec succès
   *       '400':
   *         description: "Erreur de validation (ex: email déjà existant)"
   *       '500':
   *         description: Erreur interne du serveur
   */
  app.post("/auth/signup", createUser);

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Se connecter (login)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginUserValidationRequest'
   *     responses:
   *       201:
   *         description: Renvoie le token JWT
   *       400:
   *         description: Email ou mot de passe invalide
   *       500:
   *         description: Erreur interne
   */
  app.post("/auth/login", login);

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Se déconnecter (logout)
   *     responses:
   *       200:
   *         description: Renvoie le nombre de token supprimé
   *       401:
   *         description: L'utilisateur n'est pas connecté
   *       500:
   *         description: Erreur interne
   */
  app.delete("/auth/logout", authMiddleware, logout);
  
  // Ajoutez la route de statut utilisateur AVANT les routes avec paramètres variables
  /**
   * @openapi
   * /api/user-status:
   *   get:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Récupérer le statut de connexion d'un utilisateur
   *     parameters:
   *       - in: query
   *         name: userId
   *         required: true
   *         schema:
   *           type: number
   *         description: ID de l'utilisateur dont on veut connaître le statut
   *     responses:
   *       200:
   *         description: Statut de l'utilisateur
   *       400:
   *         description: ID utilisateur manquant ou invalide
   *       404:
   *         description: Utilisateur non trouvé
   */
  app.get("/api/user-status", authMiddleware, (req, res, next) => {
    getUserStatusHandler(req, res).catch(next);
  });
  
  // Ensuite les autres routes
  /**
   * @openapi
   * /users:
   *   get:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Liste tous les utilisateurs
   *     responses:
   *       200:
   *         description: Tableau des utilisateurs
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Accès refusé
   */
  app.get("/users", authMiddleware, listUserHandler);

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Détail d'un utilisateur
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID de l'utilisateur
   *     responses:
   *       200:
   *         description: L'utilisateur demandé
   *       401:
   *         description: Non authentifié
   *       404:
   *         description: Utilisateur non trouvé
   */
  app.get("/users/:id", authMiddleware, detailedUserHandler);

  /**
   * @openapi
   * /users/{id}:
   *   put:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Met à jour un utilisateur
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserSchema'
   *     responses:
   *       200:
   *         description: Utilisateur mis à jour
   *       401:
   *         description: Non authentifié
   *       404:
   *         description: Utilisateur non trouvé
   */
  app.put("/users/:id", authMiddleware, isOwnerOrAdmin, updateUserHandler);

  /**
   * @openapi
   * /users/{id}:
   *   delete:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Supprimer un utilisateur
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: L'utilisateur supprimé
   *       401:
   *         description: Non authentifié
   *       404:
   *         description: Utilisateur non trouvé
   */
  app.delete("/users/:id", authMiddleware, isAdmin, deleteUserHandler);

  /**
   * @openapi
   * /services:
   *   post:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Créer un service
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateServiceRequest'
   *     responses:
   *       201:
   *         description: Service créé
   */
  app.post("/services", authMiddleware, createServiceHandler);

  /**
   * @openapi
   * /services:
   *   get:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Liste tous les services
   *     responses:
   *       200:
   *         description: Liste de services
   */
  app.get("/services", authMiddleware, listServiceHandler);

  /**
   * @openapi
   * /services/{id}:
   *   get:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Obtenir le détail d'un service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Le service demandé
   *       404:
   *         description: Non trouvé
   */
  app.get("/services/:id", authMiddleware, detailedServiceHandler);

  /**
   * @openapi
   * /services/{id}:
   *   put:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Met à jour un service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateServiceRequest'
   *     responses:
   *       200:
   *         description: Service mis à jour
   */
  app.put("/services/:id", authMiddleware, updateServiceHandler);

  /**
   * @openapi
   * /services/{id}:
   *   delete:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Supprime un service
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Service supprimé
   */
  app.delete("/services/:id", authMiddleware, deleteServiceHandler);

  /**
   * @openapi
   * /services/{id}/book:
   *   post:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Réserver un service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               day:
   *                 type: string
   *               timeSlot:
   *                 type: string
   *               note:
   *                 type: string
   *     responses:
   *       200:
   *         description: Service réservé avec succès
   *       400:
   *         description: Données invalides ou service non disponible
   *       404:
   *         description: Service non trouvé
   */
  app.post('/services/:id/book', authMiddleware, bookServiceHandler);

  /**
   * @openapi
   * /services/{id}/cancel:
   *   post:
   *     tags:
   *       - Services
   *     security:
   *       - bearerAuth: []
   *     summary: Annuler la réservation d'un service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Réservation annulée avec succès
   *       400:
   *         description: Service non réservé
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Non autorisé
   *       404:
   *         description: Service non trouvé
   */
  app.post('/services/:id/cancel', authMiddleware, cancelServiceBookingHandler);

  /**
   * @openapi
   * /trocoffers:
   *   post:
   *     tags:
   *       - TrocOffers
   *     security:
   *       - bearerAuth: []
   *     summary: Créer un trocOffer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTrocOfferRequest'
   *     responses:
   *       201:
   *         description: TrocOffer créé
   */
  app.post("/trocoffers", authMiddleware, upload.single('image'), createTrocOfferHandler);

  /**
   * @openapi
   * /trocoffers:
   *   get:
   *     tags:
   *       - TrocOffers
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des trocOffers
   *     responses:
   *       200:
   *         description: Tableau des trocOffers
   */
  app.get("/trocoffers", authMiddleware, listTrocOfferHandler);

  /**
   * @openapi
   * /trocoffers/{id}:
   *   get:
   *     tags:
   *       - TrocOffers
   *     security:
   *       - bearerAuth: []
   *     summary: Obtenir le détail d'un trocOffer
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Le trocOffer demandé
   */
  app.get("/trocoffers/:id", authMiddleware, detailedTrocOfferHandler);

  /**
   * @openapi
   * /trocoffers/{id}:
   *   put:
   *     tags:
   *       - TrocOffers
   *     security:
   *       - bearerAuth: []
   *     summary: Met à jour un trocOffer
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTrocOfferRequest'
   *     responses:
   *       200:
   *         description: TrocOffer mis à jour
   */
  app.put("/trocoffers/:id", authMiddleware, updateTrocOfferHandler);

  /**
   * @openapi
   * /trocoffers/{id}:
   *   delete:
   *     tags:
   *       - TrocOffers
   *     security:
   *       - bearerAuth: []
   *     summary: Supprime un trocOffer
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: TrocOffer supprimé
   */
  app.delete("/trocoffers/:id", authMiddleware, deleteTrocOfferHandler);

  /**
   * @openapi
   * /messages:
   *   post:
   *     tags:
   *       - Messages
   *     security:
   *       - bearerAuth: []
   *     summary: Créer un message
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateMessageRequest'
   *     responses:
   *       201:
   *         description: Message créé
   */
  app.post("/messages", authMiddleware, createMessageHandler);

  /**
   * @openapi
   * /messages:
   *   get:
   *     tags:
   *       - Messages
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des messages
   *     responses:
   *       200:
   *         description: Tableau des messages
   */
  app.get("/messages", authMiddleware, listMessageHandler);

  /**
   * @openapi
   * /messages/{id}:
   *   get:
   *     tags:
   *       - Messages
   *     security:
   *       - bearerAuth: []
   *     summary: Détail d'un message
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Le message demandé
   */
  app.get("/messages/:id", authMiddleware, detailedMessageHandler);

  /**
   * @openapi
   * /messages/{id}:
   *   put:
   *     tags:
   *       - Messages
   *     security:
   *       - bearerAuth: []
   *     summary: Mettre à jour un message (marquer comme lu)
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 example: read
   *     responses:
   *       200:
   *         description: Message mis à jour
   */
  app.put("/messages/:id", authMiddleware, updateMessageHandler);

  /**
   * @openapi
   * /messages/{id}:
   *   delete:
   *     tags:
   *       - Messages
   *     security:
   *       - bearerAuth: []
   *     summary: Supprime un message
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Message supprimé
   */
  app.delete("/messages/:id", authMiddleware, deleteMessageHandler);

  /**
   * @openapi
   * /events:
   *   post:
   *     tags:
   *       - Events
   *     security:
   *       - bearerAuth: []
   *     summary: Créer un event
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateEventRequest'
   *     responses:
   *       201:
   *         description: Event créé
   */
  app.post("/events", authMiddleware, createEventHandler);

  /**
   * @openapi
   * /events:
   *   get:
   *     tags:
   *       - Events
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des events
   *     responses:
   *       200:
   *         description: Tableau des events
   */
  app.get("/events", authMiddleware, listEventHandler);

  /**
   * @openapi
   * /events/{id}:
   *   get:
   *     tags:
   *       - Events
   *     security:
   *       - bearerAuth: []
   *     summary: Détail d'un event
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: L'event demandé
   */
  app.get("/events/:id", authMiddleware, detailedEventHandler);

  /**
   * @openapi
   * /events/{id}:
   *   put:
   *     tags:
   *       - Events
   *     security:
   *       - bearerAuth: []
   *     summary: Met à jour un event
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateEventRequest'
   *     responses:
   *       200:
   *         description: Event mis à jour
   */
  app.put("/events/:id", authMiddleware, updateEventHandler);

  /**
   * @openapi
   * /events/{id}:
   *   delete:
   *     tags:
   *       - Events
   *     security:
   *       - bearerAuth: []
   *     summary: Supprime un event
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Event supprimé
   */
  app.delete("/events/:id", authMiddleware, deleteEventHandler);

  /**
   * @openapi
   * /event-participants:
   *   post:
   *     tags:
   *       - EventParticipants
   *     security:
   *       - bearerAuth: []
   *     summary: Créer une participation à un event
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateEventParticipantRequest'
   *     responses:
   *       201:
   *         description: EventParticipant créé
   */
  app.post("/event-participants", authMiddleware, createEventParticipantHandler);

  /**
   * @openapi
   * /event-participants:
   *   get:
   *     tags:
   *       - EventParticipants
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des participations
   *     responses:
   *       200:
   *         description: Tableau des participations
   */
  app.get("/event-participants", authMiddleware, listEventParticipantHandler);

  /**
   * @openapi
   * /event-participants/{id}:
   *   get:
   *     tags:
   *       - EventParticipants
   *     security:
   *       - bearerAuth: []
   *     summary: Détail d'une participation
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: La participation demandée
   */
  app.get("/event-participants/:id", authMiddleware, detailedEventParticipantHandler);

  /**
   * @openapi
   * /event-participants/{id}:
   *   put:
   *     tags:
   *       - EventParticipants
   *     security:
   *       - bearerAuth: []
   *     summary: Met à jour une participation
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateEventParticipantRequest'
   *     responses:
   *       200:
   *         description: Participation mise à jour
   */
  app.put("/event-participants/:id", authMiddleware, updateEventParticipantHandler);

  /**
   * @openapi
   * /event-participants/{id}:
   *   delete:
   *     tags:
   *       - EventParticipants
   *     security:
   *       - bearerAuth: []
   *     summary: Supprime une participation
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Participation supprimée
   */
  app.delete("/event-participants/:id", authMiddleware, deleteEventParticipantHandler);

  /**
   * @openapi
   * /absences:
   *   post:
   *     tags:
   *       - Absences
   *     security:
   *       - bearerAuth: []
   *     summary: Déclarer une absence
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAbsenceRequest'
   *     responses:
   *       201:
   *         description: Absence créée
   */
  app.post("/absences", authMiddleware, createAbsenceHandler);

  /**
   * @openapi
   * /absences:
   *   get:
   *     tags:
   *       - Absences
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des absences
   *     responses:
   *       200:
   *         description: Liste des absences
   */
  app.get("/absences", authMiddleware, listAbsencesHandler);

  /**
   * @openapi
   * /absences/{id}:
   *   get:
   *     tags:
   *       - Absences
   *     security:
   *       - bearerAuth: []
   *     summary: Détails d'une absence
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Détails de l'absence
   */
  app.get("/absences/:id", authMiddleware, detailedAbsenceHandler);

  /**
   * @openapi
   * /absences/{id}:
   *   put:
   *     tags:
   *       - Absences
   *     security:
   *       - bearerAuth: []
   *     summary: Mise à jour d'une absence
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAbsenceRequest'
   *     responses:
   *       200:
   *         description: Absence mise à jour
   */
  app.put("/absences/:id", authMiddleware, updateAbsenceHandler);

  /**
   * @openapi
   * /absences/{id}:
   *   delete:
   *     tags:
   *       - Absences
   *     security:
   *       - bearerAuth: []
   *     summary: Suppression d'une absence
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Absence supprimée
   */
  app.delete("/absences/:id", authMiddleware, deleteAbsenceHandler);

  /**
   * @openapi
   * /trusted-contacts:
   *   post:
   *     tags:
   *       - TrustedContacts
   *     security:
   *       - bearerAuth: []
   *     summary: Ajouter un contact de confiance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TrustedContactRequest'
   *     responses:
   *       200:
   *         description: Contact de confiance ajouté
   */
  app.post("/trusted-contacts", authMiddleware, addTrustedContactHandler);

  /**
   * @openapi
   * /trusted-contacts/{userId}/{trustedUserId}:
   *   delete:
   *     tags:
   *       - TrustedContacts
   *     security:
   *       - bearerAuth: []
   *     summary: Supprimer un contact de confiance
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: number
   *         required: true
   *       - in: path
   *         name: trustedUserId
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Contact de confiance supprimé
   */
  app.delete("/trusted-contacts/:userId/:trustedUserId", authMiddleware, removeTrustedContactHandler);

  /**
   * @openapi
   * /users/{userId}/trusted-contacts:
   *   get:
   *     tags:
   *       - TrustedContacts
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des contacts de confiance d'un utilisateur
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Liste des contacts de confiance
   */
  app.get("/users/:userId/trusted-contacts", authMiddleware, listTrustedContactsHandler);

  /**
   * @openapi
   * /journal/articles:
   *   post:
   *     tags:
   *       - Journal
   *     security:
   *       - bearerAuth: []
   *     summary: Create a new article
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               category:
   *                 type: string
   *               isPublic:
   *                 type: boolean
   *               imageUrl:
   *                 type: string
   *     responses:
   *       201:
   *         description: Article created successfully
   */
  app.post("/journal/articles", authMiddleware, (req, res, next) => {
    createArticleHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/articles:
   *   get:
   *     tags:
   *       - Journal
   *     summary: Get all articles
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of items per page
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by category
   *       - in: query
   *         name: isPublic
   *         schema:
   *           type: boolean
   *         description: Filter by public/private status
   *     responses:
   *       200:
   *         description: List of articles
   */
  app.get("/journal/articles", (req, res, next) => {
    listArticlesHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/articles/{id}:
   *   get:
   *     tags:
   *       - Journal
   *     summary: Get article by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Article details
   */
  app.get("/journal/articles/:id", (req, res, next) => {
    getArticleHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/articles/{id}:
   *   put:
   *     tags:
   *       - Journal
   *     security:
   *       - bearerAuth: []
   *     summary: Update an article
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               category:
   *                 type: string
   *               status:
   *                 type: string
   *               isPublic:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Article updated successfully
   */
  app.put("/journal/articles/:id", authMiddleware, (req, res, next) => {
    updateArticleHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/articles/{id}:
   *   delete:
   *     tags:
   *       - Journal
   *     security:
   *       - bearerAuth: []
   *     summary: Delete an article
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Article deleted successfully
   */
  app.delete("/journal/articles/:id", authMiddleware, (req, res, next) => {
    deleteArticleHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/categories:
   *   post:
   *     tags:
   *       - Journal
   *     security:
   *       - bearerAuth: []
   *     summary: Create a new category
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created successfully
   */
  app.post("/journal/categories", authMiddleware, isAdmin, (req, res, next) => {
    createCategoryHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/categories:
   *   get:
   *     tags:
   *       - Journal
   *     summary: Get all categories
   *     responses:
   *       200:
   *         description: List of categories
   */
  app.get("/journal/categories", (req, res, next) => {
    listCategoriesHandler(req, res).catch(next);
  });

  /**
   * @openapi
   * /journal/categories/{id}:
   *   delete:
   *     tags:
   *       - Journal
   *     security:
   *       - bearerAuth: []
   *     summary: Delete a category
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Category deleted successfully
   */
  app.delete("/journal/categories/:id", authMiddleware, isAdmin, (req, res, next) => {
    deleteCategoryHandler(req, res).catch(next);
  });
}
