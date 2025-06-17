import { Request, Response } from "express";
import { createUserValidation, LoginUserValidation } from "./validators/auth/create-user";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { compare, hash } from "bcryptjs";
import { AppDataSource } from "../db/database";
import { User } from "../db/models/user";
import { DeleteResult, QueryFailedError } from "typeorm";
import { JsonWebTokenError, JwtPayload, NotBeforeError, sign, TokenExpiredError } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { Token } from "../db/models/token";
import { ACCESS_TOKEN_DURATION, REFRESH_TOKEN_DURATION, TOKEN_SECRET } from "../constants";
import { refreshValidation } from "./validators/auth/refresh-token";

export const createUser = async(req: Request, res: Response) => {
    try{
        const validation = createUserValidation.validate(req.body)
        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const createUserRequest = validation.value
        const hashedPassword = await hash(createUserRequest.password, 10)
        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.save({
            email: createUserRequest.email,
            password: hashedPassword,
            lastname: createUserRequest.lastname,
            firstname: createUserRequest.firstname,
            role: createUserRequest.role
        })
        res.status(201).send({
            id: user.id,
            email: user.email,
            created_at: user.createdAt,
            updated_at: user.updatedAt
        })
        
    } catch(error) {
        if (error instanceof QueryFailedError && error.driverError.code === "23505") {
            res.status(400).send({"message": "email already exist"})
        }
        if (error instanceof Error) {
            console.log(error.message)
        }
        res.status(500).send({"message": "internal error"})
    }
};

export const login = async (req: Request, res: Response) => {

    try {
        const validation = LoginUserValidation.validate(req.body)
        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const loginRequest = validation.value
        const userRepository = AppDataSource.getRepository(User)
        const user : User | null = await userRepository.findOneBy({
            email: loginRequest.email
        })
        if(user === null) {
            res.status(400).send({"message": "email or password not valid"})
            return
        }

        const isValid = await compare(loginRequest.password, user.password)
        if(!isValid) {
            res.status(400).send({"message": "email or password not valid"})
            return
        }

        const accessTokenCreated = await createAccessToken(user);
        const refreshTokenCreated = await createRefreshToken(user);

        res.status(201).send({
            token: accessTokenCreated.token,
            refresh_token: refreshTokenCreated.token,
        });
    } catch(error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
        res.status(500).send({"message": "internal error"});
    }
};

export const logout = async (req: Request, res: Response) => {
    const tokenRepository = AppDataSource.getRepository(Token);

    try {
        const delRes : DeleteResult = await tokenRepository.delete({user: {id: (req as any).user.userId}});
        res.status(200).send(delRes);
    } catch (error) {
        console.log(error);
        res.status(500).send({"message": "internal error"});
    }
};

export const refresh = async (req: Request, res: Response) => {
    const validation = refreshValidation.validate(req.body);
    if (validation.error) {
        res.status(400).send(generateValidationErrorMessage(validation.error.details));
        return;
    }

    let [type, refreshToken] = validation.value.refresh_token.split(' ') ?? []
    if (type !== 'Bearer') {
        res.status(401).send({error: "Refresh token invalide."});
        return;
    }

    let refreshPayload : RefreshTokenPayload;
    let user : User | null;
    try {
        const tokenRepository = AppDataSource.getRepository(Token);
        const token = await tokenRepository.findOneBy({token: refreshToken});
        if (!token) {
            res.status(404).send({error: "Refresh token invalide."});
            return;
        }

        refreshPayload = jwt.verify(refreshToken, TOKEN_SECRET) as RefreshTokenPayload;
        const userRepository = AppDataSource.getRepository(User);
        user = await userRepository.findOneBy({id: refreshPayload.userId});
        if (!user) {
            res.status(404).send({error: "Utilisateur introuvable."});
            return;
        }
    } catch (error) {
        if (error instanceof TokenExpiredError
            || error instanceof JsonWebTokenError
            || error instanceof NotBeforeError) {
            res.status(401).send({error: "Refresh token invalide."});
        } else {
            res.status(500).send({error: "Internal error."});
        }
        return;
    }

    const accessToken = await createAccessToken(user);

    // If the refresh token is about to expire we refresh it too
    if (refreshPayload.exp && checkRefreshTokenExp(refreshPayload.exp)) {
        refreshToken = (await createRefreshToken(user)).token;
    }

    res.status(201).send({
        access_token: accessToken.token,
        refresh_token: refreshToken,
    });
};

async function createAccessToken(user: User) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
        createdAt: user.createdAt,
    };
    const accessToken = sign(
        payload,
        TOKEN_SECRET,
        {expiresIn: ACCESS_TOKEN_DURATION}
    );

    const tokenRepository = AppDataSource.getRepository(Token);
    return await tokenRepository.save({
        token: accessToken,
        user,
        type: "access",
    });
}

async function createRefreshToken(user: User) {
    const refreshToken = sign(
        {userId: user.id},
        TOKEN_SECRET,
        {expiresIn: REFRESH_TOKEN_DURATION}
    );
    
    const tokenRepository = AppDataSource.getRepository(Token);
    return await tokenRepository.save({
        token: refreshToken,
        user,
        type: "refresh",
    });
}

// exp est un timestamp
// Retourne vrai si exp est aujourd'hui mais que son heure n'est pas passée
function checkRefreshTokenExp(exp: number) : boolean {
    const now = new Date();
    const target = new Date(exp);

    const sameDay =
        now.getFullYear() === target.getFullYear() &&
        now.getMonth() === target.getMonth() &&
        now.getDate() === target.getDate();

    const beforeTime = now.getTime() < target.getTime();

    return sameDay && beforeTime;
}

interface RefreshTokenPayload{
    userId: number;
    exp?: number;
}