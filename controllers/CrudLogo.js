const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// Configuración de multer para almacenar el archivo
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'logos'), // Carpeta donde se guardarán los logos
    filename: (req, file, cb) => {
        cb(null, 'Logo.png'); // Renombramos el archivo a Logo.png
    },
});

const upload = multer({ storage });

// Función para subir el logo
const uploadLogo = (req, res) => {
    // Utilizamos multer para manejar la subida
    upload.single('logo')(req, res, (err) => {
        if (err) {
            console.error('Error al subir el logo:', err);
            return res.status(500).json({ message: "Error al subir el logo" });
        }

        // Solo actualizamos la base de datos con la nueva ruta
        const logoPath = '/logos/Logo.png'; // Ruta del logo
        const updateSql = "UPDATE logos SET path = ? WHERE id = 1"; // Asegúrate de que hay un logo con id = 1

        db.query(updateSql, [logoPath], (err) => {
            if (err) {
                console.error('Error al actualizar el logo en la base de datos:', err);
                return res.status(500).json({ message: "Error al actualizar el logo" });
            }
            return res.json({ success: "Logo actualizado correctamente", logoPath });
        });
    });
};

// Función para obtener el logo
const getLogo = (req, res) => {
    const sql = "SELECT path FROM logos WHERE id = 1"; // Asegúrate de que solo hay un logo
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

// Función para eliminar un logo
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
