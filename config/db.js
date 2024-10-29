require('dotenv').config();
const mysql = require('mysql');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,  
  waitForConnections: true,  
  connectionLimit: 10,  
  queueLimit: 0,  
};

const pool = mysql.createPool(dbConfig);

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

  if (connection) connection.release(); 
  console.log('Conectado a la base de datos MySQL usando un pool de conexiones.');
});

pool.on('error', (err) => {
  console.error('Error en el pool de conexiones:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect();  
  } else {
    throw err;  
  }
});

module.exports = pool;