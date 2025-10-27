const db = require('../../config/db');

// Guarda el descuento obtenido en la ruleta
const guardarDescuento = async (req, res) => {
  try {
    const { id_usuario, premio } = req.body;
    let porcentaje_descuento = 0;
    const match = premio.match(/\d+/);
    if (match) porcentaje_descuento = parseInt(match[0]);

    await db.query(
      `INSERT INTO ruleta_descuentos (id_usuario, premio, porcentaje_descuento)
       VALUES (?, ?, ?)`,
      [id_usuario, premio, porcentaje_descuento]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error guardando descuento:", err);
    res.status(500).json({ error: "Error al guardar descuento" });
  }
};

// Verifica si el usuario puede girar la ruleta
const puedeGirar = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    if (!id_usuario) return res.status(400).json({ error: "Falta el parámetro id_usuario" });

    // 1️⃣ Fecha de creación del usuario
    const [usuario] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT created_at FROM usuarios WHERE id = ?`,
        [id_usuario],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const fechaCreacion = new Date(usuario.created_at);
    const limiteGiro = new Date(fechaCreacion.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ahora = new Date();

    // 2️⃣ Verificar si ya giró antes
    const [giro] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT fecha_giro, premio 
         FROM ruleta_descuentos 
         WHERE id_usuario = ?
         ORDER BY fecha_giro DESC 
         LIMIT 1`,
        [id_usuario],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // 3️⃣ Ya giró → no puede volver
    if (giro) {
      return res.json({
        puedeGirar: false,
        motivo: "Ya giraste una vez.",
        fecha_giro: giro.fecha_giro,
        premio: giro.premio,
      });
    }

    // 4️⃣ Expiró el plazo de 7 días
    if (ahora > limiteGiro) {
      return res.json({
        puedeGirar: false,
        motivo: "Tu tiempo para girar la ruleta expiró (7 días después del registro).",
        fecha_limite: limiteGiro,
      });
    }

    // 5️⃣ Puede girar (dentro de los 7 días y no ha girado)
    res.json({
      puedeGirar: true,
      mensaje: "Puedes girar la ruleta por primera vez",
      fecha_limite: limiteGiro,
    });
  } catch (err) {
    console.error("Error verificando ruleta:", err);
    res.status(500).json({ error: "Error al verificar ruleta" });
  }
};

module.exports = { guardarDescuento, puedeGirar };
