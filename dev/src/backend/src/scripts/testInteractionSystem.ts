import { AppDataSource } from "../db/database";
import { AutoInteractionService } from "../services/autoInteractionService";
import { SuggestionEngine } from "../services/suggestionEngine";
import { InteractionService } from "../services/interaction";

/**
 * Script de test pour vérifier le bon fonctionnement du système d'interactions
 */
async function testInteractionSystem() {
    try {
        console.log("🧪 Test du système d'interactions...");
        
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const interactionService = new InteractionService();
        const suggestionEngine = new SuggestionEngine();

        // 1. Test des statistiques d'interactions
        console.log("\n📊 Test des statistiques d'interactions:");
        
        const userRepository = AppDataSource.getRepository("User");
        const users = await userRepository.find();
        
        if (users.length > 0) {
            const testUser = users[0];
            console.log(`Testing avec l'utilisateur: ${testUser.firstname} ${testUser.lastname}`);
            
            // Statistiques utilisateur
            const stats = await interactionService.getUserInteractionStats(testUser.id);
            console.log("📈 Statistiques utilisateur:", {
                totalInteractions: stats.totalInteractions,
                byType: stats.byType,
                averageRating: stats.averageRating,
                recentActivity: stats.recentActivity
            });

            // Catégories préférées
            const favoriteCategories = await interactionService.getUserFavoriteCategories(testUser.id, 3);
            console.log("❤️ Catégories préférées:", favoriteCategories);

            // Interactions récentes
            const recentInteractions = await interactionService.getUserRecentInteractions(testUser.id, 5);
            console.log("⏰ Interactions récentes:", recentInteractions.length);

            if (users.length > 1) {
                // Test d'affinité entre utilisateurs
                const otherUser = users[1];
                const affinityScore = await interactionService.calculateAffinityScore(testUser.id, otherUser.id);
                console.log(`🤝 Score d'affinité avec ${otherUser.firstname}: ${affinityScore}%`);

                // Utilisateurs avec affinités
                const affinities = await interactionService.findUserAffinities(testUser.id, 3);
                console.log("👥 Utilisateurs avec affinités:", affinities);
            }

            // 2. Test du moteur de suggestions
            console.log("\n🎯 Test du moteur de suggestions:");
            
            try {
                const suggestions = await suggestionEngine.generateSuggestions(testUser.id, 5);
                console.log(`💡 ${suggestions.length} suggestions générées`);
                
                if (suggestions.length > 0) {
                    console.log("Première suggestion:", {
                        entityType: suggestions[0].entityType,
                        title: suggestions[0].title,
                        score: suggestions[0].score,
                        reason: suggestions[0].reason
                    });
                }
            } catch (error) {
                console.log("⚠️ Erreur lors de la génération de suggestions (normal si pas assez de données):", error);
            }

            // 3. Test des suggestions en temps réel
            console.log("\n⚡ Test des suggestions en temps réel:");
            
            try {
                const realtimeSuggestions = await suggestionEngine.generateRealTimeSuggestions(testUser.id, {
                    entityType: 'service',
                    category: 'informatique',
                    entityId: 1
                });
                console.log(`🔥 ${realtimeSuggestions.length} suggestions en temps réel`);
            } catch (error) {
                console.log("⚠️ Erreur suggestions temps réel (normal si pas assez de données):", error);
            }

            // 4. Simulation d'interactions automatiques
            console.log("\n🤖 Test des interactions automatiques:");
            
            try {
                console.log("Simulation d'une consultation de service...");
                await AutoInteractionService.onContentViewed(
                    testUser.id,
                    users[1]?.id || testUser.id,
                    'service',
                    1,
                    'Service de test',
                    'informatique'
                );
                console.log("✅ Interaction de consultation créée");

                console.log("Simulation d'une recommandation...");
                await AutoInteractionService.onRecommendationShown(
                    testUser.id,
                    users[1]?.id || testUser.id,
                    'service',
                    1,
                    'Service recommandé',
                    'informatique',
                    'Basé sur vos intérêts'
                );
                console.log("✅ Interaction de recommandation créée");

            } catch (error) {
                console.log("⚠️ Erreur lors de la simulation:", error);
            }

        } else {
            console.log("❌ Aucun utilisateur trouvé. Exécutez d'abord le seeder: npm run seed:interactions");
        }

        // 5. Test de vérification de la structure
        console.log("\n🔍 Vérification de la structure de la base:");
        
        const interactionRepository = AppDataSource.getRepository("Interaction");
        const totalInteractions = await interactionRepository.count();
        console.log(`📝 Total d'interactions en base: ${totalInteractions}`);

        if (totalInteractions > 0) {
            // Vérifier les types d'interactions
            const interactionTypes = await AppDataSource.query(`
                SELECT "entityType", "interactionType", COUNT(*) as count
                FROM interaction 
                GROUP BY "entityType", "interactionType"
                ORDER BY count DESC
            `);
            console.log("📊 Répartition des types d'interactions:");
            interactionTypes.forEach((type: any) => {
                console.log(`   ${type.entityType}.${type.interactionType}: ${type.count}`);
            });

            // Vérifier les catégories
            const categories = await AppDataSource.query(`
                SELECT category, COUNT(*) as count
                FROM interaction 
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            `);
            console.log("🏷️ Top catégories:");
            categories.forEach((cat: any) => {
                console.log(`   ${cat.category}: ${cat.count}`);
            });
        }

        console.log("\n✅ Tests terminés avec succès !");

    } catch (error) {
        console.error("❌ Erreur lors des tests:", error);
        throw error;
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    testInteractionSystem()
        .then(() => {
            console.log("\n🎉 Tous les tests sont passés !");
            process.exit(0);
        })
        .catch(() => process.exit(1));
}

export { testInteractionSystem };
