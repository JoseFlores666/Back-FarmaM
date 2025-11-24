const admin = require("../config/firebaseAdmin");
const db = require('../config/db');

async function sendNotificationToUser(userId, title, body) {
  return new Promise((resolve, reject) => {
    // 1. Buscar token del usuario
    const sql = "SELECT fcm_token FROM fcm_tokens WHERE user_id = ? LIMIT 1";

    db.query(sql, [userId], async (err, results) => {
      if (err) {
        console.log("❌ Error buscando token:", err);
        return reject(err);
      }

      if (results.length === 0) {
        console.log("⚠️ Usuario no tiene token FCM");
        return resolve("No token");
      }

      const token = results[0].fcm_token;

      const message = {
        token,
        notification: { title, body },
        android: {
          priority: "high",
        },
        data: {
          userId: String(userId),
        },
      };

      try {
        const response = await admin.messaging().send(message);
        console.log("📩 Notificación enviada:", response);
        resolve(response);
      } catch (sendErr) {
        console.log("❌ Error enviando notificación:", sendErr);
        reject(sendErr);
      }
    });
  });
}

module.exports = sendNotificationToUser;
