import { AppDataSource } from "../database";
import { User } from "../models/user";
import { Interaction } from "../models/interaction";
import { Service } from "../models/service";
import { TrocOffer } from "../models/troc_offer";
import { Event } from "../models/event";
import * as bcryptjs from "bcryptjs";

export class SuggestionSeeder {
    
    static async seed() {
        console.log("🌱 Démarrage du seeding pour le système de suggestions...");
        
        try {
            await this.createTestUsers();
            await this.createTestServices();
            await this.createTestTrocOffers();
            await this.createTestEvents();
            await this.createTestInteractions();
            
            console.log("✅ Seeding terminé avec succès !");
        } catch (error) {
            console.error("❌ Erreur lors du seeding:", error);
            throw error;
        }
    }

    private static async createTestUsers() {
        console.log("👥 Création des utilisateurs de test...");
        
        const userRepository = AppDataSource.getRepository(User);

        // Hash du mot de passe "Azerty123" pour tous les utilisateurs de test
        const hashedPassword = await bcryptjs.hash("Azerty123", 10);
        
        const testUsers = [
            {
                firstname: "Alice",
                lastname: "Martin",
                email: "alice.martin@test.com",
                password: hashedPassword,
                role: 0
            },
            {
                firstname: "Bob",
                lastname: "Dupont",
                email: "bob.dupont@test.com",
                password: hashedPassword,
                role: 0
            },
            {
                firstname: "Claire",
                lastname: "Bernard",
                email: "claire.bernard@test.com",
                password: hashedPassword,
                role: 0
            },
            {
                firstname: "David",
                lastname: "Moreau",
                email: "david.moreau@test.com",
                password: hashedPassword,
                role: 0
            },
            {
                firstname: "Emma",
                lastname: "Petit",
                email: "emma.petit@test.com",
                password: hashedPassword,
                role: 0
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await userRepository.findOne({ 
                where: { email: userData.email } 
            });
            
            if (!existingUser) {
                const user = userRepository.create(userData);
                await userRepository.save(user);
                console.log(`   ✓ Utilisateur créé: ${userData.firstname} ${userData.lastname}`);
            }
        }
    }

    private static async createTestServices() {
        console.log("🔧 Création des services de test...");
        
        const serviceRepository = AppDataSource.getRepository(Service);
        const userRepository = AppDataSource.getRepository(User);
        
        const users = await userRepository.find();
        
        const testServices = [
            {
                title: "Cours de développement web",
                description: "Apprentissage HTML, CSS, JavaScript et React",
                type: "informatique",
                status: "available",
                date_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                title: "Jardinage et entretien",
                description: "Aide pour l'entretien de votre jardin",
                type: "jardinage",
                status: "available",
                date_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                date_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            },
            {
                title: "Cours de cuisine italienne",
                description: "Apprenez à cuisiner de délicieux plats italiens",
                type: "cuisine",
                status: "available",
                date_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                date_end: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
            },
            {
                title: "Coaching sportif personnel",
                description: "Entraînement personnalisé à domicile",
                type: "sport",
                status: "available",
                date_start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                date_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            },
            {
                title: "Cours de yoga débutant",
                description: "Relaxation et bien-être par le yoga",
                type: "bien-être",
                status: "available",
                date_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        ];

        for (let i = 0; i < testServices.length; i++) {
            const serviceData = testServices[i];
            const user = users[i % users.length];
            
            const existingService = await serviceRepository.findOne({
                where: { title: serviceData.title }
            });
            
            if (!existingService) {
                const service = serviceRepository.create({
                    ...serviceData,
                    provider: user
                });
                await serviceRepository.save(service);
                console.log(`   ✓ Service créé: ${serviceData.title}`);
            }
        }
    }

    private static async createTestTrocOffers() {
        console.log("🔄 Création des offres de troc de test...");
        
        const trocRepository = AppDataSource.getRepository(TrocOffer);
        const userRepository = AppDataSource.getRepository(User);
        
        const users = await userRepository.find();
        
        const testTrocs = [
            {
                title: "Livre de programmation contre livre de cuisine",
                description: "Échange livre 'Clean Code' contre livre de recettes",
                type: "offer",
                status: "available"
            },
            {
                title: "Plantes d'intérieur contre outils de jardinage",
                description: "J'ai trop de plantes, cherche outils",
                type: "offer",
                status: "available"
            },
            {
                title: "Cours de guitare contre cours d'informatique",
                description: "Échange de compétences musicales/tech",
                type: "request",
                status: "available"
            },
            {
                title: "Équipement photo contre matériel de sport",
                description: "Objectif 50mm contre raquette de tennis",
                type: "offer",
                status: "available"
            }
        ];

        for (let i = 0; i < testTrocs.length; i++) {
            const trocData = testTrocs[i];
            const user = users[i % users.length];
            
            const existingTroc = await trocRepository.findOne({
                where: { title: trocData.title }
            });
            
            if (!existingTroc) {
                const troc = trocRepository.create({
                    ...trocData,
                    creation_date: new Date(),
                    user: user
                });
                await trocRepository.save(troc);
                console.log(`   ✓ Troc créé: ${trocData.title}`);
            }
        }
    }

    private static async createTestEvents() {
        console.log("🎉 Création des événements de test...");
        
        const eventRepository = AppDataSource.getRepository(Event);
        const userRepository = AppDataSource.getRepository(User);
        
        const users = await userRepository.find();
        
        const testEvents = [
            {
                name: "Atelier développement web communautaire",
                description: "Rencontre entre développeurs du quartier",
                category: "technologie",
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 1 semaine
                location: "Espace co-working local",
                max_participants: 20,
                status: "open",
                type: "community"
            },
            {
                name: "Marché aux plants du quartier",
                description: "Échange et vente de plants entre voisins",
                category: "jardinage",
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 2 semaines
                location: "Place du marché",
                max_participants: 50,
                status: "open",
                type: "community"
            },
            {
                name: "Cours de cuisine collective",
                description: "Préparation d'un repas en groupe",
                category: "cuisine",
                date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
                location: "Cuisine partagée",
                max_participants: 12,
                status: "open",
                type: "regular"
            },
            {
                name: "Tournoi de sport de quartier",
                description: "Compétition amicale multi-sports",
                category: "sport",
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Dans 10 jours
                location: "Terrain de sport local",
                max_participants: 30,
                status: "open",
                type: "community"
            }
        ];

        for (let i = 0; i < testEvents.length; i++) {
            const eventData = testEvents[i];
            const user = users[i % users.length];
            
            const existingEvent = await eventRepository.findOne({
                where: { name: eventData.name }
            });
            
            if (!existingEvent) {
                const event = eventRepository.create({
                    ...eventData,
                    creator: user
                });
                await eventRepository.save(event);
                console.log(`   ✓ Événement créé: ${eventData.name}`);
            }
        }
    }

    private static async createTestInteractions() {
        console.log("🤝 Création des interactions de test...");
        
        const interactionRepository = AppDataSource.getRepository(Interaction);
        const userRepository = AppDataSource.getRepository(User);
        const serviceRepository = AppDataSource.getRepository(Service);
        const trocRepository = AppDataSource.getRepository(TrocOffer);
        const eventRepository = AppDataSource.getRepository(Event);
        
        const users = await userRepository.find();
        const services = await serviceRepository.find({ relations: ['provider'] });
        const trocs = await trocRepository.find({ relations: ['user'] });
        const events = await eventRepository.find({ relations: ['creator'] });
        
        if (users.length < 2) {
            console.log("   ⚠️ Pas assez d'utilisateurs pour créer des interactions");
            return;
        }

        // 1. Créer des interactions réalistes pour les services
        await this.createServiceInteractions(interactionRepository, users, services);
        
        // 2. Créer des interactions pour les trocs
        await this.createTrocInteractions(interactionRepository, users, trocs);
        
        // 3. Créer des interactions pour les événements
        await this.createEventInteractions(interactionRepository, users, events);
        
        // 4. Créer des interactions de consultation
        await this.createViewInteractions(interactionRepository, users, services, trocs, events);
        
        console.log("   ✓ Interactions créées avec succès");
    }

    private static async createServiceInteractions(interactionRepository: any, users: any[], services: any[]) {
        for (const service of services) {
            const provider = service.provider;
            
            // Interaction de création
            await this.saveInteraction(interactionRepository, {
                userA: provider.id,
                userB: provider.id,
                entityType: 'service',
                interactionType: 'created',
                category: service.type,
                entityId: service.id,
                entityTitle: service.title,
                date: new Date(service.date_start.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });

            // Quelques réservations aléatoires
            const numBookings = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numBookings; i++) {
                const requester = users[Math.floor(Math.random() * users.length)];
                if (requester.id !== provider.id) {
                    await this.saveInteraction(interactionRepository, {
                        userA: requester.id,
                        userB: provider.id,
                        entityType: 'service',
                        interactionType: 'booked',
                        category: service.type,
                        entityId: service.id,
                        entityTitle: service.title,
                        date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
                    });

                    // Parfois accepté
                    if (Math.random() > 0.3) {
                        await this.saveInteraction(interactionRepository, {
                            userA: provider.id,
                            userB: requester.id,
                            entityType: 'service',
                            interactionType: 'accepted',
                            category: service.type,
                            entityId: service.id,
                            entityTitle: service.title,
                            date: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
                        });

                        // Parfois complété avec note
                        if (Math.random() > 0.5) {
                            await this.saveInteraction(interactionRepository, {
                                userA: requester.id,
                                userB: provider.id,
                                entityType: 'service',
                                interactionType: 'completed',
                                category: service.type,
                                entityId: service.id,
                                entityTitle: service.title,
                                date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                                rating: Math.floor(Math.random() * 2) + 4 // Notes entre 4 et 5
                            });
                        }
                    }
                }
            }
        }
    }

    private static async createTrocInteractions(interactionRepository: any, users: any[], trocs: any[]) {
        for (const troc of trocs) {
            const creator = troc.user;
            
            // Interaction de création
            await this.saveInteraction(interactionRepository, {
                userA: creator.id,
                userB: creator.id,
                entityType: 'troc',
                interactionType: 'created',
                category: 'echange',
                entityId: troc.id,
                entityTitle: troc.title,
                date: troc.creation_date
            });

            // Quelques propositions
            const numOffers = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numOffers; i++) {
                const interested = users[Math.floor(Math.random() * users.length)];
                if (interested.id !== creator.id) {
                    await this.saveInteraction(interactionRepository, {
                        userA: interested.id,
                        userB: creator.id,
                        entityType: 'troc',
                        interactionType: 'offered',
                        category: 'echange',
                        entityId: troc.id,
                        entityTitle: troc.title,
                        date: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
                    });

                    // Parfois échangé
                    if (Math.random() > 0.7) {
                        await this.saveInteraction(interactionRepository, {
                            userA: creator.id,
                            userB: interested.id,
                            entityType: 'troc',
                            interactionType: 'exchanged',
                            category: 'echange',
                            entityId: troc.id,
                            entityTitle: troc.title,
                            date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                            rating: Math.floor(Math.random() * 2) + 4
                        });
                    }
                }
            }
        }
    }

    private static async createEventInteractions(interactionRepository: any, users: any[], events: any[]) {
        for (const event of events) {
            const organizer = event.creator;
            
            // Interaction de création
            await this.saveInteraction(interactionRepository, {
                userA: organizer.id,
                userB: organizer.id,
                entityType: 'event',
                interactionType: 'created',
                category: event.category,
                entityId: event.id,
                entityTitle: event.name,
                date: new Date(event.date.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000)
            });

            // Participants aléatoires
            const numParticipants = Math.min(Math.floor(Math.random() * 8) + 2, event.max_participants);
            const participants: any[] = [];
            
            for (let i = 0; i < numParticipants; i++) {
                const participant = users[Math.floor(Math.random() * users.length)];
                if (participant.id !== organizer.id && !participants.find(p => p.id === participant.id)) {
                    participants.push(participant);
                    
                    // Inscription
                    await this.saveInteraction(interactionRepository, {
                        userA: participant.id,
                        userB: organizer.id,
                        entityType: 'event',
                        interactionType: 'joined',
                        category: event.category,
                        entityId: event.id,
                        entityTitle: event.name,
                        date: new Date(event.date.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                    });

                    // Si l'événement est passé, marquer comme assisté
                    if (event.date < new Date()) {
                        await this.saveInteraction(interactionRepository, {
                            userA: participant.id,
                            userB: organizer.id,
                            entityType: 'event',
                            interactionType: 'attended',
                            category: event.category,
                            entityId: event.id,
                            entityTitle: event.name,
                            date: event.date,
                            metadata: { participants: participants.map(p => p.id) }
                        });
                    }
                }
            }

            // Créer des interactions entre participants si l'événement est passé
            if (event.date < new Date() && participants.length > 1) {
                for (let i = 0; i < participants.length; i++) {
                    for (let j = i + 1; j < participants.length; j++) {
                        await this.saveInteraction(interactionRepository, {
                            userA: participants[i].id,
                            userB: participants[j].id,
                            entityType: 'event',
                            interactionType: 'attended',
                            category: event.category,
                            entityId: event.id,
                            entityTitle: event.name,
                            date: event.date,
                            metadata: { 
                                participants: participants.map(p => p.id),
                                meetingType: 'participant_to_participant' 
                            }
                        });
                    }
                }
            }
        }
    }

    private static async createViewInteractions(interactionRepository: any, users: any[], services: any[], trocs: any[], events: any[]) {
        // Créer des interactions de consultation
        for (let i = 0; i < 30; i++) {
            const viewer = users[Math.floor(Math.random() * users.length)];
            
            const contentType = Math.random();
            if (contentType < 0.33 && services.length > 0) {
                const service = services[Math.floor(Math.random() * services.length)];
                if (viewer.id !== service.provider.id) {
                    await this.saveInteraction(interactionRepository, {
                        userA: viewer.id,
                        userB: service.provider.id,
                        entityType: 'view',
                        interactionType: 'viewed',
                        category: `view_service_${service.type}`,
                        entityId: service.id,
                        entityTitle: service.title,
                        date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
                    });
                }
            } else if (contentType < 0.66 && trocs.length > 0) {
                const troc = trocs[Math.floor(Math.random() * trocs.length)];
                if (viewer.id !== troc.user.id) {
                    await this.saveInteraction(interactionRepository, {
                        userA: viewer.id,
                        userB: troc.user.id,
                        entityType: 'view',
                        interactionType: 'viewed',
                        category: 'view_troc_echange',
                        entityId: troc.id,
                        entityTitle: troc.title,
                        date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
                    });
                }
            } else if (events.length > 0) {
                const event = events[Math.floor(Math.random() * events.length)];
                if (viewer.id !== event.creator.id) {
                    await this.saveInteraction(interactionRepository, {
                        userA: viewer.id,
                        userB: event.creator.id,
                        entityType: 'view',
                        interactionType: 'viewed',
                        category: `view_event_${event.category}`,
                        entityId: event.id,
                        entityTitle: event.name,
                        date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
                    });
                }
            }
        }
    }

    private static async saveInteraction(interactionRepository: any, interactionData: any) {
        try {
            const interaction = interactionRepository.create(interactionData);
            await interactionRepository.save(interaction);
        } catch (error: any) {
            // Ignorer les erreurs de doublons ou de contraintes
            console.warn(`   ⚠️ Interaction ignorée:`, error?.message || error);
        }
    }
}
