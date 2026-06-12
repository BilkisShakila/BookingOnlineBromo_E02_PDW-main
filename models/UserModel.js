const db = require('../config/db');

class UserModel {
  static async create({ username, email, password, phone, role = 'customer' }) {
    const sql = `
      INSERT INTO users (username, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [username, email, password, phone, role]);
    return result.insertId;
  }

  static async findByUsername(username) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const [rows] = await db.query(sql, [username]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await db.query(sql, [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const sql = `SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = UserModel;
