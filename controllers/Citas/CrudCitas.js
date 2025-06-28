const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getCitas = (req, res) => {
    const sql = `
        SELECT c.*, 
               c.id AS codcita,
               c.fecha_creacion,
               c.fecha,
      CONCAT(p.nombre, ' ', p.apellidoPaterno, ' ', p.apellidoMaterno) AS paciente,
    CONCAT(d.nomdoc, ' ', d.apepaternodoc, ' ' , d.apematernodoc) AS doctor,
               e.titulo AS especialidad, 
               h.dia AS dia_horario, 
               h.hora_inicio, 
               h.hora_fin,
               h.estado as estadohorario
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
    const { coddoc } = req.params;

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
        const { codpaci, coddoc, fecha, hora, motivo_cita, servicios } = req.body;
        const io = req.app.get('io');

        if (!codpaci || !coddoc || !fecha || !hora || !motivo_cita) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        if (!Array.isArray(servicios) || servicios.length === 0 || servicios.length > 2) {
            return res.status(400).json({ message: "Debes seleccionar entre 1 y 2 servicios" });
        }

        const sql = `INSERT INTO citas (codpaci, coddoc, fecha, hora, motivo_cita) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [codpaci, coddoc, fecha, hora, motivo_cita], (err, result) => {
            if (err) {
                console.error("Error al insertar cita:", err);
                return res.status(500).json({ message: "Error en el servidor" });
            }

            const citaId = result.insertId;

            // Insertar servicios relacionados
            const insertServiciosSql = `INSERT INTO cita_servicio (cita_id, servicio_id) VALUES ?`;
            const values = servicios.map(servId => [citaId, servId]);

            db.query(insertServiciosSql, [values], (err2) => {
                if (err2) {
                    console.error("Error al insertar servicios de cita:", err2);
                    return res.status(500).json({ message: "Error al guardar los servicios" });
                }

                // Notificación por socket y base de datos
                const titulo = "Cita Asignada";
                const mensaje = `Tu cita fue registrada para el día ${fecha} a las ${hora}.`;

                io.to(`paciente_${codpaci}`).emit("notificacion:nueva", { titulo, mensaje });

                const insertNotiSql = `INSERT INTO notificaciones (codpaci, titulo, mensaje) VALUES (?, ?, ?)`;
                db.query(insertNotiSql, [codpaci, titulo, mensaje], (err3) => {
                    if (err3) {
                        console.error("Error al guardar la notificación:", err3);
                    }
                });

                res.status(201).json({ message: "Cita y servicios guardados exitosamente", id: citaId });
            });
        });
    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};



const reagendarCita = (req, res) => {
    const { id } = req.params;
    const { fecha, hora, codpaci } = req.body;
    const io = req.app.get('io');

    const sql = `
        UPDATE citas
        SET fecha = ?, hora = ?
        WHERE id = ?
    `;

    db.query(sql, [fecha, hora, id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error al reagendar la cita" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cita no encontrada" });
        }

        const titulo = "Cita reagendada";
        const mensaje = `Tu cita fue cambiada para el ${fecha} a las ${hora}.`;

        // Emitir notificación por socket
        io.to(`paciente_${codpaci}`).emit("notificacion:nueva", {
            titulo,
            mensaje,
        });

        // Guardar la notificación en la base de datos
        const insertSql = `
            INSERT INTO notificaciones (codpaci, titulo, mensaje)
            VALUES (?, ?, ?)
        `;

        db.query(insertSql, [codpaci, titulo, mensaje], (insertErr) => {
            if (insertErr) {
                console.error("Error al guardar la notificación:", insertErr);
            }
            return res.json({ message: "Cita reagendada correctamente" });
        });
    });
};

const editarDatosCita = (req, res) => {
    const { id } = req.params;
    const { codpaci, coddoc, motivo_cita, servicios } = req.body;
    const io = req.app.get('io');

    if (!Array.isArray(servicios) || servicios.length === 0 || servicios.length > 2) {
        return res.status(400).json({ message: "Debes seleccionar entre 1 y 2 servicios" });
    }

    const sql = `
      UPDATE citas
      SET codpaci=?, coddoc=?, motivo_cita=?
      WHERE id = ?
    `;

    db.query(sql, [codpaci, coddoc, motivo_cita, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error al editar la cita" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Cita no encontrada" });

        // Borrar servicios anteriores
        const deleteSql = `DELETE FROM cita_servicio WHERE cita_id = ?`;
        db.query(deleteSql, [id], (delErr) => {
            if (delErr) {
                console.error("Error al borrar servicios anteriores:", delErr);
                return res.status(500).json({ message: "Error al actualizar los servicios" });
            }

            // Insertar nuevos servicios
            const insertSql = `INSERT INTO cita_servicio (cita_id, servicio_id) VALUES ?`;
            const values = servicios.map(sid => [id, sid]);

            db.query(insertSql, [values], (insertErr) => {
                if (insertErr) {
                    console.error("Error al insertar nuevos servicios:", insertErr);
                    return res.status(500).json({ message: "Error al guardar los servicios" });
                }

                // Notificación
                const titulo = "Cita modificada";
                const mensaje = "Tu cita fue actualizada por el personal médico.";

                io.to(`paciente_${codpaci}`).emit("notificacion:nueva", { titulo, mensaje });

                const insertNoti = `INSERT INTO notificaciones (codpaci, titulo, mensaje) VALUES (?, ?, ?)`;
                db.query(insertNoti, [codpaci, titulo, mensaje], (err3) => {
                    if (err3) console.error("Error al guardar la notificación:", err3);
                    return res.json({ message: "Cita y servicios actualizados correctamente" });
                });
            });
        });
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



module.exports = { getCitas, generarCitas, createCita, reagendarCita, editarDatosCita, deleteCita, deleteAllCitasByDoctor, getCitasById, cancelarCita };
