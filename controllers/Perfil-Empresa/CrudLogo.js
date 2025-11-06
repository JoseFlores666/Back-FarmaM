const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');
const cloudinary = require('cloudinary').v2;


const getAllLogos = async (req, res) => {
  try {
    const query = 'SELECT * FROM logos';
    db.query(query, (error, results) => {
      if (error) return res.status(500).json({ message: 'Error al obtener los logos', error });
      res.status(200).json(results);
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los logos', error });
  }
};


const getLogoActivo = async (req, res) => {
  try {
    const query = 'SELECT * FROM logos WHERE isActive = true LIMIT 1';
    db.query(query, (error, results) => {
      if (error) return res.status(500).json({ message: 'Error al obtener el logo activo', error });
      if (results.length === 0) {
        return res.status(404).json({ message: 'No hay logo activo' });
      }
      res.status(200).json(results[0]);
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el logo activo', error });
  }
};



const createLogo = (req, res) => {
  const { id_usuario } = req.body;
  const imagen = req.file;

  if (!id_usuario || !imagen) {
    return res.status(400).json({ message: "id_usuario e imagen son obligatorios" });
  }

  const sql = "INSERT INTO logos (url, isActive, public_id) VALUES (?, ?, ?)";
  db.query(sql, [imagen.path, false, imagen.filename], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al insertar el logo" });

    const newData = {
      id: result.insertId,
      url: imagen.path,
      isActive: false,
      public_id: imagen.filename,
    };

    const oldData = JSON.stringify({ message: "N/A" });
    createAudit(id_usuario, "CREATE", "logos", oldData, JSON.stringify(newData));

    return res.status(201).json({
      success: true,
      message: "Logo creado correctamente",
      id: result.insertId,
    });
  });
};

const updateLogo = (req, res) => {
  const { id } = req.params;
  const { id_usuario, isActive } = req.body;
  const nuevaImagen = req.file;

  const getOldDataSql = "SELECT * FROM logos WHERE id = ?";
  db.query(getOldDataSql, [id], async (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ message: "Error al obtener datos anteriores" });

    const oldData = rows[0];
    let url = oldData.url;
    let public_id = oldData.public_id;

    if (nuevaImagen) {
      // Eliminar imagen antigua si existe
      if (oldData.public_id) {
        try {
          await cloudinary.uploader.destroy(oldData.public_id);
        } catch (error) {
          console.error("Error al eliminar imagen anterior:", error);
        }
      }
      url = nuevaImagen.path;
      public_id = nuevaImagen.filename;
    }

    const updateSql = "UPDATE logos SET url = ?, isActive = ?, public_id = ? WHERE id = ?";
    const params = [url, isActive || false, public_id, id];

    db.query(updateSql, params, (err) => {
      if (err) return res.status(500).json({ message: "Error al actualizar logo" });

      if (isActive === true) {
        const resetActiveQuery = "UPDATE logos SET isActive = false WHERE id != ?";
        db.query(resetActiveQuery, [id], (error) => {
          if (error) console.error("Error al desactivar otros logos:", error);
        });
      }

      const newData = { id, url, isActive, public_id };
      createAudit(id_usuario, "UPDATE", "logos", JSON.stringify(oldData), JSON.stringify(newData));

      res.json({ success: true, message: "Logo actualizado correctamente", newData });
    });
  });
};

const deleteLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ message: "El id_usuario es requerido" });
    }

    const selectQuery = "SELECT * FROM logos WHERE id = ?";
    db.query(selectQuery, [id], async (error, result) => {
      if (error) {
        console.error("Error al consultar el logo:", error);
        return res.status(500).json({ message: "Error al consultar el logo", error });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }

      const oldData = result[0];

      // Si tienes public_id guardado, elimínalo de Cloudinary
      if (oldData.public_id) {
        try {
          await cloudinary.uploader.destroy(oldData.public_id);
        } catch (cloudErr) {
          console.error("Error al eliminar imagen en Cloudinary:", cloudErr);
          // Opcional: no retornar error para que igual siga con borrado de BD
        }
      }

      const deleteQuery = "DELETE FROM logos WHERE id = ?";
      db.query(deleteQuery, [id], (error, deleteResult) => {
        if (error) {
          console.error("Error al eliminar el logo:", error);
          return res.status(500).json({ message: "Error al eliminar el logo", error });
        }
        createAudit(id_usuario, "DELETE", "logos", JSON.stringify(oldData), JSON.stringify({ message: "N/A" }));

        res.status(200).json({ message: "Logo eliminado correctamente" });
      });
    });
  } catch (error) {
    console.error("Error en deleteLogo:", error);
    res.status(500).json({ message: "Error al eliminar el logo", error });
  }
};




module.exports = { getAllLogos, updateLogo, deleteLogo, getLogoActivo,createLogo };
