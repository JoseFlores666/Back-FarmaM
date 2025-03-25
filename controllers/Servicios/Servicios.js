const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('../Perfil-Empresa/CrudAuditoria');

const getServicios = async (req, res) => {
    const sql = "SELECT * FROM servicios";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const crearServicios = (req, res) => {
    const { nombre, descripcion, imagen, id_usuario } = req.body;

    if (!nombre || !descripcion || !imagen) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const sql = "INSERT INTO servicios (nombre, descripcion, imagen) VALUES (?, ?, ?)";
    db.query(sql, [nombre, descripcion, imagen], (err, result) => {
        if (err) {
            console.error('Error al insertar servicio:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        const newData = { id: result.insertId, nombre, descripcion, imagen };
        // Guardar en auditoría, sin old_data ya que estamos creando un nuevo registro
        const oldData = JSON.stringify({ message: "N/A" });
        createAudit(id_usuario, "CREATE", "servicios", oldData, JSON.stringify(newData));

        return res.status(201).json({ message: "Servicio agregado con éxito", id: result.insertId });
    });
};

const updateServicios = (req, res) => {
    const { id } = req.params;  // 'id' para la actualización
    const { nombre, descripcion, imagen, id_usuario } = req.body;

    const sql = "UPDATE servicios SET nombre = ?, descripcion = ?, imagen = ? WHERE id = ?";
    db.query(sql, [nombre, descripcion, imagen, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar servicio:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el servicio para actualizar" });
        }

        const newData = { id, nombre, descripcion, imagen };

        // Obtener los datos antiguos (antes de la actualización)
        const selectQuery = "SELECT * FROM servicios WHERE id = ?";
        db.query(selectQuery, [id], (error, result) => {
            if (error) {
                console.error("Error al consultar servicio:", error);
                return res.status(500).json({ message: "Error al consultar servicio", error });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const oldData = result[0];
            createAudit(id_usuario, "UPDATE", "servicios", JSON.stringify(oldData), JSON.stringify(newData));

            return res.json({ message: "Servicio actualizado con éxito" });
        });
    });
};


const deleteServicios = (req, res) => {
    const { id } = req.params;
    const { id_usuario } = req.body;

    const getOldDataSql = "SELECT * FROM servicios WHERE id = ?";
    db.query(getOldDataSql, [id], (err, rows) => {
        if (err) {
            console.error("Error al obtener los datos anteriores:", err);
            return res.status(500).json({ message: "Error al obtener los datos anteriores" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "servicio no encontrado" });
        }

        const valorEliminado = rows[0];

        const deleteSql = "DELETE FROM servicios WHERE id = ?";
        db.query(deleteSql, [id], (err) => {
            if (err) {
                console.error("Error al eliminar valor:", err);
                return res.status(500).json({ error: "Error al eliminar valor" });
            }

            createAudit(id_usuario, "DELETE", "servicios", JSON.stringify(valorEliminado), JSON.stringify({ message: "N/A" }));

            res.json({ success: true, message: "servicio eliminado correctamente", valorEliminado });
        });
    });
};


module.exports = { getServicios, crearServicios, updateServicios, deleteServicios };
