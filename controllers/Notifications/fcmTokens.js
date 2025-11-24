const db = require('../../config/db');

const fcmTokens = (req, res) => {
    const { userId, token, deviceInfo } = req.body;

    const sql = `
        INSERT INTO fcm_tokens (user_id, fcm_token, device_info)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE fcm_token = VALUES(fcm_token)
    `;

    db.query(sql, [userId, token, deviceInfo], (err) => {
        if (err) {
            console.log("Error guardando token FCM:", err);
            return res.status(500).json({ error: "Error guardando token" });
        }
        return res.json({ message: "Token FCM guardado correctamente" });
    });
};

module.exports={fcmTokens}
