const express = require('express');
const router = express.Router();
const db = require('../config/db');

const getTerminosCondiciones = async (req, res) => {
    const sql = "SELECT * FROM terminos_condiciones";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createTerminosCondiciones = async (req, res) => {
    const { titulo, contenido, fecha_vigencia } = req.body; 
    const vigencia = 'Vigente';

    const checkActiveSql = "SELECT * FROM terminos_condiciones WHERE vigencia = 'Vigente'";
    db.query(checkActiveSql, async (err, activeResults) => {
        if (err) {
            console.error('Error al consultar términos activos:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (activeResults.length > 0) {
            const updateActiveSql = "UPDATE terminos_condiciones SET vigencia = 'No vigente' WHERE id = ?";
            await db.query(updateActiveSql, [activeResults[0].id]);
        }

        const version = (activeResults.length === 0) ? '1.0' : (parseFloat(activeResults[0].version) + 1).toFixed(1);

        const insertSql = "INSERT INTO terminos_condiciones (titulo, contenido, vigencia, fecha_creacion, fecha_vigencia, version, estado) VALUES (?, ?, ?, NOW(), ?, ?, 'en proceso')";
        db.query(insertSql, [titulo, contenido, vigencia, fecha_vigencia, version], (err, result) => {
            if (err) {
                console.error('Error al crear término:', err);
                return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
            }
            return res.json({ success: "Término y condición agregado correctamente", id: result.insertId });
        });
    });
};

const updateTerminosCondiciones = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, fecha_vigencia } = req.body;

    try {
        const updateCurrentSql = "UPDATE terminos_condiciones SET vigencia = 'No vigente' WHERE id = ?";
        await db.query(updateCurrentSql, [id]);

        const getCurrentVersionSql = "SELECT version FROM terminos_condiciones WHERE id = ?";
        db.query(getCurrentVersionSql, [id], async (err, result) => {
            if (err) {
                console.error('Error al obtener versión actual:', err);
                return res.status(500).json({ message: "Error en el servidor" });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Término no encontrado" });
            }

            const currentVersion = parseFloat(result[0].version);
            const newVersion = (Math.floor(currentVersion) + 1).toFixed(1);

            const insertSql = "INSERT INTO terminos_condiciones (titulo, contenido, vigencia, fecha_creacion, fecha_vigencia, version, estado) VALUES (?, ?, ?, NOW(), ?, ?, 'en proceso')";
            db.query(insertSql, [titulo, contenido, 'Vigente', fecha_vigencia, newVersion], (err) => {
                if (err) {
                    console.error('Error al insertar nueva versión:', err);
                    return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
                }
                return res.json({ success: "Término y condición actualizado correctamente" });
            });
        });
    } catch (err) {
        console.error('Error en la función updateTerminosCondiciones:', err);
        return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
    }
};

const deleteTerminosCondiciones = async (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE terminos_condiciones SET vigencia = 'No vigente', estado = 'eliminado' WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al marcar como eliminado:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
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
            console.error('Error al consultar términos vigentes:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

module.exports = {getTerminosCondiciones,createTerminosCondiciones,updateTerminosCondiciones,deleteTerminosCondiciones,getCurrentTerminos};
