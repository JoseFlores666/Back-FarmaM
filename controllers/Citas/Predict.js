const express = require('express');
const router = express.Router();
const db = require('../../config/db'); // tu conexión MySQL/MariaDB sin mysql2/promise
const axios = require('axios');

// Consulta SQL
const sql = `
SELECT 
  u.id AS paciente_id,
  u.nombre,
  u.apellidoPaterno,
  u.apellidoMaterno,
  u.edad AS edad_paciente,
  u.genero AS genero_paciente,
  u.telefono,
  u.correo,
  d.coddoc,
  d.nomdoc,
  d.genero AS genero_doctor,
  d.edad AS edad_doctor,
  e.titulo AS especialidad,
  c.fecha,
  c.hora,
  c.estado,
  c.atendido,
  DAYOFWEEK(c.fecha) AS dia_semana,
  MONTH(c.fecha) AS mes_cita,
  IF(TIME(c.hora) < '12:00:00', 'mañana', 'tarde') AS turno_cita,
  (SELECT COUNT(*) FROM citas c2 WHERE c2.codpaci = u.id AND c2.fecha < c.fecha) AS citas_previas,
  (SELECT COUNT(*) FROM citas c3 WHERE c3.codpaci = u.id AND c3.atendido = 0 AND c3.fecha < c.fecha) AS faltas_previas,
  TIMESTAMPDIFF(MONTH, u.created_at, c.fecha) AS antiguedad_paciente_meses,
  (SELECT COUNT(*) FROM doctor_servicios ds WHERE ds.doctor_id = d.coddoc) AS cantidad_servicios_doctor
FROM citas c
JOIN usuarios u ON c.codpaci = u.id
JOIN doctor d ON c.coddoc = d.coddoc
JOIN especialidad e ON d.codespe = e.codespe
`;

const consultaCsv = (req, res) => {
  // Ejecutar consulta SQL con callback
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error en la consulta SQL:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json([]);
    }

    // Enviar datos a microservicio Flask para predicción
    axios.post('http://127.0.0.1:5001/predecir', rows)
      .then(flaskRes => {
        const { predicciones, probabilidades } = flaskRes.data;

        const datosConResultados = rows.map((fila, i) => ({
          ...fila,
          prediccion: predicciones[i],
          probabilidad_asistir: probabilidades[i],
        }));

        return res.json(datosConResultados);
      })
      .catch(err => {
        console.error("Error al llamar a Flask:", err);
        return res.status(500).json({ message: "Error en el servidor Flask" });
      });
  });
};

module.exports = { consultaCsv };
