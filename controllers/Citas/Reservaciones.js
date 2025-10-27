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

    const sqlCheck = `SELECT * FROM citas WHERE id = ?`;
    db.query(sqlCheck, [codcita], (errCheck, resultCheck) => {
      if (errCheck) {
        console.error('Error al verificar la cita:', errCheck);
        return res.status(500).json({ message: 'Error al verificar la cita' });
      }

      if (resultCheck.length === 0) {
        return res.status(404).json({ message: 'La cita no existe' });
      }

      // 1. Actualizar la cita
      const sqlUpdate = `
        UPDATE citas
        SET 
          codpaci = ?, 
          motivo_cita = ?, 
          estado = 'Reservada'
        WHERE id = ?
      `;
      db.query(sqlUpdate, [paciente.codpaci, paciente.motivo_consulta, codcita], (errUpdate, resultUpdate) => {
        if (errUpdate) {
          console.error('Error al actualizar la cita:', errUpdate);
          return res.status(500).json({ message: 'Error al reemplazar la cita' });
        }

        if (resultUpdate.affectedRows === 0) {
          return res.status(404).json({ message: 'No se encontró la cita para actualizar' });
        }

        // 2. Eliminar servicios anteriores de la cita
        const sqlDeleteServiciosPrevios = `DELETE FROM cita_servicio WHERE cita_id = ?`;
        db.query(sqlDeleteServiciosPrevios, [codcita], (errDelServ) => {
          if (errDelServ) {
            console.error('Error al eliminar servicios anteriores:', errDelServ);
          }

          // 3. Obtener nuevos servicios de lista_espera_servicio
          const sqlServicios = `
            SELECT codservicio 
            FROM lista_espera_servicio 
            WHERE codlista = ?
          `;
          db.query(sqlServicios, [paciente.id], (errServ, servicios) => {
            if (errServ) {
              console.error('Error al consultar servicios:', errServ);
              return res.status(500).json({ message: 'Cita actualizada, pero error al recuperar servicios' });
            }

            if (servicios.length > 0) {
              const insertServicios = `
                INSERT INTO cita_servicio (cita_id, servicio_id) VALUES ?
              `;
              const values = servicios.map(s => [codcita, s.codservicio]);

              db.query(insertServicios, [values], (errInsert) => {
                if (errInsert) {
                  console.error('Error al insertar servicios nuevos:', errInsert);
                }
              });
            }

            // 4. Eliminar paciente de lista_espera
            const sqlDelete = `DELETE FROM lista_espera WHERE id = ?`;
            db.query(sqlDelete, [paciente.id], (errDelete) => {
              if (errDelete) {
                console.error('Error al eliminar de lista de espera:', errDelete);
                return res.status(500).json({ message: 'Cita actualizada, pero no se liberó lista de espera' });
              }

              const sqlCleanServicios = `DELETE FROM lista_espera_servicio WHERE codlista = ?`;
              db.query(sqlCleanServicios, [paciente.id], (errClean) => {
                if (errClean) {
                  console.error('Error al limpiar servicios de lista_espera:', errClean);
                }

                return res.json({
                  message: 'Cita reemplazada automáticamente con paciente de la lista de espera',
                });
              });
            });
          });
        });
      });
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
  const { id, codpaci, motivoCita, servicios, total } = req.body;
  const io = req.app.get('io');

  console.log(req.body);

  if (!id || !codpaci || !motivoCita || total == null) {
    return res.status(400).json({ message: 'Faltan datos requeridos (id, codpaci, motivo o total)' });
  }

  if (!Array.isArray(servicios) || servicios.length === 0 || servicios.length > 2) {
    return res.status(400).json({ message: "Debes seleccionar entre 1 y 2 servicios" });
  }

  // 🔹 Primero verificamos si el usuario tiene un descuento activo
  const sqlDescuento = `SELECT * FROM ruleta_descuentos WHERE id_usuario = ? AND activo = 1 LIMIT 1`;
  db.query(sqlDescuento, [codpaci], (err, resultDesc) => {
    if (err) {
      console.error('Error al verificar descuento:', err);
      return res.status(500).json({ message: 'Error al verificar descuento' });
    }

    let totalFinal = parseFloat(total);
    let descuentoAplicado = "Sin descuento";

    if (resultDesc.length > 0) {
      const descuento = resultDesc[0];
      descuentoAplicado = descuento.premio;

      // 🔸 Aplicar el descuento según el tipo
      if (descuento.premio === "Cita Gratis") {
        totalFinal = 0;
      } else if (descuento.porcentaje_descuento > 0) {
        totalFinal = totalFinal - (totalFinal * (descuento.porcentaje_descuento / 100));
      }

      // 🔸 Marcar el descuento como usado
      const sqlUpdateDescuento = `UPDATE ruleta_descuentos SET activo = 0 WHERE id_descuento = ?`;
      db.query(sqlUpdateDescuento, [descuento.id_descuento], (err2) => {
        if (err2) console.error('Error al actualizar descuento:', err2);
      });
    }

    // 🔹 Verificamos que la cita esté disponible
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

      // 🔹 Actualizamos la cita agregando el total (ya con descuento si aplica)
      const sql = `
        UPDATE citas 
        SET codpaci = ?, motivo_cita = ?, estado = 'Reservada', total = ? 
        WHERE id = ? AND estado = 'Disponible'
      `;

      db.query(sql, [codpaci, motivoCita, totalFinal, id], (err, result) => {
        if (err) {
          console.error('Error al reservar la cita:', err);
          return res.status(500).json({ message: 'Error al reservar la cita' });
        }

        if (result.affectedRows === 0) {
          return res.status(409).json({ message: 'La cita ya fue reservada por otro paciente.' });
        }

        // 🔹 Insertar los servicios de la cita
        const insertSql = `INSERT INTO cita_servicio (cita_id, servicio_id) VALUES ?`;
        const values = servicios.map(sid => [id, sid]);

        db.query(insertSql, [values], (insertErr) => {
          if (insertErr) {
            console.error("Error al guardar los servicios:", insertErr);
            return res.status(500).json({ message: "Cita reservada, pero ocurrió un error al guardar los servicios" });
          }

          // 🔹 Notificación al paciente
          const titulo = "Cita reservada";
          const mensaje =
            descuentoAplicado !== "Sin descuento"
              ? `Tu cita ha sido reservada con éxito. Se aplicó el descuento: ${descuentoAplicado}.`
              : "Tu cita ha sido reservada con éxito.";

          io.to(`paciente_${codpaci}`).emit("notificacion:nueva", { titulo, mensaje });

          const insertNoti = `INSERT INTO notificaciones (codpaci, titulo, mensaje) VALUES (?, ?, ?)`;          
          db.query(insertNoti, [codpaci, titulo, mensaje], (err) => {
            if (err) console.error('Error al insertar notificación:', err);
          });

          // 🔹 Respuesta final
          return res.json({
            message: 'Cita y servicios reservados correctamente con total registrado',
            totalFinal,
            descuentoAplicado
          });
        });
      });
    });
  });
};



const agregarListaEspera = (req, res) => {
  const { codcita, codpaci, motivo_consulta, servicios } = req.body;
  const io = req.app.get('io');

  if (!codcita || !codpaci || !motivo_consulta || !Array.isArray(servicios) || servicios.length === 0) {
    return res.status(400).json({ message: 'Faltan datos requeridos o servicios no válidos' });
  }

  const sqlInsertLista = `
    INSERT INTO lista_espera (codcita, codpaci, motivo_consulta, fecha_registro)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(sqlInsertLista, [codcita, codpaci, motivo_consulta], (err, result) => {
    if (err) {
      console.error('Error al insertar en lista de espera:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    const codlista = result.insertId;

    // Insertar servicios asociados a la lista
    const insertServiciosSql = `
      INSERT INTO lista_espera_servicio (codlista, codservicio) VALUES ?
    `;

    const values = servicios.map(servId => [codlista, servId]);

    db.query(insertServiciosSql, [values], (err2) => {
      if (err2) {
        console.error('Error al insertar servicios en lista de espera:', err2);
        return res.status(500).json({ message: 'Error al guardar los servicios' });
      }

      const titulo = 'Agregado a lista de espera';
      const mensaje = 'Has sido agregado a la lista de espera para la cita seleccionada.';

      io.to(`paciente_${codpaci}`).emit('notificacion:nueva', { titulo, mensaje });

      const insertNoti = `
        INSERT INTO notificaciones (codpaci, titulo, mensaje)
        VALUES (?, ?, ?)
      `;

      db.query(insertNoti, [codpaci, titulo, mensaje], (err3) => {
        if (err3) console.error('Error al insertar notificación:', err3);
        return res.status(201).json({ message: 'Paciente agregado a la lista de espera con servicios' });
      });
    });
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
  const io = req.app.get("io");

  if (!id || !motivoCancelacion) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  // 1. Obtener codpaci de la cita
  const sqlGetCita = `SELECT codpaci FROM citas WHERE id = ?`;

  db.query(sqlGetCita, [id], (err, resultCita) => {
    if (err) {
      console.error("Error al obtener la cita:", err);
      return res.status(500).json({ message: "Error al obtener la cita" });
    }

    if (resultCita.length === 0) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    const codpaci = resultCita[0].codpaci;

    // 2. Obtener pacientes en lista de espera
    const sqlListaEspera = `SELECT codpaci FROM lista_espera WHERE codcita = ?`;

    db.query(sqlListaEspera, [id], (err, listaEspera) => {
      if (err) {
        console.error("Error al consultar lista de espera:", err);
        return res.status(500).json({ message: "Error en servidor" });
      }

      // 3. Notificar al paciente principal
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

      // 5. Eliminar dependencias antes de borrar la cita
      const sqlEliminarCitaServicio = `DELETE FROM cita_servicio WHERE cita_id = ?`;
      db.query(sqlEliminarCitaServicio, [id], (err) => {
        if (err) {
          console.error("Error al eliminar registros en cita_servicio:", err);
          return res.status(500).json({ message: "Error al eliminar dependencias de la cita" });
        }

        // 6. Eliminar lista de espera
        const sqlBorrarListaEspera = `DELETE FROM lista_espera WHERE codcita = ?`;
        db.query(sqlBorrarListaEspera, [id], (err) => {
          if (err) {
            console.error("Error al eliminar lista de espera:", err);
            return res.status(500).json({ message: "Error al limpiar lista de espera" });
          }

          // 7. Finalmente eliminar la cita
          const sqlEliminarCita = `DELETE FROM citas WHERE id = ?`;
          db.query(sqlEliminarCita, [id], (err) => {
            if (err) {
              console.error("Error al eliminar la cita:", err);
              return res.status(500).json({ message: "Error al eliminar la cita" });
            }

            return res.json({
              message: "Cita eliminada correctamente y notificaciones enviadas.",
            });
          });
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



module.exports = { getServiciosDeCita, reservarCita, agregarListaEspera, checkCitaPendiente, getListaEspera, reemplazarCita, deleteListaEspera, cancelarYEliminarCita };
