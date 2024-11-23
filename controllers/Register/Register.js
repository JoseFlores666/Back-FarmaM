const bcrypt = require('bcryptjs');
const connection = require('../../config/db');
const sanitizeHtml = require('sanitize-html');
const sendVerificationEmail = require('../testEmail');
const crypto = require('crypto');
// const emailExistence = require('email-existence'); // Comentado

const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex');
};

// const verifyEmailExistence = (email) => {
//     return new Promise((resolve, reject) => {
//         emailExistence.check(email, (error, response) => {
//             if (error) {
//                 console.error('Error verificando el correo:', error);
//                 return reject(error);
//             }
//             resolve(response);
//         });
//     });
// };

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

        // Comentado el uso de verifyEmailExistence
        // const emailExists = await verifyEmailExistence(sanitizedCorreo);
        // if (!emailExists) {
        //     return res.status(400).json({ message: 'La dirección de correo no es válida o no existe.' });
        // }

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

                    const userId = userInsertResult.insertId;
                    const verificationCode = generateVerificationCode();

                    connection.query("UPDATE usuarios SET verification_code = ? WHERE id = ?", [verificationCode, userId], (err) => {
                        if (err) {
                            console.error('Error al actualizar el código de verificación:', err);
                            return res.status(500).json({ message: 'Ocurrió un error al registrar la seguridad del usuario.' });
                        }

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
        });

    } catch (error) {
        console.error('Error general en el registro:', error);
        return res.status(500).json({ message: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.' });
    }
};

module.exports = register;
