import { InteractionService } from "./interaction";

/**
 * Service pour enregistrer automatiquement les interactions basées sur l'activité des utilisateurs
 * Ce système génère automatiquement les interactions selon les actions des utilisateurs sur le site
 */
export class InteractionTracker {
    private interactionService: InteractionService;

    constructor() {
        this.interactionService = new InteractionService();
    }

    /**
     * Enregistre une interaction de service
     */
    async trackServiceInteraction(
        providerId: number,
        requesterId: number,
        serviceId: number,
        serviceTitle: string,
        serviceCategory: string,
        action: 'created' | 'booked' | 'accepted' | 'cancelled' | 'completed',
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: action === 'created' ? providerId : requesterId,
                userB: action === 'created' ? providerId : providerId, // Pour création, auto-interaction
                entityType: 'service',
                interactionType: action,
                category: serviceCategory,
                entityId: serviceId,
                entityTitle: serviceTitle,
                metadata
            });

            // Si c'est une réservation, créer aussi l'interaction pour le provider
            if (action === 'booked' && providerId !== requesterId) {
                await this.interactionService.recordInteraction({
                    userA: providerId,
                    userB: requesterId,
                    entityType: 'service',
                    interactionType: 'booked',
                    category: serviceCategory,
                    entityId: serviceId,
                    entityTitle: serviceTitle,
                    metadata
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'interaction service:', error);
        }
    }

    /**
     * Enregistre une interaction de troc
     */
    async trackTrocInteraction(
        offererId: number,
        requesterId: number,
        trocId: number,
        trocTitle: string,
        trocCategory: string,
        action: 'created' | 'offered' | 'requested' | 'exchanged' | 'cancelled',
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: action === 'created' ? offererId : requesterId,
                userB: action === 'created' ? offererId : offererId,
                entityType: 'troc',
                interactionType: action,
                category: trocCategory,
                entityId: trocId,
                entityTitle: trocTitle,
                metadata
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'interaction troc:', error);
        }
    }

    /**
     * Enregistre une interaction d'événement
     */
    async trackEventInteraction(
        organizerId: number,
        participantId: number,
        eventId: number,
        eventTitle: string,
        eventCategory: string,
        action: 'created' | 'joined' | 'left' | 'attended' | 'organized',
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: action === 'created' || action === 'organized' ? organizerId : participantId,
                userB: organizerId,
                entityType: 'event',
                interactionType: action,
                category: eventCategory,
                entityId: eventId,
                entityTitle: eventTitle,
                metadata
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'interaction événement:', error);
        }
    }

    /**
     * Enregistre une interaction d'absence
     */
    async trackAbsenceInteraction(
        absentUserId: number,
        helperId: number,
        absenceId: number,
        absenceTitle: string,
        action: 'created' | 'accepted' | 'declined' | 'completed',
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: action === 'created' ? absentUserId : helperId,
                userB: action === 'created' ? absentUserId : absentUserId,
                entityType: 'absence',
                interactionType: action,
                category: 'absence_help',
                entityId: absenceId,
                entityTitle: absenceTitle,
                metadata
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'interaction absence:', error);
        }
    }

    /**
     * Enregistre une interaction de message
     */
    async trackMessageInteraction(
        senderId: number,
        receiverId: number,
        messageId: number,
        messageSubject: string,
        action: 'sent' | 'received' | 'replied' = 'sent',
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: senderId,
                userB: receiverId,
                entityType: 'message',
                interactionType: action,
                category: 'communication',
                entityId: messageId,
                entityTitle: messageSubject || 'Message privé',
                metadata
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'interaction message:', error);
        }
    }

    /**
     * Enregistre une interaction de consultation
     */
    async trackViewInteraction(
        viewerId: number,
        targetUserId: number,
        entityType: 'service' | 'troc' | 'event' | 'absence',
        entityId: number,
        entityTitle: string,
        category: string,
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: viewerId,
                userB: targetUserId,
                entityType: 'view',
                interactionType: 'viewed',
                category: `view_${entityType}_${category}`,
                entityId,
                entityTitle,
                metadata
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'interaction vue:', error);
        }
    }

    /**
     * Enregistre une recommandation automatique du système
     */
    async trackRecommendationInteraction(
        userId: number,
        recommendedUserId: number,
        entityType: 'service' | 'troc' | 'event',
        entityId: number,
        entityTitle: string,
        category: string,
        reason: string,
        metadata?: any
    ): Promise<void> {
        try {
            await this.interactionService.recordInteraction({
                userA: userId,
                userB: recommendedUserId,
                entityType: 'recommendation',
                interactionType: 'recommended',
                category: `suggestion_${entityType}_${category}`,
                entityId,
                entityTitle,
                notes: reason,
                metadata
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la recommandation:', error);
        }
    }

    /**
     * Enregistre un rating d'interaction
     */
    async trackRatingInteraction(
        raterId: number,
        ratedUserId: number,
        originalInteractionId: number,
        rating: number,
        notes?: string
    ): Promise<void> {
        try {
            // Met à jour l'interaction originale
            await this.interactionService.updateInteraction(originalInteractionId, rating, notes);
            
            // Crée une nouvelle interaction pour le rating
            await this.interactionService.recordInteraction({
                userA: raterId,
                userB: ratedUserId,
                entityType: 'service', // Sera déterminé selon le contexte
                interactionType: 'rated',
                category: 'evaluation',
                entityId: originalInteractionId,
                entityTitle: `Évaluation d'interaction`,
                rating,
                notes
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du rating:', error);
        }
    }

    /**
     * Méthode pour créer automatiquement des interactions basées sur la participation à un événement
     */
    async trackEventParticipationInteractions(
        eventId: number,
        eventTitle: string,
        eventCategory: string,
        organizerId: number,
        participantIds: number[]
    ): Promise<void> {
        try {
            // Créer des interactions entre l'organisateur et chaque participant
            for (const participantId of participantIds) {
                if (participantId !== organizerId) {
                    await this.trackEventInteraction(
                        organizerId,
                        participantId,
                        eventId,
                        eventTitle,
                        eventCategory,
                        'attended',
                        { participants: participantIds }
                    );
                }
            }

            // Créer des interactions entre participants (réseau social)
            for (let i = 0; i < participantIds.length; i++) {
                for (let j = i + 1; j < participantIds.length; j++) {
                    const userA = participantIds[i];
                    const userB = participantIds[j];
                    
                    if (userA !== organizerId && userB !== organizerId) {
                        await this.interactionService.recordInteraction({
                            userA,
                            userB,
                            entityType: 'event',
                            interactionType: 'attended',
                            category: eventCategory,
                            entityId: eventId,
                            entityTitle: eventTitle,
                            metadata: { participants: participantIds, meetingType: 'participant_to_participant' }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement des interactions d\'événement:', error);
        }
    }

    /**
     * Trouve les dernières interactions pour générer des suggestions en temps réel
     */
    async getRecentInteractionsForSuggestions(
        userId: number,
        limit: number = 5
    ): Promise<any[]> {
        try {
            return await this.interactionService.getUserRecentInteractions(userId, limit);
        } catch (error) {
            console.error('Erreur lors de la récupération des interactions récentes:', error);
            return [];
        }
    }
}

// Instance singleton pour réutilisation
export const interactionTracker = new InteractionTracker();
