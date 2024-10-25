const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'logos'), 
    filename: (req, file, cb) => {
        cb(null, 'Logo.png'); 
    },
});

const upload = multer({ storage });

const uploadLogo = (req, res) => {
    upload.single('logo')(req, res, (err) => {
        if (err) {
            console.error('Error al subir el logo:', err);
            return res.status(500).json({ message: "Error al subir el logo" });
        }

        const logoPath = '/logos/Logo.png'; 
        const updateSql = "UPDATE logos SET path = ? WHERE id = 1"; 

        db.query(updateSql, [logoPath], (err) => {
            if (err) {
                console.error('Error al actualizar el logo en la base de datos:', err);
                return res.status(500).json({ message: "Error al actualizar el logo" });
            }
            return res.json({ success: "Logo actualizado correctamente", logoPath });
        });
    });
};

const getLogo = (req, res) => {
    const sql = "SELECT path FROM logos WHERE id = 1"; 
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Logo no encontrado" });
        }
        return res.json(result[0]);
    });
};

const deleteLogo = (req, res) => {
    const id = req.params.id; 
    const sql = "DELETE FROM logos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar término:', err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Término no encontrado" });
        }
        return res.json({ success: "Término eliminado correctamente" });
    });
};

module.exports = { getLogo, uploadLogo, deleteLogo };
