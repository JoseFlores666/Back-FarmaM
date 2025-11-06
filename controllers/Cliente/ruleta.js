const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const cloudinary = require("cloudinary").v2;

const insertDataWheel = (req, res) => {
  try {
    const { nombre, isActive } = req.body;
    let { colores, ofertas } = req.body;
    const fondo = req.file;

    if (!nombre || !fondo) {
      return res.status(400).json({ message: "Nombre y fondo son obligatorios" });
    }

    colores = colores ? JSON.parse(colores) : [];
    ofertas = ofertas ? JSON.parse(ofertas) : [];

    const imagenUrl = fondo.path || fondo.url;
    const publicId = fondo.filename || fondo.public_id;

    // Desactivar otras si esta está activa
    if (isActive === "1" || isActive === 1) {
      db.query("UPDATE tblruleta SET isActive = 0", (err) => {
        if (err) console.error("Error desactivando otras ruletas:", err);
      });
    }

    const sqlRuleta =
      "INSERT INTO tblruleta (nombre, imagen, public_id, isActive) VALUES (?, ?, ?, ?)";
    const values = [nombre, imagenUrl, publicId, isActive];

    db.query(sqlRuleta, values, (err, result) => {
      if (err) {
        console.error("Error al crear la ruleta:", err);
        return res.status(500).json({ error: "Error al crear ruleta" });
      }

      const ruletaId = result.insertId;

      // Insertar colores
      colores.forEach((color) => {
        db.query("INSERT INTO tblcolores (ruleta_id, color) VALUES (?, ?)", [
          ruletaId,
          color,
        ]);
      });

      // Insertar ofertas
      ofertas.forEach((oferta) => {
        db.query(
          "INSERT INTO tblofertas (ruleta_id, oferta, colorTexto) VALUES (?, ?, ?)",
          [ruletaId, oferta.option, oferta.textColor || "#000000"]
        );
      });

      res.json({ message: "Ruleta creada correctamente", ruletaId });
    });
  } catch (error) {
    console.error("Error en insertDataWheel:", error);
    res.status(500).json({ error: "Error al crear la ruleta" });
  }
};



// GET /ruleta/getWheels
const getWheels = (req, res) => {
  db.query("SELECT * FROM tblruleta", (err, result) => {
    if (err) return res.status(500).json({ error: "Error al obtener ruletas" });
    res.json(result);
  });
};

// GET /ruleta/getWheelById/:id
const getWheelById = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM tblruleta WHERE id = ?", [id], (err, resultRuleta) => {
    if (err) return res.status(500).json({ error: "Error al obtener ruleta" });
    if (resultRuleta.length === 0) return res.status(404).json({ error: "Ruleta no encontrada" });

    const ruleta = resultRuleta[0];

    db.query("SELECT * FROM tblcolores WHERE ruleta_id = ?", [id], (err, resultColores) => {
      if (err) return res.status(500).json({ error: "Error al obtener colores" });

      db.query("SELECT * FROM tblofertas WHERE ruleta_id = ?", [id], (err, resultOfertas) => {
        if (err) return res.status(500).json({ error: "Error al obtener ofertas" });

        res.json({ ...ruleta, colores: resultColores, ofertas: resultOfertas });
      });
    });
  });
};

const updateWheelById = async (req, res) => {
  const { id } = req.params;
  const { nombre, isActive } = req.body;
  let { colores, ofertas } = req.body;
  const nuevaImagen = req.file;
  try {
    colores = colores ? JSON.parse(colores) : [];
    ofertas = ofertas ? JSON.parse(ofertas) : [];

    // Buscar public_id actual
    const [rows] = await new Promise((resolve, reject) => {
      db.query("SELECT public_id FROM tblruleta WHERE id = ?", [id], (err, result) =>
        err ? reject(err) : resolve(result)
      );
    });

    const oldPublicId = rows?.[0]?.public_id;

    let imagenUrl = null;
    let newPublicId = null;

    if (nuevaImagen) {
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }

      imagenUrl = nuevaImagen.path || nuevaImagen.url;
      newPublicId = nuevaImagen.filename || nuevaImagen.public_id;
    }

    // Desactivar otras si se activa
    if (isActive === "1" || isActive === 1) {
      await new Promise((resolve, reject) => {
        db.query("UPDATE tblruleta SET isActive = 0 WHERE id <> ?", [id], (err) =>
          err ? reject(err) : resolve()
        );
      });
    }

    // Actualizar ruleta
    let sql, params;
    if (imagenUrl && newPublicId) {
      sql =
        "UPDATE tblruleta SET nombre = ?, imagen = ?, public_id = ?, isActive = ? WHERE id = ?";
      params = [nombre, imagenUrl, newPublicId, isActive, id];
    } else {
      sql = "UPDATE tblruleta SET nombre = ?, isActive = ? WHERE id = ?";
      params = [nombre, isActive, id];
    }

    await new Promise((resolve, reject) => {
      db.query(sql, params, (err) => (err ? reject(err) : resolve()));
    });

    // Colores
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM tblcolores WHERE ruleta_id = ?", [id], (err) =>
        err ? reject(err) : resolve()
      );
    });
    colores.forEach((color) => {
      db.query("INSERT INTO tblcolores (ruleta_id, color) VALUES (?, ?)", [id, color]);
    });

    // Ofertas
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM tblofertas WHERE ruleta_id = ?", [id], (err) =>
        err ? reject(err) : resolve()
      );
    });
    ofertas.forEach((oferta) => {
      db.query(
        "INSERT INTO tblofertas (ruleta_id, oferta, colorTexto) VALUES (?, ?, ?)",
        [id, oferta.option, oferta.textColor || "#000000"]
      );
    });

    res.json({ message: "Ruleta actualizada correctamente" });
  } catch (error) {
    console.error("Error en updateWheelById:", error);
    res.status(500).json({ error: "Error al actualizar ruleta" });
  }
};

const deleteWheelById = (req, res) => {
  const { id } = req.params;

  db.query("SELECT public_id FROM tblruleta WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al consultar la ruleta:", err);
      return res.status(500).json({ error: "Error al consultar la ruleta" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Ruleta no encontrada" });
    }

    const publicId = result[0].public_id;

    const eliminarRuleta = () => {
      // Eliminar colores y ofertas primero
      db.query("DELETE FROM tblcolores WHERE ruleta_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar colores" });

        db.query("DELETE FROM tblofertas WHERE ruleta_id = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Error al eliminar ofertas" });

          db.query("DELETE FROM tblruleta WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: "Error al eliminar ruleta" });

            res.json({ message: "Ruleta eliminada correctamente" });
          });
        });
      });
    };

    if (publicId) {
      cloudinary.uploader.destroy(publicId, (error, resultDestroy) => {
        if (error) {
          console.error("Error al eliminar imagen de Cloudinary:", error);
        } else {
          console.log("Imagen eliminada de Cloudinary:", resultDestroy);
        }
        eliminarRuleta();
      });
    } else {
      eliminarRuleta();
    }
  });
};


const getWheelActive = (req, res) => {
  const sqlRuleta = "SELECT * FROM tblruleta WHERE isActive = 1 LIMIT 1";

  db.query(sqlRuleta, (err, result) => {
    if (err) {
      console.error("Error al obtener la ruleta activa:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "No hay ruleta activa" });
    }

    const ruleta = result[0];

    const sqlColores = "SELECT color FROM tblcolores WHERE ruleta_Id = ?";
    db.query(sqlColores, [ruleta.id], (errCol, colores) => {
      if (errCol) {
        console.error("Error al obtener colores:", errCol);
        return res.status(500).json({ message: "Error en el servidor" });
      }

      const sqlOfertas =
        "SELECT oferta, colorTexto FROM tblofertas WHERE ruleta_Id = ?";
      db.query(sqlOfertas, [ruleta.id], (errOf, ofertas) => {
        if (errOf) {
          console.error("Error al obtener ofertas:", errOf);
          return res.status(500).json({ message: "Error en el servidor" });
        }

        return res.json({
          ...ruleta,
          colores,
          ofertas,
        });
      });
    });
  });
};

const getColorById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM tblcolores WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al obtener la ruleta:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Ruleta no encontrada" });
    }

    res.json(result[0]);
  });
};

const getOfertById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM tblofertas WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al obtener la oferta:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }

    res.json(result[0]);
  });
};


module.exports = {
  insertDataWheel,
  getWheels,
  getWheelById,
  updateWheelById,
  deleteWheelById,
  getWheelActive,
  getColorById,
  getOfertById
};
