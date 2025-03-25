const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getCitas = (req, res) => {
    const sql = `
        SELECT c.*, 
               p.nombre AS paciente, 
               d.nomdoc AS doctor, 
               e.titulo AS especialidad, 
               h.dia AS dia_horario, 
               h.hora_inicio, 
               h.hora_fin,
               h.estado
        FROM citas c
        LEFT JOIN usuarios p ON c.codpaci = p.id
        LEFT JOIN doctor d ON c.coddoc = d.coddoc
        LEFT JOIN especialidad e ON d.codespe = e.codespe
        LEFT JOIN horario h ON c.codhor = h.codhor;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(Array.isArray(result) && result.length > 0 ? result : []);
    });
};

const getCitasById = (req, res) => {
    const { coddoc } = req.params; // Obtener el ID del doctor desde la URL

    // Validar si coddoc es un número válido
    if (!coddoc || isNaN(coddoc)) {
        return res.status(400).json({ message: "ID del doctor no válido o faltante" });
    }

    const sql = `
        SELECT 
            c.id,
            c.coddoc,
            c.codpaci,
            c.fecha,
            c.hora,
            c.estado,
            p.nombre AS paciente,
            d.nomdoc AS doctor,
            e.titulo AS especialidad,
            h.dia AS dia_horario,
            h.hora_inicio,
            h.hora_fin
        FROM citas c
        LEFT JOIN usuarios p ON c.codpaci = p.id
        LEFT JOIN doctor d ON c.coddoc = d.coddoc
        LEFT JOIN especialidad e ON d.codespe = e.codespe
        LEFT JOIN horario h ON c.codhor = h.codhor
        WHERE c.coddoc = ?;
    `;

    db.query(sql, [coddoc], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (!Array.isArray(result) || result.length === 0) {
            return res.status(404).json({ message: "No se encontraron citas para este doctor" });
        }

        return res.json(result);
    });
};


const reservarCita = (req, res) => {
    const { id, codpaci, motivoCita } = req.body;
    if (!id || !codpaci || !motivoCita) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const sqlSelect = `SELECT * FROM citas WHERE id = ? AND estado = 'Disponible'`;
    db.query(sqlSelect, [id], (err, resultSelect) => {
        if (err) {
            console.error('Error al verificar la cita:', err);
            return res.status(500).json({ message: 'Error al verificar la cita' });
        }

        if (resultSelect.length === 0) {
            return res.status(404).json({ message: 'La cita no está disponible o no existe' });
        }

        const sql = `UPDATE citas 
                     SET codpaci = ?, motivo_cita = ?, estado = 'Reservada' 
                     WHERE id = ? AND estado = 'Disponible'`;

        db.query(sql, [codpaci, motivoCita, id], (err, result) => {
            if (err) {
                console.error('Error al reservar la cita:', err);
                return res.status(500).json({ message: 'Error al reservar la cita' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'La cita no está disponible o no existe' });
            }

            return res.json({ message: 'Cita reservada correctamente' });
        });
    });
};

const cancelarCita = (req, res) => {
    const { id, codpaci } = req.body;
    if (!id || !codpaci) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    const sql = `UPDATE citas 
                 SET codpaci = NULL, motivo_cita = '', estado = 'Disponible' 
                 WHERE id = ? AND codpaci = ? AND estado = 'Reservada'`;

    db.query(sql, [id, codpaci], (err, result) => {
        if (err) {
            console.error("Error al cancelar la cita:", err);
            return res.status(500).json({ message: "Error al cancelar la cita" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró la cita o no está reservada" });
        }

        return res.json({ message: "Cita cancelada correctamente" });
    });
};

const generarCitas = async (req, res) => {
    const { coddoc, codhor, hora_inicio, hora_fin } = req.body;

    if (!coddoc || !codhor || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    await db.query(`CALL GenerarCitas(?, ?, ?, ?, 'Disponible')`, [
        coddoc, codhor, hora_inicio, hora_fin
    ]);

    await db.query(
        `UPDATE horario SET estado = 'Activo' WHERE coddoc = ?`,
        [coddoc]
    );

    res.json({ message: 'Citas generadas correctamente y horario actualizado a Activo' });
};

const createCita = async (req, res) => {
    try {
        const { codpaci, coddoc, fecha, hora, estado, motivo_cita } = req.body;

        if (!codpaci || !coddoc || !fecha || !hora || !estado || !motivo_cita) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const sql = `INSERT INTO citas (codpaci, coddoc, fecha, hora, estado, motivo_cita) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [codpaci, coddoc, fecha, hora, estado, motivo_cita], (err, result) => {
            if (err) {
                console.error("Error al insertar cita:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }
            res.status(201).json({ message: "Cita guardada exitosamente", id: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};

const updateCita = (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE citas SET ? WHERE id = ?';

    db.query(sql, [updates, id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expediente no encontrado" });
        }
        return res.json({ message: "Expediente actualizado" });
    });
};

const deleteCita = async (req, res) => {
    const { id } = req.params;
    try {
        db.query('DELETE FROM citas WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar la cita:', err);
                return res.status(500).json({ error: 'Error al eliminar la cita' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Cita no encontrada" });
            }
            res.json({ message: 'Cita eliminada con éxito' });
        });
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const deleteAllCitasByDoctor = (req, res) => {
    const { coddoc } = req.params;
    const sqlDelete = 'DELETE FROM citas WHERE coddoc = ?';

    db.query(sqlDelete, [coddoc], (err, result) => {
        if (err) {
            console.error('Error al eliminar las citas:', err);
            return res.status(500).json({ message: 'Error al eliminar las citas', error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontraron citas para este doctor' });
        }

        const sqlUpdate = 'UPDATE horario SET estado = "inactivo" WHERE coddoc = ?';

        db.query(sqlUpdate, [coddoc], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error al actualizar el estado del horario:', updateErr);
                return res.status(500).json({ message: 'Error al actualizar el estado del horario', error: updateErr });
            }

            return res.json({ message: 'Todas las citas del doctor eliminadas y horario actualizado a inactivo correctamente' });
        });
    });
};



module.exports = { getCitas, reservarCita, generarCitas, createCita, updateCita, deleteCita, deleteAllCitasByDoctor, getCitasById,cancelarCita };
