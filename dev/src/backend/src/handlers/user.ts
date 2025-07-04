// handlers/user.ts
import { Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { User } from "../db/models/user";
import { ListUsersValidation, UserIdValidation, UserUpdateValidation } from "./validators/user";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { Token } from "../db/models/token";

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
        // Validation de l'ID depuis les paramètres
        const idValidation = UserIdValidation.validate(req.params);
        if (idValidation.error) {
            res.status(400).send(generateValidationErrorMessage(idValidation.error.details))
            return
        }

        // Validation du body pour les champs à mettre à jour
        const bodyValidation = UserUpdateValidation.validate(req.body);
        if (bodyValidation.error) {
            res.status(400).send(generateValidationErrorMessage(bodyValidation.error.details))
            return
        }

        const userId = idValidation.value.id;
        const updateData = bodyValidation.value;
        
        const userRepository = AppDataSource.getRepository(User)
        const userFound = await userRepository.findOneBy({ id: userId })
        if (userFound === null) {
            res.status(404).send({ "error": `user ${userId} not found` })
            return
        }

        // Mise à jour des champs seulement s'ils sont fournis
        if (updateData.lastname !== undefined) {
            userFound.lastname = updateData.lastname
        }

        if (updateData.firstname !== undefined) {
            userFound.firstname = updateData.firstname
        }

        if (updateData.email !== undefined) {
            userFound.email = updateData.email
        }

        if (updateData.role !== undefined) {
            userFound.role = updateData.role
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
        const validation = UserIdValidation.validate({ ...req.params, ...req.body });
        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details));
            return;
        }

        const updateUser = validation.value;
        const userRepository = AppDataSource.getRepository(User);
        const tokenRepository = AppDataSource.getRepository(Token);

        // Supprimer d'abord les tokens associés
        await tokenRepository.delete({ user: { id: updateUser.id } });

        // Ensuite supprimer l'utilisateur
        const userFound = await userRepository.findOneBy({ id: updateUser.id });
        if (userFound === null) {
            res.status(404).send({ "error": `user ${updateUser.id} not found` });
            return;
        }

        const userDeleted = await userRepository.remove(userFound);
        res.status(200).send(userDeleted);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal error" });
    }
}

/**
 * Récupérer le statut d'un utilisateur
 * GET /api/user-status
 */
export const getUserStatusHandler = async (req: Request, res: Response) => {
  try {
    console.log('Query params reçus:', req.query);
    
    // Récupérer l'ID dans la query string
    const userId = req.query.userId;
    
    // Vérifier que l'ID est présent
    if (!userId) {
      return res.status(400).send({ error: "Le paramètre 'userId' est requis" });
    }
    
    // Convertir en nombre
    const userIdNum = parseInt(userId as string);
    
    // Vérifier que c'est un nombre valide
    if (isNaN(userIdNum)) {
      return res.status(400).send({ error: "L'ID utilisateur doit être un nombre" });
    }
    
    // Récupérer le statut de l'utilisateur
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userIdNum },
      select: ['id', 'status', 'last_active']
    });
    
    // Si l'utilisateur n'existe pas
    if (!user) {
      return res.status(404).send({ error: "Utilisateur non trouvé" });
    }
    
    // Renvoyer le statut
    return res.status(200).send({
      id: user.id,
      status: user.status || 'offline',
      lastActive: user.last_active
    });
    
  } catch (error) {
    console.error("Erreur dans getUserStatusHandler:", error);
    return res.status(500).send({ error: "Erreur interne du serveur" });
  }
};

