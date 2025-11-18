const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getOpinionById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "SELECT * FROM opiniones WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ message: "Error en el servidor" });
            if (result.length === 0) return res.status(404).json({ message: "Opinión no encontrada" });
            res.status(200).json(result[0]);
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};

const createOpinion = async (req, res) => {
    try {
        const { user_id, rating, opinion, rol_id, nombre } = req.body;

        if (!user_id || !rating || !opinion) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const nombreFinal = rol_id === 1
            ? `Administrador_${Math.floor(Math.random() * 1000)}`
            : nombre || null;

        const sql = `
            INSERT INTO opiniones (user_id, nombre, rating, opinion)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [user_id, nombreFinal, rating, opinion], (err) => {
            if (err) {
                console.error("❌ Error al insertar opinión:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            res.status(201).json({ message: "Opinión guardada exitosamente" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

const getOpinions = async (req, res) => {
    try {
        const sql = `
            SELECT 
                o.*, 
                u.nombre AS usuario_nombre, 
                u.foto_perfil, 
                u.usuario, 
                u.rol_id,
                CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno) AS paciente,
                (SELECT COUNT(*) FROM opinion_reacciones r WHERE r.opinion_id = o.id AND r.tipo = 'like') AS total_likes,
                (SELECT COUNT(*) FROM opinion_reacciones r WHERE r.opinion_id = o.id AND r.tipo = 'dislike') AS total_dislikes
            FROM opiniones o
            JOIN usuarios u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;
        db.query(sql, (err, results) => {
            if (err) {
                console.error("❌ Error al obtener opiniones:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};
const updateOpinion = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, opinion, nombre } = req.body;


        if (rating === undefined || opinion === undefined || opinion.trim() === "") {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const sql = "UPDATE opiniones SET rating = ?, opinion = ?, nombre = ? WHERE id = ?";
        db.query(sql, [rating, opinion, nombre, id], (err, result) => {
            if (err) {
                console.error("Error en la actualización:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Opinión no encontrada" });
            }

            res.status(200).json({ message: "Opinión actualizada exitosamente" });
        });
    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};


const deleteOpinion = async (req, res) => {
    try {
        const { id } = req.params;

        const deleteReactions = "DELETE FROM opinion_reacciones WHERE opinion_id = ?";
        db.query(deleteReactions, [id], (err) => {
            if (err) return res.status(500).json({ message: "Error eliminando reacciones" });

            const deleteOpinion = "DELETE FROM opiniones WHERE id = ?";
            db.query(deleteOpinion, [id], (err2, result) => {
                if (err2) return res.status(500).json({ message: "Error eliminando opinión" });
                if (result.affectedRows === 0)
                    return res.status(404).json({ message: "Opinión no encontrada" });

                res.status(200).json({ message: "Opinión y reacciones eliminadas exitosamente" });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};


const updateReaction = async (req, res) => {
    const { user_id, tipo } = req.body;
    const { id: opinion_id } = req.params;

    if (!opinion_id || !user_id || !tipo) {
        return res.status(400).json({ success: false, message: "Faltan datos" });
    }

    try {
        const checkQuery = "SELECT * FROM opinion_reacciones WHERE opinion_id = ? AND user_id = ?";
        db.query(checkQuery, [opinion_id, user_id], (err, results) => {
            if (err) {
                console.error("Error al verificar reacción:", err);
                return res.status(500).json({ success: false, error: "Error al verificar reacción" });
            }

            if (results.length > 0) {
                const existing = results[0];

                if (existing.tipo === tipo) {
                    const deleteQuery = "DELETE FROM opinion_reacciones WHERE id = ?";
                    db.query(deleteQuery, [existing.id], (err2) => {
                        if (err2) {
                            console.error("Error al eliminar reacción:", err2);
                            return res.status(500).json({ success: false, error: "Error al eliminar reacción" });
                        }

                        const counterColumn = tipo === "like" ? "megusta" : "nomegusta";
                        const updateCounter = `UPDATE opiniones SET ${counterColumn} = ${counterColumn} - 1 WHERE id = ?`;
                        db.query(updateCounter, [opinion_id]);

                        return res.json({ success: true, message: "Reacción eliminada (neutral)" });
                    });
                }
                else {
                    const updateReaction = "UPDATE opinion_reacciones SET tipo = ?, created_at = NOW() WHERE id = ?";
                    db.query(updateReaction, [tipo, existing.id], (err3) => {
                        if (err3) {
                            console.error("Error al actualizar tipo de reacción:", err3);
                            return res.status(500).json({ success: false, error: "Error al actualizar tipo de reacción" });
                        }

                        const removeFrom = existing.tipo === "like" ? "megusta" : "nomegusta";
                        const addTo = tipo === "like" ? "megusta" : "nomegusta";

                        const updateCounters = `
                            UPDATE opiniones 
                            SET ${removeFrom} = ${removeFrom} - 1, ${addTo} = ${addTo} + 1 
                            WHERE id = ?`;
                        db.query(updateCounters, [opinion_id]);

                        return res.json({ success: true, message: "Reacción actualizada correctamente" });
                    });
                }
            }
            else {
                const insertQuery = "INSERT INTO opinion_reacciones (opinion_id, user_id, tipo, created_at) VALUES (?, ?, ?, NOW())";
                db.query(insertQuery, [opinion_id, user_id, tipo], (err4) => {
                    if (err4) {
                        console.error("Error al insertar reacción:", err4);
                        return res.status(500).json({ success: false, error: "Error al insertar reacción" });
                    }

                    const counterColumn = tipo === "like" ? "megusta" : "nomegusta";
                    const updateCounter = `UPDATE opiniones SET ${counterColumn} = ${counterColumn} + 1 WHERE id = ?`;
                    db.query(updateCounter, [opinion_id]);

                    return res.json({ success: true, message: "Reacción registrada correctamente" });
                });
            }
        });
    } catch (error) {
        console.error("Error general en updateReaction:", error);
        res.status(500).json({ success: false, error: "Error en el servidor" });
    }
};


module.exports = {
    createOpinion,
    getOpinions,
    updateOpinion,
    deleteOpinion,
    updateReaction,
    getOpinionById
};
