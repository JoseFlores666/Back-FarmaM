const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');

const getEnlaces = async (req, res) => {
    const sql = "SELECT * FROM enlaces";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.json(result);
    });
};

const createEnlace = async (req, res) => {
    const { nombre, url, id_usuario } = req.body;
    console.log(req.body);

    const sql = "INSERT INTO enlaces (nombre, url) VALUES (?, ?)";

    db.query(sql, [nombre, url], (err, result) => {
        if (err) {
            console.error("Error al crear enlace:", err);
            return res.status(500).json({ message: "Ocurrió un error inesperado" });
        }

        const newData = { id: result.insertId, nombre, url };
        const oldData = JSON.stringify({ message: "N/A" });  

        createAudit(id_usuario, "CREATE", "enlaces", oldData, JSON.stringify(newData));

        return res.json({ success: "Enlace agregado correctamente", id: result.insertId });
    });
};

const updateEnlace = async (req, res) => {
    const { id } = req.params;
    const { nombre, url, id_usuario } = req.body;

    console.log(req.body);

    const selectSql = "SELECT * FROM enlaces WHERE id = ?";
    db.query(selectSql, [id], (err, result) => {
        if (err) {
            console.error("Error al consultar el enlace:", err);
            return res.status(500).json({ message: "Error al consultar el enlace", err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Enlace no encontrado" });
        }

        const oldData = result[0];  

        const updateSql = "UPDATE enlaces SET nombre = ?, url = ? WHERE id = ?";
        db.query(updateSql, [nombre, url, id], (err, updateResult) => {
            if (err) {
                console.error("Error al actualizar el enlace:", err);
                return res.status(500).json({ message: "Error al actualizar enlace", err });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ message: "Enlace no encontrado" });
            }

            const newData = { id, nombre, url };

            createAudit(id_usuario, "UPDATE", "enlaces", JSON.stringify(oldData), JSON.stringify(newData));

            return res.json({ success: "Enlace actualizado correctamente", id, nombre, url });
        });
    });
};

const deleteEnlace = (req, res) => {
    const { id } = req.params;
    const { id_usuario } = req.body;

    const getEnlaceSql = "SELECT * FROM enlaces WHERE id = ?";
    db.query(getEnlaceSql, [id], (err, rows) => {
        if (err) {
            console.error("Error al consultar el enlace:", err);
            return res.status(500).json({ error: "Error interno del servidor" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "Enlace no encontrado" });
        }

        const enlaceEliminado = rows[0];

        const deleteEnlaceSql = "DELETE FROM enlaces WHERE id = ?";
        db.query(deleteEnlaceSql, [id], (err, deleteResult) => {
            if (err) {
                console.error("Error al eliminar el enlace:", err);
                return res.status(500).json({ error: "Error al eliminar enlace" });
            }

            createAudit(id_usuario, "DELETE", "enlaces", JSON.stringify(enlaceEliminado), JSON.stringify({ message: "N/A" }));

            res.json({ message: "Enlace eliminado correctamente", enlaceEliminado });
        });
    });
};




module.exports = { getEnlaces, createEnlace, updateEnlace, deleteEnlace };
