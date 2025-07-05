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
    LEFT JOIN doctor d ON r.coddoc = d.coddoc
    ORDER BY r.fecha_inicio DESC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });

    const grouped = {};
    result.forEach(r => {
      const key = `${r.codpaci}-${r.coddoc}-${r.fecha_inicio}-${r.fecha_fin}`;
      if (!grouped[key]) {
        grouped[key] = {
          id: r.id,
          codpaci: r.codpaci,
          coddoc: r.coddoc,
          fecha_inicio: r.fecha_inicio,
          fecha_fin: r.fecha_fin,
          estado: r.estado,
          paciente: r.paciente,
          doctor: r.doctor
        };
      }
    });

    return res.json(Object.values(grouped));
  });
};

const getMedicamentosByReceta = (req, res) => {
  const { recetaId } = req.params;

  const sql = `
    SELECT id, medicamento, dosis, instrucciones
    FROM recetas_medicas
    WHERE historial_id = (
      SELECT historial_id
      FROM recetas_medicas
      WHERE id = ?
      LIMIT 1
    )
  `;

  db.query(sql, [recetaId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result);
  });
};


const getRecetasByPacienteId = (req, res) => {
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
    if (err) return res.status(500).json({ message: "Error en el servidor" });
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
    fecha_inicio,
    fecha_fin,
    estado,
    medicamentos
  } = req.body;

  if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
    return res.status(400).json({ message: "Debe enviar al menos un medicamento" });
  }

  const sql = `
    INSERT INTO recetas_medicas 
      (historial_id, coddoc, codpaci, medicamento, dosis, instrucciones, fecha_inicio, fecha_fin, estado) 
    VALUES ?
  `;

  const values = medicamentos.map((med) => [
    historial_id,
    coddoc,
    codpaci,
    med.medicamento,
    med.dosis,
    med.instrucciones,
    fecha_inicio,
    fecha_fin,
    estado
  ]);

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error al crear recetas:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.status(201).json({ message: "Recetas creadas correctamente" });
  });
};


const updateRecetas = (req, res) => {
  const { id } = req.params;
  const { recetas } = req.body;

  if (!Array.isArray(recetas) || recetas.length === 0) {
    return res.status(400).json({ message: "Debe enviar al menos una receta" });
  }

  const historialIdQuery = `SELECT historial_id FROM recetas_medicas WHERE id = ? LIMIT 1`;

  db.query(historialIdQuery, [id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json({ message: "Receta no encontrada" });
    }

    const historial_id = result[0].historial_id;

    const deleteQuery = `DELETE FROM recetas_medicas WHERE historial_id = ?`;

    db.query(deleteQuery, [historial_id], (err) => {
      if (err) {
        console.error("Error al eliminar recetas:", err);
        return res.status(500).json({ message: "Error al eliminar recetas existentes" });
      }

      const insertQuery = `
        INSERT INTO recetas_medicas 
        (historial_id, coddoc, codpaci, medicamento, dosis, instrucciones, fecha_inicio, fecha_fin, estado)
        VALUES ?
      `;

      const values = recetas.map(r => [
        historial_id,
        r.coddoc,
        r.codpaci,
        r.medicamento,
        r.dosis,
        r.instrucciones,
        r.fecha_inicio,
        r.fecha_fin,
        r.estado
      ]);

      db.query(insertQuery, [values], (err) => {
        if (err) {
          console.error("Error al insertar nuevas recetas:", err);
          return res.status(500).json({ message: "Error al insertar nuevas recetas" });
        }

        return res.status(200).json({ message: "Recetas actualizadas correctamente" });
      });
    });
  });
};


const deleteRecetas = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM recetas_medicas WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Receta no encontrada" });
    }
    return res.json({ message: "Receta eliminada correctamente" });
  });
};

module.exports = {getRecetas,getRecetasByPacienteId,createRecetas,updateRecetas,deleteRecetas,getMedicamentosByReceta};
