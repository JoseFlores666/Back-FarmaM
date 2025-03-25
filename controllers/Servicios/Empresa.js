const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');

const getEmpresa = (req, res) => {
    const sql = "SELECT * FROM empresa";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!Array.isArray(result) || result.length === 0) {
            console.log("No se encontraron servicios en la base de datos.");
            return res.json([]);
        }
        return res.json(result);
    });
};
const updateEmpresa = (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { id_usuario } = req.body;  // Suponiendo que el id del usuario viene en el cuerpo de la solicitud

    const sqlSelect = 'SELECT * FROM empresa WHERE id = ?';
    db.query(sqlSelect, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error al obtener los datos actuales de la empresa" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Empresa no encontrada" });
        }

        const currentData = results[0];
        const updatedData = {};

        // Filtrar las actualizaciones que realmente han cambiado
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (updates[key] !== currentData[key]) {
                    updatedData[key] = updates[key];
                }
            }
        }

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: "No hay cambios para actualizar" });
        }

        const sqlUpdate = 'UPDATE empresa SET ? WHERE id = ?';
        db.query(sqlUpdate, [updatedData, id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error al actualizar los datos de la empresa" });
            }

            // Crear auditoría para el cambio
            createAudit(id_usuario, "UPDATE", "empresa", JSON.stringify(currentData), JSON.stringify(updatedData));

            return res.json({ success: true, message: "Datos actualizados correctamente" });
        });
    });
};

module.exports = { getEmpresa, updateEmpresa }