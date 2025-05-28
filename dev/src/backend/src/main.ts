import express from "express"
import cors from "cors"
import { initHandlers } from "./handlers/handler"
import { AppDataSource } from "./db/database"
import { swaggerDocs } from "./handlers/swagger/swagger"
import path from 'path';
import cron from 'node-cron';
import { checkEventStatus } from './jobs/eventStatusChecker';

const app = async () => {
    const app = express()
    const port = 3000

    app.use(cors({
        origin: 'http://localhost', // URL de votre frontend
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }))

    app.use(express.json())
    app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));
    initHandlers(app)
    try {
        await AppDataSource.initialize()
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message)
        }
    }

    // Configuration du cron job pour vérifier les événements toutes les heures
    cron.schedule('0 * * * *', async () => {
        console.log('Vérification des statuts d\'événements...');
        try {
            await checkEventStatus();
        } catch (error) {
            console.error('Erreur lors de la vérification des événements:', error);
        }
    });

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`)
        swaggerDocs(app, port);
    })
}

app();