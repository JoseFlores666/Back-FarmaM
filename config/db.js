// db.js
require('dotenv').config();
const mysql = require('mysql');

// Crear un pool de conexiones
const connection = mysql.createPool({
    connectionLimit: 12, // Número máximo de conexiones en el pool
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    acquireTimeout: 30000, // Tiempo de espera en milisegundos para obtener una conexión
    waitForConnections: true, // Esperar si no hay conexiones disponibles
    queueLimit: 0,
});

// Manejo de errores en el pool
pool.on('connection', (connection) => {
    console.log('Conexión a la base de datos establecida.');
});

pool.on('error', (err) => {
    console.error('Error en la conexión del pool:', err);
});

// Exportar el pool para que se use en otras partes de la aplicación

module.exports = connection;
