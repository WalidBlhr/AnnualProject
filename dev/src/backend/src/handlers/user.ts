// handlers/user.ts
import { Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { User } from "../db/models/user";
import { ListUsersValidation, UserIdValidation, UserUpdateValidation } from "./validators/user";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";

// READ (liste) - GET /users
export const listUserHandler = async (req: Request, res: Response) => {
  try {
      console.log((req as any).user)
      const validation = ListUsersValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listUserRequest = validation.value
      console.log(listUserRequest)

      const query = AppDataSource.createQueryBuilder(User, 'user')

      // if (listUserRequest.priceMax !== undefined) {
      //     query.andWhere("user.price <= :priceMax", { priceMax: listUserRequest.priceMax })
      // }

      query.skip((listUserRequest.page - 1) * listUserRequest.limit);
      query.take(listUserRequest.limit);

      const [users, totalCount] = await query.getManyAndCount();

      const page = listUserRequest.page
      const totalPages = Math.ceil(totalCount / listUserRequest.limit);

      res.send(
          {
              data: users,
              page_size: listUserRequest.limit,
              page,
              total_count: totalCount,
              total_pages: totalPages,
          }
      )

  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

// READ (détail) - GET /users/:id
export const detailedUserHandler = async (req: Request, res: Response) => {
  try {
      const validation = UserIdValidation.validate(req.params);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const getUserRequest = validation.value
      const userRepository = AppDataSource.getRepository(User)
      const user = await userRepository.findOne({
          where: { id: getUserRequest.id }
      })
      if (user === null) {
          res.status(404).send({ "message": "resource not found" })
          return
      }

      res.status(200).send(user);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

// UPDATE - PUT /users/:id
export const updateUserHandler = async (req: Request, res: Response) => {
  try {
      const validation = UserUpdateValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateUser = validation.value
      const userRepository = AppDataSource.getRepository(User)
      const userFound = await userRepository.findOneBy({ id: updateUser.id })
      if (userFound === null) {
          res.status(404).send({ "error": `user ${updateUser.id} not found` })
          return
      }

      if (updateUser.lastname) {
          userFound.lastname = updateUser.lastname
      }

      const userUpdate = await userRepository.save(userFound)
      res.status(200).send(userUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

// DELETE - DELETE /users/:id
export const deleteUserHandler = async (req: Request, res: Response) => {
  try {
      const validation = UserIdValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateUser = validation.value
      const userRepository = AppDataSource.getRepository(User)
      const userFound = await userRepository.findOneBy({ id: updateUser.id })
      if (userFound === null) {
          res.status(404).send({ "error": `user ${updateUser.id} not found` })
          return
      }

      const userDeleted = await userRepository.remove(userFound)
      res.status(200).send(userDeleted)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}
