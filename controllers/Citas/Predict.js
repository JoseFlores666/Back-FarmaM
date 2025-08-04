const express = require('express');
const router = express.Router();
const db = require('../../config/db'); 
const axios = require('axios');

const sql = `
SELECT
    c.id AS id_cita,
    u.nombre,
    u.apellidoPaterno,
    u.apellidoMaterno,
    u.edad,
    u.genero,
    c.fecha,
    c.hora,
    c.motivo_cita,
    s.nombre AS servicio,
    cs.servicio_id
FROM citas c
JOIN usuarios u ON c.codpaci = u.id
JOIN cita_servicio cs ON cs.cita_id = c.id
JOIN servicios s ON s.id = cs.servicio_id`;

const consultaCsv = (req, res) => {
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error en la BD' });
    if (!Array.isArray(rows) || rows.length === 0) return res.json([]);

    axios.post('http://127.0.0.1:5001/predecir', rows)
      .then(flaskRes => {
        const { predicciones, probabilidades } = flaskRes.data;

        const datosConResultados = rows.map((fila, i) => ({
          ...fila,
          prediccion: predicciones[i],
          probabilidad_asistir: probabilidades[i],
        }));

        res.json(datosConResultados);
      })
      .catch(err => {
        console.error('Error con Flask:', err.message);
        res.status(500).json({ message: 'Error en el microservicio Flask' });
      });
  });
};

module.exports = { consultaCsv };
