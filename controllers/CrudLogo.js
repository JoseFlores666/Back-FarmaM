const cloudinary = require('../config/cloudinary');

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'Home/logos' },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Error al subir el logo' });
        }
        res.json({ path: result.secure_url, public_id: result.public_id });
      }
    );
    req.file.stream.pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
};

const getAllLogos = async (req, res) => {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:logos')
      .sort_by('public_id', 'desc')
      .execute();
    
    const logos = resources.map(logo => ({
      url: logo.secure_url,
      public_id: logo.public_id,
    }));
    
    res.json(logos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los logos' });
  }
};

const getLogoById = async (req, res) => {
  const { id } = req.params;
  try {
    const logo = await cloudinary.api.resource(id);
    res.json({ url: logo.secure_url, public_id: logo.public_id });
  } catch (error) {
    res.status(404).json({ error: 'Logo no encontrado' });
  }
};

const updateLogo = async (req, res) => {
  const { id } = req.params; 
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    await cloudinary.uploader.destroy(id);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'Home/logos' },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Error al actualizar el logo' });
        }
        res.json({ path: result.secure_url, public_id: result.public_id });
      }
    );
    req.file.stream.pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el logo' });
  }
};

const deleteLogo = async (req, res) => {
  const { id } = req.params; 
  try {
    await cloudinary.uploader.destroy(id);
    res.json({ message: `Logo con ID ${id} eliminado exitosamente` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el logo' });
  }
};

module.exports = {
  uploadLogo,
  getAllLogos,
  getLogoById,
  updateLogo,
  deleteLogo,
};
