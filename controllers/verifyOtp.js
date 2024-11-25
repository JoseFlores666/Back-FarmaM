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
    const cookieVerificationCode = req.cookies.verificationCode;

    if (!cookieVerificationCode) {
      return res.status(400).json({ message: 'El código de verificación ha expirado o no existe.' });
    }

    if (otp === cookieVerificationCode) {
      const updateResult = await new Promise((resolve, reject) => {
        db.query('UPDATE usuarios SET isVerified = 1 WHERE correo = ?', [correo], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'No se pudo actualizar la verificación en la tabla de usuarios.' });
      }

      res.clearCookie('verificationCode');

      return res.status(200).json({ message: 'Verificación exitosa.' });
    } else {
      return res.status(400).json({ message: 'El código de verificación es incorrecto.' });
    }
  } catch (err) {
    console.error('Error en verifyOtp:', err);
    return res.status(500).json({ message: 'Error al verificar el código de verificación.' });
  }
};

module.exports = verifyOtp;
