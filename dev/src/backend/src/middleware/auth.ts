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
import { User } from "../db/models/user";

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

        verify(token, "valuerandom", {ignoreExpiration}, async (err, user) => {
            if (err) {
                console.log("expiré");
                res.status(403).send({ "message": "Access Forbidden" })
                return
            }
            
            // Vérifier le statut de bannissement de l'utilisateur
            const userRepo = AppDataSource.getRepository(User);
            const userFromDb = await userRepo.findOne({ 
                where: { id: (user as any).userId },
                select: ['id', 'is_banned', 'banned_at', 'ban_reason', 'ban_until']
            });
            
            if (userFromDb) {
                // Vérifier si le bannissement temporaire a expiré
                if (userFromDb.is_banned && userFromDb.ban_until && new Date() > userFromDb.ban_until) {
                    userFromDb.is_banned = false;
                    userFromDb.banned_at = null;
                    userFromDb.ban_reason = null;
                    userFromDb.ban_until = null;
                    await userRepo.save(userFromDb);
                }
                
                // Si l'utilisateur est encore banni, refuser l'accès
                if (userFromDb.is_banned) {
                    const banMessage = userFromDb.ban_until 
                        ? `Compte banni jusqu'au ${userFromDb.ban_until.toLocaleDateString()}. Motif: ${userFromDb.ban_reason}`
                        : `Compte banni définitivement. Motif: ${userFromDb.ban_reason}`;
                        
                    res.status(403).send({ 
                        "message": "Account Banned",
                        "details": banMessage,
                        "ban_info": {
                            "is_banned": true,
                            "banned_at": userFromDb.banned_at,
                            "ban_reason": userFromDb.ban_reason,
                            "ban_until": userFromDb.ban_until
                        }
                    });
                    return;
                }
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