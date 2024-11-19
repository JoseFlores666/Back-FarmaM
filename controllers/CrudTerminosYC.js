const express = require('express');
const router = express.Router();
const db = require('../config/db');

const isFechaValida = (fecha) => {
    const fechaActual = new Date();
    const fechaDate = new Date(fecha);
    
    if (isNaN(fechaDate.getTime())) {
        return false; 
    }
    
    if (fechaDate < fechaActual) {
        return false; 
    }
    
    return true;
};

const getTerminosCondiciones = async (req, res) => {
    const sql = "SELECT * FROM terminos_condiciones";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor al obtener términos y condiciones", details: err.message });
        }
        return res.json(result);
    });
};

const createTerminosCondiciones = async (req, res) => {
    const { titulo, contenido, fecha_vigencia } = req.body;

    if (!isFechaValida(fecha_vigencia)) {
        return res.status(400).json({ message: "La fecha de vigencia no es válida o está en el pasado" });
    }

    const vigencia = 'Vigente';

    const checkActiveSql = "SELECT * FROM terminos_condiciones WHERE vigencia = 'Vigente'";
    db.query(checkActiveSql, async (err, activeResults) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor al consultar términos activos", details: err.message });
        }

        if (activeResults.length > 0) {
            const updateActiveSql = "UPDATE terminos_condiciones SET vigencia = 'No vigente' WHERE id = ?";
            await db.query(updateActiveSql, [activeResults[0].id]);
        }

        const version = (activeResults.length === 0) ? '1.0' : (parseFloat(activeResults[0].version) + 1).toFixed(1);

        const insertSql = "INSERT INTO terminos_condiciones (titulo, contenido, vigencia, fecha_creacion, fecha_vigencia, version, estado) VALUES (?, ?, ?, NOW(), ?, ?, 'en proceso')";
        db.query(insertSql, [titulo, contenido, vigencia, fecha_vigencia, version], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Ocurrió un error inesperado al crear término", details: err.message });
            }
            return res.json({ success: "Término y condición agregado correctamente", id: result.insertId });
        });
    });
};

const updateTerminosCondiciones = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, fecha_vigencia } = req.body;

    if (!isFechaValida(fecha_vigencia)) {
        return res.status(400).json({ message: "La fecha de vigencia no es válida o está en el pasado" });
    }

    try {
        const updateCurrentSql = "UPDATE terminos_condiciones SET vigencia = 'No vigente' WHERE id = ?";
        await db.query(updateCurrentSql, [id]);

        const getCurrentVersionSql = "SELECT version FROM terminos_condiciones WHERE id = ?";
        db.query(getCurrentVersionSql, [id], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error en el servidor al obtener versión actual", details: err.message });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Término no encontrado" });
            }

            const currentVersion = parseFloat(result[0].version);
            const newVersion = (Math.floor(currentVersion) + 1).toFixed(1);

            const insertSql = "INSERT INTO terminos_condiciones (titulo, contenido, vigencia, fecha_creacion, fecha_vigencia, version, estado) VALUES (?, ?, ?, NOW(), ?, ?, 'en proceso')";
            db.query(insertSql, [titulo, contenido, 'Vigente', fecha_vigencia, newVersion], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Ocurrió un error inesperado al insertar nueva versión", details: err.message });
                }
                return res.json({ success: "Término y condición actualizado correctamente" });
            });
        });
    } catch (err) {
        return res.status(500).json({ message: "Ocurrió un error inesperado al actualizar término", details: err.message });
    }
};

const deleteTerminosCondiciones = async (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE terminos_condiciones SET vigencia = 'No vigente', estado = 'eliminado' WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al marcar término como eliminado", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Término no encontrado" });
        }
        return res.json({ success: "Término marcado como eliminado correctamente" });
    });
};

const getCurrentTerminos = async (req, res) => {
    const sql = "SELECT * FROM terminos_condiciones WHERE vigencia = 'Vigente'";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor al obtener términos vigentes", details: err.message });
        }
        return res.json(result);
    });
};

module.exports = { getTerminosCondiciones, createTerminosCondiciones, updateTerminosCondiciones, deleteTerminosCondiciones, getCurrentTerminos };
