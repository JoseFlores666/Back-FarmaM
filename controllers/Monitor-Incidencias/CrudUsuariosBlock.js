const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getUsuariosAll = (req, res) => {
    const sql = `
        SELECT u.id, u.nombre, u.correo,
        u.apellidoPaterno,
        CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno) AS nombreUsuario,
        u.apellidoMaterno, s.intentos
        FROM usuarios u
        LEFT JOIN seguridad s ON u.id = s.user_id
    `;
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error al obtener los usuarios" });
        }
        return res.json(result);
    });
};

const bloquearUsuario = (req, res) => {
    const { id } = req.params;

    const sql = `
        UPDATE seguridad
        SET intentos = 5  -- Bloqueado
        WHERE user_id = ?
    `;
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al bloquear usuario:', err);
            return res.status(500).json({ message: "Error al bloquear el usuario" });
        }

        return res.json({ message: "Usuario bloqueado exitosamente" });
    });
};
const desbloquearUsuario = (req, res) => {
    const { id } = req.params;

    const sql = `
        UPDATE seguridad
        SET intentos = 0  -- Desbloqueado
        WHERE user_id = ?
    `;
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al desbloquear usuario:', err);
            return res.status(500).json({ message: "Error al desbloquear el usuario" });
        }

        return res.json({ message: "Usuario desbloqueado exitosamente" });
    });
};

module.exports = {getUsuariosAll, bloquearUsuario, desbloquearUsuario};
