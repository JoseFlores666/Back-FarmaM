const express = require('express');
const router = express.Router();
const db = require('../config/db');

const getEslogan = async (req, res) => {
    const sql = "SELECT * FROM eslogan LIMIT 1";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
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

    const updateSql = "UPDATE eslogan SET eslogan = ? WHERE id = 1";
    
    db.query(updateSql, [eslogan], (err) => {
        if (err) {
            console.error('Error al actualizar el eslogan:', err);
            return res.status(500).json({ message: "Error al actualizar el eslogan" });
        }
        return res.json({ success: "Eslogan actualizado correctamente" });
    });
};

const createEslogan = (eslogan, res) => {
    const insertSql = "INSERT INTO eslogan (eslogan) VALUES (?)";
    db.query(insertSql, [eslogan], (err) => {
        if (err) {
            console.error('Error al crear el eslogan:', err);
            return res.status(500).json({ message: "Error al crear el eslogan" });
        }
        return res.json({ success: "Eslogan agregado correctamente" });
    });
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
