const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getEnlaces = async (req, res) => {
    const sql = "SELECT * FROM enlaces";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createEnlace = async (req, res) => {
    const { nombre, url } = req.body; 
    const sql = "INSERT INTO enlaces (nombre, url) VALUES (?, ?)";
    db.query(sql, [nombre, url], (err, result) => {
        if (err) {
            console.error('Error al crear enlace:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" }); 
        }
        return res.json({ success: "Enlace agregado correctamente", id: result.insertId });
    });
};

const updateEnlace = async (req, res) => {
    const { id } = req.params; 
    const { nombre, url } = req.body; 

    const sql = "UPDATE enlaces SET nombre = ?, url = ? WHERE id = ?";
    db.query(sql, [nombre, url, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar enlace:', err);
            return res.status(500).json({ message: "Error al actualizar enlace" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Enlace no encontrado" });
        }
        return res.json({ success: "Enlace actualizado correctamente", id, nombre, url });
    });
};

const deleteEnlace = async (req, res) => {
    const id = req.params.id; 
    const sql = "DELETE FROM enlaces WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar enlace:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Enlace no encontrado" });
        }
        return res.json({ success: "Enlace eliminado correctamente" });
    });
};

module.exports = {getEnlaces,createEnlace,updateEnlace,deleteEnlace};
