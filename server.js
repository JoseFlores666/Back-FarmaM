// const https = require('https');
// const fs = require('fs');
// const app = require('./app');  // Importa la app configurada
// const path = require('path');

// // Lee los certificados SSL
// const options = {
//     key: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.key')),
//     cert: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.crt')),
// };

// // Inicia el servidor HTTPS con los certificados
// https.createServer(options, app).listen(4000, () => {
//     console.log('Servidor HTTPS escuchando en https://localhost:4000');
// });



const app = require('./app');
const connection = require('./config/db'); 
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

process.on('SIGINT', () => {
    connection.end((err) => {
        console.log('Desconectado de la base de datos MySQL.');
        process.exit(err ? 1 : 0);
    });
});
