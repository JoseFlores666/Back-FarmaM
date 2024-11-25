const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken'); 
const { body, validationResult } = require('express-validator');

router.use(express.json());

const verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correo, otp } = req.body;

  try {
    const token = req.cookies.verificationToken; 

    if (!token) {
      return res.status(400).json({ message: 'El token de verificación ha expirado o no existe.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'El token de verificación no es válido o ha expirado.' });
    }

    const expectedOtp = decoded.verificationCode; 

    if (otp !== expectedOtp) {
      return res.status(400).json({ message: 'El código de verificación es incorrecto.' });
    }

    db.query(
      'UPDATE usuarios SET isVerified = 1 WHERE correo = ?',
      [correo],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error al actualizar el estado de verificación.' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado o ya verificado.' });
        }

        res.clearCookie('verificationToken');
        return res.status(200).json({ message: 'Verificación exitosa.' });
      }
    );
  } catch (err) {
    return res.status(500).json({ message: 'Error al verificar el código de verificación.' });
  }
};

module.exports = verifyOtp;
