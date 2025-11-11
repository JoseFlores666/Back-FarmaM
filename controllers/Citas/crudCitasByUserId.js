const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getCitasByPacienteId = (req, res) => {
    const { codpaci } = req.params;

    if (!codpaci || isNaN(codpaci)) {
        return res.status(400).json({ message: "ID del paciente no válido o faltante" });
    }

    const sql = `
        SELECT 
            c.id,
            c.coddoc,
            c.codpaci,
            c.fecha,
            c.hora,
            c.estado,
            c.motivo_cita,
            p.nombre AS paciente,
            p.apellidoPaterno,
            p.apellidoMaterno,
            d.nomdoc AS doctor,
            d.apepaternoDoc,
            d.apematernoDoc,
            e.titulo AS especialidad,
            h.dia AS dia_horario,
            h.hora_inicio,
            h.hora_fin
        FROM citas c
        LEFT JOIN usuarios p ON c.codpaci = p.id
        LEFT JOIN doctor d ON c.coddoc = d.coddoc
        LEFT JOIN especialidad e ON d.codespe = e.codespe
        LEFT JOIN horario h ON c.codhor = h.codhor
        WHERE c.codpaci = ?;
    `;

    db.query(sql, [codpaci], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (!Array.isArray(result) || result.length === 0) {
            return res.status(404).json({ message: "No se encontraron citas para este paciente" });
        }

        return res.json(result);
    });
};
const getListaEsperaByCitaId = (req, res) => {
  const { codcita } = req.params;
  console.log("Parámetros recibidos:", req.params);

  if (!codcita || isNaN(codcita)) {
    return res.status(400).json({ message: "ID de cita no válido o faltante" });
  }

  const sql = `
    SELECT 
      le.id,
      le.codcita,
      le.codpaci,
      le.motivo_consulta,
      le.estado,
      le.fecha_registro,
      p.nombre AS paciente,
      p.apellidoPaterno,
      p.apellidoMaterno,
      c.fecha AS fecha_cita,
      c.hora AS hora_cita,
      d.nomdoc AS doctor,
      e.titulo AS especialidad
    FROM lista_espera le
    LEFT JOIN usuarios p ON le.codpaci = p.id
    LEFT JOIN citas c ON le.codcita = c.id
    LEFT JOIN doctor d ON c.coddoc = d.coddoc
    LEFT JOIN especialidad e ON d.codespe = e.codespe
    WHERE le.codcita = ?
    ORDER BY le.fecha_registro DESC;
  `;

  db.query(sql, [codcita], (err, result) => {
    if (err) {
      console.error("❌ Error en la consulta de lista_espera:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ message: "No hay registros en la lista de espera para esta cita" });
    }

    return res.json(result);
  });
};



module.exports = { getCitasByPacienteId, getListaEsperaByCitaId };
