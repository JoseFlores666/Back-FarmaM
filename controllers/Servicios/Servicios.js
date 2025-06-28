const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('../Perfil-Empresa/CrudAuditoria');

const getServicios = async (req, res) => {
    const sql = `
        SELECT 
            s.id,
            s.nombre,
            s.descripcion,
            s.imagen,
            s.costo,
            s.descuento,
            COUNT(ds.doctor_id) AS cantidad_doctores
        FROM 
            servicios s
        LEFT JOIN 
            doctor_servicios ds ON ds.servicio_id = s.id
        GROUP BY 
            s.id, s.nombre, s.descripcion
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const getServiciosAsignadosCount = (req, res) => {
    const { coddoc } = req.params;

    const sql = `
        SELECT COUNT(*) AS total_servicios_asignados
        FROM doctor_servicios
        WHERE doctor_id = ?
    `;

    db.query(sql, [coddoc], (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result[0]); 
    });
};


const getServiciosDelDoctor = (req, res) => {
    const { coddoc } = req.params;

    const sql = `
        SELECT 
            s.id,
            s.nombre,
            s.descripcion
        FROM 
            servicios s
        INNER JOIN 
            doctor_servicios ds ON ds.servicio_id = s.id
        WHERE 
            ds.doctor_id = ?
    `;

    db.query(sql, [coddoc], (err, result) => {
        if (err) {
            console.error('Error al obtener servicios del doctor:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        return res.json(result); // Esto se usa en setServiciosAsignados() en el frontend
    });
};


const crearServicios = (req, res) => {
    const { nombre, descripcion, imagen, id_usuario, costo, descuento } = req.body;

    if (!nombre || !descripcion || !imagen || costo === undefined || descuento === undefined) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const sql = "INSERT INTO servicios (nombre, descripcion, imagen, costo, descuento) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [nombre, descripcion, imagen, costo, descuento], (err, result) => {
        if (err) {
            console.error('Error al insertar servicio:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        const newData = { id: result.insertId, nombre, descripcion, imagen, costo, descuento };
        const oldData = JSON.stringify({ message: "N/A" });
        createAudit(id_usuario, "CREATE", "servicios", oldData, JSON.stringify(newData));

        return res.status(201).json({ message: "Servicio agregado con éxito", id: result.insertId });
    });
};

const updateServicios = (req, res) => {
    const { id } = req.params; 
    const { nombre, descripcion, imagen, id_usuario, costo, descuento } = req.body;

    const sql = "UPDATE servicios SET nombre = ?, descripcion = ?, imagen = ?, costo = ?, descuento = ? WHERE id = ?";
    db.query(sql, [nombre, descripcion, imagen, costo, descuento, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar servicio:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el servicio para actualizar" });
        }

        const newData = { id, nombre, descripcion, imagen, costo, descuento };

        const selectQuery = "SELECT * FROM servicios WHERE id = ?";
        db.query(selectQuery, [id], (error, result) => {
            if (error) {
                console.error("Error al consultar servicio:", error);
                return res.status(500).json({ message: "Error al consultar servicio", error });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const oldData = result[0];
            createAudit(id_usuario, "UPDATE", "servicios", JSON.stringify(oldData), JSON.stringify(newData));

            return res.json({ message: "Servicio actualizado con éxito" });
        });
    });
};



const deleteServicios = (req, res) => {
    const { id } = req.params;
    const { id_usuario } = req.body;

    const getOldDataSql = "SELECT * FROM servicios WHERE id = ?";
    db.query(getOldDataSql, [id], (err, rows) => {
        if (err) {
            console.error("Error al obtener los datos anteriores:", err);
            return res.status(500).json({ message: "Error al obtener los datos anteriores" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "servicio no encontrado" });
        }

        const valorEliminado = rows[0];

        const deleteSql = "DELETE FROM servicios WHERE id = ?";
        db.query(deleteSql, [id], (err) => {
            if (err) {
                console.error("Error al eliminar valor:", err);
                return res.status(500).json({ error: "Error al eliminar valor" });
            }

            createAudit(id_usuario, "DELETE", "servicios", JSON.stringify(valorEliminado), JSON.stringify({ message: "N/A" }));

            res.json({ success: true, message: "servicio eliminado correctamente", valorEliminado });
        });
    });
};

const asignarServiciosDoctor = (req, res) => {
    const { coddoc } = req.params;
    const { servicios } = req.body;

    if (!Array.isArray(servicios)) {
        return res.status(400).json({ message: 'El campo servicios debe ser un arreglo' });
    }

    const deleteQuery = 'DELETE FROM doctor_servicios WHERE doctor_id = ?';
    db.query(deleteQuery, [coddoc], (err) => {
        if (err) {
            console.error('Error al eliminar servicios anteriores:', err);
            return res.status(500).json({ message: 'Error al eliminar servicios anteriores' });
        }

        if (servicios.length === 0) {
            return res.json({ message: 'Servicios eliminados correctamente' });
        }

        const insertQuery = 'INSERT INTO doctor_servicios (doctor_id, servicio_id) VALUES ?';
        const values = servicios.map(id => [coddoc, id]);

        db.query(insertQuery, [values], (err) => {
            if (err) {
                console.error('Error al asignar servicios:', err);
                return res.status(500).json({ message: 'Error al asignar servicios' });
            }

            return res.json({ message: 'Servicios actualizados correctamente' });
        });
    });
};






module.exports = { getServicios, crearServicios, updateServicios, deleteServicios, asignarServiciosDoctor,getServiciosAsignadosCount,getServiciosDelDoctor };
