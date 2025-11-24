const db = require('../../config/db');
const sanitizeHtml = require('sanitize-html');

const loginGoogle = (req, res) => {
    try {
        const { givenName, familyName, email, photo } = req.body;

        if (!email || !givenName) {
            return res.status(400).json({ message: "Datos inválidos enviados desde Google." });
        }

        // Sanitizar datos
        const cleanCorreo = sanitizeHtml(email);
        const cleanGivenName = sanitizeHtml(givenName);
        const cleanFamilyName = sanitizeHtml(familyName || "");

        // Separar apellidoPaterno y apellidoMaterno
        let apellidoPaterno = "";
        let apellidoMaterno = "";
        if (cleanFamilyName) {
            const parts = cleanFamilyName.trim().split(" ");
            apellidoPaterno = parts[0] || "";
            apellidoMaterno = parts.slice(1).join(" ") || "";
        }

        const nombreCompleto = `${cleanGivenName} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        const usuario = cleanGivenName; // conserva los espacios tal como viene

        // 1️⃣ VERIFICAR SI YA EXISTE
        db.query("SELECT * FROM usuarios WHERE correo = ?", [cleanCorreo], (err, results) => {
            if (err) {
                console.error("Error consultando usuario:", err);
                return res.status(500).json({ message: "Error interno en el servidor." });
            }

            // 2️⃣ SI YA EXISTE → INICIAR SESIÓN
            if (results.length > 0) {
                const user = results[0];

                req.session.user = {
                    id: user.id,
                    usuario: user.usuario,
                    nombre: user.nombre,
                    role: user.rol_id,
                    foto_perfil: user.foto_perfil
                };

                // Verificar si el usuario tiene datos incompletos
                const necesitaCompletar =
                    !user.nombre ||
                    !user.apellidoPaterno ||
                    !user.telefono ||
                    !user.genero ||
                    !user.edad;

                return res.status(200).json({
                    message: "Inicio de sesión exitoso con Google.",
                    user: req.session.user,
                    completar: necesitaCompletar // true si debe llenar datos
                });
            }

            // 3️⃣ SI NO EXISTE → CREAR USUARIO AUTOMÁTICAMENTE
            const nuevoUsuario = {
                usuario,
                nombre: nombreCompleto,
                apellidoPaterno,
                apellidoMaterno,
                correo: cleanCorreo,
                telefono: "",
                genero: "",
                edad: 18, // valor por defecto
                rol_id: 2, // usuario normal
                foto_perfil: photo || "https://cdn-icons-png.flaticon.com/512/3135/3135768.png",
                foto_perfil_public_id: ""
            };

            db.query("INSERT INTO usuarios SET ?", nuevoUsuario, (err, result) => {
                if (err) {
                    console.error("Error registrando usuario Google:", err);
                    return res.status(500).json({ message: "Error al registrar usuario." });
                }

                const newUserId = result.insertId;

                req.session.user = {
                    id: newUserId,
                    usuario: nuevoUsuario.usuario,
                    nombre: nuevoUsuario.nombre,
                    role: 2,
                    foto_perfil: nuevoUsuario.foto_perfil
                };

                // 🚨 Usuario nuevo → debe llenar datos adicionales si quiere
                return res.status(201).json({
                    message: "Usuario registrado automáticamente con Google.",
                    user: req.session.user,
                    completar: true
                });
            });
        });

    } catch (error) {
        console.error("Error en loginGoogle:", error);
        return res.status(500).json({ message: "Error interno." });
    }
};

module.exports = { loginGoogle };
