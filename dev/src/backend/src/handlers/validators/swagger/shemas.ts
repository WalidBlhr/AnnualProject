/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - lastname
 *         - firstname
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         lastname:
 *           type: string
 *         firstname:
 *           type: string
 *         role:
 *           type: number
 *           default: 0
 *     LoginUserValidationRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     UpdateUserSchema:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         lastname:
 *           type: string
 *         firstname:
 *           type: string
 *         role:
 *           type: number
 *     CreateServiceRequest:
 *       type: object
 *       properties:
 *         type_service:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *         userId:
 *           type: number
 *     UpdateServiceRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         type_service:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *     CreateTrocOfferRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         creation_date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *         userId:
 *           type: number
 *     UpdateTrocOfferRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *     CreateMessageRequest:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *         date_sent:
 *           type: string
 *           format: date-time
 *         senderId:
 *           type: number
 *         receiverId:
 *           type: number
 *         status:
 *           type: string
 *     UpdateMessageRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         content:
 *           type: string
 *         status:
 *           type: string
 *     CreateEventRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         max_participants:
 *           type: number
 *         min_participants:
 *           type: number
 *         status:
 *           type: string
 *         creatorId:
 *           type: number
 *     UpdateEventRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         name:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         max_participants:
 *           type: number
 *         min_participants:
 *           type: number
 *         status:
 *           type: string
 *     CreateEventParticipantRequest:
 *       type: object
 *       properties:
 *         userId:
 *           type: number
 *         eventId:
 *           type: number
 *         date_inscription:
 *           type: string
 *           format: date-time
 *         status_participation:
 *           type: string
 *     UpdateEventParticipantRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         date_inscription:
 *           type: string
 *           format: date-time
 *         status_participation:
 *           type: string
 */
