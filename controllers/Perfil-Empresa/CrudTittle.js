const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const {createAudit} = require('./CrudAuditoria')
const jwt = require('jsonwebtoken');

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

    const sqlSelect = "SELECT title FROM settings WHERE id = ?";
    db.query(sqlSelect, [id], (err, results) => {
        if (err) {
            console.error('Error al consultar el título existente:', err);
            return res.status(500).json({ message: "Error en el servidor." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "No se encontró el registro para actualizar." });
        }

        const oldTitle = results[0].title; 
        if (oldTitle === title) {
            return res.status(400).json({ message: "El título ingresado es igual al existente." });
        }

        const sqlUpdate = "UPDATE settings SET title = ? WHERE id = ?";
        db.query(sqlUpdate, [title, id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error en el servidor al actualizar el título." });
            }

            if (result.affectedRows > 0) {
                createAudit(req, 'Actualizacion', 'settings', oldTitle, title);
            }

            return res.status(200).json({ success: true, message: "Título actualizado correctamente.", id, title });
        });
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
