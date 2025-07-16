import { AppDataSource } from "../db/database";
import { Interaction } from "../db/models/interaction";
import { Repository } from "typeorm";

export interface InteractionData {
    userA: number;
    userB: number;
    entityType: "service" | "troc" | "event" | "absence" | "message" | "view" | "recommendation";
    interactionType: "created" | "booked" | "accepted" | "cancelled" | "completed" | "declined" |
                    "joined" | "left" | "attended" | "organized" |
                    "offered" | "requested" | "exchanged" |
                    "sent" | "received" | "replied" |
                    "viewed" | "recommended" | "rated";
    category: string;
    entityId: number;
    entityTitle: string;
    rating?: number;
    notes?: string;
    metadata?: any;
}

export interface UserAffinityScore {
    userId: number;
    score: number;
    commonInteractions: number;
    sharedCategories: string[];
}

export class InteractionService {
    private interactionRepository: Repository<Interaction>;

    constructor() {
        this.interactionRepository = AppDataSource.getRepository(Interaction);
    }

    /**
     * Enregistre une nouvelle interaction entre deux utilisateurs
     */
    async recordInteraction(data: InteractionData): Promise<Interaction> {
        const interaction = this.interactionRepository.create({
            ...data,
            date: new Date()
        });

        return await this.interactionRepository.save(interaction);
    }

    /**
     * Met à jour une interaction existante avec une note ou un rating
     */
    async updateInteraction(
        interactionId: number, 
        rating?: number, 
        notes?: string
    ): Promise<Interaction | null> {
        const interaction = await this.interactionRepository.findOne({
            where: { id: interactionId }
        });

        if (!interaction) {
            return null;
        }

        if (rating !== undefined) {
            interaction.rating = rating;
        }
        if (notes !== undefined) {
            interaction.notes = notes;
        }

        return await this.interactionRepository.save(interaction);
    }

    /**
     * Calcule le score d'affinité entre deux utilisateurs
     */
    async calculateAffinityScore(userA: number, userB: number): Promise<number> {
        // Interactions communes entre les deux utilisateurs
        const commonInteractions = await this.interactionRepository
            .createQueryBuilder("interaction")
            .where("(interaction.userA = :userA AND interaction.userB = :userB)")
            .orWhere("(interaction.userA = :userB AND interaction.userB = :userA)")
            .setParameters({ userA, userB })
            .getCount();

        // Catégories communes
        const commonCategories = await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("DISTINCT interaction.category")
            .where("(interaction.userA = :userA OR interaction.userB = :userA)")
            .andWhere("interaction.category IN (SELECT DISTINCT i2.category FROM interaction i2 WHERE i2.\"userA\" = :userB OR i2.\"userB\" = :userB)")
            .setParameters({ userA, userB })
            .getCount();

        // Notes moyennes des interactions
        const avgRating = await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("AVG(interaction.rating)", "avgRating")
            .where("(interaction.userA = :userA AND interaction.userB = :userB)")
            .orWhere("(interaction.userA = :userB AND interaction.userB = :userA)")
            .andWhere("interaction.rating IS NOT NULL")
            .setParameters({ userA, userB })
            .getRawOne();

        // Calcul du score d'affinité (0-100)
        let score = 0;
        
        // Poids des interactions communes (max 40 points)
        score += Math.min(commonInteractions * 10, 40);
        
        // Poids des catégories communes (max 30 points)
        score += Math.min(commonCategories * 6, 30);
        
        // Poids de la note moyenne (max 30 points)
        if (avgRating?.avgRating) {
            score += (parseFloat(avgRating.avgRating) / 5) * 30;
        }

        return Math.round(score);
    }

    /**
     * Trouve les utilisateurs avec le plus d'affinités avec un utilisateur donné
     */
    async findUserAffinities(userId: number, limit: number = 10): Promise<UserAffinityScore[]> {
        // Récupère tous les utilisateurs avec qui l'utilisateur a eu des interactions
        const interactedUsers = await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("DISTINCT CASE WHEN interaction.userA = :userId THEN interaction.userB ELSE interaction.userA END", "userId")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .setParameters({ userId })
            .getRawMany();

        const affinities: UserAffinityScore[] = [];

        for (const user of interactedUsers) {
            const otherUserId = user.userId;
            if (otherUserId === userId) continue;

            const score = await this.calculateAffinityScore(userId, otherUserId);
            
            // Compte les interactions communes
            const commonInteractions = await this.interactionRepository
                .createQueryBuilder("interaction")
                .where("(interaction.userA = :userId AND interaction.userB = :otherUserId)")
                .orWhere("(interaction.userA = :otherUserId AND interaction.userB = :userId)")
                .setParameters({ userId, otherUserId })
                .getCount();

            // Trouve les catégories partagées
            const sharedCategories = await this.interactionRepository
                .createQueryBuilder("interaction")
                .select("DISTINCT interaction.category")
                .where("(interaction.userA = :userId OR interaction.userB = :userId)")
                .andWhere("interaction.category IN (SELECT DISTINCT i2.category FROM interaction i2 WHERE i2.\"userA\" = :otherUserId OR i2.\"userB\" = :otherUserId)")
                .setParameters({ userId, otherUserId })
                .getRawMany();

            affinities.push({
                userId: otherUserId,
                score,
                commonInteractions,
                sharedCategories: sharedCategories.map(c => c.category)
            });
        }

        // Trie par score décroissant et limite les résultats
        return affinities
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Trouve les catégories les plus populaires pour un utilisateur
     */
    async getUserFavoriteCategories(userId: number, limit: number = 5): Promise<Array<{category: string, count: number}>> {
        return await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("interaction.category", "category")
            .addSelect("COUNT(*)", "count")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .setParameters({ userId })
            .groupBy("interaction.category")
            .orderBy("count", "DESC")
            .limit(limit)
            .getRawMany();
    }

    /**
     * Récupère les interactions récentes d'un utilisateur
     */
    async getUserRecentInteractions(
        userId: number, 
        limit: number = 20,
        entityType?: string
    ): Promise<Interaction[]> {
        const query = this.interactionRepository
            .createQueryBuilder("interaction")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .setParameters({ userId })
            .orderBy("interaction.date", "DESC")
            .limit(limit);

        if (entityType) {
            query.andWhere("interaction.entityType = :entityType", { entityType });
        }

        return await query.getMany();
    }

    /**
     * Génère des statistiques d'interaction pour un utilisateur
     */
    async getUserInteractionStats(userId: number): Promise<{
        totalInteractions: number;
        byType: Record<string, number>;
        byCategory: Record<string, number>;
        averageRating: number;
        recentActivity: number; // Interactions des 30 derniers jours
    }> {
        const totalInteractions = await this.interactionRepository
            .createQueryBuilder("interaction")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .setParameters({ userId })
            .getCount();

        const byType = await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("interaction.entityType", "entityType")
            .addSelect("COUNT(*)", "count")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .setParameters({ userId })
            .groupBy("interaction.entityType")
            .getRawMany();

        const byCategory = await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("interaction.category", "category")
            .addSelect("COUNT(*)", "count")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .setParameters({ userId })
            .groupBy("interaction.category")
            .getRawMany();

        const avgRatingResult = await this.interactionRepository
            .createQueryBuilder("interaction")
            .select("AVG(interaction.rating)", "avgRating")
            .where("(interaction.userA = :userId OR interaction.userB = :userId)")
            .andWhere("interaction.rating IS NOT NULL")
            .setParameters({ userId })
            .getRawOne();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = await this.interactionRepository
            .createQueryBuilder("interaction")
            .where("interaction.userA = :userId OR interaction.userB = :userId")
            .andWhere("interaction.date >= :thirtyDaysAgo")
            .setParameters({ userId, thirtyDaysAgo })
            .getCount();

        return {
            totalInteractions,
            byType: byType.reduce((acc, item) => {
                acc[item.entityType] = parseInt(item.count);
                return acc;
            }, {} as Record<string, number>),
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = parseInt(item.count);
                return acc;
            }, {} as Record<string, number>),
            averageRating: avgRatingResult?.avgRating ? parseFloat(avgRatingResult.avgRating) : 0,
            recentActivity
        };
    }
}
