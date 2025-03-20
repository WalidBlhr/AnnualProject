// index.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }});

app.use(cors());
app.use(express.json());

// Exemple de route de base
app.get('/', (req, res) => {
    res.send('API Next Door Buddy 🚀');
});

// Socket.io connexion
io.on('connection', (socket) => {
    console.log('Utilisateur connecté au chat:', socket.id);

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté du chat:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 API lancée sur le port ${PORT}`));
