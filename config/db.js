const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi dasar database dinamis membaca .env
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  port: parseInt(process.env.DB_PORT) || 3306,
  // Mengamankan jalur transpor data ke TiDB Cloud dengan enkripsi TLS/SSL ketat
  ssl: process.env.DB_SSL === 'true' ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : false
};

// Inisialisasi pool koneksi
const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || 'booking_bromo',
  waitForConnections: true,
  connectionLimit: 5,       // Batasi limit koneksi di lingkungan serverless agar efisien
  queueLimit: 0,
  connectTimeout: 15000     // Menaikkan batas batas tunggu (15 detik) untuk mencegah ETIMEDOUT
});

// Fungsi inisialisasi yang disederhanakan untuk kestabilan production di Vercel
async function initDB() {
  try {
    // Lakukan cek ping koneksi singkat untuk memastikan kredensial .env valid
    const connection = await pool.getConnection();
    console.log(`Berhasil terhubung ke database TiDB: ${process.env.DB_NAME || 'booking_bromo'}`);
    
    // Jika berjalan di lokal (development), jalankan fungsi pembantu opsional jika diperlukan
    if (process.env.NODE_ENV !== 'production' && process.env.DB_HOST === 'localhost') {
      await createTables();
      await seedData();
    }
    
    connection.release(); // Kembalikan slot koneksi ke dalam pool
  } catch (error) {
    console.error('Gagal mengoneksikan database:', error);
    // Jangan gunakan process.exit(1) di serverless agar runtime container tidak mati total
  }
}

// Fungsi pembantu pembuatan tabel otomatis (hanya aktif di lingkungan lokal jika diizinkan)
async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const packagesTable = `
    CREATE TABLE IF NOT EXISTS packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      price_per_person DECIMAL(10, 2) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const bookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      package_id INT NOT NULL,
      travel_date DATE NOT NULL,
      total_participants INT NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'waiting_verification', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
      booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );
  `;

  const paymentsTable = `
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      amount_paid DECIMAL(10, 2) NOT NULL,
      bank_name VARCHAR(50) NOT NULL,
      account_holder VARCHAR(100) NOT NULL,
      payment_proof_url VARCHAR(255) NOT NULL,
      status ENUM('pending', 'verified', 'failed') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `;

  await pool.query(usersTable);
  await pool.query(packagesTable);
  await pool.query(bookingsTable);
  await pool.query(paymentsTable);
}

// Fungsi pembantu penyuntikan data awal (hanya aktif di lingkungan lokal)
async function seedData() {
  const bcrypt = require('bcryptjs');
  const [admins] = await pool.query("SELECT * FROM users WHERE role = 'admin'");
  if (admins.length === 0) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    await pool.query(
      "INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, 'admin')",
      ['admin', 'admin@bromo.com', hashedPassword, '081234567890']
    );
  }
}

function query(sql, params) {
  return pool.query(sql, params);
}

module.exports = {
  initDB,
  query,
  getPool: () => pool
};