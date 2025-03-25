const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');

const getContactInfo = (req, res) => {
    const sql = "SELECT * FROM datos_contacto ORDER BY id DESC LIMIT 1";

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (!Array.isArray(result)) {
            console.error('El resultado no es un array:', result);
            return res.status(500).json({ message: "Error en el servidor, resultado no válido" });
        }

        if (result.length === 0) {
            return res.json({ direccion: '', email: '', telefono: '' });
        }

        return res.json(result[0]);
    });
};

const upsertContactInfo = (req, res) => {
    const { direccion, email, telefono } = req.body;
    const id = 1;
    
    const getCurrentDataSql = 'SELECT direccion, email, telefono FROM datos_contacto WHERE id = ?';
    
    db.query(getCurrentDataSql, [id], (err, result) => {
        if (err) {
            console.error('Error al obtener los datos actuales:', err);
            return res.status(500).json({ message: 'Error al obtener los datos actuales' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No se encontró el registro con el id proporcionado' });
        }

        const currentData = result[0];

        const sql = 'UPDATE datos_contacto SET direccion = ?, email = ?, telefono = ? WHERE id = ?';
        db.query(sql, [direccion, email, telefono, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar los datos de contacto:', err);
                return res.status(500).json({ message: 'Error al actualizar los datos de contacto' });
            }

            const updatedData = { direccion, email, telefono };
            createAudit(id, 'UPDATE', 'Empresa contacto', JSON.stringify(currentData), JSON.stringify(updatedData));

            res.json({ message: 'Datos actualizados correctamente' });
        });
    });
};


module.exports = { getContactInfo, upsertContactInfo };
