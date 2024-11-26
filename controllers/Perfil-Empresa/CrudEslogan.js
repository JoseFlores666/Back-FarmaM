const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');  

const getEslogan = async (req, res) => {
    const sql = "SELECT * FROM eslogan LIMIT 1";
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (!Array.isArray(result)) {
            return res.status(500).json({ message: "Error en el servidor, resultado no válido" });
        }

        if (result.length === 0) {
            return res.json({ eslogan: '' });
        }

        return res.json(result[0]);
    });
};

const updateEslogan = (req, res) => {
    const { eslogan } = req.body;

    if (!eslogan || typeof eslogan !== 'string') {
        return res.status(400).json({ message: 'Eslogan inválido. Debe ser una cadena de texto válida.' });
    }

    const selectSql = "SELECT eslogan FROM eslogan WHERE id = 1";
    db.query(selectSql, (err, result) => {
        if (err) {
            console.error('Error al consultar el eslogan existente:', err);
            return res.status(500).json({ message: "Error al consultar el eslogan actual" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontró el eslogan para actualizar." });
        }

        const oldEslogan = result[0].eslogan;

        // Verifica si el eslogan es igual al actual
        if (oldEslogan === eslogan) {
            return res.status(200).json({ 
                success: true, 
                message: "El eslogan ingresado ya está actualizado.", 
                eslogan 
            });
        }

        const updateSql = "UPDATE eslogan SET eslogan = ? WHERE id = 1";
        db.query(updateSql, [eslogan], (err) => {
            if (err) {
                return res.status(500).json({ message: "Error al actualizar el eslogan" });
            }

            createAudit(req, 'Actualizacion', 'eslogan', oldEslogan, eslogan);

            return res.status(200).json({ 
                success: true, 
                message: "Eslogan actualizado correctamente.", 
                eslogan 
            });
        });
    });
};


const createEslogan = async (req, res) => {
    const { eslogan } = req.body; 
    
    const insertSql = "INSERT INTO eslogan (eslogan) VALUES (?)";
    try {
        await db.query(insertSql, [eslogan]);
        return res.json({ success: "Eslogan agregado correctamente" });
    } catch (err) {
        console.error('Error al crear el eslogan:', err);
        return res.status(500).json({ message: "Error al crear el eslogan" });
    }
};

const deleteEslogan = (req, res) => {
    const deleteSql = "DELETE FROM eslogan WHERE id = 1"; 
    db.query(deleteSql, (err) => {
        if (err) {
            console.error('Error al eliminar el eslogan:', err);
            return res.status(500).json({ message: "Error al eliminar el eslogan" });
        }
        return res.json({ success: "Eslogan eliminado correctamente" });
    });
};

module.exports = { getEslogan, updateEslogan, createEslogan, deleteEslogan };
