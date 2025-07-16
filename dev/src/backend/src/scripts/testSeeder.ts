import "reflect-metadata";
import { AppDataSource } from "../db/database";
import { SuggestionSeeder } from "../db/seeders/suggestionSeeder";

async function testSeeder() {
    console.log("🧪 Test du seeder...");
    
    try {
        // Initialiser la connexion à la base de données
        await AppDataSource.initialize();
        console.log("✅ Connexion à la base de données établie");
        
        // Tester juste la création d'utilisateurs
        await SuggestionSeeder.seed();
        
        console.log("🎉 Test terminé avec succès !");
        
    } catch (error) {
        console.error("❌ Erreur lors du test:", error);
        if (error instanceof Error) {
            console.error("Stack trace:", error.stack);
        }
    } finally {
        // Fermer la connexion
        try {
            await AppDataSource.destroy();
            console.log("🔌 Connexion fermée");
        } catch (err) {
            console.error("Erreur lors de la fermeture:", err);
        }
    }
}

testSeeder();
