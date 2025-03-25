const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getEspecialidades = (req, res) => {
    const sql = "SELECT * FROM especialidad";
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

const crearEspecialidad = (req, res) => {
    const { titulo, detalles, imagen } = req.body;

    if (!titulo || !detalles || !imagen) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const sql = "INSERT INTO especialidad (titulo, detalles, imagen) VALUES (?, ?, ?)";
    db.query(sql, [titulo, detalles, imagen], (err, result) => {
        if (err) {
            console.error('Error al insertar especialidad:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }


        return res.status(201).json({ message: "Especialidad agregada con éxito", id: result.insertId });
    });
};


const updateEspecialidad = (req, res) => {
    const { codespe } = req.params;
    const { titulo, detalles, imagen } = req.body;  // Cambié 'nombre' a 'titulo' y 'descripcion' a 'detalles' para que coincida con el frontend
    const sql = "UPDATE especialidad SET titulo = ?, detalles = ?, imagen = ? WHERE codespe = ?";
    db.query(sql, [titulo, detalles, imagen, codespe], (err, result) => {
        if (err) {
            console.error('Error al actualizar especialidad:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró la especialidad para actualizar" });
        }

        return res.json({ message: "Especialidad actualizada con éxito" });
    });
};


const deleteEspecialidad = (req, res) => {
    const { codespe } = req.params;
    const sql = "DELETE FROM especialidad WHERE codespe = ?";
    db.query(sql, [codespe], (err, result) => {
        if (err) {
            console.error('Error al eliminar especialidad:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró la especialidad para eliminar" });
        }
        return res.json({ message: "Especialidad eliminada con éxito" });
    });
};


module.exports = { getEspecialidades, crearEspecialidad, updateEspecialidad, deleteEspecialidad };
