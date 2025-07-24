const express = require('express');
const router = express.Router();
const db = require('../../config/db');

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

const getAvisosPriv = async (req, res) => {
    const sql = "SELECT * FROM avisopriv";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createAvisoPriv = async (req, res) => {
    const { titulo, contenido, fecha_vigen } = req.body;

    if (fecha_vigen && !isFechaValida(fecha_vigen)) {
        return res.status(400).json({ message: "La fecha de vigencia no es válida o está en el pasado" });
    }

    const vigencia = 'Vigente';

    const checkActiveSql = "SELECT * FROM avisopriv WHERE vigencia = 'Vigente'";
    db.query(checkActiveSql, async (err, activeResults) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (activeResults.length > 0) {
            const updateActiveSql = "UPDATE avisopriv SET vigencia = 'No vigente' WHERE id = ?";
            await db.query(updateActiveSql, [activeResults[0].id]);
        }

        const version = (activeResults.length === 0) ? '1.0' : (parseFloat(activeResults[0].version) + 1).toFixed(1);

        const insertSql = "INSERT INTO avisopriv (titulo, contenido, vigencia, fecha_creac, fecha_vigen, version, estado) VALUES (?, ?, ?, NOW(), ?, ?, 'en proc')";
        db.query(insertSql, [titulo, contenido, vigencia, fecha_vigen, version], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
            }
            return res.json({ success: "Aviso de privacidad agregado correctamente", id: result.insertId });
        });
    });
};

const updateAvisoPriv = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, fecha_vigen } = req.body;

    if (fecha_vigen && !isFechaValida(fecha_vigen)) {
        return res.status(400).json({ message: "La fecha de vigencia no es válida o está en el pasado" });
    }

    try {
        const updateCurrentSql = "UPDATE avisopriv SET vigencia = 'No vigente' WHERE id = ?";
        await db.query(updateCurrentSql, [id]);

        const getCurrentVersionSql = "SELECT version FROM avisopriv WHERE id = ?";
        db.query(getCurrentVersionSql, [id], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error en el servidor" });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Aviso de privacidad no encontrado" });
            }

            const currentVersion = parseInt(result[0].version);
            const newVersion = currentVersion + 1;

            const insertSql = "INSERT INTO avisopriv (titulo, contenido, vigencia, fecha_creac, fecha_vigen, version, estado) VALUES (?, ?, ?, NOW(), ?, ?, 'en proc')";
            db.query(insertSql, [titulo, contenido, 'Vigente', fecha_vigen, newVersion], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
                }
                return res.json({ success: "Aviso de privacidad actualizado correctamente" });
            });
        });
    } catch (err) {
        return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
    }
};

const deleteAvisoPriv = async (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE avisopriv SET vigencia = 'No vigente', estado = 'eliminado' WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Ocurrió un error inesperado: " + err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aviso de privacidad no encontrado" });
        }
        return res.json({ success: "Aviso de privacidad marcado como eliminado correctamente" });
    });
};

const getCurrentAvisosPriv = async (req, res) => {
    const sql = "SELECT * FROM avisopriv WHERE vigencia = 'Vigente'";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

module.exports = { getAvisosPriv,createAvisoPriv,updateAvisoPriv,deleteAvisoPriv,getCurrentAvisosPriv};