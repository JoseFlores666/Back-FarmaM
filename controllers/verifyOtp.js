const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

router.use(express.json());

const verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correo, otp } = req.body;

  try {
    // Buscar el usuario por correo
    db.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo],
      (err, results) => {
        if (err) {
          console.error('Error en la consulta de usuario:', err);
          return res.status(500).json({ message: 'Error al verificar el usuario.' });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userId = results[0].id;

        // Buscar el código de verificación en la base de datos
        db.query(
          'SELECT * FROM auth_codes WHERE user_id = ? AND code = ? AND used = FALSE',
          [userId, otp],
          (err, codeResults) => {
            if (err) {
              console.error('Error en la consulta del código:', err);
              return res.status(500).json({ message: 'Error al verificar el código.' });
            }

            if (codeResults.length === 0) {
              return res.status(400).json({ message: 'Código de verificación incorrecto o ya utilizado.' });
            }

            const authCode = codeResults[0];

            // Verificar si el código ha expirado
            if (new Date(authCode.expires_at) < new Date()) {
              return res.status(400).json({ message: 'El código ha expirado.' });
            }

            // Marcar el código como usado
            db.query(
              'UPDATE auth_codes SET used = TRUE WHERE id = ?',
              [authCode.id],
              (err) => {
                if (err) {
                  console.error('Error al actualizar el código:', err);
                  return res.status(500).json({ message: 'Error al actualizar el código de verificación.' });
                }

                // Marcar al usuario como verificado
                db.query(
                  'UPDATE seguridad SET isVerified = 1 WHERE user_id = ?',
                  [userId],
                  (err) => {
                    if (err) {
                      console.error('Error al actualizar estado de verificación:', err);
                      return res.status(500).json({ message: 'Error al actualizar estado de verificación.' });
                    }

                    return res.status(200).json({ message: 'Verificación exitosa.' });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (err) {
    console.error('Error en la verificación del código:', err);
    return res.status(500).json({ message: 'Error al verificar el código de verificación.' });
  }
};

module.exports = verifyOtp;
