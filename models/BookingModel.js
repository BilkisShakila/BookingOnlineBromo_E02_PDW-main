const db = require('../config/db');

class BookingModel {
  static async create({ user_id, package_id, travel_date, total_participants, total_price }) {
    const sql = `
      INSERT INTO bookings (user_id, package_id, travel_date, total_participants, total_price, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(sql, [user_id, package_id, travel_date, total_participants, total_price]);
    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT b.*, p.name as package_name, p.price_per_person, u.username, u.email, u.phone
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const sql = `
      SELECT b.*, p.name as package_name, p.image_url as package_image, pay.id as payment_id, pay.status as payment_status
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      LEFT JOIN payments pay ON b.id = pay.booking_id
      WHERE b.user_id = ?
      ORDER BY b.id DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  }

  static async getAllWithDetails() {
    const sql = `
      SELECT b.*, p.name as package_name, u.username, u.email, u.phone, pay.id as payment_id, pay.status as payment_status
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN payments pay ON b.id = pay.booking_id
      ORDER BY b.id DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE bookings SET status = ? WHERE id = ?`;
    const [result] = await db.query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  static async cancel(id, userId) {
    const sql = `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'`;
    const [result] = await db.query(sql, [id, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = BookingModel;
