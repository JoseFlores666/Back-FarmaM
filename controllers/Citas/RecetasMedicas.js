const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getRecetas = (req, res) => {
  const recetasQuery = `
    SELECT 
      r.id,
      r.codpaci,
      r.coddoc,
      r.fecha_inicio,
      r.fecha_fin,
      r.estado,
      CONCAT_WS(' ', p.nombre, p.apellidoPaterno, p.apellidoMaterno) AS paciente,
      CONCAT_WS(' ', d.nomdoc, d.apepaternodoc, d.apematernodoc) AS doctor
    FROM recetas r
    LEFT JOIN usuarios p ON r.codpaci = p.id
    LEFT JOIN doctor d ON r.coddoc = d.coddoc
    ORDER BY r.fecha_inicio DESC;
  `;

  db.query(recetasQuery, (err, recetas) => {
    if (err) {
      console.error("❌ Error en recetas:", err);
      return res.status(500).json({ message: "Error al obtener recetas" });
    }

    if (recetas.length === 0) return res.json([]);

    const recetaIds = recetas.map(r => r.id);

    const medsQuery = `
      SELECT 
        id,
        receta_id,
        medicamento,
        dosis,
        instrucciones
      FROM receta_medicamentos
      WHERE receta_id IN (?)
    `;

    db.query(medsQuery, [recetaIds], (err2, meds) => {
      if (err2) {
        console.error("❌ Error en medicamentos:", err2);
        return res.status(500).json({ message: "Error al obtener medicamentos" });
      }

      const medsByReceta = {};

      meds.forEach(m => {
        if (!medsByReceta[m.receta_id]) {
          medsByReceta[m.receta_id] = [];
        }

        medsByReceta[m.receta_id].push({
          id: m.id,
          medicamento: m.medicamento,
          dosis: m.dosis,
          instrucciones: m.instrucciones
        });
      });

      const result = recetas.map(r => ({
        ...r,
        medicamentos: medsByReceta[r.id] || []
      }));

      return res.json(result);
    });
  });
};

const getRecetaById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      r.*,
      m.id AS med_id,
      m.medicamento,
      m.dosis,
      m.instrucciones
    FROM recetas r
    LEFT JOIN receta_medicamentos m ON r.id = m.receta_id
    WHERE r.id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json(err);

    if (rows.length === 0)
      return res.status(404).json({ message: "Receta no encontrada" });

    const receta = {
      id: rows[0].id,
      coddoc: rows[0].coddoc,
      codpaci: rows[0].codpaci,
      fecha_inicio: rows[0].fecha_inicio,
      fecha_fin: rows[0].fecha_fin,
      estado: rows[0].estado,
      medicamentos: rows.map(m => ({
        id: m.med_id,
        medicamento: m.medicamento,
        dosis: m.dosis,
        instrucciones: m.instrucciones
      }))
    };

    res.json(receta);
  });
};

const getMisRecetas = (req, res) => {
  const { id } = req.params;
const idUsuario = Number(id); 

  const recetasQuery = `
    SELECT 
      r.id,
      r.codpaci,
      r.coddoc,
      r.fecha_inicio,
      r.fecha_fin,
      r.estado,
      CONCAT_WS(' ', p.nombre, p.apellidoPaterno, p.apellidoMaterno) AS paciente,
      CONCAT_WS(' ', d.nomdoc, d.apepaternodoc, d.apematernodoc) AS doctor
    FROM recetas r
    LEFT JOIN usuarios p ON r.codpaci = p.id
    LEFT JOIN doctor d ON r.coddoc = d.coddoc
    WHERE r.codpaci = ?
    ORDER BY r.fecha_inicio DESC;
  `;

  db.query(recetasQuery, [idUsuario], (err, recetas) => {
    if (err) return res.status(500).json({ message: "Error al obtener recetas" });

    if (recetas.length === 0) return res.json([]);

    const recetaIds = recetas.map(r => r.id);

    const medsQuery = `
      SELECT 
        id,
        receta_id,
        medicamento,
        dosis,
        instrucciones
      FROM receta_medicamentos
      WHERE receta_id IN (?)
    `;

    db.query(medsQuery, [recetaIds], (err2, meds) => {
      if (err2) return res.status(500).json({ message: "Error al obtener medicamentos" });

      const medsByReceta = {};
      meds.forEach(m => {
        if (!medsByReceta[m.receta_id]) medsByReceta[m.receta_id] = [];
        medsByReceta[m.receta_id].push({
          id: m.id,
          medicamento: m.medicamento,
          dosis: m.dosis,
          instrucciones: m.instrucciones
        });
      });

      const result = recetas.map(r => ({
        ...r,
        medicamentos: medsByReceta[r.id] || []
      }));

      res.json(result);
    });
  });
};


const createRecetas = (req, res) => {
  const { coddoc, codpaci, fecha_inicio, fecha_fin, estado, medicamentos } = req.body;

  if (!Array.isArray(medicamentos) || medicamentos.length === 0)
    return res.status(400).json({ message: "Debe enviar al menos un medicamento" });

  const sqlReceta = `
    INSERT INTO recetas (coddoc, codpaci, fecha_inicio, fecha_fin, estado)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sqlReceta, [coddoc, codpaci, fecha_inicio, fecha_fin, estado], (err, result) => {
    if (err) return res.status(500).json(err);

    const recetaId = result.insertId;

    const insertMeds = `
      INSERT INTO receta_medicamentos (receta_id, medicamento, dosis, instrucciones)
      VALUES ?
    `;

    const values = medicamentos.map(m => [
      recetaId,
      m.medicamento,
      m.dosis,
      m.instrucciones
    ]);

    db.query(insertMeds, [values], (err2) => {
      if (err2) return res.status(500).json(err2);

      res.status(201).json({ message: "Receta creada correctamente", recetaId });
    });
  });
};

const updateRecetas = (req, res) => {
  const { id } = req.params;
  const { coddoc, codpaci, fecha_inicio, fecha_fin, estado, medicamentos } = req.body;

  if (!Array.isArray(medicamentos) || medicamentos.length === 0)
    return res.status(400).json({ message: "Debe enviar al menos un medicamento" });

  const findSql = "SELECT * FROM recetas WHERE id = ?";

  db.query(findSql, [id], (err, rows) => {
    if (err) return res.status(500).json(err);

    if (rows.length === 0)
      return res.status(404).json({ message: "Receta no encontrada" });

    const updateSql = `
      UPDATE recetas 
      SET coddoc = ?, codpaci = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
      WHERE id = ?
    `;

    db.query(updateSql, [coddoc, codpaci, fecha_inicio, fecha_fin, estado, id], (err2) => {
      if (err2) return res.status(500).json(err2);

      db.query("DELETE FROM receta_medicamentos WHERE receta_id = ?", [id], (err3) => {
        if (err3) return res.status(500).json(err3);

        const insertSql = `
          INSERT INTO receta_medicamentos (receta_id, medicamento, dosis, instrucciones)
          VALUES ?
        `;

        const values = medicamentos.map(m => [
          id,
          m.medicamento,
          m.dosis,
          m.instrucciones
        ]);

        db.query(insertSql, [values], (err4) => {
          if (err4) return res.status(500).json(err4);

          res.json({ message: "Receta actualizada correctamente" });
        });
      });
    });
  });
};


const deleteRecetas = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM recetas WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Receta no encontrada" });

    res.json({ message: "Receta eliminada correctamente" });
  });
};

module.exports = {
  getRecetas,
  getRecetaById,
  createRecetas,
  updateRecetas,
  deleteRecetas,
  getMisRecetas
};
