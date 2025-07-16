import { InteractionService, UserAffinityScore } from "./interaction";
import { AppDataSource } from "../db/database";
import { Service } from "../db/models/service";
import { Event } from "../db/models/event";
import { TrocOffer } from "../db/models/troc_offer";
import { Absence } from "../db/models/absence";
import { User } from "../db/models/user";

export interface SuggestionItem {
    id: number;
    entityType: "service" | "troc" | "event" | "absence";
    title: string;
    description: string;
    category: string;
    userId: number;
    userName: string;
    score: number;
    reason: string;
    createdAt: Date;
}

export interface SuggestionFilters {
    categories?: string[];
    entityTypes?: Array<"service" | "troc" | "event" | "absence">;
    excludeOwn?: boolean;
    minScore?: number;
}

export class SuggestionEngine {
    private interactionService: InteractionService;

    constructor() {
        this.interactionService = new InteractionService();
    }

    /**
     * Génère des suggestions personnalisées pour un utilisateur
     */
    async generateSuggestions(
        userId: number,
        limit: number = 10,
        filters: SuggestionFilters = {}
    ): Promise<SuggestionItem[]> {
        console.log(`🎯 [SuggestionEngine] Génération de suggestions pour userId: ${userId}, limit: ${limit}, filters:`, filters);
        
        const suggestions: SuggestionItem[] = [];

        // 1. Suggestions basées sur les affinités utilisateur
        console.log(`🤝 [SuggestionEngine] Recherche d'affinités pour userId: ${userId}`);
        const affinitySuggestions = await this.getAffinityBasedSuggestions(userId, Math.ceil(limit * 0.4), filters);
        console.log(`🤝 [SuggestionEngine] Affinités trouvées: ${affinitySuggestions.length}`);
        suggestions.push(...affinitySuggestions);

        // 2. Suggestions basées sur les catégories préférées
        console.log(`📂 [SuggestionEngine] Recherche par catégories pour userId: ${userId}`);
        const categorySuggestions = await this.getCategoryBasedSuggestions(userId, Math.ceil(limit * 0.3), filters);
        console.log(`📂 [SuggestionEngine] Suggestions par catégories: ${categorySuggestions.length}`);
        suggestions.push(...categorySuggestions);

        // 3. Suggestions basées sur la popularité et la nouveauté
        console.log(`🔥 [SuggestionEngine] Recherche populaires pour userId: ${userId}`);
        const popularSuggestions = await this.getPopularSuggestions(userId, Math.ceil(limit * 0.3), filters);
        console.log(`🔥 [SuggestionEngine] Suggestions populaires: ${popularSuggestions.length}`);
        suggestions.push(...popularSuggestions);

        console.log(`📊 [SuggestionEngine] Total avant déduplication: ${suggestions.length}`);
        
        // Déduplique, trie par score et limite
        const uniqueSuggestions = this.deduplicateAndSort(suggestions);
        
        console.log(`✅ [SuggestionEngine] Suggestions finales pour userId ${userId}: ${uniqueSuggestions.length}`);
        
        return uniqueSuggestions.slice(0, limit);
    }

    /**
     * Suggestions basées sur les utilisateurs avec de fortes affinités
     */
    private async getAffinityBasedSuggestions(
        userId: number,
        limit: number,
        filters: SuggestionFilters
    ): Promise<SuggestionItem[]> {
        const affinities = await this.interactionService.findUserAffinities(userId, 10);
        const suggestions: SuggestionItem[] = [];

        for (const affinity of affinities) {
            // Récupère les services/trocs/events récents de l'utilisateur avec affinité
            const recentItems = await this.getRecentItemsFromUser(affinity.userId, filters);
            
            for (const item of recentItems) {
                if (suggestions.length >= limit) break;

                // Calcule le score basé sur l'affinité et la fraîcheur
                const daysSinceCreation = Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                const freshnessScore = Math.max(0, 100 - daysSinceCreation * 2); // Pénalise les anciens contenus
                const finalScore = (affinity.score * 0.7) + (freshnessScore * 0.3);

                suggestions.push({
                    ...item,
                    score: Math.round(finalScore),
                    reason: `Utilisateur avec forte affinité (${affinity.score}% de compatibilité)`
                });
            }
        }

        return suggestions;
    }

    /**
     * Suggestions basées sur les catégories préférées de l'utilisateur
     */
    private async getCategoryBasedSuggestions(
        userId: number,
        limit: number,
        filters: SuggestionFilters
    ): Promise<SuggestionItem[]> {
        const favoriteCategories = await this.interactionService.getUserFavoriteCategories(userId, 5);
        const suggestions: SuggestionItem[] = [];

        for (const favCategory of favoriteCategories) {
            const categoryItems = await this.getItemsByCategory(favCategory.category, filters);
            
            for (const item of categoryItems) {
                if (suggestions.length >= limit) break;
                if (item.userId === userId && filters.excludeOwn) continue;

                // Score basé sur la préférence catégorielle et la fraîcheur
                const daysSinceCreation = Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                const freshnessScore = Math.max(0, 100 - daysSinceCreation * 2);
                const categoryScore = (favCategory.count / 10) * 100; // Normalise selon le nombre d'interactions
                const finalScore = (categoryScore * 0.6) + (freshnessScore * 0.4);

                suggestions.push({
                    ...item,
                    score: Math.round(finalScore),
                    reason: `Basé sur vos intérêts dans ${favCategory.category} (${favCategory.count} interactions)`
                });
            }
        }

        return suggestions;
    }

    /**
     * Suggestions basées sur la popularité et la nouveauté
     */
    private async getPopularSuggestions(
        userId: number,
        limit: number,
        filters: SuggestionFilters
    ): Promise<SuggestionItem[]> {
        const popularItems = await this.getPopularItems(filters);
        const suggestions: SuggestionItem[] = [];

        for (const item of popularItems) {
            if (suggestions.length >= limit) break;
            if (item.userId === userId && filters.excludeOwn) continue;

            // Score basé sur la popularité générale
            const daysSinceCreation = Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const freshnessScore = Math.max(0, 100 - daysSinceCreation * 2);
            const popularityScore = 70; // Score de base pour les éléments populaires
            const finalScore = (popularityScore * 0.5) + (freshnessScore * 0.5);

            suggestions.push({
                ...item,
                score: Math.round(finalScore),
                reason: "Populaire dans votre quartier"
            });
        }

        return suggestions;
    }

    /**
     * Récupère les éléments récents d'un utilisateur
     */
    private async getRecentItemsFromUser(
        userId: number,
        filters: SuggestionFilters
    ): Promise<SuggestionItem[]> {
        console.log(`🔍 [getRecentItemsFromUser] Recherche pour userId: ${userId}, filters:`, filters);
        
        const suggestions: SuggestionItem[] = [];
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        try {
            // Services
            if (!filters.entityTypes || filters.entityTypes.includes('service')) {
                const services = await AppDataSource.getRepository(Service)
                    .createQueryBuilder('service')
                    .leftJoinAndSelect('service.provider', 'provider')
                    .where('service.provider.id = :userId', { userId })
                    .andWhere('service.createdAt >= :oneMonthAgo', { oneMonthAgo })
                    .andWhere('service.status = :status', { status: 'active' })
                    .orderBy('service.createdAt', 'DESC')
                    .limit(10)
                    .getMany();

                console.log(`📋 [getRecentItemsFromUser] Services trouvés: ${services.length}`);

                for (const service of services) {
                    suggestions.push({
                        id: service.id,
                        entityType: 'service',
                        title: service.title,
                        description: service.description,
                        category: service.type,
                        userId: service.provider.id,
                        userName: `${service.provider.firstname} ${service.provider.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: service.createdAt
                    });
                }
            }

            // Events
            if (!filters.entityTypes || filters.entityTypes.includes('event')) {
                const events = await AppDataSource.getRepository(Event)
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.creator', 'creator')
                    .where('event.creator.id = :userId', { userId })
                    .andWhere('event.date >= :now', { now: new Date() })
                    .andWhere('event.status = :status', { status: 'open' })
                    .orderBy('event.date', 'ASC')
                    .limit(10)
                    .getMany();

                console.log(`🎉 [getRecentItemsFromUser] Events trouvés: ${events.length}`);

                for (const event of events) {
                    suggestions.push({
                        id: event.id,
                        entityType: 'event',
                        title: event.name,
                        description: event.description || event.location,
                        category: event.category || 'general',
                        userId: event.creator.id,
                        userName: `${event.creator.firstname} ${event.creator.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: event.date
                    });
                }
            }

            // Trocs
            if (!filters.entityTypes || filters.entityTypes.includes('troc')) {
                const trocs = await AppDataSource.getRepository(TrocOffer)
                    .createQueryBuilder('troc')
                    .leftJoinAndSelect('troc.user', 'user')
                    .where('troc.user.id = :userId', { userId })
                    .andWhere('troc.creation_date >= :oneMonthAgo', { oneMonthAgo })
                    .andWhere('troc.status = :status', { status: 'active' })
                    .orderBy('troc.creation_date', 'DESC')
                    .limit(10)
                    .getMany();

                console.log(`🔄 [getRecentItemsFromUser] Trocs trouvés: ${trocs.length}`);

                for (const troc of trocs) {
                    suggestions.push({
                        id: troc.id,
                        entityType: 'troc',
                        title: troc.title,
                        description: troc.description,
                        category: troc.type,
                        userId: troc.user.id,
                        userName: `${troc.user.firstname} ${troc.user.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: troc.creation_date
                    });
                }
            }

            // Absences
            if (!filters.entityTypes || filters.entityTypes.includes('absence')) {
                const absences = await AppDataSource.getRepository(Absence)
                    .createQueryBuilder('absence')
                    .leftJoinAndSelect('absence.user', 'user')
                    .where('absence.user.id = :userId', { userId })
                    .andWhere('absence.start_date >= :now', { now: new Date() })
                    .andWhere('absence.status = :status', { status: 'pending' })
                    .orderBy('absence.start_date', 'ASC')
                    .limit(5)
                    .getMany();

                console.log(`🏠 [getRecentItemsFromUser] Absences trouvées: ${absences.length}`);

                for (const absence of absences) {
                    suggestions.push({
                        id: absence.id,
                        entityType: 'absence',
                        title: `Garde du ${absence.start_date.toLocaleDateString()} au ${absence.end_date.toLocaleDateString()}`,
                        description: absence.notes || 'Demande de garde',
                        category: 'garde',
                        userId: absence.user.id,
                        userName: `${absence.user.firstname} ${absence.user.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: absence.start_date
                    });
                }
            }

            console.log(`✅ [getRecentItemsFromUser] Total suggestions trouvées: ${suggestions.length}`);
            return suggestions;

        } catch (error) {
            console.error(`❌ [getRecentItemsFromUser] Erreur:`, error);
            return [];
        }
    }

    /**
     * Récupère les éléments par catégorie
     */
    private async getItemsByCategory(
        category: string,
        filters: SuggestionFilters
    ): Promise<SuggestionItem[]> {
        console.log(`🏷️ [getItemsByCategory] Recherche pour catégorie: ${category}, filters:`, filters);
        
        const suggestions: SuggestionItem[] = [];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        try {
            // Services par type/catégorie
            if (!filters.entityTypes || filters.entityTypes.includes('service')) {
                const services = await AppDataSource.getRepository(Service)
                    .createQueryBuilder('service')
                    .leftJoinAndSelect('service.provider', 'provider')
                    .where('service.type = :category', { category })
                    .andWhere('service.status = :status', { status: 'active' })
                    .andWhere('service.createdAt >= :oneWeekAgo', { oneWeekAgo })
                    .orderBy('service.createdAt', 'DESC')
                    .limit(15)
                    .getMany();

                console.log(`📋 [getItemsByCategory] Services trouvés pour ${category}: ${services.length}`);

                for (const service of services) {
                    suggestions.push({
                        id: service.id,
                        entityType: 'service',
                        title: service.title,
                        description: service.description,
                        category: service.type,
                        userId: service.provider.id,
                        userName: `${service.provider.firstname} ${service.provider.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: service.createdAt
                    });
                }
            }

            // Events par catégorie
            if (!filters.entityTypes || filters.entityTypes.includes('event')) {
                const events = await AppDataSource.getRepository(Event)
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.creator', 'creator')
                    .where('event.category = :category', { category })
                    .andWhere('event.date >= :now', { now: new Date() })
                    .andWhere('event.status = :status', { status: 'open' })
                    .orderBy('event.date', 'ASC')
                    .limit(15)
                    .getMany();

                console.log(`🎉 [getItemsByCategory] Events trouvés pour ${category}: ${events.length}`);

                for (const event of events) {
                    suggestions.push({
                        id: event.id,
                        entityType: 'event',
                        title: event.name,
                        description: event.description || event.location,
                        category: event.category || 'general',
                        userId: event.creator.id,
                        userName: `${event.creator.firstname} ${event.creator.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: event.date
                    });
                }
            }

            // Trocs par type
            if (!filters.entityTypes || filters.entityTypes.includes('troc')) {
                const trocs = await AppDataSource.getRepository(TrocOffer)
                    .createQueryBuilder('troc')
                    .leftJoinAndSelect('troc.user', 'user')
                    .where('troc.type = :category', { category })
                    .andWhere('troc.status = :status', { status: 'active' })
                    .andWhere('troc.creation_date >= :oneWeekAgo', { oneWeekAgo })
                    .orderBy('troc.creation_date', 'DESC')
                    .limit(15)
                    .getMany();

                console.log(`🔄 [getItemsByCategory] Trocs trouvés pour ${category}: ${trocs.length}`);

                for (const troc of trocs) {
                    suggestions.push({
                        id: troc.id,
                        entityType: 'troc',
                        title: troc.title,
                        description: troc.description,
                        category: troc.type,
                        userId: troc.user.id,
                        userName: `${troc.user.firstname} ${troc.user.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: troc.creation_date
                    });
                }
            }

            console.log(`✅ [getItemsByCategory] Total suggestions trouvées pour ${category}: ${suggestions.length}`);
            return suggestions;

        } catch (error) {
            console.error(`❌ [getItemsByCategory] Erreur pour catégorie ${category}:`, error);
            return [];
        }
    }

    /**
     * Récupère les éléments populaires
     */
    private async getPopularItems(filters: SuggestionFilters): Promise<SuggestionItem[]> {
        console.log(`🔥 [getPopularItems] Recherche d'éléments populaires, filters:`, filters);
        
        const suggestions: SuggestionItem[] = [];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        try {
            // Services récents et actifs
            if (!filters.entityTypes || filters.entityTypes.includes('service')) {
                const services = await AppDataSource.getRepository(Service)
                    .createQueryBuilder('service')
                    .leftJoinAndSelect('service.provider', 'provider')
                    .leftJoinAndSelect('service.bookings', 'bookings')
                    .where('service.status = :status', { status: 'available' })
                    .andWhere('service.createdAt >= :oneWeekAgo', { oneWeekAgo })
                    .orderBy('service.createdAt', 'DESC')
                    .limit(10)
                    .getMany();

                console.log(`📋 [getPopularItems] Services populaires trouvés: ${services.length}`);

                for (const service of services) {
                    suggestions.push({
                        id: service.id,
                        entityType: 'service',
                        title: service.title,
                        description: service.description,
                        category: service.type,
                        userId: service.provider.id,
                        userName: `${service.provider.firstname} ${service.provider.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: service.createdAt
                    });
                }
            }

            // Events populaires (avec participants)
            if (!filters.entityTypes || filters.entityTypes.includes('event')) {
                const events = await AppDataSource.getRepository(Event)
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.creator', 'creator')
                    .leftJoinAndSelect('event.participants', 'participants')
                    .where('event.date >= :now', { now: new Date() })
                    .andWhere('event.status = :status', { status: 'open' })
                    .orderBy('event.date', 'ASC')
                    .limit(10)
                    .getMany();

                console.log(`🎉 [getPopularItems] Events populaires trouvés: ${events.length}`);

                for (const event of events) {
                    suggestions.push({
                        id: event.id,
                        entityType: 'event',
                        title: event.name,
                        description: event.description || event.location,
                        category: event.category || 'general',
                        userId: event.creator.id,
                        userName: `${event.creator.firstname} ${event.creator.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: event.date
                    });
                }
            }

            // Trocs récents
            if (!filters.entityTypes || filters.entityTypes.includes('troc')) {
                const trocs = await AppDataSource.getRepository(TrocOffer)
                    .createQueryBuilder('troc')
                    .leftJoinAndSelect('troc.user', 'user')
                    .where('troc.status = :status', { status: 'open' })
                    .andWhere('troc.creation_date >= :oneWeekAgo', { oneWeekAgo })
                    .orderBy('troc.creation_date', 'DESC')
                    .limit(10)
                    .getMany();

                console.log(`🔄 [getPopularItems] Trocs populaires trouvés: ${trocs.length}`);

                for (const troc of trocs) {
                    suggestions.push({
                        id: troc.id,
                        entityType: 'troc',
                        title: troc.title,
                        description: troc.description,
                        category: troc.type,
                        userId: troc.user.id,
                        userName: `${troc.user.firstname} ${troc.user.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: troc.creation_date
                    });
                }
            }

            // Absences urgentes (départ bientôt)
            if (!filters.entityTypes || filters.entityTypes.includes('absence')) {
                const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const absences = await AppDataSource.getRepository(Absence)
                    .createQueryBuilder('absence')
                    .leftJoinAndSelect('absence.user', 'user')
                    .where('absence.start_date BETWEEN :now AND :nextWeek', { 
                        now: new Date(), 
                        nextWeek 
                    })
                    .andWhere('absence.status = :status', { status: 'pending' })
                    .orderBy('absence.start_date', 'ASC')
                    .limit(5)
                    .getMany();

                console.log(`🏠 [getPopularItems] Absences urgentes trouvées: ${absences.length}`);

                for (const absence of absences) {
                    suggestions.push({
                        id: absence.id,
                        entityType: 'absence',
                        title: `Garde du ${absence.start_date.toLocaleDateString()} au ${absence.end_date.toLocaleDateString()}`,
                        description: absence.notes || 'Demande de garde urgente',
                        category: 'garde',
                        userId: absence.user.id,
                        userName: `${absence.user.firstname} ${absence.user.lastname}`,
                        score: 0,
                        reason: '',
                        createdAt: absence.start_date
                    });
                }
            }

            console.log(`✅ [getPopularItems] Total suggestions populaires trouvées: ${suggestions.length}`);
            return suggestions;

        } catch (error) {
            console.error(`❌ [getPopularItems] Erreur:`, error);
            return [];
        }
    }

    /**
     * Trouve des utilisateurs avec des intérêts similaires
     */
    private async findUsersWithSimilarInterests(
        userId: number,
        category: string,
        entityType: string
    ): Promise<UserAffinityScore[]> {
        return await this.interactionService.findUserAffinities(userId, 10);
    }

    /**
     * Déduplique et trie les suggestions
     */
    private deduplicateAndSort(suggestions: SuggestionItem[]): SuggestionItem[] {
        const seen = new Set<string>();
        const unique: SuggestionItem[] = [];

        for (const suggestion of suggestions) {
            const key = `${suggestion.entityType}-${suggestion.id}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(suggestion);
            }
        }

        return unique.sort((a, b) => b.score - a.score);
    }

    /**
     * Enregistre qu'une suggestion a été montrée à un utilisateur
     */
    async recordSuggestionShown(
        userId: number,
        suggestionId: number,
        suggestionType: "service" | "troc" | "event" | "absence",
        targetUserId: number,
        category: string,
        title: string
    ): Promise<void> {
        await this.interactionService.recordInteraction({
            userA: userId,
            userB: targetUserId,
            entityType: suggestionType,
            interactionType: 'recommended',
            category,
            entityId: suggestionId,
            entityTitle: title
        });
    }

    /**
     * Met à jour le modèle d'apprentissage basé sur les actions de l'utilisateur
     */
    async recordUserFeedback(
        userId: number,
        suggestionId: number,
        suggestionType: "service" | "troc" | "event" | "absence",
        action: "viewed" | "liked" | "contacted" | "ignored",
        targetUserId?: number
    ): Promise<void> {
        if (action === "contacted" && targetUserId) {
            // Enregistre une interaction positive
            await this.interactionService.recordInteraction({
                userA: userId,
                userB: targetUserId,
                entityType: suggestionType,
                interactionType: 'viewed',
                category: "suggestion_contact",
                entityId: suggestionId,
                entityTitle: `Contact via suggestion`,
                rating: 4 // Bon signal positif
            });
        } else if (action === "liked" && targetUserId) {
            // Enregistre un intérêt
            await this.interactionService.recordInteraction({
                userA: userId,
                userB: targetUserId,
                entityType: suggestionType,
                interactionType: 'viewed',
                category: "suggestion_like",
                entityId: suggestionId,
                entityTitle: `Like suggestion`,
                rating: 3
            });
        }
        // Les actions "viewed" et "ignored" peuvent être utilisées pour affiner l'algorithme
    }

    /**
     * Génère des suggestions en temps réel basées sur l'activité récente
     */
    async generateRealTimeSuggestions(
        userId: number,
        recentAction: {
            entityType: "service" | "troc" | "event" | "absence";
            category: string;
            entityId: number;
        }
    ): Promise<SuggestionItem[]> {
        // Trouve des utilisateurs qui ont eu des interactions similaires
        const similarUsers = await this.findUsersWithSimilarInterests(
            userId,
            recentAction.category,
            recentAction.entityType
        );

        const suggestions: SuggestionItem[] = [];

        for (const similarUser of similarUsers) {
            const userItems = await this.getRecentItemsFromUser(similarUser.userId, {
                categories: [recentAction.category],
                entityTypes: [recentAction.entityType],
                excludeOwn: true
            });

            suggestions.push(...userItems.map(item => ({
                ...item,
                score: similarUser.score,
                reason: `Utilisateurs avec des intérêts similaires dans ${recentAction.category}`
            })));
        }

        return this.deduplicateAndSort(suggestions).slice(0, 5);
    }

    /**
     * Génère des suggestions basées sur la géolocalisation
     */
    async generateLocationBasedSuggestions(
        userId: number,
        userLocation: { latitude: number; longitude: number },
        radius: number = 5000 // en mètres
    ): Promise<SuggestionItem[]> {
        // À implémenter selon vos données de géolocalisation
        // Cette méthode devrait trouver des services/événements/trocs près de l'utilisateur
        return [];
    }

    /**
     * Génère des suggestions pour un utilisateur inactif
     */
    async generateReactivationSuggestions(userId: number): Promise<SuggestionItem[]> {
        // Suggestions spéciales pour réactiver un utilisateur inactif
        // Basées sur ses anciennes préférences et les nouveautés
        const oldFavorites = await this.interactionService.getUserFavoriteCategories(userId, 3);
        const suggestions: SuggestionItem[] = [];

        for (const favorite of oldFavorites) {
            const newItems = await this.getItemsByCategory(favorite.category, { excludeOwn: true });
            suggestions.push(...newItems.map(item => ({
                ...item,
                score: 75,
                reason: `Nouvelles activités dans ${favorite.category} - revenez découvrir !`
            })));
        }

        return this.deduplicateAndSort(suggestions).slice(0, 10);
    }
}
