const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const cloudinary = require('cloudinary').v2;

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
    MAX(h.estado) AS estado,  -- Tomamos el estado más relevante
COUNT(DISTINCT ds.servicio_id) AS total_servicios_asignados,
    c.precio_base,
            c.descuento
FROM doctor d
JOIN especialidad e ON d.codespe = e.codespe
LEFT JOIN horario h ON d.coddoc = h.coddoc
        LEFT JOIN doctor_servicios ds ON ds.doctor_id = d.coddoc
                LEFT JOIN costos c ON c.doctor_id = d.coddoc
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
  try {
    const { nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, especialidad, password } = req.body;
    const nuevaImagen = req.file;

    // Validación
    if (!nomdoc || !telefo || !correo || !genero || !edad || !apepaternodoc || !apematernodoc || !especialidad || !password || !nuevaImagen) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const imagenUrl = nuevaImagen.path;
    const publicId = nuevaImagen.filename;

    const sql = `
      INSERT INTO doctor 
      (nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, password, foto_doc, public_id, codespe) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      nomdoc, telefo, correo, genero, edad,
      apepaternodoc, apematernodoc, password,
      imagenUrl, publicId, especialidad
    ]);

    res.status(201).json({ message: "Doctor agregado correctamente" });

  } catch (error) {
    console.error('Error al crear doctor:', error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc, especialidad, password } = req.body;
    const nuevaImagen = req.file;

    // Obtener el public_id actual del doctor
    const rows = await new Promise((resolve, reject) => {
      db.query('SELECT public_id FROM doctor WHERE coddoc = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const oldPublicId = rows.length > 0 ? rows[0].public_id : null;

    let imagenUrl = null;
    let newPublicId = null;

    // Si hay nueva imagen, eliminar la antigua de Cloudinary y preparar datos para update
    if (nuevaImagen) {
      if (oldPublicId) {
        const destroyResponse = await cloudinary.uploader.destroy(oldPublicId);
        console.log('Imagen antigua eliminada:', destroyResponse);
      }
      imagenUrl = nuevaImagen.path;
      newPublicId = nuevaImagen.filename;
    }

    // Construir SQL y params según si hay o no nueva imagen
    let sql, params;
    if (imagenUrl && newPublicId) {
      sql = `
        UPDATE doctor 
        SET nomdoc = ?, telefo = ?, correo = ?, genero = ?, edad = ?, apepaternodoc = ?, apematernodoc = ?, 
            password = ?, foto_doc = ?, public_id = ?, codespe = ?
        WHERE coddoc = ?`;
      params = [
        nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc,
        password, imagenUrl, newPublicId, especialidad, id
      ];
    } else {
      sql = `
        UPDATE doctor 
        SET nomdoc = ?, telefo = ?, correo = ?, genero = ?, edad = ?, apepaternodoc = ?, apematernodoc = ?, 
            password = ?, codespe = ?
        WHERE coddoc = ?`;
      params = [
        nomdoc, telefo, correo, genero, edad, apepaternodoc, apematernodoc,
        password, especialidad, id
      ];
    }

    await new Promise((resolve, reject) => {
      db.query(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: "Doctor actualizado correctamente" });

  } catch (error) {
    console.error('Error en updateDoc:', error);
    res.status(500).json({ message: "Error inesperado al actualizar doctor" });
  }
};
const deleteDoc = async (req, res) => {
  const { id } = req.params;
  try {
    // Obtener public_id antes de borrar
    const rows = await new Promise((resolve, reject) => {
      db.query('SELECT public_id FROM doctor WHERE coddoc = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const publicId = rows[0].public_id;

    // Eliminar imagen en Cloudinary si existe publicId
    if (publicId) {
      try {
        const destroyResponse = await cloudinary.uploader.destroy(publicId);
        console.log('Imagen eliminada de Cloudinary:', destroyResponse);
      } catch (err) {
        console.error('Error eliminando imagen en Cloudinary:', err);
        // No interrumpir la eliminación del doctor en BD si falla la imagen
      }
    }

    // Borrar doctor de la base de datos
    const result = await new Promise((resolve, reject) => {
      db.query('DELETE FROM doctor WHERE coddoc = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    res.json({ message: "Doctor eliminado correctamente" });

  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};


const upsertCostosDoctor = (req, res) => {
    const { doctor_id, precio_base, descuento } = req.body;

    if (!doctor_id || precio_base === undefined || descuento === undefined) {
        return res.status(400).json({ message: "Datos incompletos" });
    }

    // Verificar si ya existe costo registrado
    const selectSql = `SELECT * FROM costos WHERE doctor_id = ?`;
    db.query(selectSql, [doctor_id], (err, results) => {
        if (err) {
            console.error("Error al consultar costos:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (results.length > 0) {
            // Actualizar si ya existe
            const updateSql = `UPDATE costos SET precio_base = ?, descuento = ? WHERE doctor_id = ?`;
            db.query(updateSql, [precio_base, descuento, doctor_id], (err2) => {
                if (err2) {
                    console.error("Error al actualizar costos:", err2);
                    return res.status(500).json({ message: "Error al actualizar" });
                }
                return res.json({ message: "Costos actualizados correctamente" });
            });
        } else {
            // Insertar si no existe
            const insertSql = `INSERT INTO costos (doctor_id, precio_base, descuento) VALUES (?, ?, ?)`;
            db.query(insertSql, [doctor_id, precio_base, descuento], (err3) => {
                if (err3) {
                    console.error("Error al insertar costos:", err3);
                    return res.status(500).json({ message: "Error al insertar" });
                }
                return res.json({ message: "Costos creados correctamente" });
            });
        }
    });
};


module.exports = { getDoc, createDoc, updateDoc, deleteDoc,upsertCostosDoctor }