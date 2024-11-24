const https = require('https');
const http = require('http'); 
const fs = require('fs');
const app = require('./app');
const path = require('path');

// si es true = https y si es false = http
//al desplegarlo en render debera estar en false
const USE_HTTPS = false;  

if (USE_HTTPS) {
    const options = {
        key: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.crt')),
    };

    https.createServer(options, app).listen(4000, () => {
        console.log('Servidor HTTPS escuchando en https://localhost:4000');
    });
} else {
    http.createServer(app).listen(4000, () => {
        console.log('Servidor HTTP escuchando en http://localhost:4000');
    });
}
