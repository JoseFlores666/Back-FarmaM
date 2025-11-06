const bcrypt = require('bcryptjs');
const db = require('../../config/db');

const login = (req, res) => {
    const { correo, password } = req.body;

    db.query(
        `SELECT u.*, r.id AS rolId, r.nombre AS rolNombre, s.isVerified, s.intentos 
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
            JOIN seguridad s ON u.id = s.user_id
            WHERE u.correo = ?`,
        [correo],
        (err, result) => {
            if (err) {
                console.error("Error en la consulta:", err);
                return res.status(500).json({ message: 'Ocurrió un error, por favor inténtalo de nuevo más tarde.' });
            }

            if (result.length > 0) {
                return procesarLoginUsuario(req, res, result[0], password);
            } else {
                return res.status(400).json({ message: 'Credenciales inválidas' });
            }
        }
    );
};

const procesarLoginUsuario = (req, res, user, password) => {
    if (user.isVerified === 0) {
        return res.status(403).json({ message: 'Tu cuenta aún no ha sido verificada. Por favor verifica tu correo antes de iniciar sesión.' });
    }

    if (user.intentos >= 5) {
        return res.status(403).json({ message: 'Tu cuenta está bloqueada. Se desbloqueará automáticamente después de 24 horas.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
        const nuevosIntentos = user.intentos + 1;
        db.query("UPDATE seguridad SET intentos = ? WHERE user_id = ?", [nuevosIntentos, user.id], (updateErr) => {
            if (updateErr) {
                console.error("Error al actualizar intentos:", updateErr);
                return res.status(500).json({ message: 'Error al actualizar los intentos.' });
            }
            return res.status(400).json({ message: `Credenciales inválidas. Intentos restantes: ${5 - nuevosIntentos}` });
        });
        return;
    }

    db.query("UPDATE seguridad SET intentos = 0 WHERE user_id = ?", [user.id], (resetErr) => {
        if (resetErr) {
            console.error("Error al resetear intentos:", resetErr);
            return res.status(500).json({ message: 'Error al restablecer los intentos.' });
        }

        let userData = {
            id: user.id,
            usuario: user.usuario,
            isAdmin: false,
            role: user.rolId,
        };
        guardarSesionYResponder(req, res, userData);
    });
};

const guardarSesionYResponder = (req, res, userData) => {
    req.session.user = userData;

    res.status(200).json({
        message: "Sesión iniciada correctamente",
        user: userData
    });
};

const consultaSesion = (req, res) => {
    if (req.session.user) {
        res.status(200).json(req.session.user);
    }
    else {
        res.status(401).json({ message: 'No autenticado' });
    }
};


const cerrarSesion = (req, res) => {
    const sessionId = req.sessionID;

    req.session.destroy(async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }

        sessionStore.destroy(sessionId, (err) => {
            if (err) console.error('Error al eliminar sesión manualmente:', err);
        });

        res.clearCookie('connect.sid', { path: '/', sameSite: 'none', secure: true });
        res.status(200).json({ message: 'Sesión cerrada correctamente' });
    });
};

module.exports = { login, cerrarSesion, consultaSesion };
