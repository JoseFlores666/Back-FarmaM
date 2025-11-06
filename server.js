const https = require('https');
const http = require('http');
const fs = require('fs');
const app = require('./app');
const path = require('path');
const { Server } = require('socket.io');
const sockets = require('./sockets')

const USE_HTTPS = process.env.USE_HTTPS === 'true';

let server;
if (USE_HTTPS) {
    const options = {
        key: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.crt')),
    };
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}

const io = new Server(server, {
    cors: {
        origin: [
            'https://farmamedic.vercel.app',
            'https://isoftuthh.com',
            'https://bina5.com',
            'http://localhost:5173',
            'https://localhost:5173',
            'http://localhost:4173',
            'https://localhost:4173',
            'https://farma-medic.vercel.app',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    }
});

app.set('io', io);

sockets(io)

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en ${USE_HTTPS ? 'https' : 'http'}://localhost:${PORT}`);
});
