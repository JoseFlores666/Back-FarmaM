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

    if (!direccion || typeof direccion !== 'string') {
        return res.status(400).json({ message: 'Dirección inválida.' });
    }
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Correo electrónico inválido.' });
    }
    if (!telefono || typeof telefono !== 'string') {
        return res.status(400).json({ message: 'Teléfono inválido.' });
    }

    const checkSql = "SELECT * FROM datos_contacto ORDER BY id DESC LIMIT 1";

    db.query(checkSql, (err, result) => {
        if (err) {
            console.error('Error al consultar datos de contacto:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.length > 0) {
            const existingData = result[0];

            // Verificar si los datos son iguales
            if (
                existingData.direccion === direccion &&
                existingData.email === email &&
                existingData.telefono === telefono
            ) {
                return res.status(200).json({ message: "Los datos de contacto no han cambiado. No se realizó ninguna actualización." });
            }

            // Actualizar si los datos son diferentes
            const updateSql = "UPDATE datos_contacto SET direccion = ?, email = ?, telefono = ?, fecha_actualizacion = NOW() WHERE id = ?";
            db.query(updateSql, [direccion, email, telefono, existingData.id], (err) => {
                if (err) {
                    console.error('Error al actualizar los datos de contacto:', err);
                    return res.status(500).json({ message: "Error al actualizar los datos de contacto" });
                }

                createAudit(req, 'Actualizar', 'datos_contacto', `direccion: ${existingData.direccion}, email: ${existingData.email}, telefono: ${existingData.telefono}`, `direccion: ${direccion}, email: ${email}, telefono: ${telefono}`);

                return res.json({ success: "Datos de contacto actualizados correctamente" });
            });
        } else {
            // Insertar si no hay datos existentes
            const insertSql = "INSERT INTO datos_contacto (direccion, email, telefono, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())";
            db.query(insertSql, [direccion, email, telefono], (err, result) => {
                if (err) {
                    console.error('Error al crear los datos de contacto:', err);
                    return res.status(500).json({ message: "Error al crear los datos de contacto" });
                }

                createAudit(req, 'Insertar', 'datos_contacto', 'N/A', `direccion: ${direccion}, email: ${email}, telefono: ${telefono}`);

                return res.json({ success: "Datos de contacto creados correctamente" });
            });
        }
    });
};

const deleteContactInfo = (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ message: "ID inválido" });
    }

    const deleteSql = "SELECT * FROM datos_contacto WHERE id = ?";
    db.query(deleteSql, [id], (err, result) => {
        if (err) {
            console.error('Error al consultar los datos de contacto:', err);
            return res.status(500).json({ message: "Error al consultar los datos de contacto" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Datos de contacto no encontrados" });
        }

        const oldData = result[0];

        const deleteQuery = "DELETE FROM datos_contacto WHERE id = ?";
        db.query(deleteQuery, [id], (err) => {
            if (err) {
                console.error('Error al eliminar los datos de contacto:', err);
                return res.status(500).json({ message: "Error al eliminar los datos de contacto" });
            }

            createAudit(req, 'Eliminar', 'datos_contacto', `direccion: ${oldData.direccion}, email: ${oldData.email}, telefono: ${oldData.telefono}`, 'N/A');

            return res.json({ success: "Datos de contacto eliminados correctamente" });
        });
    });
};

module.exports = { getContactInfo, upsertContactInfo, deleteContactInfo };
