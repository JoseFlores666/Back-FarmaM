const connection = require('../config/db');
const crypto = require('crypto');
const recuperarPassEmail = require('./recuperarPassEmail');
const bcrypt = require('bcryptjs');

async function recuperarPassword(req, res) {
    const email = req.body.email;

    connection.query('SELECT * FROM usuarios WHERE correo = ?', [email], async (error, rows) => {
        if (error) {
            console.error('Error en la consulta de la base de datos:', error);
            return res.status(500).json({ message: 'Error en la consulta de la base de datos' });
        }

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(404).json({ message: 'El correo no existe en la base de datos' });
        }

        const name = rows[0].nombre;
        const token = generarToken(6);

        res.cookie('resetToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000 
        });

        await recuperarPassEmail(token, email, name);

        return res.status(200).json({ message: 'Token de recuperación enviado' });
    });
}

async function cambiarPassword(req, res) {
    const { email, token, nuevaContrasena } = req.body;

    connection.query('SELECT * FROM usuarios WHERE correo = ?', [email], async (error, rows) => {
        if (error) {
            console.error('Error en la consulta de la base de datos:', error);
            return res.status(500).json({ message: 'Error en la consulta de la base de datos' });
        }

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(404).json({ message: 'El correo no existe en la base de datos' });
        }

        const cookieToken = req.cookies.resetToken;

        if (!cookieToken || cookieToken !== token) {
            return res.status(400).json({ message: 'Token de recuperación inválido' });
        }

        const expiracionToken = new Date(Date.now() + (15 * 60 * 1000)); 


        const contrasenaEncriptada = await bcrypt.hash(nuevaContrasena, 10);

        connection.query('UPDATE usuarios SET password = ? WHERE correo = ?', [contrasenaEncriptada, email], (error) => {
            if (error) {
                console.error('Error al actualizar la contraseña:', error);
                return res.status(500).json({ message: 'Error al actualizar la contraseña' });
            }

            res.clearCookie('resetToken');

            return res.status(200).json({ message: 'Contraseña cambiada con éxito' });
        });
    });
}

function generarToken(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

module.exports = { recuperarPassword, cambiarPassword };
