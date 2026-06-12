const db = require('../config/db');

class PackageModel {
  static async getAll() {
    const sql = `SELECT * FROM packages ORDER BY id DESC`;
    const [rows] = await db.query(sql);
    return rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM packages WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async create({ name, description, price_per_person, image_url }) {
    const sql = `
      INSERT INTO packages (name, description, price_per_person, image_url)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [name, description, price_per_person, image_url]);
    return result.insertId;
  }

  static async update(id, { name, description, price_per_person, image_url }) {
    let sql, params;
    if (image_url) {
      sql = `
        UPDATE packages
        SET name = ?, description = ?, price_per_person = ?, image_url = ?
        WHERE id = ?
      `;
      params = [name, description, price_per_person, image_url, id];
    } else {
      sql = `
        UPDATE packages
        SET name = ?, description = ?, price_per_person = ?
        WHERE id = ?
      `;
      params = [name, description, price_per_person, id];
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const sql = `DELETE FROM packages WHERE id = ?`;
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = PackageModel;
