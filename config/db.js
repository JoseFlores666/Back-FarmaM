require('dotenv').config();
const mysql = require('mysql');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,  // Timeout de conexión de 10 segundos
  waitForConnections: true,  // Esperar a que se libere una conexión si el pool está lleno
  connectionLimit: 10,  // Limitar el número de conexiones activas
  queueLimit: 0,  // No limitar la cola de conexiones
};

// Crear un pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para manejar las conexiones del pool
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Conexión a la base de datos cerrada.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Demasiadas conexiones a la base de datos.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Conexión a la base de datos rechazada.');
    }
    console.error('Error al obtener una conexión desde el pool:', err);
    return;
  }

  if (connection) connection.release(); // Liberar la conexión de vuelta al pool si es exitosa
  console.log('Conectado a la base de datos MySQL usando un pool de conexiones.');
});

pool.on('error', (err) => {
  console.error('Error en el pool de conexiones:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect();  // Intenta reconectar en caso de desconexión
  } else {
    throw err;  // Si es otro tipo de error, lo lanzamos
  }
});

module.exports = pool;