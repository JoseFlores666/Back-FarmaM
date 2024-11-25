const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../../config/db');

const login = (req, res) => {
    const { correo, password } = req.body;

    connection.query(
        "SELECT u.*, r.nombre AS rolNombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.correo = ?",
        [correo],
        (err, result) => {
            if (err) {
                return res.status(500).send('Ocurrió un error, por favor inténtalo de nuevo más tarde.');
            }

            if (result.length === 0) {
                return res.status(400).send('Credenciales inválidas');
            }

            const user = result[0];

            // Verificar si existe la cookie de desbloqueo
            const unlockToken = req.cookies.unlockToken;

            if (unlockToken) {
                try {
                    const decoded = jwt.verify(unlockToken, process.env.JWT_SECRET);
                    if (decoded.userId === user.id && decoded.expiresAt > Date.now()) {
                        connection.query(
                            "UPDATE usuarios SET intentos = 0 WHERE id = ?",
                            [user.id],
                            (resetErr) => {
                                if (resetErr) {
                                    return res.status(500).send('Error al desbloquear la cuenta.');
                                }
                                res.clearCookie('unlockToken');
                                return res.status(200).send({ message: 'Tu cuenta ha sido desbloqueada automáticamente. Por favor, inicia sesión nuevamente.' });
                            }
                        );
                        return;
                    }
                } catch (error) {
                    res.clearCookie('unlockToken'); // Limpiar la cookie si es inválida o expirada
                }
            }

            if (user.intentos >= 5) {
                if (!unlockToken) {
                    // Generar un token de desbloqueo si aún no existe
                    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
                    const unlockJwt = jwt.sign(
                        { userId: user.id, expiresAt },
                        process.env.JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.cookie('unlockToken', unlockJwt, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'None',
                        maxAge: 24 * 60 * 60 * 1000, // 24 horas
                    });
                }
                return res.status(403).send({ message: 'Tu cuenta está bloqueada debido a múltiples intentos fallidos. Se desbloqueará automáticamente después de 24 horas.' });
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);

            if (!passwordIsValid) {
                const nuevosIntentos = user.intentos + 1;

                connection.query(
                    "UPDATE usuarios SET intentos = ? WHERE id = ?",
                    [nuevosIntentos, user.id],
                    (updateErr) => {
                        if (updateErr) {
                            return res.status(500).send('Ocurrió un error al actualizar los intentos.');
                        }

                        if (nuevosIntentos >= 5) {
                            return res.status(403).send({ message: 'Tu cuenta ha sido bloqueada debido a múltiples intentos fallidos. Se desbloqueará automáticamente después de 24 horas.' });
                        }

                        return res.status(400).send({
                            message: `Credenciales inválidas. Intentos restantes: ${5 - nuevosIntentos}`
                        });
                    }
                );
            } else {
                connection.query(
                    "UPDATE usuarios SET intentos = 0 WHERE id = ?",
                    [user.id],
                    (resetErr) => {
                        if (resetErr) {
                            return res.status(500).send('Ocurrió un error al restablecer los intentos.');
                        }

                        const isAdmin = user.rolNombre === 'admin';

                        const token = jwt.sign(
                            {
                                id: user.id,
                                usuario: user.usuario,
                                correo: user.correo,
                                isAdmin,
                            },
                            process.env.JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        res.cookie('authToken', token, {
                            maxAge: 24 * 60 * 60 * 1000,
                            httpOnly: true,
                            sameSite: 'None',
                            secure: process.env.NODE_ENV === 'production',
                        });

                        return res.status(200).send({
                            id: user.id,
                            usuario: user.usuario,
                            correo: user.correo,
                            isAdmin,
                        });
                    }
                );
            }
        }
    );
};

module.exports = login;
