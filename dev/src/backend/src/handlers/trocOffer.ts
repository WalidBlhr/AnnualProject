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
 * Mise à jour d’une TrocOffer
 * PUT /trocoffers/:id
 */
export const updateTrocOfferHandler = async (req: Request, res: Response) => {
  try {
    // 1) Validation combinée : params + body
    const validation = updateTrocOfferValidation.validate({
      ...req.params,
      ...req.body,
    });
    if (validation.error) {
      return res.status(400).send(generateValidationErrorMessage(validation.error.details));
    }

    // 2) Récupération en base
    const { id, title, description, status } = validation.value;
    const trocOfferRepo = AppDataSource.getRepository(TrocOffer);
    const trocOfferFound = await trocOfferRepo.findOneBy({ id });

    if (!trocOfferFound) {
      return res.status(404).send({ message: `TrocOffer ${id} not found` });
    }

    // 3) Mise à jour des champs si présents
    if (title !== undefined) trocOfferFound.title = title;
    if (description !== undefined) trocOfferFound.description = description;
    if (status !== undefined) trocOfferFound.status = status;

    const trocOfferUpdated = await trocOfferRepo.save(trocOfferFound);

    return res.send(trocOfferUpdated);
  } catch (error) {
    console.error("updateTrocOfferHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};

/**
 * Suppression d’une TrocOffer
 * DELETE /trocoffers/:id
 */
export const deleteTrocOfferHandler = async (req: Request, res: Response) => {
  try {
    // 1) Validation sur paramètre "id"
    const validation = trocOfferIdValidation.validate(req.params);
    if (validation.error) {
      return res.status(400).send(generateValidationErrorMessage(validation.error.details));
    }

    // 2) Récupération & suppression
    const { id } = validation.value;
    const trocOfferRepo = AppDataSource.getRepository(TrocOffer);
    const trocOfferFound = await trocOfferRepo.findOneBy({ id });
    if (!trocOfferFound) {
      return res.status(404).send({ message: `TrocOffer ${id} not found` });
    }

    const trocOfferRemoved = await trocOfferRepo.remove(trocOfferFound);
    return res.send(trocOfferRemoved);
  } catch (error) {
    console.error("deleteTrocOfferHandler error:", error);
    return res.status(500).send({ message: "internal error" });
  }
};
