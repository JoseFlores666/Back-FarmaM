const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const getDoc = (req, res) => {
    const sql = `
        SELECT 
    d.coddoc,
    d.nomdoc,
                CONCAT(d.nomdoc, ' ', d.apepaternodoc, ' ', d.apematernodoc) AS nombreCompleto,
    d.telefo,
    d.correo,
    d.genero,
    d.edad,
    d.apepaternodoc,
    d.apematernodoc,
    d.foto_doc,

    d.password,
    e.codespe,
    e.titulo AS especialidad,
    d.fecha_create,
    d.foto_doc,
    MAX(h.estado) AS estado  -- Tomamos el estado más relevante
FROM doctor d
JOIN especialidad e ON d.codespe = e.codespe
LEFT JOIN horario h ON d.coddoc = h.coddoc
GROUP BY d.coddoc;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (!Array.isArray(result) || result.length === 0) {
            console.log("No se encontraron doctores en la base de datos.");
            return res.json([]);
        }
        return res.json(result);
    });
};


const createDoc = async (req, res) => {
    const { nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, especialidad, password, foto_doc } = req.body;

    if (!nomdoc || !telefo || !correo || !genero || !edad || !apepaternodoc || !apematernodoc || !especialidad, !password, !foto_doc) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    try {
        const sql = `
            INSERT INTO doctor (nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc,password,foto_doc, codespe) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, password, foto_doc, especialidad]);

        res.status(201).json({ message: "Doctor agregado correctamente" });

    } catch (error) {
        console.error('Error en la consulta:', error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

const updateDoc = async (req, res) => {
    const { id } = req.params;
    const { nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, especialidad, password, foto_doc } = req.body;

    try {
        const sql = `
            UPDATE doctor 
            SET nomdoc=?, telefo=?, correo=?, genero=?, edad=?, apepaternodoc=?, apematernodoc=?,password=?,foto_doc=?, codespe=? 
            WHERE coddoc=?
        `;

        const result = await db.query(sql, [nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, especialidad, password, foto_doc, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Doctor no encontrado" });
        }

        res.json({ message: "Doctor actualizado correctamente" });

    } catch (error) {
        console.error('Error en la consulta:', error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

const deleteDoc = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `DELETE FROM doctor WHERE coddoc = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Error en la consulta:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Doctor no encontrado" });
            }

            res.json({ message: "Doctor eliminado correctamente" });
        });
    } catch (error) {
        console.error("Error en la consulta:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

module.exports = { getDoc, createDoc, updateDoc, deleteDoc }