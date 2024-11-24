const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

const app = express();

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
        new winston.transports.Console()
    ]
});

app.use(helmet());

const allowedOrigins = [
    'https://farmamedic.vercel.app',
    'https://isoftuthh.com',
    'https://back-farmam.onrender.com',
    'http://localhost:5173',
    'http://localhost:4000',
    'https://localhost:5173',
    'https://localhost:4000',
    'https://farma-medic.vercel.app'
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
});

//true = https y si es false = http
//al desplegar el backend a render tiene que estar en false
const useHttps = false;

app.use(
    session({
        key: 'sessionId',
        secret: process.env.SESSION_SECRET || 'yourSecret',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: useHttps, 
            sameSite: 'None', 
            maxAge: 30 * 60 * 1000, 
        },
    })
);

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5000,
    message: 'Demasiadas solicitudes desde esta IP, por favor inténtalo de nuevo más tarde.',
});

app.use(limiter);

app.use('/api', authRoutes);

module.exports = app;
