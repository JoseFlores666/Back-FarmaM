const express = require('express');
const router = express.Router();
const db = require('../../config/db');


const getNotiById = (req, res) => {
    const { codpaci } = req.params; 
    const sql = `SELECT * FROM notificaciones WHERE codpaci = ? ORDER BY fecha DESC`;

    db.query(sql, [codpaci], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result || []);
    });
};

module.exports = { getNotiById }