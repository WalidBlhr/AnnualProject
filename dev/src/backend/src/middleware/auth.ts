import { NextFunction, Request, Response } from "express";

// Extend the Request interface to include the user property
// declare global {
//     namespace Express {
//         interface Request {
//             user?: { id: string; role: number };
//         }
//     }
// }
import { verify } from "jsonwebtoken";
import { AppDataSource } from "../db/database";
import { Token } from "../db/models/token";

// Middleware d'authentification existant
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization
        if (authHeader === undefined) {
            res.status(401).send({ "message": "Unauthorized" })
            return
        }

        const bearerSplit = authHeader.split(' ')
        if (bearerSplit.length < 2) {
            res.status(401).send({ "message": "Unauthorized" })
            return
        }
        const token = bearerSplit[1];

        const tokenRepo = AppDataSource.getRepository(Token)
        const tokenFound = tokenRepo.findOne({ where: { token } })
        if (tokenFound === null) {
            res.status(403).send({ "message": "Access Forbidden" })
            return
        }

        verify(token, "valuerandom", (err, user) => {
            if (err) {
                res.status(403).send({ "message": "Access Forbidden" })
                return
            }
            // https://www.geeksforgeeks.org/express-js-res-locals-property/
            (req as any).user = user;
            next();
        })


    } catch (error) {

    }
}

// Middleware pour autoriser uniquement les administrateurs
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if ((req as any).user && (req as any).user.role === 1) {
      next();
    } else {
      res.status(403).send({ message: "Forbidden" });
    }
};

// Middleware pour vérifier que l'utilisateur est propriétaire ou admin
export const isOwnerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if ((req as any).user?.role === 1 || (req as any).user?.id === req.params.id) {
        next();
    } else {
        res.status(403).send({ message: 'Forbidden' });
    }
};
