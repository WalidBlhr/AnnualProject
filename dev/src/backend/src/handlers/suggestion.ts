import { Request, Response } from "express";
import { InteractionService } from "../services/interaction";
import { SuggestionEngine } from "../services/suggestionEngine";

const interactionService = new InteractionService();
const suggestionEngine = new SuggestionEngine();

/**
 * Enregistre une nouvelle interaction
 * POST /interactions
 */
export const recordInteraction = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const { userB, entityType, interactionType, category, entityId, entityTitle, rating, notes } = req.body;
        const userA = user.userId;

        if (!userB || !entityType || !interactionType || !category || !entityId || !entityTitle) {
            res.status(400).send({ 
                message: "Données manquantes: userB, entityType, interactionType, category, entityId, entityTitle requis" 
            });
            return;
        }

        const interaction = await interactionService.recordInteraction({
            userA,
            userB,
            entityType,
            interactionType,
            category,
            entityId,
            entityTitle,
            rating,
            notes
        });

        res.status(201).send({
            success: true,
            interaction: {
                id: interaction.id,
                userA: interaction.userA,
                userB: interaction.userB,
                entityType: interaction.entityType,
                interactionType: interaction.interactionType,
                category: interaction.category,
                entityId: interaction.entityId,
                entityTitle: interaction.entityTitle,
                date: interaction.date,
                rating: interaction.rating,
                notes: interaction.notes
            }
        });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'interaction:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Met à jour une interaction existante
 * PUT /interactions/:id
 */
export const updateInteraction = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const interactionId = parseInt(req.params.id);
        const { rating, notes } = req.body;

        if (isNaN(interactionId)) {
            res.status(400).send({ message: "ID d'interaction invalide" });
            return;
        }

        const updatedInteraction = await interactionService.updateInteraction(
            interactionId,
            rating,
            notes
        );

        if (!updatedInteraction) {
            res.status(404).send({ message: "Interaction non trouvée" });
            return;
        }

        res.send({
            success: true,
            interaction: updatedInteraction
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'interaction:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Récupère les affinités d'un utilisateur
 * GET /affinities
 */
export const getUserAffinities = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const limit = parseInt(req.query.limit as string) || 10;

        const affinities = await interactionService.findUserAffinities(userId, limit);

        res.send({
            success: true,
            affinities
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des affinités:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Récupère les statistiques d'interaction d'un utilisateur
 * GET /stats
 */
export const getUserStats = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const stats = await interactionService.getUserInteractionStats(userId);

        res.send({
            success: true,
            stats
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Récupère les catégories préférées d'un utilisateur
 * GET /categories
 */
export const getUserFavoriteCategories = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const limit = parseInt(req.query.limit as string) || 5;

        const categories = await interactionService.getUserFavoriteCategories(userId, limit);

        res.send({
            success: true,
            categories
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories préférées:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Récupère les interactions récentes d'un utilisateur
 * GET /interactions/recent
 */
export const getUserRecentInteractions = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const type = req.query.type as string;

        const interactions = await interactionService.getUserRecentInteractions(userId, limit, type);

        res.send({
            success: true,
            interactions
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des interactions récentes:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Génère des suggestions personnalisées
 * GET /suggestions
 */
export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const limit = parseInt(req.query.limit as string) || 10;
        const categories = req.query.categories ? (req.query.categories as string).split(",") : undefined;
        const types = req.query.types ? (req.query.types as string).split(",") : undefined;
        const excludeOwn = req.query.excludeOwn === "true";
        const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;

        const suggestions = await suggestionEngine.generateSuggestions(userId, limit, {
            categories,
            entityTypes: types as any,
            excludeOwn,
            minScore
        });

        res.send({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error("Erreur lors de la génération des suggestions:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Enregistre la consultation d'une suggestion
 * POST /suggestions/view
 */
export const recordSuggestionView = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const { suggestionId, suggestionType, targetUserId, category, title } = req.body;

        if (!suggestionId || !suggestionType || !targetUserId || !category || !title) {
            res.status(400).send({ 
                message: "Données manquantes: suggestionId, suggestionType, targetUserId, category, title requis" 
            });
            return;
        }

        await suggestionEngine.recordSuggestionShown(
            userId,
            suggestionId,
            suggestionType,
            targetUserId,
            category,
            title
        );

        res.send({
            success: true,
            message: "Consultation de suggestion enregistrée"
        });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de la consultation:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Enregistre un feedback utilisateur sur une suggestion
 * POST /suggestions/feedback
 */
export const recordSuggestionFeedback = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const { suggestionId, suggestionType, action, targetUserId } = req.body;

        if (!suggestionId || !suggestionType || !action) {
            res.status(400).send({ 
                message: "Données manquantes: suggestionId, suggestionType, action requis" 
            });
            return;
        }

        await suggestionEngine.recordUserFeedback(
            userId,
            suggestionId,
            suggestionType,
            action,
            targetUserId
        );

        res.send({
            success: true,
            message: "Feedback enregistré"
        });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du feedback:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Génère des suggestions en temps réel
 * POST /suggestions/realtime
 */
export const getRealTimeSuggestions = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const { type, category, entityId } = req.body;

        if (!type || !category || !entityId) {
            res.status(400).send({ 
                message: "Données manquantes: type, category, entityId requis" 
            });
            return;
        }

        const suggestions = await suggestionEngine.generateRealTimeSuggestions(userId, {
            entityType: type,
            category,
            entityId
        });

        res.send({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error("Erreur lors de la génération des suggestions en temps réel:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};

/**
 * Calcule le score d'affinité entre deux utilisateurs
 * GET /affinities/:targetUserId
 */
export const getAffinityScore = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).send({ message: "Non authentifié" });
            return;
        }

        const userId = user.userId;
        const targetUserId = parseInt(req.params.targetUserId);

        if (isNaN(targetUserId)) {
            res.status(400).send({ message: "ID utilisateur cible invalide" });
            return;
        }

        const score = await interactionService.calculateAffinityScore(userId, targetUserId);

        res.send({
            success: true,
            affinityScore: score,
            userA: userId,
            userB: targetUserId
        });
    } catch (error) {
        console.error("Erreur lors du calcul du score d'affinité:", error);
        res.status(500).send({ message: "Erreur interne du serveur" });
    }
};
