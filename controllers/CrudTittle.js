const express = require('express');
const router = express.Router();
const db = require('../config/db');

const getTitle = async (req, res) => {
    const sql = "SELECT title FROM settings"; 
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createTitle = async (req, res) => {
    const { title } = req.body; 

    if (title.length < 1 || title.length > 255) {
        return res.status(400).json({ message: "El título debe tener entre 1 y 255 caracteres." });
    }

    const sql = "INSERT INTO settings (title) VALUES (?) ON DUPLICATE KEY UPDATE title = ?";
    db.query(sql, [title, title], (err, result) => {
        if (err) {
            console.error('Error al crear o actualizar el título:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" });
        }
        return res.json({ success: "Título agregado/actualizado correctamente", id: result.insertId });
    });
};

const updateTitle = async (req, res) => {
    const { id } = req.params; 
    const { title } = req.body;

    if (title.length < 1 || title.length > 255) {
        return res.status(400).json({ message: "El título debe tener entre 1 y 255 caracteres." });
    }

    const sql = "UPDATE settings SET title = ? WHERE id = ?";
    db.query(sql, [title, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar el título:', err);
            return res.status(500).json({ message: "Error al actualizar el título" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Título no encontrado" });
        }
        return res.json({ success: "Título actualizado correctamente", id, title });
    });
};

const deleteTitle = async (req, res) => {
    const id = req.params.id; 
    const sql = "DELETE FROM settings WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar el título:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Título no encontrado" });
        }
        return res.json({ success: "Título eliminado correctamente" });
    });
};

module.exports = { getTitle, createTitle, updateTitle, deleteTitle };
