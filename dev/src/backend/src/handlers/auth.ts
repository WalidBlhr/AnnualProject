// File: dev/src/backend/src/handlers/auth.ts
import { Request, Response } from "express";
import { createUserValidation, LoginUserValidation } from "./validators/auth/create-user";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { compare, hash } from "bcryptjs";
import { AppDataSource } from "../db/database";
import { User } from "../db/models/user";
import { QueryFailedError } from "typeorm";
import { sign } from "jsonwebtoken";
import { Token } from "../db/models/token";

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
            return
        }
        if (error instanceof Error) {
            console.log(error.message)
        }
        res.status(500).send({"message": "internal error"})
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const validation = LoginUserValidation.validate(req.body)
        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const loginRequest = validation.value
        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOne({
            where: { email: loginRequest.email }
        })

        if (!user) {
            res.status(401).send({ "message": "email or password not valid" })
            return
        }

        const isPasswordValid = await compare(loginRequest.password, user.password)
        if (!isPasswordValid) {
            res.status(401).send({ "message": "email or password not valid" })
            return
        }

        const token = sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET || "secret",
            {
                expiresIn: "1h",
            }
        )

        const tokenRepository = AppDataSource.getRepository(Token)
        await tokenRepository.save({
            token,
            userId: user.id
        })

        res.send({ token })
    } catch (error) {
        if (error instanceof Error) {
            console.error('Login error:', error.message)
        }
        res.status(500).send({ "message": "internal error" })
    }
}

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOne({
            where: { id: (req as any).user.userId }
        })

        if (!user) {
            res.status(404).send({ "message": "user not found" })
            return
        }

        res.send({
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        })
    } catch (error) {
        if (error instanceof Error) {
            console.error('Get current user error:', error.message)
        }
        res.status(500).send({ "message": "internal error" })
    }
}
