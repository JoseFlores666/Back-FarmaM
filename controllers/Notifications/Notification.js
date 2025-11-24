const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// 🔹 Obtener notificaciones por usuario
const getNotiById = (req, res) => {
    const { codpaci } = req.params; 
    console.log(codpaci)

    const sql = `SELECT * FROM notificaciones WHERE codpaci = ? ORDER BY fecha DESC`;

    db.query(sql, [codpaci], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result || []);
    });
};

// 🔹 Marcar una notificación como leída por su ID
const marcarNotiLeida = (req, res) => {
    const { id } = req.params; 
    console.log(id)
    const sql = `UPDATE notificaciones SET leida = 1 WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al actualizar notificación" });
        }
        return res.json({ message: "Notificación marcada como leída", result });
    });
};

// 🔹 Marcar todas las notificaciones de un usuario como leídas
const marcarTodasNotiLeidas = (req, res) => {
    const { codpaci } = req.params; 
    console.log(codpaci)

    const sql = `UPDATE notificaciones SET leida = 1 WHERE codpaci = ?`;

    db.query(sql, [codpaci], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al actualizar notificaciones" });
        }
        return res.json({ message: "Todas las notificaciones marcadas como leídas", result });
    });
};

// 🔹 Eliminar una notificación por ID
const eliminarNoti = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM notificaciones WHERE id = ?`;
    console.log(id)

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al eliminar notificación" });
        }
        return res.json({ message: "Notificación eliminada", result });
    }); 
};

// 🔹 Eliminar todas las notificaciones de un usuario
const eliminarTodasNoti = (req, res) => {
    const { codpaci } = req.params;
    const sql = `DELETE FROM notificaciones WHERE codpaci = ?`;

    db.query(sql, [codpaci], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al eliminar notificaciones" });
        }
        return res.json({ message: "Todas las notificaciones eliminadas", result });
    });
};

module.exports = { getNotiById, marcarNotiLeida, marcarTodasNotiLeidas,eliminarNoti,eliminarTodasNoti};
