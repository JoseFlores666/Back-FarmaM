const nodemailer = require('nodemailer');
require('dotenv').config(); // Para usar variables de entorno

// Configura Nodemailer con un servicio SMTP (por ejemplo, Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Puedes usar otros servicios o un servidor SMTP
    auth: {
        user: process.env.EMAIL_USER, // Tu correo electrónico
        pass: process.env.EMAIL_PASS  // Tu contraseña o token de aplicación
    }
});

async function sendVerificationEmail(token, email, name) {
    try {
        // Crear el contenido del correo
        const mailOptions = {
            from: '"FarmaMedic" <' + process.env.EMAIL_USER + '>', // Remitente del correo
            to: email, // Destinatario
            subject: 'Verificación de Correo Electrónico',
            html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #007bff;
                        text-align: center;
                    }
                    p {
                        line-height: 1.6;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 0.9em;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Hola ${name}</h1>
                    <p>Gracias por registrarte. Para activar tu cuenta, utiliza el siguiente código de verificación: <strong>${token}</strong>.</p>
                    <p>Ingresa este código en la plataforma FarmaMedic para confirmar tu dirección de correo electrónico y activar tu cuenta.</p>
                    <p>Recuerda que este código de verificación caducará en 15 minutos, así que asegúrate de utilizarlo a tiempo.</p>
                    <p>Si no te registraste en nuestra plataforma, puedes ignorar este mensaje.</p>
                    <p class="footer">¡Gracias por ser parte de nuestra comunidad!</p>
                </div>
            </body>
            </html>`
        };

        // Enviar el correo utilizando Nodemailer
        await transporter.sendMail(mailOptions);
        console.log('Correo enviado con éxito a', email);
    } catch (error) {
        console.error('Error enviando correo:', error);
    }
}

module.exports = sendVerificationEmail;
