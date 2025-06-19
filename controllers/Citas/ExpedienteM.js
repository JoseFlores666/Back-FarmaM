const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getExpediente = (req, res) => {
    const sql = `SELECT em.*, p.nombre,
      CONCAT(p.nombre, ' ', p.apellidoPaterno, ' ', p.apellidoMaterno) AS paciente
      FROM expediente_medico em
      JOIN usuarios p ON em.codpaci = p.id`;

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


const getExpedienteById = (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT em.*, p.nombre, p.foto_perfil, p.correo, p.genero
        FROM expediente_medico em
        JOIN usuarios p ON em.codpaci = p.id
        WHERE em.codpaci = ?`; 

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error en la consulta del expediente:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Expediente no encontrado" });
        }
        return res.json(result[0]); 
    });
};


const createExpediente = (req, res) => {
    const { codpaci, antecedentes, alergias, enfermedades, medicamentos, notas, altura, peso, bmi, temperatura, presion_resp, presion_art, presion_card, tipo_sangre } = req.body;
    const sql = 'INSERT INTO expediente_medico (codpaci, antecedentes, alergias, enfermedades, medicamentos, notas, altura, peso, bmi, temperatura, presion_resp, presion_art, presion_card, tipo_sangre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)';
    const values = [codpaci, antecedentes, alergias, enfermedades, medicamentos, notas, altura, peso, bmi, temperatura, presion_resp, presion_art, presion_card, tipo_sangre];
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.status(201).json({ message: "Expediente creado", id: result.insertId });
    });
};

const updateExpediente = (req, res) => {
    const { id } = req.params;
    const { motivo, coddoc, ...updates } = req.body;

    console.log("ID:", id);
    console.log("Motivo:", motivo);
    console.log("Código del doctor:", coddoc);
    console.log("Updates:", updates);

    const sqlUpdate = 'UPDATE expediente_medico SET ? WHERE id = ?';

    db.query(sqlUpdate, [updates, id], (err, result) => {
        if (err) {
            console.error("Error en la actualización del expediente:", err);
            return res.status(500).json({ message: "Error en el servidor", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expediente no encontrado" });
        }

        if (motivo && coddoc) {
            const sqlInsert = 'INSERT INTO expediente_actualizaciones (expediente_id, coddoc, descripcion) VALUES (?, ?, ?)';
            db.query(sqlInsert, [id, coddoc, motivo], (err) => {
                if (err) {
                    console.error("Error al registrar la actualización:", err);
                    return res.status(500).json({ message: "Error al registrar la actualización", error: err });
                }
                return res.json({ message: "Expediente actualizado y motivo registrado correctamente" });
            });
        } else {
            return res.json({ message: "Expediente actualizado sin motivo registrado" });
        }
    });
};


const deleteExpediente = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM expediente_medico WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expediente no encontrado" });
        }
        return res.json({ message: "Expediente eliminado" });
    });
};


module.exports = { getExpediente, getExpedienteById, createExpediente, updateExpediente, deleteExpediente }