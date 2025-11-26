const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

// Setup Express app and HTTP server
const app = express();
app.use(express.static('public'));  // serve files from public/ directory
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

httpServer.listen(3000);

// Game state
const players = {};    // Map of socket.id -> player object
const foods = [];      // Array of food objects {x, y}
const viruses = [];    // Array of virus objects {x, y}
let foodCount = 0;

const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;

console.log(`Server started`);

io.on('connection', (socket) => {
    console.log('Player connected!', socket.id);

    // When a new player joins, expect a "joinGame" event with their name
    socket.on('joinGame', (playerName) => {
        // Initialize player state
        const startSize = 5;  // initial radius or mass
        const startX = Math.random() * MAP_WIDTH;
        const startY = Math.random() * MAP_HEIGHT;
        players[socket.id] = {
            id: socket.id,
            name: playerName || 'Anonymous',
            x: startX, y: startY,
            mass: 10,           // Starting mass (could be related to radius)
            radius: startSize,
            vx: 0, vy: 0        // velocity components
        };
        console.log(`${playerName} joined the game.`);
        // Send the new player the current state (other players, food, viruses)
        socket.emit('initState', {
            selfId: socket.id,
            players: Object.values(players),
            foods: foods,
            viruses: viruses
        });
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    // Handle player disconnecting
    socket.on('disconnect', () => {
        console.log('Player disconnected', socket.id);
        // Remove from state and inform remaining players
        delete players[socket.id];
        socket.broadcast.emit('playerLeft', socket.id);
    });
});
