const connection = require('../../config/db');
const jwt = require('jsonwebtoken');

const createAudit = (req, action_type, table_name, old_data, new_data) => {
  const token = req.cookies.authToken;

  if (!token) {
    console.error('No se encontró la cookie de autenticación.');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin_usuario = decoded.usuario;

    const sql = `INSERT INTO auditoria (admin_usuario, action_type, table_name, old_data, new_data) 
                 VALUES (?, ?, ?, ?, ?)`;

    connection.query(sql, [admin_usuario, action_type, table_name, old_data, new_data], (err) => {
      if (err) {
        console.error('Error al crear el registro de auditoría:', err);
      } else {
        console.log('Registro de auditoría creado exitosamente.');
      }
    });
  } catch (err) {
    console.error('Error al decodificar el token JWT:', err);
  }
};

const getAuditLogs = (req, res) => {
  const sql = "SELECT * FROM auditoria";

  connection.query(sql, (err, result) => {
    if (err) {
      console.error('Error al obtener los registros de auditoría:', err);
      return res.status(500).json({ message: 'Error al obtener los registros de auditoría' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron registros de auditoría' });
    }

    return res.status(200).json(result);
  });
};

module.exports = { createAudit, getAuditLogs };
