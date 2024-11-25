const bcrypt = require('bcryptjs');
const connection = require('../../config/db');
const sanitizeHtml = require('sanitize-html');
const sendVerificationEmail = require('../testEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); 

const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex');
};

const register = async (req, res) => {
    try {
        const { usuario, nombre, apellidoPaterno, apellidoMaterno, edad, telefono, genero, correo, password } = req.body;

        if (!usuario || !nombre || !apellidoPaterno || !correo || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        const sanitizedUsuario = sanitizeHtml(usuario);
        const sanitizedNombre = sanitizeHtml(nombre);
        const sanitizedApellidoPaterno = sanitizeHtml(apellidoPaterno);
        const sanitizedApellidoMaterno = sanitizeHtml(apellidoMaterno);
        const sanitizedCorreo = sanitizeHtml(correo);
        const sanitizedTelefono = sanitizeHtml(telefono);
        const sanitizedGenero = sanitizeHtml(genero);

        connection.query("SELECT * FROM usuarios WHERE correo = ?", [sanitizedCorreo], (err, result) => {
            if (err) {
                console.error('Error en la consulta de correo:', err);
                return res.status(500).json({ message: 'Ocurrió un error, por favor inténtalo de nuevo más tarde.' });
            }

            if (result.length > 0) {
                return res.status(400).json({ message: 'El correo ya está registrado.' });
            }

            connection.query("SELECT * FROM usuarios WHERE telefono = ?", [sanitizedTelefono], (err, phoneResult) => {
                if (err) {
                    console.error('Error en la consulta de teléfono:', err);
                    return res.status(500).json({ message: 'Ocurrió un error, por favor inténtalo de nuevo más tarde.' });
                }

                if (phoneResult.length > 0) {
                    return res.status(400).json({ message: 'El teléfono ya está registrado.' });
                }

                const hashedPassword = bcrypt.hashSync(password, 10);

                const newUser = {
                    usuario: sanitizedUsuario,
                    nombre: sanitizedNombre,
                    apellidoPaterno: sanitizedApellidoPaterno,
                    apellidoMaterno: sanitizedApellidoMaterno,
                    edad,
                    telefono: sanitizedTelefono,
                    genero: sanitizedGenero,
                    correo: sanitizedCorreo,
                    password: hashedPassword,
                };

                connection.query("INSERT INTO usuarios SET ?", newUser, (err, userInsertResult) => {
                    if (err) {
                        console.error('Error al registrar el usuario:', err);
                        return res.status(500).json({ message: 'Ocurrió un error al registrar el usuario.' });
                    }

                    const verificationCode = generateVerificationCode();

                    const token = jwt.sign(
                        { verificationCode, correo: sanitizedCorreo }, 
                        process.env.JWT_SECRET, 
                        { expiresIn: '15m' } 
                    );

                    res.cookie('verificationToken', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production', 
                        maxAge: 15 * 60 * 1000, 
                        sameSite: 'None', 
                    });

                    try {
                        sendVerificationEmail(verificationCode, sanitizedCorreo, sanitizedUsuario);
                        return res.status(200).json({ message: 'Registro exitoso! Un código de verificación ha sido enviado a tu correo.' });
                    } catch (emailError) {
                        console.error('Error al enviar el correo de verificación:', emailError);
                        return res.status(500).json({ message: 'Ocurrió un error al enviar el correo de verificación.' });
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error general en el registro:', error);
        return res.status(500).json({ message: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.' });
    }
};

module.exports = register;
