const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('../Perfil-Empresa/CrudAuditoria');

const getValores = (req, res) => {
    const sql = "SELECT * FROM valores";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createValor = (req, res) => {
    const { nombre, descripcion, imagen, id_usuario } = req.body;

    if (!nombre || !descripcion || !imagen) {
        return res.status(400).json({ message: "Nombre, descripción e imagen son obligatorios" });
    }

    const sql = "INSERT INTO valores (nombre, descripcion, imagen) VALUES (?, ?, ?)";
    db.query(sql, [nombre, descripcion, imagen], (err, result) => {
        if (err) return res.status(500).json({ message: "Error al insertar el valor" });

        const newData = { id: result.insertId, nombre, descripcion, imagen };

        // Guardar en auditoría, sin old_data ya que estamos creando un nuevo registro
        const oldData = JSON.stringify({ message: "N/A" });
        createAudit(id_usuario, "CREATE", "valores", oldData, JSON.stringify(newData));

        return res.status(201).json({ success: true, message: "Valor creado correctamente", id: result.insertId });
    });
};

const updateValores = (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, imagen, id_usuario } = req.body;

    const updateSql = "UPDATE valores SET nombre = ?, descripcion = ?, imagen = ? WHERE id = ?";

    // Obtener los datos antiguos (antes de la actualización)
    const getOldDataSql = "SELECT * FROM valores WHERE id = ?";
    db.query(getOldDataSql, [id], (err, oldRows) => {
        if (err) {
            console.error("Error al obtener los datos anteriores:", err);
            return res.status(500).json({ message: "Error al obtener los datos anteriores" });
        }

        if (oldRows.length === 0) {
            return res.status(404).json({ message: "Valor no encontrado" });
        }

        const oldData = oldRows[0];

        // Ejecutar actualización
        db.query(updateSql, [nombre, descripcion, imagen, id], (err, updateResult) => {
            if (err) {
                console.error("Error al actualizar valor:", err);
                return res.status(500).json({ message: "Error al actualizar valor" });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ message: "Valor no encontrado" });
            }

            const newData = { id, nombre, descripcion, imagen };

            // Guardar en auditoría con old_data y new_data
            createAudit(id_usuario, "UPDATE", "valores", JSON.stringify(oldData), JSON.stringify(newData));

            return res.json({ success: "Valor actualizado correctamente", id, nombre, descripcion, imagen });
        });
    });
};

const deleteValor = (req, res) => {
    const { id } = req.params;
    const { id_usuario } = req.body;

    // Obtener los datos antiguos (antes de la eliminación)
    const getOldDataSql = "SELECT * FROM valores WHERE id = ?";
    db.query(getOldDataSql, [id], (err, rows) => {
        if (err) {
            console.error("Error al obtener los datos anteriores:", err);
            return res.status(500).json({ message: "Error al obtener los datos anteriores" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "Valor no encontrado" });
        }

        const valorEliminado = rows[0];

        // Eliminar el valor
        const deleteSql = "DELETE FROM valores WHERE id = ?";
        db.query(deleteSql, [id], (err, deleteResult) => {
            if (err) {
                console.error("Error al eliminar valor:", err);
                return res.status(500).json({ error: "Error al eliminar valor" });
            }

            // Guardar en auditoría con old_data (valor eliminado) y new_data (vacío o mensaje "N/A")
            createAudit(id_usuario, "DELETE", "valores", JSON.stringify(valorEliminado), JSON.stringify({ message: "N/A" }));

            res.json({ success: true, message: "Valor eliminado correctamente", valorEliminado });
        });
    });
};

module.exports = { getValores, createValor, updateValores, deleteValor };
