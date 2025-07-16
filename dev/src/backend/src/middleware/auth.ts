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
        const tokenFound = await tokenRepo.findOne({ where: { token } })
        if (tokenFound === null) {
            console.log("not in db");
            res.status(403).send({ "message": "Access Forbidden" })
            return
        }

        // Ignore l'expiration si requete pour logout
        const ignoreExpiration = req.path === "/auth/logout";

        verify(token, "valuerandom", {ignoreExpiration}, (err, user) => {
            if (err) {
                console.log("expiré");
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
/*export const isOwnerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const userIdFromToken = (req as any).user?.userId;
    const userIdFromParams = parseInt(req.params.id);
    
    console.log('isOwnerOrAdmin check:', {
        userIdFromToken,
        userIdFromParams,
        userRole: (req as any).user?.role,
        isAdmin: (req as any).user?.role === 1,
        isOwner: userIdFromToken === userIdFromParams
    });
    
    if ((req as any).user?.role === 1 || userIdFromToken === userIdFromParams) {
        next();
    } else {
        console.log('Access denied: user', userIdFromToken, 'trying to access user', userIdFromParams);
        res.status(403).send({ message: 'Forbidden' });
    }
};*/

export const isOwnerOrAdmin = (propToCheck : string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userIdFromToken = (req as any).user?.userId;
        const userIdFromParams = parseInt(req.params[propToCheck]);

        console.log('isOwnerOrAdmin check:', {
            userIdFromToken,
            userIdFromParams,
            userRole: (req as any).user?.role,
            isAdmin: (req as any).user?.role === 1,
            isOwner: userIdFromToken === userIdFromParams
        });

        if ((req as any).user?.role === 1 || userIdFromToken === userIdFromParams) {
            next();
        } else {
            console.log('Access denied: user', userIdFromToken, 'trying to access user', userIdFromParams);
            res.status(403).send({ message: 'Forbidden' });
        }
    }
}