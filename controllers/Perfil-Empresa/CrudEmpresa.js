const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria')
const jwt = require('jsonwebtoken');

const getEmpresa = async (req, res) => {
    const sql = "SELECT * FROM empresa";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const updateEmpresa = async (req, res) => {
    const { id } = req.params;
    const { id_usuario, nombre, nosotros, mision, vision, eslogan } = req.body;

    const sqlSelect = "SELECT nombre, nosotros, mision, vision, eslogan FROM empresa WHERE id = ?";
    
    db.query(sqlSelect, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener los datos de la empresa:', err);
            return res.status(500).json({ message: "Error en el servidor al obtener los datos." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Empresa no encontrada." });
        }

        const oldData = results[0]; 

        const sqlUpdate = `
            UPDATE empresa 
            SET 
                nombre = ?, 
                nosotros = ?, 
                mision = ?, 
                vision = ?, 
                eslogan = ?
            WHERE id = ?
        `;

        db.query(sqlUpdate, [nombre, nosotros, mision, vision, eslogan, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar los datos de la empresa:', err);
                return res.status(500).json({ message: "Error en el servidor al actualizar los datos." });
            }

            if (result.affectedRows > 0) {
                const updatedData = {
                    nombre,
                    nosotros,
                    mision,
                    vision,
                    eslogan
                };

                createAudit(id_usuario, "UPDATE", "empresa", JSON.stringify({ oldData }),JSON.stringify({updatedData }));
            }

            return res.status(200).json({ success: true, message: "Datos de la empresa actualizados correctamente." });
        });
    });
};





module.exports = { getEmpresa,updateEmpresa, };
