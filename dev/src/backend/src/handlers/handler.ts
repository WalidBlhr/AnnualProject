import { Application, Request, Response } from "express";
import { upload } from '../config/multer';
import { authMiddleware, isAdmin, isOwnerOrAdmin } from "../middleware/auth";
import { createUser, login, logout, refresh } from "./auth";
import { forgotPasswordHandler, resetPasswordHandler, verifyResetTokenHandler } from "./password-reset";

import {
    addTrustedContactHandler,
    createAbsenceHandler,
    deleteAbsenceHandler,
    detailedAbsenceHandler,
    listAbsencesHandler,
    listTrustedContactsHandler,
    removeTrustedContactHandler,
    respondToAbsenceHandler,
    updateAbsenceHandler
} from "./absence";
import {
    createArticleHandler,
    deleteArticleHandler,
    getArticleHandler,
    listArticlesHandler,
    updateArticleHandler
} from './article';
import { createCategoryHandler, deleteCategoryHandler, listCategoriesHandler, updateCategoryHandler } from "./category";
import { createEventHandler, deleteEventHandler, detailedEventHandler, listEventHandler, updateEventHandler, cancelEventHandler } from "./event";
import { createEventParticipantHandler, deleteEventParticipantHandler, detailedEventParticipantHandler, listEventParticipantHandler, updateEventParticipantHandler } from "./eventParticipant";
import { createMessageHandler, deleteMessageHandler, detailedMessageHandler, listMessageHandler, updateMessageHandler } from "./message";
import { createServiceHandler, deleteServiceHandler, detailedServiceHandler, listServiceHandler, updateServiceHandler, createBookingHandler, acceptBookingHandler, cancelBookingHandler, listBookingHandler } from "./service";
import { createTicTacToeGame, getTicTacToeGame, playTicTacToeMove } from './tictactoe';
import { createTrocOfferHandler, deleteTrocOfferHandler, detailedTrocOfferHandler, listTrocOfferHandler, updateTrocOfferHandler } from "./trocOffer";
import { deleteUserHandler, detailedUserHandler, getUserStatusHandler, listUserHandler, updateUserHandler, updateEmailNotificationPreferencesHandler, getEmailNotificationPreferencesHandler } from "./user";
import { createMessageGroup, deleteMessageGroup, getMessageGroup, listMessageGroups, patchMessageGroup } from "./messageGroup";
import { createGroupMessage, listGroupMessages } from "./groupMessage";
import { getAffinityScore, getRealTimeSuggestions, getSuggestions, getUserAffinities, getUserFavoriteCategories, getUserRecentInteractions, getUserStats, recordInteraction, recordSuggestionFeedback, recordSuggestionView, updateInteraction } from "./suggestion";

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
   * /auth/forgot-password:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Demande de réinitialisation du mot de passe
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *             required:
   *               - email
   *     responses:
   *       200:
   *         description: Email de réinitialisation envoyé
   *       400:
   *         description: Email invalide
   *       500:
   *         description: Erreur interne
   */
  app.post("/auth/forgot-password", forgotPasswordHandler);

  /**
   * @openapi
   * /auth/verify-reset-token/{token}:
   *   get:
   *     tags:
   *       - Auth
   *     summary: Vérifier la validité d'un token de réinitialisation
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Token valide
   *       400:
   *         description: Token invalide ou expiré
   *       500:
   *         description: Erreur interne
   */
  app.get("/auth/verify-reset-token/:token", verifyResetTokenHandler);

  /**
   * @openapi
   * /auth/reset-password:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Réinitialiser le mot de passe
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *                 minLength: 6
   *             required:
   *               - token
   *               - password
   *     responses:
   *       200:
   *         description: Mot de passe réinitialisé avec succès
   *       400:
   *         description: Token invalide ou mot de passe invalide
   *       500:
   *         description: Erreur interne
   */
  app.post("/auth/reset-password", resetPasswordHandler);

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

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Rafraîchir le token d'accès (refresh)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshRequest'
   *     responses:
   *       200:
   *         description: Renvoie le nouveau token d'accès et le refresh token (potentiellement un nouveau).
   *       400:
   *         description: La requête ne contient pas de propriété refresh_token.
   *       401:
   *         description: Le refresh_token est invalide.
   *       404:
   *         description: L'utilisateur propriétaire du refresh token n'existe plus.
   *       500:
   *         description: Erreur interne
   */
  app.post("/auth/refresh", refresh);
  
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
  app.put("/users/:id", authMiddleware, isOwnerOrAdmin("id"), updateUserHandler);

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
   * /users/{id}/email-notifications:
   *   get:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Récupérer les préférences de notification par email
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Préférences de notification
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 email_notifications_enabled:
   *                   type: boolean
   *       401:
   *         description: Non authentifié
   *       404:
   *         description: Utilisateur non trouvé
   */
  app.get("/users/:id/email-notifications", authMiddleware, isOwnerOrAdmin("id"), getEmailNotificationPreferencesHandler);

  /**
   * @openapi
   * /users/{id}/email-notifications:
   *   put:
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     summary: Mettre à jour les préférences de notification par email
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
   *               enabled:
   *                 type: boolean
   *                 description: Activer ou désactiver les notifications par email
   *             required:
   *               - enabled
   *     responses:
   *       200:
   *         description: Préférences mises à jour
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 email_notifications_enabled:
   *                   type: boolean
   *       401:
   *         description: Non authentifié
   *       404:
   *         description: Utilisateur non trouvé
   */
  app.put("/users/:id/email-notifications", authMiddleware, isOwnerOrAdmin("id"), updateEmailNotificationPreferencesHandler);

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
   * /bookings:
   *   get:
   *     tags:
   *       - Bookings
   *     security:
   *       - bearerAuth: []
   *     summary: Liste des réservations de l'utilisateur
   *     responses:
   *       200:
   *         description: Liste des réservations
   */
  app.get("/bookings", authMiddleware, listBookingHandler);

  /**
   * @openapi
   * /bookings:
   *   post:
   *     tags:
   *       - Bookings
   *     security:
   *       - bearerAuth: []
   *     summary: Créer une réservation
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateBookingRequest'
   *     responses:
   *       201:
   *         description: Réservation créée
   *       400:
   *         description: Erreur de validation
   *       404:
   *         description: Service non trouvé
   */
  app.post("/bookings", authMiddleware, createBookingHandler);

  /**
   * @openapi
   * /bookings/{id}/accept:
   *   put:
   *     tags:
   *       - Bookings
   *     security:
   *       - bearerAuth: []
   *     summary: Accepter une réservation
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Réservation acceptée
   *       403:
   *         description: Non autorisé
   *       404:
   *         description: Réservation non trouvée
   */
  app.put("/bookings/:booking_id/accept", authMiddleware, acceptBookingHandler);

  /**
   * @openapi
   * /bookings/{id}/cancel:
   *   put:
   *     tags:
   *       - Bookings
   *     security:
   *       - bearerAuth: []
   *     summary: Annuler une réservation
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Réservation annulée
   *       403:
   *         description: Non autorisé
   *       404:
   *         description: Réservation non trouvée
   */
  app.put("/bookings/:booking_id/cancel", authMiddleware, cancelBookingHandler);

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
   * /events/{id}/cancel:
   *   put:
   *     tags:
   *       - Events
   *     security:
   *       - bearerAuth: []
   *     summary: Annuler un événement
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: number
   *         required: true
   *     responses:
   *       200:
   *         description: Event annulé
   */
  app.put("/events/:id/cancel", authMiddleware, cancelEventHandler);

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
   * /absences/{id}/response:
   *   put:
   *     tags:
   *       - Absences
   *     security:
   *       - bearerAuth: []
   *     summary: Répondre à une demande de surveillance
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
   *                 enum: [accepted, refused]
   *               response_notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Réponse enregistrée avec succès
   */
  app.put("/absences/:id/response", authMiddleware, respondToAbsenceHandler);

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

  /**
   * @openapi
   * /journal/categories/{id}:
   *   put:
   *     tags:
   *       - Journal
   *     security:
   *       - bearerAuth: []
   *     summary: Update a category
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
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Category updated successfully
   */
  app.put("/journal/categories/:id", authMiddleware, isAdmin, (req, res, next) => {
    updateCategoryHandler(req, res).catch(next);
  });

  app.post('/tictactoe', authMiddleware, createTicTacToeGame);
  app.get('/tictactoe', authMiddleware, getTicTacToeGame);
  app.put('/tictactoe/:id/move', authMiddleware, playTicTacToeMove);

  /**
   * @openapi
   * /message-groups/:
   *   get:
   *     tags:
   *       - Message Groups
   *     security:
   *       - bearerAuth: []
   *     summary: Get all groupchats
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
   *         name: name
   *         schema:
   *           type: string
   *         description: Group's name
   *       - in: query
   *         name: ownerFullname
   *         schema:
   *           type: string
   *         description: Group owner's fullname
   *       - in: query
   *         name: ownerId
   *         schema:
   *           type: integer
   *         description: Group owner's id
   *       - in: query
   *         name: membersMin
   *         schema:
   *           type: integer
   *         description: Minimum amount of members
   *       - in: query
   *         name: membersMax
   *         schema:
   *           type: integer
   *         description: Maximum amount of members
   *       - in: query
   *         name: messageMin
   *         schema:
   *           type: integer
   *         description: Minimum amount of messages
   *       - in: query
   *         name: messageMax
   *         schema:
   *           type: integer
   *         description: Maximum amount of messages
   *     responses:
   *       200:
   *         description: Category updated successfully
   *       400:
   *         description: Request is not as it should be. Refer to the response errors
   *       500:
   *         description: Server error
   */
  app.get("/message-groups/", authMiddleware, isAdmin, (req, res, next) => {
    listMessageGroups(req, res).catch(next);
  });

  /**
   * @openapi
   * /message-groups/{id}:
   *   get:
   *     tags:
   *       - Message Groups
   *     security:
   *       - bearerAuth: []
   *     summary: Get groupchat by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *     responses:
   *       200:
   *         description: Success. Response contains groupchat details
   *       400:
   *         description: Request is not as it should be. The ID parameter is probably missing.
   *       404:
   *         description: There is not any groupchat with such an ID.
   *       500:
   *         description: Server error
   */
  app.get("/message-groups/:id", authMiddleware, (req, res, next) => {
    getMessageGroup(req, res).catch(next);
  });

  /**
   * @openapi
   * /message-groups/:
   *   post:
   *     tags:
   *       - Message Groups
   *     security:
   *       - bearerAuth: []
   *     summary: Create a groupchat
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - ownerId
   *             properties:
   *               name:
   *                 type: string
   *               ownerId:
   *                 type: integer
   *               description:
   *                 type: string
   *               membersId:
   *                 type: array
   *                 items:
   *                   type: integer
   *     responses:
   *       201:
   *         description: Groupchat has been created
   *       400:
   *         description: Request is not as it should be. Refer to the response error.
   *       500:
   *         description: Server error
   */
  app.post("/message-groups/", authMiddleware, (req, res, next) => {
    createMessageGroup(req, res).catch(next);
  });

  /**
   * @openapi
   * /message-groups/:
   *   patch:
   *     tags:
   *       - Message Groups
   *     security:
   *       - bearerAuth: []
   *     summary: Update the groupchat with the information of the body
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
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
   *               ownerId:
   *                 type: integer
   *               newMembersIDs:
   *                 type: array
   *                 items:
   *                   type: integer
   *               removedMembersIDs:
   *                 type: array
   *                 items:
   *                   type: integer
   *     responses:
   *       200:
   *         description: Modifications have been applied. The response contains the new data.
   *       400:
   *         description: Request is not as it should be. Refer to the response error.
   *       404:
   *         description: There is not any groupchat with such an ID.
   *       500:
   *         description: Server error
   */
  app.patch("/message-groups/:id", authMiddleware, (req, res, next) => {
    patchMessageGroup(req, res).catch(next);
  });

  /**
   * @openapi
   * /message-groups/{id}:
   *   delete:
   *     tags:
   *       - Message Groups
   *     security:
   *       - bearerAuth: []
   *     summary: Delete groupchat by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *     responses:
   *       200:
   *         description: Groupchat has been deleted.
   *       400:
   *         description: Request is not as it should be. The ID parameter is probably missing.
   *       404:
   *         description: There is not any groupchat with such an ID.
   *       500:
   *         description: Server error
   */
  app.delete("/message-groups/:id", authMiddleware, (req, res, next) => {
    deleteMessageGroup(req, res).catch(next);
  });

  /**
   * @openapi
   * /messages:
   *   get:
   *     tags:
   *       - Groups' messages
   *     security:
   *       - bearerAuth: []
   *     summary: List a given group's messages.
   *     parameters:
   *       - in: path
   *         name: groupId
   *         schema:
   *           type: integer
   *         required: true
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
   *         name: sentAfter
   *         schema:
   *           type: integer
   *         description: Minimum sending date of the messages
   *       - in: query
   *         name: sentBefore
   *         schema:
   *           type: integer
   *         description: Maximum sending date of the messages
   *       - in: query
   *         name: senderId
   *         schema:
   *           type: integer
   *         description: Sender's ID
   *     responses:
   *       200:
   *         description: Success. The response contains the group's messages.
   *       400:
   *         description: Bad request. Refer to the response error message.
   *       403:
   *         description: Access forbidden.
   *       404:
   *         description: Resource not found. Refer to the response error message.
   *       500:
   *         description: Server error
   */
  app.get("/message-groups/:groupId/messages", authMiddleware, (req, res, next) => {
    listGroupMessages(req, res).catch(next);
  });

  /**
   * @openapi
   * /messages:
   *   post:
   *     tags:
   *       - Groups' messages
   *     security:
   *       - bearerAuth: []
   *     summary: Create a message in the given group.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateMessageRequest'
   *     parameters:
   *       - in: path
   *         name: groupId
   *         schema:
   *           type: integer
   *         required: true
   *     responses:
   *       201:
   *         description: Resource created.
   *       400:
   *         description: Bad request. Refer to the response error message.
   *       403:
   *         description: Access forbidden.
   *       404:
   *         description: Resource not found. Refer to the response error message.
   *       500:
   *         description: Server error.
   */  
  app.post("/message-groups/:groupId/messages", authMiddleware, (req, res, next) => {
    createGroupMessage(req, res).catch(next);
  });

  // Routes pour le système de suggestions et d'interactions
  // app.use('/api/suggestions', suggestionRoutes);

  app.post("/interactions", authMiddleware, recordInteraction);
  app.put("/interactions/:id", authMiddleware, updateInteraction);
  app.get("/interactions/recent", authMiddleware, getUserRecentInteractions);
  
  // Routes pour les affinités et statistiques
  app.get("/affinities", authMiddleware, getUserAffinities);
  app.get("/affinities/:targetUserId", authMiddleware, getAffinityScore);
  app.get("/stats", authMiddleware, getUserStats);
  app.get("/categories", authMiddleware, getUserFavoriteCategories);
  
  // Routes pour les suggestions
  app.get("/suggestions", authMiddleware, getSuggestions);
  app.post("/suggestions/view", authMiddleware, recordSuggestionView);
  app.post("/suggestions/feedback", authMiddleware, recordSuggestionFeedback);
  app.post("/suggestions/realtime", authMiddleware, getRealTimeSuggestions);
}
