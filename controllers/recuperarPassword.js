const connection = require('../config/db');
const crypto = require('crypto');
const recuperarPassEmail = require('./recuperarPassEmail');
const bcrypt = require('bcryptjs');

function generarToken(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

const recuperarPassword = async (req, res) => {
    const { email } = req.body;

    connection.query('SELECT id, nombre FROM usuarios WHERE correo = ?', [email], async (error, result) => {
        if (error) {
            console.error('Error en la consulta de la base de datos:', error);
            return res.status(500).json({ message: 'Error en la consulta de la base de datos' });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'El correo no existe en la base de datos' });
        }

        const userId = result[0].id;
        const name = result[0].nombre;
        const token = generarToken(6);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        try {
            await recuperarPassEmail(token, email, name);
            connection.query(
                'INSERT INTO auth_codes (user_id, CODE, expires_at) VALUES (?, ?, ?)',
                [userId, token, expiresAt],
                (err) => {
                    if (err) {
                        console.error('Error al guardar el token en la base de datos:', err);
                        return res.status(500).json({ message: 'Error al generar el token de recuperación' });
                    }
                    return res.status(200).json({ message: 'Token de recuperación enviado. Revisa tu correo electrónico.' });
                }
            );
        } catch (emailError) {
            console.error('Error al enviar el correo:', emailError);
            return res.status(500).json({ message: 'Error al enviar el correo' });
        }
    });
};

const verificarToken = async (req, res) => {
    const { email, token } = req.body;
    connection.query(
        'SELECT auth_codes.id FROM auth_codes JOIN usuarios ON auth_codes.user_id = usuarios.id WHERE usuarios.correo = ? AND auth_codes.CODE = ? AND auth_codes.expires_at > NOW() AND auth_codes.used = FALSE',
        [email, token],
        (err, result) => {
            if (err) {
                console.error('Error en la consulta de verificación:', err);
                return res.status(500).json({ message: 'Error en la verificación del token' });
            }
            if (!result || result.length === 0) {
                return res.status(400).json({ message: 'El token ingresado no es válido o ha expirado.' });
            }
            return res.status(200).json({ message: 'El token es válido.' });
        }
    );
};

const cambiarPassword = async (req, res) => {
    const { email, token, nuevaContrasena } = req.body;

    connection.query(
        'SELECT auth_codes.id, usuarios.id AS user_id FROM auth_codes JOIN usuarios ON auth_codes.user_id = usuarios.id WHERE usuarios.correo = ? AND auth_codes.CODE = ? AND auth_codes.expires_at > NOW() AND auth_codes.used = FALSE',
        [email, token],
        async (err, result) => {
            if (err) {
                console.error('Error en la consulta de verificación:', err);
                return res.status(500).json({ message: 'Error en la verificación del token' });
            }
            if (!result || result.length === 0) {
                return res.status(400).json({ message: 'El token ingresado no es válido o ha expirado.' });
            }

            const authCodeId = result[0].id;
            const userId = result[0].user_id;
            const contrasenaEncriptada = await bcrypt.hash(nuevaContrasena, 10);

            connection.query('UPDATE usuarios SET password = ? WHERE id = ?', [contrasenaEncriptada, userId], (updateError) => {
                if (updateError) {
                    console.error('Error al actualizar la contraseña:', updateError);
                    return res.status(500).json({ message: 'Error al actualizar la contraseña' });
                }
                connection.query('UPDATE auth_codes SET used = TRUE WHERE id = ?', [authCodeId], (err) => {
                    if (err) {
                        console.error('Error al actualizar el estado del token:', err);
                    }
                    return res.status(200).json({ message: 'Contraseña cambiada con éxito' });
                });
            });
        }
    );
};

module.exports = { recuperarPassword, verificarToken, cambiarPassword };
