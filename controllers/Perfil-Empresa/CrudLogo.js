const db = require('../../config/db');

const uploadLogo = async (req, res) => {
  try {
    const { url } = req.body;

    const query = 'INSERT INTO logos (url, isActive) VALUES (?, ?)';
    db.query(query, [url, false], (error, result) => {
      if (error) return res.status(500).json({ message: 'Error al subir el logo', error });
      res.status(201).json({ message: 'Logo subido y guardado correctamente', logo: { id: result.insertId, url, isActive: false } });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir el logo', error });
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
    const { url, isActive } = req.body;

    const query = 'UPDATE logos SET url = ?, isActive = ? WHERE id = ?';
    db.query(query, [url, isActive, id], (error, result) => {
      if (error) return res.status(500).json({ message: 'Error al actualizar el logo', error });
      if (isActive) {
        const resetActiveQuery = 'UPDATE logos SET isActive = false WHERE id != ?';
        db.query(resetActiveQuery, [id]);
      }
      res.status(200).json({ message: 'Logo actualizado correctamente', logo: { id, url, isActive } });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el logo', error });
  }
};

const deleteLogo = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM logos WHERE id = ?';
    db.query(query, [id], (error, result) => {
      if (error) return res.status(500).json({ message: 'Error al eliminar el logo', error });
      res.status(200).json({ message: 'Logo eliminado correctamente' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el logo', error });
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

module.exports = {
  uploadLogo,
  getAllLogos,
  updateLogo,
  deleteLogo,
  getLogoActivo,
};