const connection = require('../config/db');
const crypto = require('crypto');
const recuperarPassEmail = require('./recuperarPassEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

function generarToken(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

const recuperarPassword = async (req, res) => {
    const { email } = req.body;

    connection.query('SELECT nombre FROM usuarios WHERE correo = ?', [email], async (error, result) => {
        if (error) {
            console.error('Error en la consulta de la base de datos:', error);
            return res.status(500).json({ message: 'Error en la consulta de la base de datos' });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'El correo no existe en la base de datos' });
        }

        const name = result[0].nombre;
        const token = generarToken(6);

        try {
            await recuperarPassEmail(token, email, name);

            const jwtToken = jwt.sign(
                { recoveryToken: token }, 
                process.env.JWT_SECRET,
                { expiresIn: '15m' } 
            );

            res.cookie('recoveryToken', jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
                maxAge: 15 * 60 * 1000, 
            });

            return res.status(200).json({ message: 'Token de recuperación enviado. Revisa tu correo electrónico.' });
        } catch (emailError) {
            console.error('Error al enviar el correo:', emailError);
            return res.status(500).json({ message: 'Error al enviar el correo' });
        }
    });
};

const verificarToken = async (req, res) => {
    const { token } = req.body;

    const jwtToken = req.cookies.recoveryToken;

    if (!jwtToken) {
        return res.status(401).json({ message: 'No hay un token en la cookie. Solicita uno nuevamente.' });
    }

    try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        
        if (decoded.recoveryToken === token) {
            return res.status(200).json({ message: 'El token es válido.' });
        } else {
            return res.status(400).json({ message: 'El token ingresado no es válido.' });
        }
    } catch (error) {
        return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
    }
};

const cambiarPassword = async (req, res) => {
    const { email, nuevaContrasena } = req.body;

    const jwtToken = req.cookies.recoveryToken;

    if (!jwtToken) {
        return res.status(400).json({ message: 'No se encontró el token de recuperación. Solicítalo nuevamente.' });
    }

    try {
        jwt.verify(jwtToken, process.env.JWT_SECRET);
        
        connection.query('SELECT correo FROM usuarios WHERE correo = ?', [email], async (error, result) => {
            if (error) {
                console.error('Error en la consulta de la base de datos:', error);
                return res.status(500).json({ message: 'Error en la consulta de la base de datos' });
            }

            if (!result || result.length === 0) {
                return res.status(404).json({ message: 'El correo no existe en la base de datos' });
            }

            try {
                const contrasenaEncriptada = await bcrypt.hash(nuevaContrasena, 10);

                connection.query(
                    'UPDATE usuarios SET password = ? WHERE correo = ?',
                    [contrasenaEncriptada, email],
                    (updateError) => {
                        if (updateError) {
                            console.error('Error al actualizar la contraseña:', updateError);
                            return res.status(500).json({ message: 'Error al actualizar la contraseña' });
                        }

                        res.clearCookie('recoveryToken');

                        return res.status(200).json({ message: 'Contraseña cambiada con éxito' });
                    }
                );
            } catch (hashError) {
                console.error('Error al encriptar la contraseña:', hashError);
                return res.status(500).json({ message: 'Error al procesar la solicitud. Inténtalo de nuevo.' });
            }
        });
    } catch (error) {
        return res.status(400).json({ message: 'El token de recuperación no es válido o ha expirado.' });
    }
};

module.exports = { recuperarPassword, verificarToken, cambiarPassword };
