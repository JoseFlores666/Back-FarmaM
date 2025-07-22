const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const cloudinary = require('cloudinary').v2;

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

const crearEspecialidad = async (req, res) => {
  try {
    const { titulo, detalles } = req.body;
    const nuevaImagen = req.file;
    if (!titulo || !detalles || !nuevaImagen) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const imagenUrl = nuevaImagen.path;     
    const publicId = nuevaImagen.filename;  

    const sql = "INSERT INTO especialidad (titulo, detalles, imagen, public_id) VALUES (?, ?, ?, ?)";
    db.query(sql, [titulo, detalles, imagenUrl, publicId], (err, result) => {
      if (err) {
        console.error('Error al insertar especialidad:', err);
        return res.status(500).json({ message: "Error en el servidor" });
      }

      return res.status(201).json({ 
        message: "Especialidad agregada con éxito", 
        id: result.insertId,
        titulo,
        detalles,
        imagen: imagenUrl
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error inesperado" });
  }
};

const updateEspecialidad = async (req, res) => {
  try {
    const { codespe } = req.params;
    const { titulo, detalles } = req.body;
    const nuevaImagen = req.file;

    const rows = await new Promise((resolve, reject) => {
      db.query('SELECT public_id FROM especialidad WHERE codespe = ?', [codespe], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const oldPublicId = rows.length > 0 ? rows[0].public_id : null;

    let imagenUrl = null;
    let newPublicId = null;

    if (nuevaImagen) {
      if (oldPublicId) {
        const destroyResponse = await cloudinary.uploader.destroy(oldPublicId);
        console.log('Respuesta al eliminar imagen antigua:', destroyResponse);
      }
      imagenUrl = nuevaImagen.path;
      newPublicId = nuevaImagen.filename;
    }

    let sql, params;
    if (imagenUrl && newPublicId) {
      sql = "UPDATE especialidad SET titulo = ?, detalles = ?, imagen = ?, public_id = ? WHERE codespe = ?";
      params = [titulo, detalles, imagenUrl, newPublicId, codespe];
    } else {
      sql = "UPDATE especialidad SET titulo = ?, detalles = ? WHERE codespe = ?";
      params = [titulo, detalles, codespe];
    }

    await new Promise((resolve, reject) => {
      db.query(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: "Especialidad actualizada con éxito" });
  } catch (error) {
    console.error('Error en updateEspecialidad:', error);
    res.status(500).json({ message: "Error inesperado al actualizar especialidad" });
  }
};

const deleteEspecialidad = async (req, res) => {
  const { codespe } = req.params;

  try {
    const rows = await new Promise((resolve, reject) => {
      db.query('SELECT public_id FROM especialidad WHERE codespe = ?', [codespe], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!rows.length) {
      return res.status(404).json({ message: "No se encontró la especialidad para eliminar" });
    }

    const publicId = rows[0].public_id;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    db.query('DELETE FROM especialidad WHERE codespe = ?', [codespe], (err, result) => {
      if (err) {
        console.error('Error al eliminar especialidad:', err);
        return res.status(500).json({ message: "Error en el servidor" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "No se encontró la especialidad para eliminar" });
      }
      res.json({ message: "Especialidad eliminada con éxito" });
    });

  } catch (error) {
    console.error('Error en deleteEspecialidad:', error);
    res.status(500).json({ message: "Error al eliminar la especialidad" });
  }
};




module.exports = { getEspecialidades, crearEspecialidad, updateEspecialidad, deleteEspecialidad };
