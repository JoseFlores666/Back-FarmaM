const express = require('express');
const router = express.Router();
const db = require('../config/db');

const getTerminos = async (req, res) => {
    const sql = "SELECT * FROM terminos";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createTerminos = async (req, res) => {
    const { termino } = req.body; 
    const sql = "INSERT INTO terminos (termino) VALUES (?)";
    db.query(sql, [termino], (err, result) => {
        if (err) {
            console.error('Error al crear término:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" }); 
        }
        return res.json({ success: "Término agregado correctamente", id: result.insertId });
    });
};
const updateTerminos = async (req, res) => {
    const { id } = req.params; 
    const { termino } = req.body; 

    const sql = "UPDATE terminos SET termino = ? WHERE id = ?";
    db.query(sql, [termino, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar término:', err);
            return res.status(500).json({ message: "Error al actualizar término" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Término no encontrado" });
        }
        return res.json({ success: "Término actualizado correctamente", id, termino });
    });
};


const deleteTerminos = async (req, res) => {
    const id = req.params.id; 
    const sql = "DELETE FROM terminos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar término:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Término no encontrado" });
        }
        return res.json({ success: "Término eliminado correctamente" });
    });
};


module.exports = { updateTerminos, deleteTerminos, createTerminos, getTerminos };
