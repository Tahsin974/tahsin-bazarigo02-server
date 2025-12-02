const pool = require("./db");

const createNotification = async ({
  userId,
  userRole,
  title,
  message,
  type = null,
  refId = null,
  refData = null,
  expiresAt = null,
}) => {
  try {
    await pool.query(
      `INSERT INTO notifications 
      (user_id, user_role, title, message, type, ref_id, ref_data, expires_at) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, userRole, title, message, type, refId, refData, expiresAt]
    );
  } catch (err) {
    console.error("Notification Error:", err);
  }
};
module.exports = createNotification;
