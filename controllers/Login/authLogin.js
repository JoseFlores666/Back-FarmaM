const bcrypt = require('bcryptjs');
const connection = require('../../config/db');

const login = (req, res) => {
    const { correo, password } = req.body;

    connection.query("SELECT u.*, r.nombre AS rolNombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.correo = ?", [correo], (err, result) => {
        if (err) {
            console.error('Error en la consulta de usuarios:', err); 
            return res.status(500).send('Ocurrió un error, por favor inténtalo de nuevo más tarde.');
        }

        if (result.length === 0) {
            return res.status(400).send('Credenciales inválidas'); 
        }

        const user = result[0];

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(400).send('Credenciales inválidas.');
        } else {
            const isAdmin = user.rolNombre === 'admin'; 

            console.log(`User logged in: ${user.usuario} isAdmin: ${isAdmin}`); 

            res.cookie('userId', user.id, { maxAge: 24 * 60 * 60 * 1000 }); 
            res.status(200).send({
                id: user.id,
                usuario: user.usuario, 
                correo: user.correo,
                isAdmin, 
            });
        }
    });
};

module.exports = login;
