const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const getRecetaAll = (req, res) => {
  const sql = `
    SELECT 
      r.*,
      CONCAT_WS(' ', p.nombre, p.apellidoPaterno, p.apellidoMaterno) AS paciente,
      CONCAT_WS(' ', d.nomdoc, d.apepaternodoc, d.apematernodoc) AS doctor
    FROM recetas_medicas r
    INNER JOIN usuarios p ON r.codpaci = p.id
    INNER JOIN doctor d ON r.coddoc = d.coddoc
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor", error: err });
    }
    if (!Array.isArray(result) || result.length === 0) {
      return res.json([]);
    }
    return res.json(result);
  });
};



const getRecetasPorPaciente = (req, res) => {
    const { codpaci } = req.params;
    const sql = `SELECT * FROM recetas_medicas WHERE codpaci = ?`;
    db.query(sql, [codpaci], (err, result) => {
        if (err) return res.status(500).json({ message: "Error en el servidor" });
        res.json(result);
    });
};

const crearReceta = (req, res) => {
    const {
        historial_id, coddoc, codpaci, fecha_inicio, fecha_fin,
        medicamento, dosis, instrucciones, estado
    } = req.body;

    const sql = `
        INSERT INTO recetas_medicas 
        (historial_id, coddoc, codpaci, fecha_inicio, fecha_fin, medicamento, dosis, instrucciones, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [historial_id, coddoc, codpaci, fecha_inicio, fecha_fin, medicamento, dosis, instrucciones, estado],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error al crear la receta" });
            res.status(201).json({ message: "Receta creada exitosamente" });
        }
    );
};

const actualizarReceta = (req, res) => {
    const { id } = req.params;
    const {
        historial_id, coddoc, codpaci, fecha_inicio, fecha_fin,
        medicamento, dosis, instrucciones, estado
    } = req.body;

    const sql = `
        UPDATE recetas_medicas SET 
        historial_id = ?, coddoc = ?, codpaci = ?, fecha_inicio = ?, fecha_fin = ?, 
        medicamento = ?, dosis = ?, instrucciones = ?, estado = ?
        WHERE id = ?
    `;

    db.query(sql, [historial_id, coddoc, codpaci, fecha_inicio, fecha_fin, medicamento, dosis, instrucciones, estado, id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error al actualizar la receta" });
            res.json({ message: "Receta actualizada correctamente" });
        }
    );
};

const eliminarReceta = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM recetas_medicas WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error al eliminar la receta" });
        res.json({ message: "Receta eliminada correctamente" });
    });
};


module.exports={getRecetasPorPaciente,crearReceta,getRecetaAll,eliminarReceta,actualizarReceta}