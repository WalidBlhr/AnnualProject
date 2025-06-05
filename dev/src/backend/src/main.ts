import express from "express"
import cors from "cors"
import { initHandlers } from "./handlers/handler"
import { AppDataSource } from "./db/database"
import { swaggerDocs } from "./handlers/swagger/swagger"
import path from 'path';
import { checkEventStatus } from './jobs/eventStatusChecker';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from "./db/models/user";

const app = async () => {
    const app = express()
    const port = 3000
    
    // Créer un serveur HTTP à partir de l'application Express
    const server = createServer(app);
    
    // Configurer Socket.io avec gestion CORS
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    
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

    // Map pour stocker les connexions socket par utilisateur
    const connectedUsers = new Map<number, string[]>(); // userId -> [socketIds]

    // Middleware Socket.io pour authentifier les utilisateurs
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error("Authentication error"));
        }
        
        try {
            const decoded = jwt.verify(token, "valuerandom") as { userId: number };
            socket.data.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.data.userId;
        console.log(`User ${userId} connected with socket ${socket.id}`);
        
        // Ajouter à la liste des utilisateurs connectés
        if (!connectedUsers.has(userId)) {
            connectedUsers.set(userId, []);
        }
        connectedUsers.get(userId)!.push(socket.id);
        
        // Mettre à jour le statut utilisateur dans la BD
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.update(userId, { 
            status: 'online' as any
        });
        
        // Diffuser le changement de statut
        io.emit('user_status_change', { 
            userId: userId, 
            status: 'online' 
        });
        
        // Gestion de la déconnexion
        socket.on('disconnect', async () => {
            console.log(`User ${userId} disconnected`);
            
            // Supprimer le socket de la liste
            const userSockets = connectedUsers.get(userId);
            if (userSockets) {
                const index = userSockets.indexOf(socket.id);
                if (index !== -1) {
                    userSockets.splice(index, 1);
                }
                
                // Si c'était le dernier socket, marquer comme hors ligne
                if (userSockets.length === 0) {
                    connectedUsers.delete(userId);
                    
                    // Mettre à jour la BD
                    await userRepository.update(userId, { 
                        status: 'offline' as any
                    });
                    
                    // Diffuser le changement de statut
                    io.emit('user_status_change', { 
                        userId: userId, 
                        status: 'offline' 
                    });
                }
            }
        });
        
        // Écoute des nouveaux messages
        socket.on('new_message', (message) => {
            // Diffuser le message vers le destinataire
            const receiverSockets = connectedUsers.get(message.receiverId);
            if (receiverSockets && receiverSockets.length > 0) {
                receiverSockets.forEach(socketId => {
                    io.to(socketId).emit('receive_message', message);
                });
            }
        });
    });

    // Remplacez app.listen par server.listen
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`)
        swaggerDocs(app, port);
    })
}

app();