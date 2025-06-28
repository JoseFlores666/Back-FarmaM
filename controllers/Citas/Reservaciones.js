const express = require('express');
const router = express.Router();
const db = require('../../config/db');

const getListaEspera = (req, res) => {
  const codcita = req.params.codcita;

  const sql = `SELECT le.*, 
           CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno) AS nombre_paciente
    FROM lista_espera le
    LEFT JOIN usuarios u ON le.codpaci = u.id
    WHERE le.codcita = ?`;
  db.query(sql, [codcita], (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: "Error al obtener la lista de espera" });
    }
    return res.json(result);
  });
};

const reemplazarCita = (req, res) => {  
  const { codcita } = req.params;

  if (!codcita) {
    return res.status(400).json({ message: 'Falta el código de la cita' });
  }

  const sqlLista = `
    SELECT * 
    FROM lista_espera 
    ORDER BY fecha_registro ASC 
    LIMIT 1
  `;

  db.query(sqlLista, (errLista, lista) => {
    if (errLista) {
      console.error('Error al consultar lista de espera:', errLista);
      return res.status(500).json({ message: 'Error al consultar lista de espera' });
    }

    if (lista.length === 0) {
      return res.status(404).json({ message: 'No hay pacientes en lista de espera' });
    }

    const paciente = lista[0];

    const sqlCheck = `
      SELECT * 
      FROM citas 
      WHERE id = ?
    `;
    db.query(sqlCheck, [codcita], (errCheck, resultCheck) => {
      if (errCheck) {
        console.error('Error al verificar la cita:', errCheck);
        return res.status(500).json({ message: 'Error al verificar la cita' });
      }

      if (resultCheck.length === 0) {
        return res.status(404).json({ message: 'La cita no existe' });
      }

      // 3. Actualizar la cita con los datos del primer paciente en lista de espera
      const sqlUpdate = `
        UPDATE citas
        SET 
          codpaci = ?, 
          motivo_cita = ?, 
          estado = 'Reservada'
        WHERE id = ?
      `;
      db.query(
        sqlUpdate,
        [paciente.codpaci, paciente.motivo_consulta, codcita],
        (errUpdate, resultUpdate) => {
          if (errUpdate) {
            console.error('Error al actualizar la cita:', errUpdate);
            return res.status(500).json({ message: 'Error al reemplazar la cita' });
          }

          if (resultUpdate.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontró la cita para actualizar' });
          }

          // 4. Eliminar al paciente de la lista de espera
          const sqlDelete = `
            DELETE FROM lista_espera 
            WHERE id = ?
          `;
          db.query(sqlDelete, [paciente.id], (errDelete) => {
            if (errDelete) {
              console.error('Error al eliminar de la lista de espera:', errDelete);
              return res
                .status(500)
                .json({ message: 'Cita actualizada, pero falló liberar lista de espera' });
            }

            // 5. Responder éxito
            return res.json({
              message: 'Cita reemplazada automáticamente con paciente de la lista de espera',
            });
          });
        }
      );
    });
  });
};

const deleteListaEspera = async (req, res) => {
    const { id } = req.params;
    try {
        db.query('DELETE FROM lista_espera WHERE id = ?', [id], (err, result) => {
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
const reservarCita = (req, res) => {
    const { id, codpaci, motivoCita, servicios } = req.body;
    const io = req.app.get('io');

    if (!id || !codpaci || !motivoCita) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    if (!Array.isArray(servicios) || servicios.length === 0 || servicios.length > 2) {
        return res.status(400).json({ message: "Debes seleccionar entre 1 y 2 servicios" });
    }

    const sqlSelect = `SELECT * FROM citas WHERE id = ? AND estado = 'Disponible'`;
    db.query(sqlSelect, [id], (err, resultSelect) => {
        if (err) {
            console.error('Error al verificar la cita:', err);
            return res.status(500).json({ message: 'Error al verificar la cita' });
        }

        if (resultSelect.length === 0) {
            const titulo = 'Agregado a lista de espera';
            const mensaje = 'La cita ya fue reservada. Has sido añadido a la lista de espera.';

            io.to(`paciente_${codpaci}`).emit("notificacion:nueva", { titulo, mensaje });

            const insertSql = `INSERT INTO notificaciones (codpaci, titulo, mensaje) VALUES (?, ?, ?)`;
            db.query(insertSql, [codpaci, titulo, mensaje], (err) => {
                if (err) console.error('Error al insertar notificación:', err);
            });

            return res.status(409).json({ message: mensaje });
        }

        const sql = `
            UPDATE citas 
            SET codpaci = ?, motivo_cita = ?, estado = 'Reservada' 
            WHERE id = ? AND estado = 'Disponible'
        `;

        db.query(sql, [codpaci, motivoCita, id], (err, result) => {
            if (err) {
                console.error('Error al reservar la cita:', err);
                return res.status(500).json({ message: 'Error al reservar la cita' });
            }

            if (result.affectedRows === 0) {
                return res.status(409).json({ message: 'La cita ya fue reservada por otro paciente.' });
            }

            // Insertar servicios
            const insertSql = `INSERT INTO cita_servicio (cita_id, servicio_id) VALUES ?`;
            const values = servicios.map(sid => [id, sid]);

            db.query(insertSql, [values], (insertErr) => {
                if (insertErr) {
                    console.error("Error al guardar los servicios:", insertErr);
                    return res.status(500).json({ message: "Cita reservada, pero ocurrió un error al guardar los servicios" });
                }

                const titulo = "Cita reservada";
                const mensaje = "Tu cita ha sido reservada con éxito.";

                io.to(`paciente_${codpaci}`).emit("notificacion:nueva", { titulo, mensaje });

                const insertNoti = `INSERT INTO notificaciones (codpaci, titulo, mensaje) VALUES (?, ?, ?)`;
                db.query(insertNoti, [codpaci, titulo, mensaje], (err) => {
                    if (err) console.error('Error al insertar notificación:', err);
                });

                return res.json({ message: 'Cita y servicios reservados correctamente' });
            });
        });
    });
};



const agregarListaEspera = (req, res) => {
  const { codcita, codpaci, motivo_consulta } = req.body;
  const io = req.app.get('io');

  if (!codcita || !codpaci || !motivo_consulta) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  const sql = `
    INSERT INTO lista_espera (codcita, codpaci, motivo_consulta, fecha_registro)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(sql, [codcita, codpaci, motivo_consulta], (err, result) => {
    if (err) {
      console.error('Error al insertar en lista de espera:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    const titulo = 'Agregado a lista de espera';
    const mensaje = 'Has sido agregado a la lista de espera para la cita seleccionada.';

    // Emitir notificación al paciente vía socket
    io.to(`paciente_${codpaci}`).emit('notificacion:nueva', {
      titulo,
      mensaje,
    });

    // Insertar notificación en la base de datos
    const insertSql = `
      INSERT INTO notificaciones (codpaci, titulo, mensaje)
      VALUES (?, ?, ?)
    `;

    db.query(insertSql, [codpaci, titulo, mensaje], (err) => {
      if (err) {
        console.error('Error al insertar notificación:', err);
      }
    });

    return res.status(201).json({ message: 'Paciente agregado a la lista de espera' });
  });
};


const checkCitaPendiente = (req, res) => {
  const { codpaci } = req.query;

  if (!codpaci) {
    return res.status(400).json({ message: 'Falta el parámetro codpaci' });
  }

  const sql = `
    SELECT * FROM citas 
    WHERE codpaci = ? AND estado = 'Reservada'
    LIMIT 1
  `;

  db.query(sql, [codpaci], (err, results) => {
    if (err) {
      console.error('Error al verificar cita pendiente:', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (results.length > 0) {
      return res.json({ tieneCitaPendiente: true });
    } else {
      return res.json({ tieneCitaPendiente: false });
    }
  });
};
const cancelarYEliminarCita = (req, res) => {
  const { id, motivoCancelacion } = req.body;
  const io = req.app.get('io');

  if (!id || !motivoCancelacion) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  // 1. Obtener codpaci de la cita
  const sqlGetCita = `SELECT codpaci FROM citas WHERE id = ?`;

  db.query(sqlGetCita, [id], (err, resultCita) => {
    if (err) {
      console.error('Error al obtener la cita:', err);
      return res.status(500).json({ message: 'Error al obtener la cita' });
    }

    if (resultCita.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const codpaci = resultCita[0].codpaci;

    // 2. Obtener pacientes en lista de espera (antes de borrar)
    const sqlListaEspera = `SELECT codpaci FROM lista_espera WHERE codcita = ?`;

    db.query(sqlListaEspera, [id], (err, listaEspera) => {
      if (err) {
        console.error('Error al consultar lista de espera:', err);
        return res.status(500).json({ message: 'Error en servidor' });
      }

      // 3. Notificación al paciente cuya cita fue cancelada
      const tituloPaciente = "Cita cancelada y eliminada";
      const mensajePaciente = `Tu cita fue cancelada por el siguiente motivo: ${motivoCancelacion}`;

      io.to(`paciente_${codpaci}`).emit("notificacion:nueva", {
        titulo: tituloPaciente,
        mensaje: mensajePaciente,
      });

      const insertNotiSql = `
        INSERT INTO notificaciones (codpaci, titulo, mensaje)
        VALUES (?, ?, ?)
      `;
      db.query(insertNotiSql, [codpaci, tituloPaciente, mensajePaciente]);

      // 4. Notificar a pacientes en lista de espera
      const tituloLista = "Cita cancelada";
      const mensajeLista = "Una cita que esperabas fue cancelada. Revisa otras opciones disponibles.";

      listaEspera.forEach(({ codpaci }) => {
        io.to(`paciente_${codpaci}`).emit("notificacion:nueva", {
          titulo: tituloLista,
          mensaje: mensajeLista,
        });

        db.query(insertNotiSql, [codpaci, tituloLista, mensajeLista]);
      });

      // 5. Borrar lista de espera
      const sqlBorrarListaEspera = `DELETE FROM lista_espera WHERE codcita = ?`;
      db.query(sqlBorrarListaEspera, [id], (err) => {
        if (err) {
          console.error('Error al eliminar lista de espera:', err);
          return res.status(500).json({ message: 'Error al limpiar lista de espera' });
        }

        // 6. Eliminar la cita
        const sqlEliminar = `DELETE FROM citas WHERE id = ?`;
        db.query(sqlEliminar, [id], (err) => {
          if (err) {
            console.error('Error al eliminar la cita:', err);
            return res.status(500).json({ message: 'Error al eliminar la cita' });
          }

          return res.json({ message: 'Cita eliminada y notificaciones enviadas' });
        });
      });
    });
  });
};

const getServiciosDeCita = (req, res) => {
  const { codcita } = req.params;

  const sql = `
    SELECT s.id, s.nombre, s.descripcion
    FROM cita_servicio cs
    INNER JOIN servicios s ON s.id = cs.servicio_id
    WHERE cs.cita_id = ?
  `;

  db.query(sql, [codcita], (err, result) => {
    if (err) {
      console.error("Error al obtener servicios de la cita:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    return res.json(result);
  });
};



module.exports = { reservarCita,agregarListaEspera,checkCitaPendiente,getListaEspera,reemplazarCita,deleteListaEspera,cancelarYEliminarCita };
