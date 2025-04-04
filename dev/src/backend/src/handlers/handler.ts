import { Application, Request, Response } from "express"
import { createUser, login } from "./auth"
import { authMiddleware } from "../middleware/auth"
import { deleteUserHandler, getUserByIdHandler, listUserHandler, updateUserHandler } from "./user"
import { createServiceHandler } from "./service"

export const initHandlers = (app: Application) => {
    app.get("/health", (_: Request, res: Response) => {
        res.send({ "message": "ping" })
    })

    app.post("/auth/signup", createUser)
    app.post("/auth/login", login)

    // --------------------- USER CRUD ---------------------
    app.get("/users", authMiddleware, listUserHandler);
    app.get("/users/:id", authMiddleware, getUserByIdHandler);
    app.put("/users/:id", authMiddleware, updateUserHandler);
    app.delete("/users/:id", authMiddleware, deleteUserHandler);

    // --------------------- SERVICE CRUD ---------------------
    app.post("/services", authMiddleware, createServiceHandler);
    app.get("/services", authMiddleware, listServiceHandler);
    app.get("/services/:id", authMiddleware, getServiceByIdHandler);
    app.put("/services/:id", authMiddleware, updateServiceHandler);
    app.delete("/services/:id", authMiddleware, deleteServiceHandler);

    // --------------------- TROC OFFER CRUD ---------------------
    app.post("/trocoffers", authMiddleware, createTrocOfferHandler);
    app.get("/trocoffers", authMiddleware, listTrocOfferHandler);
    app.get("/trocoffers/:id", authMiddleware, getTrocOfferByIdHandler);
    app.put("/trocoffers/:id", authMiddleware, updateTrocOfferHandler);
    app.delete("/trocoffers/:id", authMiddleware, deleteTrocOfferHandler);

    // --------------------- MESSAGE CRUD ---------------------
    app.post("/messages", authMiddleware, createMessageHandler);
    app.get("/messages", authMiddleware, listMessageHandler);
    app.get("/messages/:id", authMiddleware, getMessageByIdHandler);
    app.put("/messages/:id", authMiddleware, updateMessageHandler);
    app.delete("/messages/:id", authMiddleware, deleteMessageHandler);

    // --------------------- EVENT CRUD ---------------------
    app.post("/events", authMiddleware, createEventHandler);
    app.get("/events", authMiddleware, listEventHandler);
    app.get("/events/:id", authMiddleware, getEventByIdHandler);
    app.put("/events/:id", authMiddleware, updateEventHandler);
    app.delete("/events/:id", authMiddleware, deleteEventHandler);

    // --------------------- EVENT PARTICIPANT CRUD ---------------------
    app.post("/event-participants", authMiddleware, createEventParticipantHandler);
    app.get("/event-participants", authMiddleware, listEventParticipantHandler);
    app.get("/event-participants/:id", authMiddleware, getEventParticipantByIdHandler);
    app.put("/event-participants/:id", authMiddleware, updateEventParticipantHandler);
    app.delete("/event-participants/:id", authMiddleware, deleteEventParticipantHandler);
}