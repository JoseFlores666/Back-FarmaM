const express = require('express');
const router = express.Router();
const db = require('../config/db');

const getDeslindes = async (req, res) => {
    const sql = "SELECT * FROM deslindes"; 
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Server error" });
        }
        return res.json(result);
    });
};

const createDeslinde = async (req, res) => {
    const { deslinde } = req.body; 
    const sql = "INSERT INTO deslindes (deslinde) VALUES (?)"; 
    db.query(sql, [deslinde], (err, result) => {
        if (err) {
            console.error('Error al crear deslinde:', err);
            return res.status(500).json({ message: "Something unexpected has occurred" + err });
        }
        return res.json({ success: "Deslinde added successfully", id: result.insertId });
    });
};

const updateDeslinde = async (req, res) => {
    const { id } = req.params; 
    const { deslinde } = req.body; 
    
    const sql = "UPDATE deslindes SET deslinde = ? WHERE id = ?";
    db.query(sql, [deslinde, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar deslinde:', err);
            return res.status(500).json({ message: "Error al actualizar deslinde" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Deslinde no encontrado" });
        }
        return res.json({ id, deslinde });
    });
};

const deleteDeslinde = async (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM deslindes WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar deslinde:', err);
            return res.status(500).json({ message: "Something unexpected has occurred" + err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Deslinde no encontrado" });
        }
        return res.json({ success: "Deslinde deleted successfully" });
    });
};

module.exports = {updateDeslinde,deleteDeslinde,createDeslinde,getDeslindes};
