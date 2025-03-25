const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getActuExpe = (req, res) => {
    const sql = `
        SELECT ea.*, d.nomdoc
        FROM expediente_actualizaciones ea
        JOIN doctor d ON ea.coddoc = d.coddoc;
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

const deleteActuExpe = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM expediente_actualizaciones WHERE id = ?';

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

module.exports={getActuExpe,deleteActuExpe}