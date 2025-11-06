const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const getPerfilbyid = (req, res) => {
    const { id } = req.params;

    const sql = 'SELECT * FROM usuarios WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al obtener los datos del usuario:', err);
            return res.status(500).json({ message: 'Error al obtener los datos del usuario' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.json(result[0]); 
    });
};
const updatePerfilDatos = (req, res) => {
  const { id } = req.params;
  const { nombre, edad, telefono, correo, usuario, apellidoPaterno, apellidoMaterno, genero, id_usuario } = req.body;

  const getOldDataSql = "SELECT * FROM usuarios WHERE id = ?";
  db.query(getOldDataSql, [id], (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ message: "Error al obtener datos anteriores" });

    const oldData = rows[0];

    const updatedData = {
      nombre: nombre || oldData.nombre,
      edad: edad || oldData.edad,
      telefono: telefono || oldData.telefono,
      correo: correo || oldData.correo,
      usuario: usuario || oldData.usuario,
      apellidoPaterno: apellidoPaterno || oldData.apellidoPaterno,
      apellidoMaterno: apellidoMaterno || oldData.apellidoMaterno,
      genero: genero || oldData.genero,
    };

    const updateSql = "UPDATE usuarios SET ? WHERE id = ?";
    db.query(updateSql, [updatedData, id], (err) => {
      if (err) return res.status(500).json({ message: "Error al actualizar datos" });

      createAudit(id_usuario || id, "UPDATE", "usuarios", JSON.stringify(oldData), JSON.stringify(updatedData));

      res.json({ success: true, message: "Datos actualizados correctamente", updatedData });
    });
  });
};

// --------------------
// 2️⃣ Actualizar foto del usuario
// --------------------
const updatePerfilFoto = (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  const nuevaImagen = req.file;

  const getOldDataSql = "SELECT * FROM usuarios WHERE id = ?";
  db.query(getOldDataSql, [id], async (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ message: "Error al obtener datos anteriores" });

    const oldData = rows[0];
    let url = oldData.foto_perfil;
    let public_id = oldData.foto_perfil_public_id;

    if (nuevaImagen) {
      // Eliminar imagen anterior si existe
      if (oldData.foto_perfil_public_id) {
        try {
          await cloudinary.uploader.destroy(oldData.foto_perfil_public_id);
        } catch (error) {
          console.error("Error al eliminar imagen anterior:", error);
        }
      }
      url = nuevaImagen.path;
      public_id = nuevaImagen.filename;
    }

    const updateSql = "UPDATE usuarios SET foto_perfil = ?, foto_perfil_public_id = ? WHERE id = ?";
    db.query(updateSql, [url, public_id, id], (err) => {
      if (err) return res.status(500).json({ message: "Error al actualizar foto" });

      createAudit(id_usuario || id, "UPDATE", "usuarios", JSON.stringify({ foto_perfil: oldData.foto_perfil }), JSON.stringify({ foto_perfil: url }));

      res.json({ success: true, message: "Foto actualizada correctamente", url, public_id });
    });
  });
};

  


module.exports = { updatePerfilDatos, getPerfilbyid,updatePerfilFoto };
