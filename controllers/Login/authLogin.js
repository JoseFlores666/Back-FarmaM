const bcrypt = require('bcryptjs');
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

            if (user.intentos >= 5) {
                return res.status(403).send({ message: 'Tu cuenta está bloqueada debido a múltiples intentos fallidos.' });
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);

            if (!passwordIsValid) {
                const nuevosIntentos = user.intentos + 1;

                connection.query(
                    "UPDATE usuarios SET intentos = ? WHERE id = ?",
                    [nuevosIntentos, user.id],
                    (updateErr, updateResult) => {
                        if (updateErr) {
                            return res.status(500).send('Ocurrió un error al actualizar los intentos.');
                        }

                        if (updateResult.affectedRows === 0) {
                            return res.status(500).send('No se pudo actualizar el contador de intentos.');
                        }

                        if (nuevosIntentos >= 5) {
                            return res.status(403).send({ message: 'Tu cuenta ha sido bloqueada por múltiples intentos fallidos, espera al admin para desbloquearte.' });
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
                    (resetErr, resetResult) => {
                        if (resetErr) {
                            return res.status(500).send('Ocurrió un error al restablecer los intentos.');
                        }

                        if (resetResult.affectedRows === 0) {
                            return res.status(500).send('No se pudo restablecer los intentos.');
                        }

                        const isAdmin = user.rolNombre === 'admin';

                        res.cookie('userId', user.id, { maxAge: 24 * 60 * 60 * 1000 });
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
