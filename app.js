const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session'); 
const MySQLStore = require('express-mysql-session')(session); 
const authRoutes = require('./routes/authRoutes');
const csrfProtection = require('./middlewares/csrfMiddleware');
const cookieParser = require('cookie-parser');
const helmet = require('helmet'); // Importar helmet
const rateLimit = require('express-rate-limit'); // Importar rate limiting
const winston = require('winston'); // Importar winston para logging
require('dotenv').config();

const app = express();

// Configurar logger con winston
const logger = winston.createLogger({
    level: 'error', // Solo registrar errores
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }), // Guardar errores en un archivo
        new winston.transports.Console() // Mostrar errores en la consola también
    ]
});

// Agregar helmet para configurar cabeceras de seguridad
app.use(helmet());

// Configurar CORS
app.use(cors({
    origin: 'http://localhost:5173', // Especifica el origen permitido (tu frontend)
    credentials: true, // Permite el envío de cookies con la solicitud
}));


// Configuración de la sesión
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true, 
    checkExpirationInterval: 900000, 
    expiration: 86400000, 
});

app.use(
    session({
        key: 'sessionId', 
        secret: process.env.SESSION_SECRET || 'yourSecret', 
        store: sessionStore,
        resave: false,
        saveUninitialized: false, 
        cookie: {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Solo cookies seguras en producción
            sameSite: 'Strict',
            maxAge: 30 * 60 * 1000, 
        },
    })
);

// Middleware para parsear cookies
app.use(cookieParser());

// Middlewares de parsing para JSON y URL-encoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

// Configurar Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita a 100 solicitudes por IP cada 15 minutos
    message: 'Demasiadas solicitudes desde esta IP, por favor inténtalo de nuevo más tarde.'
});

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Aplicar protección CSRF para todas las rutas
app.use(csrfProtection);

// Ruta para enviar el token CSRF al frontend
app.get('/api/csrf-token', (req, res) => {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
        httpOnly: false, // Permite que el frontend acceda a la cookie
        secure: process.env.NODE_ENV === 'production', // Solo en producción
        sameSite: 'Strict',
    });
    res.json({ csrfToken: req.csrfToken() });
});


// Middleware global para manejo de errores
app.use((err, req, res, next) => {
    // Registrar el error con Winston
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });

    if (process.env.NODE_ENV === 'production') {
        res.status(500).send('Ocurrió un error, por favor inténtalo de nuevo más tarde.');
    } else {
        res.status(500).send(err.stack);
    }
});

// Rutas de autenticación
app.use('/api', authRoutes);

module.exports = app;
