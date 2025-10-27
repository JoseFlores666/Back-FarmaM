const db = require('../../config/db');
const cloudinary = require('cloudinary').v2;

const getNoticias = (req, res) => {
  const sql = `
    SELECT 
      n.*, 
      l.url AS logo_url 
    FROM 
      noticias n
    INNER JOIN (
      SELECT * FROM logos WHERE isActive = 1 LIMIT 1
    ) l
    ORDER BY n.fecha_publicacion DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    res.json(results);
  });
};


const addNoticia = (req, res) => {
    try {
        const { titulo, descripcion } = req.body;
        const imagen = req.file;

        if (!titulo || !descripcion || !imagen) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const imagenUrl = imagen.path || imagen.url;  
        const publicId = imagen.filename || imagen.public_id;

        const sql = 'INSERT INTO noticias (titulo, descripcion, imagen, public_id) VALUES (?, ?, ?, ?)';
        const valores = [titulo, descripcion, imagenUrl, publicId];

        db.query(sql, valores, (err, result) => {
            if (err) {
                console.error('Error al insertar en la base de datos:', err);
                return res.status(500).json({ message: 'Error al guardar en la base de datos' });
            }
            return res.status(200).json({ message: 'Noticia guardada correctamente' });
        });
    } catch (error) {
        console.error('Error en addNoticia:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const updateNoticia = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion } = req.body;
  const nuevaImagen = req.file;

  try {
    const [rows] = await new Promise((resolve, reject) => {
      db.query('SELECT public_id FROM noticias WHERE id = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const oldPublicId = rows?.[0]?.public_id;

    let imagenUrl = null;
    let newPublicId = null;

    if (nuevaImagen) {
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }

      imagenUrl = nuevaImagen.path;        
      newPublicId = nuevaImagen.filename;  
    }

    let sql, params;
    if (imagenUrl && newPublicId) {
      sql = 'UPDATE noticias SET titulo = ?, descripcion = ?, imagen = ?, public_id = ? WHERE id = ?';
      params = [titulo, descripcion, imagenUrl, newPublicId, id];
    } else {
      sql = 'UPDATE noticias SET titulo = ?, descripcion = ? WHERE id = ?';
      params = [titulo, descripcion, id];
    }

    await new Promise((resolve, reject) => {
      db.query(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return res.json({ message: 'Noticia actualizada correctamente' });
  } catch (error) {
    console.error('Error en updateNoticia:', error);
    return res.status(500).json({ message: 'Error al actualizar la noticia' });
  }
};

const deleteNoticia = (req, res) => {
    const { id } = req.params;

    const selectSql = 'SELECT public_id FROM noticias WHERE id = ?';
    db.query(selectSql, [id], (err, result) => {
        if (err) {
            console.error('Error al consultar la noticia:', err);
            return res.status(500).json({ error: 'Error al consultar la noticia' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Noticia no encontrada' });
        }

        const publicId = result[0].public_id; 

        const eliminarNoticia = () => {
            const deleteSql = 'DELETE FROM noticias WHERE id = ?';
            db.query(deleteSql, [id], (err) => {
                if (err) {
                    console.error('Error al eliminar la noticia:', err);
                    return res.status(500).json({ error: 'Error al eliminar la noticia' });
                }
                res.json({ message: 'Noticia eliminada correctamente' });
            });
        };

        if (publicId) {
            cloudinary.uploader.destroy(publicId, (error, resultDestroy) => {
                if (error) {
                    console.error('Error al eliminar en Cloudinary:', error);
                } else {
                    console.log('Imagen eliminada de Cloudinary:', resultDestroy);
                }
                eliminarNoticia();
            });
        } else {
            eliminarNoticia();
        }
    });
};

module.exports = {getNoticias,addNoticia,updateNoticia,deleteNoticia,};
