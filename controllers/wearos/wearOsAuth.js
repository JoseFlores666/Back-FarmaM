const express = require('express');
const router = express.Router();
const db = require('../../config/db');


const generarTokenWear = (req, res) => {
  const { codpaci } = req.body;
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Buscar token activo sin dispositivo para el paciente
  const sqlBuscar = `SELECT * FROM wear_vinculos WHERE codpaci = ? AND activo = 1 AND dispositivo_id IS NULL`;

  db.query(sqlBuscar, [codpaci], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al buscar token existente" });

    if (result.length > 0) {
      // Actualizar token existente pendiente
      const sqlUpdate = `UPDATE wear_vinculos SET token_vinculo = ?, fecha_vinculo = NOW() WHERE codpaci = ? AND dispositivo_id IS NULL AND activo = 1`;
      db.query(sqlUpdate, [token, codpaci], (err2) => {
        if (err2) return res.status(500).json({ message: "Error actualizando token" });
        res.json({ token });
      });
    } else {
      // Insertar nuevo token
      const sqlInsert = `INSERT INTO wear_vinculos (codpaci, token_vinculo, fecha_vinculo, activo) VALUES (?, ?, NOW(), 1)`;
      db.query(sqlInsert, [codpaci, token], (err3) => {
        if (err3) return res.status(500).json({ message: "Error generando el token" });
        res.json({ token });
      });
    }
  });
};

const vincularWear = (req, res) => {
  const { token, dispositivo_id } = req.body;

  const sql = `SELECT * FROM wear_vinculos WHERE token_vinculo = ? AND activo = 1 AND dispositivo_id IS NULL`;

  db.query(sql, [token], (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (result.length === 0) return res.status(404).json({ message: "Token inválido o ya utilizado" });

    const codpaci = result[0].codpaci;

    const updateSql = `UPDATE wear_vinculos SET dispositivo_id = ?, activo = 1 WHERE token_vinculo = ?`;
    db.query(updateSql, [dispositivo_id, token], (err2) => {
      if (err2) return res.status(500).json({ message: "Error al vincular dispositivo" });
      res.json({ message: "Dispositivo vinculado exitosamente", codpaci });
    });
  });
};

const desvincularWear = (req, res) => {
  const { dispositivo_id } = req.body;

  const sql = `UPDATE wear_vinculos SET activo = 0 WHERE dispositivo_id = ?`;

  db.query(sql, [dispositivo_id], (err) => {
    if (err) return res.status(500).json({ message: "Error al desvincular dispositivo" });
    res.json({ message: "Dispositivo desvinculado correctamente" });
  });
};


module.exports = { vincularWear, generarTokenWear, desvincularWear }