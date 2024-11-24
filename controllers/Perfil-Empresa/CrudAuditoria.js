const connection = require('../../config/db');

const createAudit = (admin_id, action_type, table_name, record_id, new_data) => {
  const sql = "INSERT INTO auditoria (admin_id, action_type, table_name, record_id, new_data) VALUES (?, ?, ?, ?, ?)";
  connection.query(sql, [admin_id, action_type, table_name, record_id, JSON.stringify(new_data)], (err, result) => {
    if (err) {
      console.error('Error al crear el registro de auditoría:', err);
    }
  });
};

const getAuditLogs = (req, res) => {
  const sql = "SELECT * FROM auditoria ORDER BY created_at DESC";
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener los registros de auditoría:', err);
      return res.status(500).json({ message: 'Error al obtener los registros de auditoría' });
    }
    res.json(results);
  });
};

module.exports = { createAudit, getAuditLogs };
