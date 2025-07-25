import cors from "cors"
import express from "express"
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import path from 'path'
import { Server } from 'socket.io'
import { AppDataSource } from "./db/database"
import { Message } from "./db/models/message"
import { User } from "./db/models/user"
import { connectMongoDB } from "./db/mongodb"; // Import MongoDB connection
import { initHandlers } from "./handlers/handler"
import { swaggerDocs } from "./handlers/swagger/swagger"
import { checkEventStatus } from './jobs/eventStatusChecker'
import { findMessageGroupById } from "./handlers/messageGroup"

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
        origin: 'http://localhost',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }))

    app.use(express.json())
    app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));
    initHandlers(app)

    try {
        // Connect to PostgreSQL
        await AppDataSource.initialize();
        // Connect to MongoDB
        await connectMongoDB();
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
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

        // Pour la mise en ligne
        const userRepository = AppDataSource.getRepository(User);
        const userToUpdate = await userRepository.findOneBy({ id: userId });
        if (userToUpdate) {
            userToUpdate.status = 'online';
            userToUpdate.last_active = new Date();
            await userRepository.save(userToUpdate);

            // Diffuser le changement de statut
            io.emit('user_status_change', { 
                userId: userId, 
                status: 'online',
            });
        }

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
                    const userRepository = AppDataSource.getRepository(User);
                    const userToUpdate = await userRepository.findOneBy({ id: userId });
                    if (userToUpdate) {
                        userToUpdate.status = 'offline';
                        userToUpdate.last_active = new Date();
                        await userRepository.save(userToUpdate);

                        // Diffuser le changement de statut
                        io.emit('user_status_change', { 
                            userId: userId, 
                            status: 'offline',
                        });
                    }
                }
            }
        });

        // Écoute des nouveaux messages
        socket.on('new_message', async (message : Message) => {
            const emitEvent = (userId: number) => {
                const sockets = connectedUsers.get(userId);
                if (sockets && sockets.length > 0) {
                    sockets.forEach(socketId => {
                        io.to(socketId).emit('receive_message', message);
                    });
                }
            };

            if(message.receiver){
                emitEvent(message.receiver.id);
            } else if (message.group) {
                const group = await findMessageGroupById(message.group.id);
                if (group === null) {
                    return;
                }

                group.members.forEach(member => {
                    if (member.id !== message.sender.id)
                        emitEvent(member.id)
                });
            }
        });
    });

    // Remplacez app.listen par server.listen
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        swaggerDocs(app, port);

        // Planifier la vérification des statuts des événements (toutes les heures)
        setInterval(checkEventStatus, 60 * 60 * 1000);
    });
};

app();
