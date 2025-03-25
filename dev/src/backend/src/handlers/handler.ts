import { Application, Request, Response } from "express"
import { createUser, login } from "./auth"
import { authMiddleware } from "../middleware/auth"

export const initHandlers = (app: Application) => {
    app.get("/health", (_: Request, res: Response) => {
        res.send({ "message": "ping" })
    })

    app.post("/auth/signup", createUser)
    app.post("/auth/login", login)
}