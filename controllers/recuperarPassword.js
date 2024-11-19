const connection = require('../config/db');
const crypto = require('crypto');
const recuperarPassEmail = require('./recuperarPassEmail');
const bcrypt = require('bcryptjs');

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

        connection.query('UPDATE usuarios SET verification_code = ? WHERE correo = ?', [token, email], async (updateError) => {
            if (updateError) {
                console.error('Error al guardar el token en la base de datos:', updateError);
                return res.status(500).json({ message: 'Error al guardar el token en la base de datos' });
            }

            try {
                await recuperarPassEmail(token, email, name);
                return res.status(200).json({ message: 'Token de recuperación enviado' });
            } catch (emailError) {
                console.error('Error al enviar el correo:', emailError);
                return res.status(500).json({ message: 'Error al enviar el correo' });
            }
        });
    });
};

const cambiarPassword = async (req, res) => {
    const { email, token, nuevaContrasena } = req.body;

    connection.query('SELECT verification_code FROM usuarios WHERE correo = ?', [email], async (error, result) => {
        if (error) {
            console.error('Error en la consulta de la base de datos:', error);
            return res.status(500).json({ message: 'Error en la consulta de la base de datos' });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'El correo no existe en la base de datos' });
        }

        const storedToken = result[0].verification_code;

        if (storedToken !== token) {
            return res.status(400).json({ message: 'Token de recuperación inválido' });
        }

        const contrasenaEncriptada = await bcrypt.hash(nuevaContrasena, 10);

        connection.query(
            'UPDATE usuarios SET password = ?, verification_code = NULL WHERE correo = ?',
            [contrasenaEncriptada, email],
            (updateError) => {
                if (updateError) {
                    console.error('Error al actualizar la contraseña:', updateError);
                    return res.status(500).json({ message: 'Error al actualizar la contraseña' });
                }

                return res.status(200).json({ message: 'Contraseña cambiada con éxito' });
            }
        );
    });
};

module.exports = { recuperarPassword, cambiarPassword };
