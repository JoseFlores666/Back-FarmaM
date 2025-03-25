const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getRecetas = (req, res) => {
    const sql = `
        SELECT em.*, p.nombre AS paciente, d.nomdoc AS doctor
        FROM Recetas_medicas em
        JOIN usuarios p ON em.codpaci = p.id
        JOIN doctor d ON em.coddoc = d.coddoc
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!Array.isArray(result) || result.length === 0) {
            return res.json([]);
        }
        return res.json(result);
    });
};


const getMedicamentos = (req, res) => {
    const sql = `SELECT * FROM medicamentos_receta`;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!Array.isArray(result) || result.length === 0) {
            return res.json([]);
        }
        return res.json(result);
    });
};



const getRecetasById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM Recetas_medicas WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Recetas no encontrado" });
        }
        return res.json(result[0]);
    });
};

const createRecetas = (req, res) => {
    const { historial_id, coddoc, codpaci, medicamentos, fecha_emision, fecha_vencimiento } = req.body;

    console.log(req.body);

    if (!coddoc || !codpaci || !medicamentos || medicamentos.length === 0 || !fecha_emision || !fecha_vencimiento) {
        return res.status(400).json({ message: "Todos los campos son obligatorios y debe haber al menos un medicamento" });
    }

    const sqlReceta = `INSERT INTO recetas_medicas (historial_id, coddoc, codpaci, fecha_emision, fecha_vencimiento) 
                        VALUES (?, ?, ?, ?, ?)`;

    const valuesReceta = [historial_id, coddoc, codpaci, fecha_emision, fecha_vencimiento];

    db.query(sqlReceta, valuesReceta, (err, result) => {
        if (err) {
            console.error("Error al insertar la receta:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        const recetaId = result.insertId;

        const sqlMedicamentos = `INSERT INTO medicamentos_receta (receta_id, medicamento, dosis, instrucciones) VALUES ?`;

        const valuesMedicamentos = medicamentos.map(med => [recetaId, med.medicamento, med.dosis, med.instrucciones]);

        db.query(sqlMedicamentos, [valuesMedicamentos], (err) => {
            if (err) {
                console.error("Error al insertar medicamentos:", err);
                return res.status(500).json({ message: "Error al guardar los medicamentos" });
            }

            return res.status(201).json({ message: "Receta creada correctamente", recetaId });
        });
    });
};

const updateRecetas = (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE Recetas_medicas SET ? WHERE id = ?';

    db.query(sql, [updates, id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Recetas no encontrado" });
        }
        return res.json({ message: "Recetas actualizado" });
    });
};

const deleteRecetas = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Recetas_medicas WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Recetas no encontrado" });
        }
        return res.json({ message: "Recetas eliminado" });
    });
};


module.exports = { getRecetas, getRecetasById, createRecetas, updateRecetas, deleteRecetas, getMedicamentos }