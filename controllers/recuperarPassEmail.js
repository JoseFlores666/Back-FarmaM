const nodemailer = require('nodemailer');
require('dotenv').config(); 

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

async function recuperarPassEmail(token, email, name) {
    try {
        const mailOptions = {
            from: '"FarmaMedic" <' + process.env.EMAIL_USER + '>', 
            to: email, 
            subject: 'Recuperación de contraseña',
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
                    <p>Hemos recibido una solicitud para recuperar tu contraseña. Tu código de recuperación es: <strong>${token}</strong>.</p>
                    <p>Para restablecer tu contraseña, ingresa este código en la sección correspondiente de la aplicación.</p>
                    <p>Asegúrate de hacerlo antes de que el código expire, ya que este código de recuperación caducará en 15 minutos.</p>
                    <p>Si no solicitaste la recuperación de contraseña, puedes ignorar este mensaje.</p>
                    <p class="footer">Gracias por utilizar nuestros servicios.</p>
                </div>
            </body>
            </html>`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error enviando correo:', error);
    }
}

module.exports = recuperarPassEmail;
