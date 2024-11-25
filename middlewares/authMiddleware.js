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

module.exports = {authenticate};
