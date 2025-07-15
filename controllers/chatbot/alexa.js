const express = require('express');
const router = express.Router();
const db = require('../../config/db');

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

const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

const obtServicios = (req, res) => {
  const sql = "SELECT nombre, imagen FROM servicios";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });

    const listItems = result.map(s => ({
      nombre: s.nombre,
      primaryText: capitalizeFirstLetter(s.nombre),
      imageSource: s.imagen
    }));

    const text = result.map(s =>
      capitalizeFirstLetter(s.nombre)
    ).join('. ');

    res.json({
      text,
      imageListData: {
        type: "object",
        objectId: "serviciosList",
        title: "Servicios médicos disponibles",
        listItems
      }
    });
  });
};

const obtServiciosDet = (req, res) => {
  const nombreBuscado = req.query.nombre; 

  if (!nombreBuscado) {
    return res.status(400).json({ message: "Falta el parámetro 'nombre'" });
  }

  const sql = "SELECT nombre, descripcion, costo, descuento, imagen FROM servicios WHERE LOWER(nombre) = LOWER(?)";

  db.query(sql, [nombreBuscado], (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (result.length === 0) return res.status(404).json({ message: "Servicio no encontrado" });

    const s = result[0];

    const servicioDetalle = {
      detailImageRightData: {
        type: "object",
        objectId: "servicioDetalle",
        image: {
          contentDescription: s.nombre,
          sources: [
            { url: s.imagen }
          ]
        },
        textContent: {
          primaryText: {
            type: "PlainText",
            text: capitalizeFirstLetter(s.nombre)
          },
          secondaryText: {
            type: "PlainText",
            text: capitalizeFirstLetter(s.descripcion)
          },
          locationText: {
            type: "PlainText",
            text: `Costo: $${s.costo}. Descuento: ${s.descuento}%`
          }
        }
      }
    };

    res.json(servicioDetalle);
  });
};

const obtContacto = (req, res) => {
  const sql = "SELECT direccion, email, telefono FROM datos_contacto";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

const obtenerDoctoresConEspecialidad = (req, res) => {
  const sql = `
    SELECT 
          d.coddoc,
      CONCAT(d.nomdoc, ' ', d.apepaternodoc, ' ', d.apematernodoc) AS nombre_completo,
      e.titulo AS especialidad,
      d.foto_doc AS imagen 
    FROM doctor d
    JOIN especialidad e ON d.codespe = e.codespe
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });

    const listItems = result.map(d => ({
      primaryText: d.nombre_completo,
      secondaryText: d.especialidad,
      imageSource: d.imagen || "https://via.placeholder.com/200x200.png?text=Doctor",
      token: d.coddoc 
    }));

    const text = result.map(d => {
      return `${d.nombre_completo}, ${d.especialidad}`;
    }).join('. ');

    res.json({
      text,
      imageListData: {
        type: "object",
        objectId: "personalList",
        title: "Personal Médico",
        listItems
      }
    });
  });
};
const obtServiciosDoctor = (req, res) => {
  let { coddoc } = req.params;

  if (!coddoc) {
    return res.status(400).json({ message: "Falta el parámetro coddoc en la ruta" });
  }

  coddoc = coddoc.trim();

  const coddocNum = Number(coddoc);
  if (isNaN(coddocNum)) {
    return res.status(400).json({ message: "El parámetro coddoc debe ser un número válido" });
  }

  const sql = `
    SELECT 
      s.id,
      s.nombre
    FROM doctor d
    JOIN doctor_servicios ds ON d.coddoc = ds.doctor_id
    JOIN servicios s ON ds.servicio_id = s.id
    WHERE d.coddoc = ?
  `;

  db.query(sql, [coddocNum], (err, result) => {
    if (err) {
      console.error("Error al obtener servicios del doctor:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (!result || result.length === 0) {
      return res.json({
        text: "No se encontraron servicios para este doctor.",
        textListData: {
          type: "object",
          objectId: "serviciosDoctorList",
          title: "Servicios del Doctor",
          listItems: []
        }
      });
    }

    const listItems = result.map(s => ({
      id: s.id.toString(),
      primaryText: s.nombre  
    }));

    const text = "Servicios del doctor: " + listItems.map(s => s.primaryText).join(", ");

    res.json({
      text,
      textListData: {
        type: "object",
        objectId: "serviciosDoctorList",
        title: "Servicios del Doctor",
        listItems
      }
    });
  });
};

module.exports = {
  obtServicios,
  obtContacto,
  getEmpresaChat,
  obtServiciosDet,
  obtenerDoctoresConEspecialidad,
  obtServiciosDoctor
};
