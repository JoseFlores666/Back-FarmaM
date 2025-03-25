const bcrypt = require('bcryptjs');
const connection = require('../../config/db');
const sanitizeHtml = require('sanitize-html');
const sendVerificationEmail = require('../testEmail');
const crypto = require('crypto');

const generateVerificationCode = () => crypto.randomBytes(3).toString('hex');

const register = (req, res) => {
    try {
        const { usuario, nombre, apellidoPaterno, apellidoMaterno, edad, telefono, genero, correo, password } = req.body;

        if (!usuario || !nombre || !apellidoPaterno || !correo || !password) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser llenados.' });
        }

        const sanitizedData = {
            usuario: sanitizeHtml(usuario),
            nombre: sanitizeHtml(nombre),
            apellidoPaterno: sanitizeHtml(apellidoPaterno),
            apellidoMaterno: sanitizeHtml(apellidoMaterno),
            correo: sanitizeHtml(correo),
            telefono: sanitizeHtml(telefono),
            genero: sanitizeHtml(genero),
            edad: parseInt(edad),
        };

        connection.query(
            "SELECT usuario, correo, telefono FROM usuarios WHERE usuario = ? OR correo = ? OR telefono = ?",
            [sanitizedData.usuario, sanitizedData.correo, sanitizedData.telefono],
            (err, results) => {
                if (err) {
                    console.error('Error en la consulta:', err);
                    return res.status(500).json({ message: 'Error al verificar usuario.' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ message: 'El usuario, correo o teléfono ya están en uso.' });
                }

                sanitizedData.password = bcrypt.hashSync(password, 10);

                connection.query(
                    "INSERT INTO usuarios SET ?",
                    sanitizedData,
                    (err, result) => {
                        if (err) {
                            console.error('Error al insertar usuario:', err);
                            return res.status(500).json({ message: 'Error al registrar usuario.' });
                        }

                        const userId = result.insertId;

                        connection.query(
                            "INSERT INTO seguridad (user_id, isVerified, intentos) VALUES (?, 0, 0)",
                            [userId, 0, 0],
                            (err) => {
                                if (err) {
                                    console.error('Error al insertar en seguridad:', err);
                                    return res.status(500).json({ message: 'Error al configurar seguridad.' });
                                }

                                const verificationCode = generateVerificationCode();
                                const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

                                connection.query(
                                    "INSERT INTO auth_codes (user_id, code, expires_at, used) VALUES (?, ?, ?, FALSE)",
                                    [userId, verificationCode, expiresAt],
                                    (err) => {
                                        if (err) {
                                            console.error('Error al guardar código de verificación:', err);
                                            return res.status(500).json({ message: 'Error al generar el código de verificación.' });
                                        }

                                        sendVerificationEmail(verificationCode, sanitizedData.correo, sanitizedData.usuario)
                                            .then(() => {
                                                return res.status(200).json({ message: 'Registro exitoso. Revisa tu correo para la verificación.' });
                                            })
                                            .catch((emailErr) => {
                                                console.error('Error enviando el correo:', emailErr);
                                                return res.status(500).json({ message: 'Registro exitoso, pero ocurrió un error al enviar el correo.' });
                                            });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error en el registro:', error);
        return res.status(500).json({ message: 'Error inesperado. Intenta de nuevo más tarde.' });
    }
};

module.exports = register;
