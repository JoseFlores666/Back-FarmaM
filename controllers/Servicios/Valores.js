const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('../Perfil-Empresa/CrudAuditoria');
const cloudinary = require('cloudinary').v2;

const getValores = (req, res) => {
    const sql = "SELECT * FROM valores";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createValor = async (req, res) => {
    const { nombre, descripcion, id_usuario } = req.body;
    const imagen = req.file;

    if (!nombre || !descripcion || !imagen) {
        return res.status(400).json({ message: "Nombre, descripción e imagen son obligatorios" });
    }

    const sql = "INSERT INTO valores (nombre, descripcion, imagen, public_id) VALUES (?, ?, ?, ?)";
    db.query(sql, [nombre, descripcion, imagen.path, imagen.filename], (err, result) => {
        if (err) return res.status(500).json({ message: "Error al insertar el valor" });

        const newData = {
            id: result.insertId,
            nombre,
            descripcion,
            imagen: imagen.path
        };

        const oldData = JSON.stringify({ message: "N/A" });
        createAudit(id_usuario, "CREATE", "valores", oldData, JSON.stringify(newData));

        return res.status(201).json({
            success: true,
            message: "Valor creado correctamente",
            id: result.insertId
        });
    });
};


const updateValores = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, id_usuario } = req.body;
  const nuevaImagen = req.file;

  const getOldDataSql = "SELECT * FROM valores WHERE id = ?";
  db.query(getOldDataSql, [id], async (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ message: "Error al obtener datos anteriores" });

    const oldData = rows[0];
    let imagenUrl = oldData.imagen;
    let public_id = oldData.public_id;

    if (nuevaImagen) {
      if (oldData.public_id) {
        try {
          await cloudinary.uploader.destroy(oldData.public_id);
        } catch (err) {
          console.error("Error al eliminar imagen anterior:", err);
        }
      }
      imagenUrl = nuevaImagen.path;
      public_id = nuevaImagen.filename;
    }

    const updateSql = "UPDATE valores SET nombre = ?, descripcion = ?, imagen = ?, public_id = ? WHERE id = ?";
    const params = [nombre, descripcion, imagenUrl, public_id, id];

    db.query(updateSql, params, (err) => {
      if (err) return res.status(500).json({ message: "Error al actualizar valor" });

      const newData = { id, nombre, descripcion, imagen: imagenUrl, public_id };
      createAudit(id_usuario, "UPDATE", "valores", JSON.stringify(oldData), JSON.stringify(newData));

      res.json({ success: true, message: "Valor actualizado correctamente", newData });
    });
  });
};

const deleteValor = (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;

  const getOldDataSql = "SELECT * FROM valores WHERE id = ?";
  db.query(getOldDataSql, [id], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener los datos anteriores" });

    if (rows.length === 0) {
      return res.status(404).json({ error: "Valor no encontrado" });
    }

    const valorEliminado = rows[0];

    if (valorEliminado.public_id) {
      try {
        const destroyResult = await cloudinary.uploader.destroy(valorEliminado.public_id);
      } catch (err) {
        console.error("Error al eliminar imagen en Cloudinary:", err);
      }
    }

    const deleteSql = "DELETE FROM valores WHERE id = ?";
    db.query(deleteSql, [id], (err) => {
      if (err) return res.status(500).json({ error: "Error al eliminar valor" });

      createAudit(id_usuario, "DELETE", "valores", JSON.stringify(valorEliminado), JSON.stringify({ message: "N/A" }));
      res.json({ success: true, message: "Valor eliminado correctamente", valorEliminado });
    });
  });
};

module.exports = { getValores, createValor, updateValores, deleteValor };
