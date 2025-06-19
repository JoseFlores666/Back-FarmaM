const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getHorarioEmpresa = (req, res) => {
    const sql = "SELECT * FROM horario_empresa";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!Array.isArray(result) || result.length === 0) {
            console.log("No se encontraron servicios en la base de datos.");
            return res.json([]);
        }
        return res.json(result);
    });
};

const crearHorarioEmpresa = (req, res) => {
    const { dia, hora_inicio, hora_fin, activo } = req.body;
    if (!dia || !hora_inicio || !hora_fin || activo === undefined) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const empresa_id = 1;
    const sql = "INSERT INTO horario_empresa (dia, hora_inicio, hora_fin, activo, empresa_id) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [dia, hora_inicio, hora_fin, activo, empresa_id], (err, result) => {
        if (err) {
            console.error('Error al insertar horario:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        return res.status(201).json({ message: "horario agregada con éxito", id: result.insertId });
    });
};


const updateHorarioEmpresa = (req, res) => {
    const { id } = req.params;
    const { dia, hora_inicio, hora_fin, activo } = req.body;

    const sql = "UPDATE horario_empresa SET dia = ?, hora_inicio = ?, hora_fin = ?, activo = ? WHERE id = ?";
    db.query(sql, [dia, hora_inicio, hora_fin, activo, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar horario:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el horario para actualizar" });
        }

        return res.json({ message: "Horario actualizado con éxito" });
    });
};



const deleteHorarioEmpresa = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM horario_empresa WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar horario:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el horario para eliminar" });
        }
        return res.json({ message: "horario eliminada con éxito" });
    });
};


module.exports = { getHorarioEmpresa, crearHorarioEmpresa, updateHorarioEmpresa, deleteHorarioEmpresa };
