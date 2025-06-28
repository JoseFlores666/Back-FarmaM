const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria')
const jwt = require('jsonwebtoken');

const getEmpresa = async (req, res) => {
    const sql = "SELECT * FROM empresa";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const updateEmpresa = async (req, res) => {
    const { id } = req.params;
    const { id_usuario, nombre, nosotros, mision, vision, eslogan } = req.body;

    const sqlSelect = "SELECT nombre, nosotros, mision, vision, eslogan FROM empresa WHERE id = ?";
    
    db.query(sqlSelect, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener los datos de la empresa:', err);
            return res.status(500).json({ message: "Error en el servidor al obtener los datos." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Empresa no encontrada." });
        }

        const oldData = results[0]; 

        const sqlUpdate = `
            UPDATE empresa 
            SET 
                nombre = ?, 
                nosotros = ?, 
                mision = ?, 
                vision = ?, 
                eslogan = ?
            WHERE id = ?
        `;

        db.query(sqlUpdate, [nombre, nosotros, mision, vision, eslogan, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar los datos de la empresa:', err);
                return res.status(500).json({ message: "Error en el servidor al actualizar los datos." });
            }

            if (result.affectedRows > 0) {
                const updatedData = {
                    nombre,
                    nosotros,
                    mision,
                    vision,
                    eslogan
                };

                createAudit(id_usuario, "UPDATE", "empresa", JSON.stringify({ oldData }),JSON.stringify({updatedData }));
            }

            return res.status(200).json({ success: true, message: "Datos de la empresa actualizados correctamente." });
        });
    });
};


const getEmpresaChat = async (req, res) => {
  const sql = `
    SELECT 
      e.*, 
      v.nombre AS valor_nombre, v.descripcion AS valor_descripcion,
      en.nombre AS enlace_nombre, en.url AS enlace_url,
      s.nombre AS servicio_nombre, s.descripcion AS servicio_descripcion, s.costo AS servicio_costo, s.descuento AS servicio_descuento,
      h.dia AS horario_dia, h.hora_inicio AS horario_hora_inicio, h.hora_fin AS horario_hora_fin, h.activo AS horario_activo
    FROM empresa e
    LEFT JOIN valores v ON v.empresa_id = e.id
    LEFT JOIN enlaces en ON en.empresa_id = e.id
    LEFT JOIN servicios s ON s.empresa_id = e.id
    LEFT JOIN horario_empresa h ON h.empresa_id = e.id
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (!rows || rows.length === 0) return res.status(404).json({ message: "No se encontró la empresa" });

    const empresa = { ...rows[0] };
    delete empresa.valor_nombre;
    delete empresa.valor_descripcion;
    delete empresa.enlace_nombre;
    delete empresa.enlace_url;
    delete empresa.servicio_nombre;
    delete empresa.servicio_descripcion;
    delete empresa.servicio_costo;
    delete empresa.servicio_descuento;
    delete empresa.horario_dia;
    delete empresa.horario_hora_inicio;
    delete empresa.horario_hora_fin;
    delete empresa.horario_activo;

    const servicios = [];
    const valores = [];
    const enlaces = [];
    const horario_empresa = [];

    const added = { servicios: new Set(), valores: new Set(), enlaces: new Set(), horarios: new Set() };

    rows.forEach(row => {
      if (row.servicio_nombre && !added.servicios.has(row.servicio_nombre)) {
        servicios.push({
          nombre: row.servicio_nombre,
          descripcion: row.servicio_descripcion,
          costo: row.servicio_costo,
          descuento: row.servicio_descuento
        });
        added.servicios.add(row.servicio_nombre);
      }

      if (row.valor_nombre && !added.valores.has(row.valor_nombre)) {
        valores.push({
          nombre: row.valor_nombre,
          descripcion: row.valor_descripcion
        });
        added.valores.add(row.valor_nombre);
      }

      if (row.enlace_nombre && !added.enlaces.has(row.enlace_nombre)) {
        enlaces.push({
          nombre: row.enlace_nombre,
          url: row.enlace_url
        });
        added.enlaces.add(row.enlace_nombre);
      }

      if (row.horario_dia && row.horario_hora_inicio && !added.horarios.has(`${row.horario_dia}-${row.horario_hora_inicio}`)) {
        horario_empresa.push({
          dia: row.horario_dia,
          hora_inicio: row.horario_hora_inicio,
          hora_fin: row.horario_hora_fin,
          activo: row.horario_activo
        });
        added.horarios.add(`${row.horario_dia}-${row.horario_hora_inicio}`);
      }
    });

    return res.json({
      empresa,
      valores,
      enlaces,
      servicios,
      horario_empresa
    });
  });
};



module.exports = { getEmpresa,updateEmpresa,getEmpresaChat };
