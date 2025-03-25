const db = require('../../config/db');
const { createAudit } = require('./CrudAuditoria');

const uploadLogo = async (req, res) => {
  try {
    const { url, id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ message: "El id_usuario es requerido" });
    }

    const oldData = JSON.stringify({ message: "N/A" });
    const updatedData = JSON.stringify({ url, isActive: false });

    const query = "INSERT INTO logos (url, isActive) VALUES (?, ?)";
    db.query(query, [url, false], (error, result) => {
      if (error) {
        console.error("Error en la inserción de logos:", error);
        return res.status(500).json({ message: "Error al subir el logo", error });
      }

      console.log("Logo insertado correctamente, creando auditoría...");

      createAudit(id_usuario, "INSERT", "logos", oldData, updatedData);

      res.status(201).json({
        message: "Logo subido y guardado correctamente",
        logo: { id: result.insertId, url, isActive: false, old_data: oldData },
      });
    });
  } catch (error) {
    console.error("Error en uploadLogo:", error);
    res.status(500).json({ message: "Error al subir el logo", error });
  }
};


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

const updateLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, isActive, id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ message: "El id_usuario es requerido" });
    }

    const selectQuery = "SELECT * FROM logos WHERE id = ?";
    db.query(selectQuery, [id], (error, result) => {
      if (error) {
        console.error("Error al consultar el logo:", error);
        return res.status(500).json({ message: "Error al consultar el logo", error });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }

      const oldData = result[0];

      const updateQuery = "UPDATE logos SET url = ?, isActive = ? WHERE id = ?";
      db.query(updateQuery, [url, isActive, id], (error, updateResult) => {
        if (error) {
          console.error("rror al actualizar el logo:", error);
          return res.status(500).json({ message: "Error al actualizar el logo", error });
        }

        if (isActive === true) {
          const resetActiveQuery = "UPDATE logos SET isActive = false WHERE id != ?";
          db.query(resetActiveQuery, [id], (error) => {
            if (error) {
              console.error("Error al desactivar otros logos:", error);
            }
          });
        }

        const newData = { url, isActive };

        createAudit(id_usuario, "UPDATE", "logos", JSON.stringify(oldData), JSON.stringify(newData));

        res.status(200).json({ message: "Logo actualizado correctamente", logo: { id, url, isActive } });
      });
    });
  } catch (error) {
    console.error("Error en updateLogo:", error);
    res.status(500).json({ message: "Error al actualizar el logo", error });
  }
};

const deleteLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ message: "El id_usuario es requerido" });
    }

    const selectQuery = "SELECT * FROM logos WHERE id = ?";
    db.query(selectQuery, [id], (error, result) => {
      if (error) {
        console.error("Error al consultar el logo:", error);
        return res.status(500).json({ message: "Error al consultar el logo", error });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }

      const oldData = result[0];

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

module.exports = { uploadLogo, getAllLogos, updateLogo, deleteLogo, getLogoActivo, };
