const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');
const jwt = require('jsonwebtoken');

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
const updateperfilbyid = (req, res) => {
    const { id } = req.params;
    const { 
        nombre,
        edad,
        telefono,
        correo,
        password,
        usuario,
        apellidoPaterno,
        apellidoMaterno,
        genero,
        foto_perfil 
    } = req.body;
  
    const updatedData = {};
  
    if (nombre) updatedData.nombre = nombre;
    if (edad) updatedData.edad = edad;
    if (telefono) updatedData.telefono = telefono;
    if (correo) updatedData.correo = correo;
    if (password) updatedData.password = password;
    if (usuario) updatedData.usuario = usuario;
    if (apellidoPaterno) updatedData.apellidoPaterno = apellidoPaterno;
    if (apellidoMaterno) updatedData.apellidoMaterno = apellidoMaterno;
    if (genero) updatedData.genero = genero;
    if (foto_perfil) updatedData.foto_perfil = foto_perfil;
  
    if (Object.keys(updatedData).length === 0) {
        return res.status(400).json({ message: "No se ha proporcionado ningún dato para actualizar" });
    }
  
    const sqlSelect = 'SELECT * FROM usuarios WHERE id = ?';
    db.query(sqlSelect, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener los datos del usuario:', err);
            return res.status(500).json({ message: 'Error al obtener los datos del usuario' });
        }
  
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
  
        const currentData = results[0];
  
        const sqlUpdate = 'UPDATE usuarios SET ? WHERE id = ?';
        db.query(sqlUpdate, [updatedData, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar el usuario:', err);
                return res.status(500).json({ message: "Error al actualizar los datos del usuario" });
            }
  
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
  
            createAudit(id, "UPDATE", "usuarios", JSON.stringify(currentData), JSON.stringify(updatedData));
  
            return res.json({ message: "Datos del usuario actualizados correctamente" });
        });
    });
  };
  


module.exports = { updateperfilbyid, getPerfilbyid };
