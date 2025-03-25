const connection = require('../../config/db');

const createAudit = (id_usuario, action_type, table_name, old_data, new_data) => {
  const sql = `INSERT INTO auditoria (id_usuario, action_type, table_name, old_data, new_data) 
               VALUES (?, ?, ?, ?, ?)`;

  connection.query(sql, [id_usuario, action_type, table_name, old_data, new_data], (err, result) => {
    if (err) {
      console.error("Error al crear el registro de auditoría:", err);
    } else {
      console.log("Registro de auditoría creado exitosamente, ID:", result.insertId);
    }
  });
};

const getAuditLogs = (req, res) => {
  const sql = `
    SELECT a.id, u.nombre AS usuario, a.action_type, a.table_name, a.new_data,a.old_data, a.fecha_creacion
    FROM auditoria a
    LEFT JOIN usuarios u ON a.id_usuario = u.id
    ORDER BY a.fecha_creacion DESC
  `;

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
