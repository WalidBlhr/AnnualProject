import { Request, Response } from "express";
import { createTrocOfferValidation, updateTrocOfferValidation, TrocOfferIdValidation, ListTrocOffersValidation } from "./validators/trocOffer";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { TrocOffer } from "../db/models/troc_offer";
import { User } from "../db/models/user";

/**
 * Create a new TrocOffer
 * POST /trocoffers
 */
export const createTrocOfferHandler = async (req: Request, res: Response) => {
  try {
      const validation = createTrocOfferValidation.validate(req.body);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const createTrocOfferRequest = validation.value
      const trocOfferRepository = AppDataSource.getRepository(TrocOffer)
      const userRepository = AppDataSource.getRepository(User)

      // Chercher l'utilisateur
      const user = await userRepository.findOneBy({ id: createTrocOfferRequest.userId })
      if (!user) {
          res.status(400).send({ "message": "Utilisateur non trouvé" })
          return
      }

      // Créer le TrocOffer avec l'utilisateur
      const trocOffer = trocOfferRepository.create({ 
          ...createTrocOfferRequest,
          user: user 
      })
      
      const trocOfferCreated = await trocOfferRepository.save(trocOffer)

      // Recharger l'offre avec les relations pour la réponse
      const trocOfferWithRelations = await trocOfferRepository.findOne({
          where: { id: trocOfferCreated.id },
          relations: {
              user: true
          }
      })

      res.status(201).send(trocOfferWithRelations)
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Lire la liste des TrocOffers (READ multiple)
 * GET /trocoffers
 */
export const listTrocOfferHandler = async (req: Request, res: Response) => {
  try {
      const validation = ListTrocOffersValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listTrocOfferRequest = validation.value

      const query = AppDataSource.createQueryBuilder(TrocOffer, 'trocOffer')
        .leftJoinAndSelect('trocOffer.user', 'user') // Ajouter cette ligne pour charger la relation user
        .select([
          'trocOffer.id',
          'trocOffer.title',
          'trocOffer.description',
          'trocOffer.creation_date',
          'trocOffer.status',
          'user.id',
          'user.firstname',
          'user.lastname'
        ])
        .skip((listTrocOfferRequest.page - 1) * listTrocOfferRequest.limit)
        .take(listTrocOfferRequest.limit);

      const [trocOffers, totalCount] = await query.getManyAndCount();

      res.send({
          data: trocOffers,
          page_size: listTrocOfferRequest.limit,
          page: listTrocOfferRequest.page,
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / listTrocOfferRequest.limit),
      });

  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Récupérer le détail d’une TrocOffer par id (READ single)
 * GET /trocoffers/:id
 */
export const detailedTrocOfferHandler = async (req: Request, res: Response) => {
  try {
      const validation = TrocOfferIdValidation.validate(req.params);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const getTrocOfferRequest = validation.value
      const trocOfferRepository = AppDataSource.getRepository(TrocOffer)
      
      // Modifier cette partie pour inclure la relation user et tous les champs nécessaires
      const trocOffer = await trocOfferRepository
          .createQueryBuilder('trocOffer')
          .leftJoinAndSelect('trocOffer.user', 'user')
          .select([
              'trocOffer.id',
              'trocOffer.title',
              'trocOffer.description',
              'trocOffer.creation_date',
              'trocOffer.status',
              'user.id',
              'user.firstname',
              'user.lastname'
          ])
          .where('trocOffer.id = :id', { id: getTrocOfferRequest.id })
          .getOne();

      if (!trocOffer) {
          res.status(404).send({ "message": "resource not found" })
          return
      }

      res.status(200).send(trocOffer);
  } catch (error) {
      if (error instanceof Error) {
          console.log(`Internal error: ${error.message}`)
      }
      res.status(500).send({ "message": "internal error" })
  }
}

/**
 * Mise à jour d’une TrocOffer
 * PUT /trocoffers/:id
 */
export const updateTrocOfferHandler = async (req: Request, res: Response) => {
  try {
      const validation = updateTrocOfferValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateTrocOffer = validation.value
      const trocOfferRepository = AppDataSource.getRepository(TrocOffer)
      const trocOfferFound = await trocOfferRepository.findOneBy({ id: updateTrocOffer.id })
      if (trocOfferFound === null) {
          res.status(404).send({ "error": `trocOffer ${updateTrocOffer.id} not found` })
          return
      }

      // if (updateTrocOffer.price) {
      //     trocOfferFound.price = updateTrocOffer.price
      // }

      const trocOfferUpdate = await trocOfferRepository.save(trocOfferFound)
      res.status(200).send(trocOfferUpdate)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}

/**
 * Suppression d’une TrocOffer
 * DELETE /trocoffers/:id
 */
export const deleteTrocOfferHandler = async (req: Request, res: Response) => {
  try {
      const validation = TrocOfferIdValidation.validate({ ...req.params, ...req.body })
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const updateTrocOffer = validation.value
      const trocOfferRepository = AppDataSource.getRepository(TrocOffer)
      const trocOfferFound = await trocOfferRepository.findOneBy({ id: updateTrocOffer.id })
      if (trocOfferFound === null) {
          res.status(404).send({ "error": `trocOffer ${updateTrocOffer.id} not found` })
          return
      }

      const trocOfferDeleted = await trocOfferRepository.remove(trocOfferFound)
      res.status(200).send(trocOfferDeleted)
  } catch (error) {
      console.log(error)
      res.status(500).send({ error: "Internal error" })
  }
}
