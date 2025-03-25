const bcrypt = require('bcryptjs');
const db = require('../../config/db');

const loginDoc = (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    db.query(
        `SELECT * FROM doctor WHERE correo = ?`, 
        [correo], 
        (err, result) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ message: 'Ocurrió un error, por favor inténtalo de nuevo más tarde.' });
            }

            if (result.length > 0) {
                const doctor = result[0];

                const passwordIsValid = bcrypt.compareSync(password, doctor.password);

                if (!passwordIsValid) {
                    return res.status(400).json({ message: 'Credenciales inválidas' });
                }

                let doctorData = {
                    id: doctor.coddoc,
                    usuario: doctor.nomdoc,  
                    isAdmin: false,  
                    role: doctor.rol_id,
                };

                guardarSesionYResponder(req, res, doctorData);

            } else {
                return res.status(400).json({ message: 'No se encontró un doctor con ese correo' });
            }
        }
    );
};

const guardarSesionYResponder = (req, res, doctorData) => {
    req.session.user = doctorData;  

    res.status(200).json({
        message: "Sesión iniciada correctamente",
        doctor: doctorData  
    });
    
};

module.exports = { loginDoc };
