const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getHorarios = (req, res) => {
    const sql = 'SELECT * FROM horario';
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

const createHorario = async (req, res) => {
    const { coddoc, hora_inicio, hora_fin, dias } = req.body;
    if (!hora_inicio || !hora_fin || !dias || dias.length === 0) {
        return res.status(400).json({ error: 'Las horas de inicio y fin y al menos un día son obligatorios.' });
    }
    try {
        for (const dia of dias) {
            await db.query(
                'INSERT INTO horario (coddoc, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
                [coddoc, dia, hora_inicio, hora_fin]
            );
        }
        res.json({ message: 'Horario médico creado con éxito' });
    } catch (error) {
        console.error('Error al crear el horario:', error);
        res.status(500).json({ error: `Error al crear el horario médico: ${error.message}` });
    }
};

const updateHorario = async (req, res) => {
    const { id } = req.params; 
    const { coddoc, hora_inicio, hora_fin, dias } = req.body;

    if (!hora_inicio || !hora_fin || !dias || dias.length === 0) {
        return res.status(400).json({ error: 'Las horas de inicio y fin y al menos un día son obligatorios.' });
    }

    try {
        await db.query('DELETE FROM horario WHERE coddoc = ?', [coddoc]);

        for (const dia of dias) {
            await db.query(
                'INSERT INTO horario (coddoc, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
                [coddoc, dia, hora_inicio, hora_fin]
            );
        }

        res.json({ message: 'Horario actualizado con éxito' });

    } catch (error) {
        console.error('Error al actualizar el horario:', error);
        res.status(500).json({ error: 'Error al actualizar el horario médico' });
    }
};


const deleteHorario = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM horario WHERE codhor = ?', [id]);
        res.json({ message: 'Horario eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar el horario:', error);
        res.status(500).json({ error: 'Error al eliminar el horario' });
    }
};





module.exports = { getHorarios, createHorario, updateHorario, deleteHorario };