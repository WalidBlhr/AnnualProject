// File: dev/src/backend/src/handlers/trocOffer.ts
import { Request, Response } from "express";
import { createTrocOfferValidation, updateTrocOfferValidation, TrocOfferIdValidation, ListTrocOffersValidation } from "./validators/trocOffer";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { TrocOffer } from "../db/models/troc_offer";

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
      const trocOffer = trocOfferRepository.create({ ...createTrocOfferRequest })
      const trocOfferCreated = await trocOfferRepository.save(trocOffer);

      res.status(201).send(trocOfferCreated)
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
      console.log((req as any).trocOffer)
      const validation = ListTrocOffersValidation.validate(req.query);
      if (validation.error) {
          res.status(400).send(generateValidationErrorMessage(validation.error.details))
          return
      }

      const listTrocOfferRequest = validation.value
      console.log(listTrocOfferRequest)

      const query = AppDataSource.createQueryBuilder(TrocOffer, 'trocOffer')

      // if (listTrocOfferRequest.priceMax !== undefined) {
      //     query.andWhere("trocOffer.price <= :priceMax", { priceMax: listTrocOfferRequest.priceMax })
      // }

      query.skip((listTrocOfferRequest.page - 1) * listTrocOfferRequest.limit);
      query.take(listTrocOfferRequest.limit);

      const [trocOffers, totalCount] = await query.getManyAndCount();

      const page = listTrocOfferRequest.page
      const totalPages = Math.ceil(totalCount / listTrocOfferRequest.limit);

      res.send(
          {
              data: trocOffers,
              page_size: listTrocOfferRequest.limit,
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

/**
 * Récupérer le détail d'une TrocOffer par id (READ single)
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
      const trocOffer = await trocOfferRepository.findOne({
          where: { id: getTrocOfferRequest.id }
      })
      if (trocOffer === null) {
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
 * Mise à jour d'une TrocOffer
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
 * Suppression d'une TrocOffer
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
