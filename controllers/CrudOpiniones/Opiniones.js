const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const createOpinion = async (req, res) => {
    try {
        const { user_id, rating, opinion } = req.body;

        if (!user_id || !rating || !opinion) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const sql = `INSERT INTO opiniones (user_id, rating, opinion) VALUES (?, ?, ?)`;
        db.query(sql, [user_id, rating, opinion], (err, result) => {
            if (err) {
                console.error("Error al insertar opinión:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            res.status(201).json({ message: "Opinión guardada exitosamente" });
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
}

const getOpinions = async (req, res) => {
    try {
        const sql = `
        SELECT o.*, u.nombre AS usuario_nombre, u.foto_perfil,u.usuario,rol_id,
      CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno) AS paciente

        FROM opiniones o
        JOIN usuarios u ON o.user_id = u.id
    `;
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Error al obtener opiniones:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};


const getOpinionById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "SELECT * FROM opiniones WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Error al obtener la opinión:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            if (result.length === 0) {
                return res.status(404).json({ message: "Opinión no encontrada" });
            }
            res.status(200).json(result[0]);
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};

const updateOpinion = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, opinion } = req.body;

        if (!rating || !opinion) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const sql = "UPDATE opiniones SET rating = ?, opinion = ? WHERE id = ?";
        db.query(sql, [rating, opinion, id], (err, result) => {
            if (err) {
                console.error("Error al actualizar opinión:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Opinión no encontrada" });
            }
            res.status(200).json({ message: "Opinión actualizada exitosamente" });
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};

const deleteOpinion = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM opiniones WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Error al eliminar opinión:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Opinión no encontrada" });
            }
            res.status(200).json({ message: "Opinión eliminada exitosamente" });
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};
const updateReaction = async (req, res) => {
    const { id } = req.params;  
    const { reaction } = req.body; 

    let column = reaction === "like" ? "megusta" : "nomegusta";
    const query = `UPDATE opiniones SET ${column} = ${column} + 1 WHERE id = ?`;

    try {
        await db.query(query, [id]);
        res.json({ success: true, message: `Se ha actualizado ${column}` });
    } catch (error) {
        console.error("Error al actualizar reacción:", error);
        res.status(500).json({ success: false, error: "Error al actualizar la reacción" });
    }
};



module.exports = { createOpinion, getOpinions, getOpinionById, updateOpinion, deleteOpinion, updateReaction };