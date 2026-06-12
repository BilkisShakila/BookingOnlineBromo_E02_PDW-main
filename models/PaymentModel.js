const db = require('../config/db');

class PaymentModel {
  static async create({ booking_id, amount_paid, bank_name, account_holder, payment_proof_url }) {
    const sql = `
      INSERT INTO payments (booking_id, amount_paid, bank_name, account_holder, payment_proof_url, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(sql, [booking_id, amount_paid, bank_name, account_holder, payment_proof_url]);
    return result.insertId;
  }

  static async findByBookingId(bookingId) {
    const sql = `SELECT * FROM payments WHERE booking_id = ?`;
    const [rows] = await db.query(sql, [bookingId]);
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE payments SET status = ? WHERE id = ?`;
    const [result] = await db.query(sql, [status, id]);
    return result.affectedRows > 0;
  }
}

module.exports = PaymentModel;
