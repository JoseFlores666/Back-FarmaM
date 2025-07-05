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

const obtPoliticas = (req, res) => {
  const sql = "SELECT * FROM politicas WHERE estado = 'en proceso' AND vigencia = 'Vigente' LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

const obtDeslinde = (req, res) => {
  const sql = "SELECT * FROM deslinde_legal WHERE estado = 'en proceso' AND vigencia = 'Vigente' LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

const obtAviso = (req, res) => {
  const sql = "SELECT * FROM avisopriv WHERE estado = 'en proceso' AND vigencia = 'Vigente' LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

const obtTerminos = (req, res) => {
  const sql = "SELECT * FROM terminos_condiciones WHERE estado = 'en proceso' AND vigencia = 'Vigente' LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

const obtServicios = (req, res) => {
  const sql = "SELECT nombre, descripcion, costo, descuento FROM servicios";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result);
  });
};

const obtHorario = (req, res) => {
  const sql = "SELECT dia, hora_inicio, hora_fin, activo FROM horario_empresa WHERE activo = 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result);
  });
};

const obtValores = (req, res) => {
  const sql = "SELECT nombre, descripcion FROM valores";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result);
  });
};

const obtEnlaces = (req, res) => {
  const sql = "SELECT nombre, url FROM enlaces";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result);
  });
};

const obtContacto = (req, res) => {
  const sql = "SELECT direccion, email, telefono FROM datos_contacto";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

const obtLogos = (req, res) => {
  const sql = "SELECT url FROM logos WHERE isActive = 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result);
  });
};

const obtNombreEmpresa = (req, res) => {
  const sql = "SELECT nombre FROM empresa LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json({ nombre: result[0]?.nombre });
  });
};

const obtNosotros = (req, res) => {
  const sql = "SELECT nosotros FROM empresa LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json({ nosotros: result[0]?.nosotros });
  });
};

const obtMision = (req, res) => {
  const sql = "SELECT mision FROM empresa LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json({ mision: result[0]?.mision });
  });
};

const obtVision = (req, res) => {
  const sql = "SELECT vision FROM empresa LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json({ vision: result[0]?.vision });
  });
};

const obtEslogan = (req, res) => {
  const sql = "SELECT eslogan FROM empresa LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json({ eslogan: result[0]?.eslogan });
  });
};

const obtInfoEmpresaCompleta = (req, res) => {
  const sql = `SELECT nombre, nosotros, mision, vision, eslogan FROM empresa LIMIT 1`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    res.json(result[0]);
  });
};

module.exports = {
  obtPoliticas,
  obtDeslinde,
  obtAviso,
  obtTerminos,
  obtServicios,
  obtHorario,
  obtValores,
  obtEnlaces,
  obtContacto,
  obtLogos,
  getEmpresaChat,
   obtNombreEmpresa,
  obtNosotros,
  obtMision,
  obtVision,
  obtEslogan,
  obtInfoEmpresaCompleta
};
