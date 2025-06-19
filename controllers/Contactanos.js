const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendCorreo = async (req, res) => {
    const { nombre, correo, titulo, mensaje } = req.body;

    const mailToEmpresa = {
        from: `"${nombre}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: correo,
        subject: `Formulario de contacto - ${titulo}`,
        html: `
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Título:</strong> ${titulo}</p>
      <p><strong>Mensaje:</strong><br/>${mensaje}</p>
    `
    };

    const mailToCliente = {
        from: `"FarmaMedic" <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: 'Hemos recibido tu mensaje',
        html: `
      <p>Hola ${nombre},</p>
      <p>Gracias por contactarnos. Hemos recibido tu mensaje con el siguiente contenido:</p>
      <p><strong>Título:</strong> ${titulo}</p>
      <p><strong>Mensaje:</strong><br/>${mensaje}</p>
      <br/>
      <p>Nos pondremos en contacto contigo lo antes posible.</p>
      <p>— Atentamente: FarmaMedic</p>
    `
    };

    try {
        await transporter.sendMail(mailToEmpresa);

        await transporter.sendMail(mailToCliente);

        res.status(200).json({ message: 'Correo enviado correctamente' });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ message: 'Error al enviar correo' });
    }
};

module.exports = { sendCorreo };
