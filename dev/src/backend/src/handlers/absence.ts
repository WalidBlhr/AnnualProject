import { Request, Response } from "express";
import { AppDataSource } from "../db/database";
import { Absence } from "../db/models/absence";
import { AbsenceResponse } from "../db/models/absence-response";
import { User } from "../db/models/user";
import { 
  AbsenceIdValidation, 
  ListAbsencesValidation, 
  createAbsenceValidation, 
  updateAbsenceValidation,
  trustedContactValidation
} from "./validators/absence";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import jwt from "jsonwebtoken";
import { In } from "typeorm";
import { Message } from "../db/models/message";

/**
 * Fonction utilitaire pour formater les dates
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Créer une nouvelle déclaration d'absence
 * POST /absences
 */
export const createAbsenceHandler = async (req: Request, res: Response) => {
  try {
    const validation = createAbsenceValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const { userId, start_date, end_date, notes, trusted_contact_ids } = validation.value;
    
    const userRepository = AppDataSource.getRepository(User);
    const absenceRepository = AppDataSource.getRepository(Absence);
    const responseRepository = AppDataSource.getRepository(AbsenceResponse);
    const messageRepository = AppDataSource.getRepository(Message);

    // Vérifier que l'utilisateur existe
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Vérifier que l'ID de l'utilisateur correspond au token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (decoded.userId !== userId) {
      res.status(403).send({ error: 'Non autorisé à déclarer une absence pour cet utilisateur' });
      return;
    }

    // Créer l'absence
    const absence = new Absence(
      0, // l'ID sera généré automatiquement
      user,
      new Date(start_date),
      new Date(end_date),
      notes || '',
      'pending',
      [],
      []
    );

    // Ajouter les contacts de confiance si spécifiés
    if (trusted_contact_ids && trusted_contact_ids.length > 0) {
      const trustedUsers = await userRepository.findBy({ id: In(trusted_contact_ids) });
      absence.trusted_contacts = trustedUsers;
    }
    
    const absenceCreated = await absenceRepository.save(absence);

    // Créer les réponses individuelles pour chaque contact de confiance
    if (trusted_contact_ids && trusted_contact_ids.length > 0) {
      const trustedUsers = await userRepository.findBy({ id: In(trusted_contact_ids) });
      
      for (const trustedUser of trustedUsers) {
        // Créer une réponse individuelle pour chaque contact
        const response = new AbsenceResponse(absenceCreated, trustedUser, 'pending', '');
        await responseRepository.save(response);

        // Envoyer une notification à chaque contact de confiance
        const newMessage = messageRepository.create({
          content: `${user.firstname} ${user.lastname} vous a désigné comme contact de confiance pendant son absence du ${formatDate(start_date)} au ${formatDate(end_date)}.`,
          date_sent: new Date(),
          sender: user,
          receiver: trustedUser,
          status: 'unread'
        });
        await messageRepository.save(newMessage);
      }
    }
    
    // Récupérer l'absence avec ses relations pour la réponse
    const absenceWithRelations = await absenceRepository.findOne({
      where: { id: absenceCreated.id },
      relations: ['user', 'trusted_contacts', 'responses', 'responses.contact']
    });
    
    res.status(201).send(absenceWithRelations);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "internal error" });
  }
};

/**
 * Liste des absences avec pagination
 * GET /absences
 */
export const listAbsencesHandler = async (req: Request, res: Response) => {
  try {
    const validation = ListAbsencesValidation.validate(req.query);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listAbsencesRequest = validation.value;
    const query = AppDataSource.createQueryBuilder(Absence, 'absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('absence.trusted_contacts', 'trusted_contacts')
      .leftJoinAndSelect('absence.responses', 'responses')
      .leftJoinAndSelect('responses.contact', 'contact')
      .select([
        'absence',
        'user.id',
        'user.firstname',
        'user.lastname',
        'trusted_contacts.id',
        'trusted_contacts.firstname',
        'trusted_contacts.lastname',
        'responses.id',
        'responses.status',
        'responses.responded_at',
        'responses.response_notes',
        'contact.id',
        'contact.firstname',
        'contact.lastname'
      ]);

    // Appliquer les filtres
    if (listAbsencesRequest.userId) {
      query.andWhere("absence.user_id = :userId", { userId: listAbsencesRequest.userId });
    }
    
    if (listAbsencesRequest.status) {
      query.andWhere("absence.status = :status", { status: listAbsencesRequest.status });
    }

    // Pagination
    query.skip((listAbsencesRequest.page - 1) * listAbsencesRequest.limit);
    query.take(listAbsencesRequest.limit);

    // Tri par date de début (la plus proche en premier)
    query.orderBy('absence.start_date', 'ASC');

    const [absences, totalCount] = await query.getManyAndCount();
    const page = listAbsencesRequest.page;
    const totalPages = Math.ceil(totalCount / listAbsencesRequest.limit);

    res.send({
      data: absences,
      page_size: listAbsencesRequest.limit,
      page,
      total_count: totalCount,
      total_pages: totalPages
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "internal error" });
  }
};

/**
 * Détail d'une absence
 * GET /absences/:id
 */
export const detailedAbsenceHandler = async (req: Request, res: Response) => {
  try {
    const validation = AbsenceIdValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const getAbsenceRequest = validation.value;
    const absenceRepository = AppDataSource.getRepository(Absence);
    const absence = await absenceRepository.findOne({
      where: { id: getAbsenceRequest.id },
      relations: ['user', 'trusted_contacts', 'responses', 'responses.contact']
    });
    
    if (absence === null) {
      res.status(404).send({ message: "Absence non trouvée" });
      return;
    }

    res.status(200).send(absence);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Internal error: ${error.message}`);
    }
    res.status(500).send({ message: "internal error" });
  }
};

/**
 * Fonction pour calculer le statut global d'une absence basé sur les réponses individuelles
 */
const calculateAbsenceStatus = (responses: AbsenceResponse[]): string => {
  if (responses.length === 0) return 'pending';
  
  const acceptedCount = responses.filter(r => r.status === 'accepted').length;
  const refusedCount = responses.filter(r => r.status === 'refused').length;
  const pendingCount = responses.filter(r => r.status === 'pending').length;
  
  // Si au moins un contact a accepté, l'absence est acceptée
  if (acceptedCount > 0) {
    return 'accepted';
  }
  
  // Si tous les contacts ont refusé, l'absence est refusée
  if (refusedCount === responses.length) {
    return 'canceled';
  }
  
  // Sinon, elle reste en attente
  return 'pending';
};

/**
 * Répondre à une demande de surveillance (pour les contacts de confiance)
 * PUT /absences/:id/response
 */
export const respondToAbsenceHandler = async (req: Request, res: Response) => {
  try {
    const absenceId = parseInt(req.params.id);
    const { status, response_notes } = req.body;
    
    if (isNaN(absenceId)) {
      res.status(400).send({ error: "ID d'absence invalide" });
      return;
    }
    
    if (!['accepted', 'refused'].includes(status)) {
      res.status(400).send({ error: "Statut invalide. Doit être 'accepted' ou 'refused'" });
      return;
    }
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    
    const absenceRepository = AppDataSource.getRepository(Absence);
    const responseRepository = AppDataSource.getRepository(AbsenceResponse);
    const userRepository = AppDataSource.getRepository(User);
    const messageRepository = AppDataSource.getRepository(Message);
    
    // Récupérer l'absence avec ses réponses
    const absence = await absenceRepository.findOne({
      where: { id: absenceId },
      relations: ['user', 'trusted_contacts', 'responses', 'responses.contact']
    });
    
    if (!absence) {
      res.status(404).send({ error: "Absence non trouvée" });
      return;
    }
    
    // Vérifier que l'utilisateur est bien un contact de confiance
    const isTrustedContact = absence.trusted_contacts.some(contact => contact.id === decoded.userId);
    if (!isTrustedContact) {
      res.status(403).send({ error: "Non autorisé à répondre à cette demande" });
      return;
    }
    
    // Chercher la réponse existante pour cet utilisateur
    let userResponse = absence.responses.find(r => r.contact.id === decoded.userId);
    
    if (userResponse) {
      // Mettre à jour la réponse existante
      userResponse.status = status;
      userResponse.response_notes = response_notes || '';
      userResponse.responded_at = new Date();
      await responseRepository.save(userResponse);
    } else {
      // Créer une nouvelle réponse
      const contact = await userRepository.findOneBy({ id: decoded.userId });
      if (!contact) {
        res.status(404).send({ error: "Contact non trouvé" });
        return;
      }
      
      userResponse = new AbsenceResponse(absence, contact, status, response_notes || '');
      await responseRepository.save(userResponse);
    }
    
    // Récupérer toutes les réponses mises à jour
    const updatedAbsence = await absenceRepository.findOne({
      where: { id: absenceId },
      relations: ['user', 'trusted_contacts', 'responses', 'responses.contact']
    });
    
    if (!updatedAbsence) {
      res.status(500).send({ error: "Erreur lors de la récupération de l'absence" });
      return;
    }
    
    // Calculer le nouveau statut global
    const newGlobalStatus = calculateAbsenceStatus(updatedAbsence.responses);
    
    // Mettre à jour le statut global de l'absence si nécessaire
    if (updatedAbsence.status !== newGlobalStatus) {
      updatedAbsence.status = newGlobalStatus;
      await absenceRepository.save(updatedAbsence);
    }
    
    // Envoyer une notification à l'utilisateur propriétaire de l'absence
    const contact = await userRepository.findOneBy({ id: decoded.userId });
    if (contact) {
      const statusMessage = status === 'accepted' ? 
        'accepté de surveiller votre logement' : 
        'refusé la demande de surveillance de logement';
        
      const newMessage = messageRepository.create({
        content: `${contact.firstname} ${contact.lastname} a ${statusMessage} pendant votre absence du ${formatDate(updatedAbsence.start_date)} au ${formatDate(updatedAbsence.end_date)}.`,
        date_sent: new Date(),
        sender: contact,
        receiver: updatedAbsence.user,
        status: 'unread'
      });
      await messageRepository.save(newMessage);
    }
    
    res.status(200).send({
      message: `Réponse ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès`,
      absence: updatedAbsence,
      global_status: newGlobalStatus
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};

/**
 * Mise à jour d'une absence
 * PUT /absences/:id
 */
export const updateAbsenceHandler = async (req: Request, res: Response) => {
  try {
    const validation = updateAbsenceValidation.validate({ ...req.params, ...req.body });
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateAbsence = validation.value;
    const absenceRepository = AppDataSource.getRepository(Absence);
    const userRepository = AppDataSource.getRepository(User);
    const responseRepository = AppDataSource.getRepository(AbsenceResponse);
    
    // Récupérer l'absence avec ses relations
    const absenceFound = await absenceRepository.findOne({
      where: { id: updateAbsence.id },
      relations: ['user', 'trusted_contacts', 'responses', 'responses.contact']
    });
    
    if (absenceFound === null) {
      res.status(404).send({ error: `Absence ${updateAbsence.id} non trouvée` });
      return;
    }

    // Vérifier que l'utilisateur a le droit de modifier cette absence
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    
    // Seul le propriétaire de l'absence peut modifier les détails (dates, notes, contacts)
    if (decoded.userId !== absenceFound.user.id) {
      res.status(403).send({ error: 'Non autorisé à modifier cette absence' });
      return;
    }

    // Mettre à jour les dates si spécifiées
    if (updateAbsence.start_date) {
      absenceFound.start_date = new Date(updateAbsence.start_date);
    }
    if (updateAbsence.end_date) {
      absenceFound.end_date = new Date(updateAbsence.end_date);
    }
    if (updateAbsence.notes !== undefined) {
      absenceFound.notes = updateAbsence.notes;
    }
    if (updateAbsence.status) {
      absenceFound.status = updateAbsence.status;
    }
    
    // Mettre à jour les contacts de confiance si spécifiés
    if (updateAbsence.trusted_contact_ids) {
      const trustedUsers = await userRepository.findBy({ id: In(updateAbsence.trusted_contact_ids) });
      absenceFound.trusted_contacts = trustedUsers;
      
      // Supprimer les anciennes réponses
      if (absenceFound.responses && absenceFound.responses.length > 0) {
        await responseRepository.remove(absenceFound.responses);
      }
      
      // Créer de nouvelles réponses pour les nouveaux contacts
      const newResponses = [];
      for (const trustedUser of trustedUsers) {
        const response = new AbsenceResponse(absenceFound, trustedUser, 'pending', '');
        const savedResponse = await responseRepository.save(response);
        newResponses.push(savedResponse);
      }
      absenceFound.responses = newResponses;
    }

    try {
      const absenceUpdated = await absenceRepository.save(absenceFound);
      
      // Récupérer l'absence mise à jour avec toutes ses relations
      const finalAbsence = await absenceRepository.findOne({
        where: { id: absenceUpdated.id },
        relations: ['user', 'trusted_contacts', 'responses', 'responses.contact']
      });
      
      res.status(200).send(finalAbsence);
    } catch (error) {
      console.error("Erreur SQL:", error);
      if (error instanceof Error) {
        res.status(500).send({ error: "Internal error: " + error.message });
      } else {
        res.status(500).send({ error: "Internal error" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};

/**
 * Suppression d'une absence
 * DELETE /absences/:id
 */
export const deleteAbsenceHandler = async (req: Request, res: Response) => {
  try {
    const validation = AbsenceIdValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const absenceId = validation.value;
    const absenceRepository = AppDataSource.getRepository(Absence);
    const absenceFound = await absenceRepository.findOne({
      where: { id: absenceId.id },
      relations: ['user']
    });
    
    if (absenceFound === null) {
      res.status(404).send({ error: `Absence ${absenceId.id} non trouvée` });
      return;
    }

    // Vérifier que l'utilisateur a le droit de supprimer cette absence
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (decoded.userId !== absenceFound.user.id) {
      res.status(403).send({ error: 'Non autorisé à supprimer cette absence' });
      return;
    }

    const absenceDeleted = await absenceRepository.remove(absenceFound);
    res.status(200).send(absenceDeleted);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};

/**
 * Ajouter un contact de confiance à un utilisateur
 * POST /trusted-contacts
 */
export const addTrustedContactHandler = async (req: Request, res: Response) => {
  try {
    const validation = trustedContactValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const { userId, trustedUserId } = validation.value;
    
    // Vérifier que l'utilisateur ne s'ajoute pas lui-même
    if (userId === trustedUserId) {
      res.status(400).send({ error: "Vous ne pouvez pas vous ajouter vous-même comme contact de confiance" });
      return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Vérifier que les deux utilisateurs existent
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['trusted_contacts']
    });
    
    const trustedUser = await userRepository.findOneBy({ id: trustedUserId });
    
    if (!user || !trustedUser) {
      res.status(404).send({ message: "Utilisateur(s) non trouvé(s)" });
      return;
    }

    // Vérifier que l'utilisateur a le droit d'ajouter un contact de confiance
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (decoded.userId !== userId) {
      res.status(403).send({ error: 'Non autorisé à modifier les contacts de confiance de cet utilisateur' });
      return;
    }

    // Vérifier si le contact est déjà dans la liste
    if (user.trusted_contacts.some(contact => contact.id === trustedUserId)) {
      res.status(400).send({ error: "Cet utilisateur est déjà un contact de confiance" });
      return;
    }

    // Ajouter le contact de confiance
    user.trusted_contacts.push(trustedUser);
    await userRepository.save(user);
    
    res.status(200).send({ message: "Contact de confiance ajouté avec succès" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};

/**
 * Supprimer un contact de confiance
 * DELETE /trusted-contacts/:userId/:trustedUserId
 */
export const removeTrustedContactHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const trustedUserId = parseInt(req.params.trustedUserId);
    
    if (isNaN(userId) || isNaN(trustedUserId)) {
      res.status(400).send({ error: "IDs invalides" });
      return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Vérifier que l'utilisateur existe
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['trusted_contacts']
    });
    
    if (!user) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }

    // Vérifier que l'utilisateur a le droit de supprimer un contact de confiance
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (decoded.userId !== userId) {
      res.status(403).send({ error: 'Non autorisé à modifier les contacts de confiance de cet utilisateur' });
      return;
    }

    // Filtrer les contacts pour enlever celui à supprimer
    user.trusted_contacts = user.trusted_contacts.filter(contact => contact.id !== trustedUserId);
    await userRepository.save(user);
    
    res.status(200).send({ message: "Contact de confiance supprimé avec succès" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};

/**
 * Lister les contacts de confiance d'un utilisateur
 * GET /users/:userId/trusted-contacts
 */
export const listTrustedContactsHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      res.status(400).send({ error: "ID utilisateur invalide" });
      return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Vérifier que l'utilisateur existe et récupérer ses contacts de confiance
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['trusted_contacts']
    });
    
    if (!user) {
      res.status(404).send({ message: "Utilisateur non trouvé" });
      return;
    }
    
    // Vérifier que l'utilisateur a le droit de voir ces contacts de confiance
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).send({ error: 'Non authentifié' });
      return;
    }
    
    const decoded = jwt.verify(token, "valuerandom") as { userId: number };
    if (decoded.userId !== userId) {
      res.status(403).send({ error: 'Non autorisé à voir les contacts de confiance de cet utilisateur' });
      return;
    }
    
    res.status(200).send(user.trusted_contacts);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal error" });
  }
};