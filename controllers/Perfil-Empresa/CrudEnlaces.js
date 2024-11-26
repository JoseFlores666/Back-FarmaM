const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria'); 
const jwt = require('jsonwebtoken');

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

        createAudit(req, 'Insertar', 'enlaces', 'N/A', `nombre: ${nombre}, url: ${url}`);

        return res.json({ success: "Enlace agregado correctamente", id: result.insertId });
    });
};

const updateEnlace = async (req, res) => {
    const { id } = req.params;
    const { nombre, url } = req.body;

    const selectSql = "SELECT * FROM enlaces WHERE id = ?";
    db.query(selectSql, [id], (err, result) => {
        if (err) {
            console.error('Error al consultar enlace:', err);
            return res.status(500).json({ message: "Error al consultar enlace" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Enlace no encontrado" });
        }

        const oldData = result[0];

        const updateSql = "UPDATE enlaces SET nombre = ?, url = ? WHERE id = ?";
        db.query(updateSql, [nombre, url, id], (err, updateResult) => {
            if (err) {
                console.error('Error al actualizar enlace:', err);
                return res.status(500).json({ message: "Error al actualizar enlace" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ message: "Enlace no encontrado" });
            }

            const newData = `nombre: ${nombre}, url: ${url}`;
            createAudit(req, 'Actualizacion', 'enlaces', `${oldData.nombre}, url: ${oldData.url}`, newData);

            return res.json({ success: "Enlace actualizado correctamente", id, nombre, url });
        });
    });
};

const deleteEnlace = async (req, res) => {
    const { id } = req.params;

    const selectSql = "SELECT * FROM enlaces WHERE id = ?";
    db.query(selectSql, [id], (err, result) => {
        if (err) {
            console.error('Error al consultar enlace:', err);
            return res.status(500).json({ message: "Error al consultar enlace" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Enlace no encontrado" });
        }

        const oldData = result[0];

        const deleteSql = "DELETE FROM enlaces WHERE id = ?";
        db.query(deleteSql, [id], (err, deleteResult) => {
            if (err) {
                console.error('Error al eliminar enlace:', err);
                return res.status(500).json({ message: "Error al eliminar enlace" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ message: "Enlace no encontrado" });
            }

            createAudit(req, 'Eliminar', 'enlaces', `${oldData.nombre}, url: ${oldData.url}`, 'N/A');

            return res.json({ success: "Enlace eliminado correctamente" });
        });
    });
};

module.exports = { getEnlaces, createEnlace, updateEnlace, deleteEnlace };
