import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { Token } from "../db/models/token";
import { verify } from "jsonwebtoken";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader) {
            res.status(401).send({ "message": "Unauthorized" })
            return
        }

        const bearerSplit = authHeader.split(' ')
        if (bearerSplit.length !== 2 || bearerSplit[0] !== 'Bearer') {
            res.status(401).send({ "message": "Invalid authorization header format" })
            return
        }

        const token = bearerSplit[1];
        const tokenRepo = AppDataSource.getRepository(Token)
        
        // Vérifier si le token existe dans la base de données
        const tokenFound = await tokenRepo.findOne({ where: { token } })
        if (!tokenFound) {
            res.status(403).send({ "message": "Access Forbidden" })
            return
        }

        // Vérifier le token JWT
        verify(token, process.env.JWT_SECRET || "secret", async (err, decoded) => {
            if (err) {
                // Si le token est expiré, le supprimer de la base de données
                if (err.name === 'TokenExpiredError') {
                    await tokenRepo.remove(tokenFound)
                }
                res.status(403).send({ "message": "Access Forbidden" })
                return
            }

            if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
                res.status(403).send({ "message": "Invalid token" })
                return
            }

            (req as any).user = decoded;
            next();
        })

    } catch (error) {
        console.error('Auth middleware error:', error)
        res.status(500).send({ "message": "Internal error" })
    }
}
