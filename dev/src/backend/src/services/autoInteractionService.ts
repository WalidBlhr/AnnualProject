import { interactionTracker } from "./interactionTracker";

/**
 * Service pour automatiser l'enregistrement des interactions selon les actions des utilisateurs
 * Ce service doit être appelé dans tous les handlers pour enregistrer automatiquement les interactions
 */
export class AutoInteractionService {
    
    /**
     * Enregistre automatiquement les interactions lors de la création d'un service
     */
    static async onServiceCreated(serviceId: number, serviceTitle: string, serviceCategory: string, providerId: number) {
        await interactionTracker.trackServiceInteraction(
            providerId,
            providerId,
            serviceId,
            serviceTitle,
            serviceCategory,
            'created'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la réservation d'un service
     */
    static async onServiceBooked(serviceId: number, serviceTitle: string, serviceCategory: string, providerId: number, requesterId: number) {
        await interactionTracker.trackServiceInteraction(
            requesterId,
            providerId,
            serviceId,
            serviceTitle,
            serviceCategory,
            'booked'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de l'acceptation d'une réservation
     */
    static async onServiceBookingAccepted(serviceId: number, serviceTitle: string, serviceCategory: string, providerId: number, requesterId: number) {
        await interactionTracker.trackServiceInteraction(
            providerId,
            requesterId,
            serviceId,
            serviceTitle,
            serviceCategory,
            'accepted'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de l'annulation d'une réservation
     */
    static async onServiceBookingCancelled(serviceId: number, serviceTitle: string, serviceCategory: string, providerId: number, requesterId: number, cancelledBy: 'provider' | 'requester') {
        const userA = cancelledBy === 'provider' ? providerId : requesterId;
        const userB = cancelledBy === 'provider' ? requesterId : providerId;
        
        await interactionTracker.trackServiceInteraction(
            userA,
            userB,
            serviceId,
            serviceTitle,
            serviceCategory,
            'cancelled'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la finalisation d'un service
     */
    static async onServiceCompleted(serviceId: number, serviceTitle: string, serviceCategory: string, providerId: number, requesterId: number, rating?: number, notes?: string) {
        await interactionTracker.trackServiceInteraction(
            requesterId,
            providerId,
            serviceId,
            serviceTitle,
            serviceCategory,
            'completed',
            { rating, notes }
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la création d'un événement
     */
    static async onEventCreated(eventId: number, eventTitle: string, eventCategory: string, organizerId: number) {
        await interactionTracker.trackEventInteraction(
            organizerId,
            organizerId,
            eventId,
            eventTitle,
            eventCategory,
            'created'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la participation à un événement
     */
    static async onEventJoined(eventId: number, eventTitle: string, eventCategory: string, organizerId: number, participantId: number) {
        await interactionTracker.trackEventInteraction(
            participantId,
            organizerId,
            eventId,
            eventTitle,
            eventCategory,
            'joined'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la finalisation d'un événement (tous les participants)
     */
    static async onEventCompleted(eventId: number, eventTitle: string, eventCategory: string, organizerId: number, participantIds: number[]) {
        await interactionTracker.trackEventParticipationInteractions(
            eventId,
            eventTitle,
            eventCategory,
            organizerId,
            participantIds
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la création d'une offre de troc
     */
    static async onTrocOfferCreated(trocId: number, trocTitle: string, trocCategory: string, offererId: number) {
        await interactionTracker.trackTrocInteraction(
            offererId,
            offererId,
            trocId,
            trocTitle,
            trocCategory,
            'created'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors d'une proposition de troc
     */
    static async onTrocOffered(trocId: number, trocTitle: string, trocCategory: string, offererId: number, requesterId: number) {
        await interactionTracker.trackTrocInteraction(
            requesterId,
            offererId,
            trocId,
            trocTitle,
            trocCategory,
            'offered'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la finalisation d'un troc
     */
    static async onTrocExchanged(trocId: number, trocTitle: string, trocCategory: string, offererId: number, requesterId: number) {
        await interactionTracker.trackTrocInteraction(
            offererId,
            requesterId,
            trocId,
            trocTitle,
            trocCategory,
            'exchanged'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la création d'une demande d'absence
     */
    static async onAbsenceCreated(absenceId: number, absenceTitle: string, absentUserId: number) {
        await interactionTracker.trackAbsenceInteraction(
            absentUserId,
            absentUserId,
            absenceId,
            absenceTitle,
            'created'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de l'acceptation d'aide pour une absence
     */
    static async onAbsenceHelpAccepted(absenceId: number, absenceTitle: string, absentUserId: number, helperId: number) {
        await interactionTracker.trackAbsenceInteraction(
            helperId,
            absentUserId,
            absenceId,
            absenceTitle,
            'accepted'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de l'envoi d'un message
     */
    static async onMessageSent(messageId: number, messageSubject: string, senderId: number, receiverId: number) {
        await interactionTracker.trackMessageInteraction(
            senderId,
            receiverId,
            messageId,
            messageSubject,
            'sent'
        );
    }

    /**
     * Enregistre automatiquement les interactions lors de la consultation d'un profil ou contenu
     */
    static async onContentViewed(
        viewerId: number, 
        targetUserId: number, 
        entityType: 'service' | 'troc' | 'event' | 'absence',
        entityId: number,
        entityTitle: string,
        category: string
    ) {
        // Ne pas enregistrer les auto-consultations
        if (viewerId !== targetUserId) {
            await interactionTracker.trackViewInteraction(
                viewerId,
                targetUserId,
                entityType,
                entityId,
                entityTitle,
                category
            );
        }
    }

    /**
     * Enregistre automatiquement les interactions lors d'une recommandation du système
     */
    static async onRecommendationShown(
        userId: number,
        recommendedUserId: number,
        entityType: 'service' | 'troc' | 'event',
        entityId: number,
        entityTitle: string,
        category: string,
        reason: string
    ) {
        await interactionTracker.trackRecommendationInteraction(
            userId,
            recommendedUserId,
            entityType,
            entityId,
            entityTitle,
            category,
            reason
        );
    }

    /**
     * Enregistre automatiquement les interactions lors d'une évaluation
     */
    static async onInteractionRated(
        raterId: number,
        ratedUserId: number,
        originalInteractionId: number,
        rating: number,
        notes?: string
    ) {
        await interactionTracker.trackRatingInteraction(
            raterId,
            ratedUserId,
            originalInteractionId,
            rating,
            notes
        );
    }
}
