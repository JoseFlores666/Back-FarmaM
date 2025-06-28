const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getRecetas = (req, res) => {
    const sql = `
    SELECT 
  r.*,
  CONCAT_WS(' ', p.nombre, p.apellidoPaterno, p.apellidoMaterno) AS paciente,
  CONCAT_WS(' ', d.nomdoc, d.apepaternodoc, d.apematernodoc) AS doctor
FROM recetas_medicas r
LEFT JOIN usuarios p ON r.codpaci = p.id
LEFT JOIN doctor d ON r.coddoc = d.coddoc;

    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!Array.isArray(result) || result.length === 0) {
            return res.json([]);
        }
        return res.json(result);
    });
};

const getRecetasByPacienteId = (req, res) => {
  console.log("una consulta")
    const { id } = req.params; 

    const sql = `
      SELECT 
        r.*,
        CONCAT_WS(' ', p.nombre, p.apellidoPaterno, p.apellidoMaterno) AS paciente,
        CONCAT_WS(' ', d.nomdoc, d.apepaternodoc, d.apematernodoc) AS doctor
      FROM recetas_medicas r
      INNER JOIN usuarios p ON r.codpaci = p.id
      INNER JOIN doctor d ON r.coddoc = d.coddoc
      WHERE r.codpaci = ?
    `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!Array.isArray(result) || result.length === 0) {
            return res.status(404).json({ message: "No se encontraron recetas para este paciente" });
        }
        return res.json(result);
    });
};

const createRecetas = async (req, res) => {
  const {
    historial_id,
    coddoc,
    codpaci,
    medicamento,
    fecha_inicio,
    fecha_fin,
    dosis,
    instrucciones,
    estado
  } = req.body;

  if (!coddoc || !codpaci || !medicamento || !fecha_inicio || !fecha_fin || !dosis || !instrucciones) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const sql = `
      INSERT INTO recetas_medicas 
        (historial_id, coddoc, codpaci, medicamento, dosis, instrucciones, fecha_inicio, fecha_fin, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      historial_id,
      coddoc,
      codpaci,
      medicamento,
      dosis,
      instrucciones,
      fecha_inicio,
      fecha_fin,
      estado
    ];

    await db.query(sql, values);

    res.status(201).json({ message: "Receta creada correctamente" });

  } catch (error) {
    console.error("Error al crear receta:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};


const updateRecetas = (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE Recetas_medicas SET ? WHERE id = ?';

    db.query(sql, [updates, id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Recetas no encontrado" });
        }
        return res.json({ message: "Recetas actualizado" });
    });
};

const deleteRecetas = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM recetas_medicas WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Recetas no encontrado" });
        }
        return res.json({ message: "Recetas eliminado" });
    });
};


module.exports = { getRecetas, createRecetas, updateRecetas, deleteRecetas, getRecetasByPacienteId }