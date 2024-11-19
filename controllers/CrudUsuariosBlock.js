const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los usuarios
const getUsuariosAll = async (req, res) => {
    const sql = "SELECT * FROM usuarios";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor al obtener usuarios", details: err.message });
        }
        return res.json(result);
    });
};

// Bloquear usuario (intentos = 5)
const bloquearUsuario = (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE usuarios SET intentos = 5 WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al bloquear usuario", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        return res.json({ message: "Usuario bloqueado exitosamente" });
    });
};

// Desbloquear usuario (intentos = 0)
const desbloquearUsuario = (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE usuarios SET intentos = 0 WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al desbloquear usuario", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        return res.json({ message: "Usuario desbloqueado exitosamente" });
    });
};

module.exports = {getUsuariosAll, bloquearUsuario, desbloquearUsuario};
