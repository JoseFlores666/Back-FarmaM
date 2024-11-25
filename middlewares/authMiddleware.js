const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.cookies.authToken; 

    if (!token) {
        return res.status(401).send('Acceso no autorizado. No se proporcionó un token.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(403).send('Token inválido o expirado.');
    }
};


const verificarCodigo = (req, res) => {
    const token = req.cookies.verificationToken;

    if (!token) {
        return res.status(401).json({ message: 'No se encontró el token de verificación.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return res.status(200).json({ message: 'Token válido', data: decoded });
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};


module.exports = {authenticate, verificarCodigo};
