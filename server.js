const https = require('https');
const http = require('http');
const fs = require('fs');
const app = require('./app');
const path = require('path');

const USE_HTTPS = false;

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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});