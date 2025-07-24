const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('../Perfil-Empresa/CrudAuditoria');
const cloudinary = require('cloudinary').v2;

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

const getServicioById = (req, res) => {
  const { id } = req.params;

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
      WHERE 
          s.id = ?
      GROUP BY 
          s.id, s.nombre, s.descripcion, s.imagen, s.costo, s.descuento
  `;

  db.query(sql, [id], (err, result) => {
      if (err) {
          console.error('Error al obtener el servicio por ID:', err);
          return res.status(500).json({ message: "Error en el servidor" });
      }

      if (result.length === 0) {
          return res.status(404).json({ message: "Servicio no encontrado" });
      }

      return res.json(result[0]);
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

const crearServicios = async (req, res) => {
  const { nombre, descripcion, id_usuario, costo, descuento } = req.body;
  const file = req.file;

  if (!nombre || !descripcion || !file || costo === undefined || descuento === undefined || !id_usuario) {
    return res.status(400).json({ message: "Todos los campos son obligatorios, incluyendo la imagen y id_usuario" });
  }

  try {
    // Aquí ya no es necesario volver a subir a Cloudinary, solo usamos los datos generados por multer-storage-cloudinary
    const imagenUrl = file.path;        // URL segura generada por multer-storage-cloudinary
    const public_id = file.filename;    // public_id generado por Cloudinary (equivale a 'filename')

    const sql = "INSERT INTO servicios (nombre, descripcion, imagen, public_id, costo, descuento) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [nombre, descripcion, imagenUrl, public_id, costo, descuento], (err, result) => {
      if (err) {
        console.error('Error al insertar servicio:', err);
        return res.status(500).json({ message: "Error en el servidor" });
      }

      const newData = { id: result.insertId, nombre, descripcion, imagen: imagenUrl, costo, descuento };
      const oldData = JSON.stringify({ message: "N/A" });

      createAudit(id_usuario, "CREATE", "servicios", oldData, JSON.stringify(newData));

      return res.status(201).json({ message: "Servicio agregado con éxito", id: result.insertId });
    });
  } catch (error) {
    console.error("Error en el proceso:", error);
    return res.status(500).json({ message: "Error procesando la solicitud" });
  }
};
const updateServicios = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, id_usuario, costo, descuento } = req.body;
  const nuevaImagen = req.file;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario es requerido para la auditoría" });
  }

  const getOldDataSql = "SELECT * FROM servicios WHERE id = ?";
  db.query(getOldDataSql, [id], async (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(500).json({ message: "Error al obtener datos anteriores" });
    }

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

    const updateSql = `
      UPDATE servicios 
      SET nombre = ?, descripcion = ?, imagen = ?, public_id = ?, costo = ?, descuento = ?
      WHERE id = ?
    `;
    const params = [nombre, descripcion, imagenUrl, public_id, costo, descuento, id];

    db.query(updateSql, params, (err) => {
      if (err) return res.status(500).json({ message: "Error al actualizar servicio" });

      const newData = {
        id,
        nombre,
        descripcion,
        imagen: imagenUrl,
        public_id,
        costo,
        descuento
      };

      createAudit(id_usuario, "UPDATE", "servicios", JSON.stringify(oldData), JSON.stringify(newData));

      res.json({ success: true, message: "Servicio actualizado correctamente", newData });
    });
  });
};


const deleteServicios = (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario es requerido para la auditoría" });
  }

  const getOldDataSql = "SELECT * FROM servicios WHERE id = ?";
  db.query(getOldDataSql, [id], async (err, rows) => {
    if (err) {
      console.error("Error al obtener los datos anteriores:", err);
      return res.status(500).json({ message: "Error al obtener los datos anteriores" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const valorEliminado = rows[0];

    // Eliminar imagen de Cloudinary si existe
    if (valorEliminado.public_id) {
      try {
        await cloudinary.uploader.destroy(valorEliminado.public_id);
      } catch (err) {
        console.error("Error al eliminar imagen de Cloudinary:", err);
      }
    }

    const deleteSql = "DELETE FROM servicios WHERE id = ?";
    db.query(deleteSql, [id], (err) => {
      if (err) {
        console.error("Error al eliminar servicio:", err);
        return res.status(500).json({ message: "Error al eliminar servicio" });
      }

      createAudit(id_usuario, "DELETE", "servicios", JSON.stringify(valorEliminado), JSON.stringify({ message: "Eliminado" }));

      return res.json({ message: "Servicio eliminado correctamente", valorEliminado });
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






module.exports = {getServicioById, getServicios, crearServicios, updateServicios, deleteServicios, asignarServiciosDoctor,getServiciosAsignadosCount,getServiciosDelDoctor };
