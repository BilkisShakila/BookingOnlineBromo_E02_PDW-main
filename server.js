const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); // 🛠️ TAMBAHAN: Adapter session untuk database
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Muat variabel lingkungan
dotenv.config();

const db = require('./config/db');

// Rute
const authRoutes = require('./routes/authRoutes');
const packageRoutes = require('./routes/packageRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const PackageController = require('./controllers/PackageController');

const app = express();

// --- MODIFIKASI VERCEL: Percayai proxy routing HTTPS Vercel ---
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // 🛠️ Wajib disetel ke 1 agar cookie secure dapat dikirim lewat Vercel proxy
}

// --- MODIFIKASI VERCEL: Hindari crash fs di environment serverless ---
const uploadDir = path.join(__dirname, 'public/uploads');
if (process.env.NODE_ENV !== 'production') {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

// Inisialisasi Database MySQL
db.initDB();

// Pengaturan Template Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sajikan folder public secara statis
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- MODIFIKASI KONEKSI SESSION KE DATABASES ---
// Kita gunakan instance pool yang sama dari config/db agar hemat slot koneksi TiDB
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // Bersihkan sesi kedaluwarsa otomatis setiap 15 menit
}, db.pool); 

// Konfigurasi Session yang Dioptimalkan untuk Vercel & TiDB
app.use(session({
  key: 'booking_bromo_session',
  secret: process.env.SESSION_SECRET || 'secret_key_bromo_123',
  store: sessionStore, // 🛠️ Sesi dialihkan dari memori RAM serverless ke TiDB Cloud
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // Sesi bertahan 1 Hari
    secure: process.env.NODE_ENV === 'production', // 🛠️ Wajib TRUE di production agar aman lewat HTTPS Vercel
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 🛠️ Menghindari masalah cookie hilang saat redirect lintas domain di serverless
  }
}));

// Global Middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routing Utama
app.get('/', PackageController.renderCatalog);
app.use('/auth', authRoutes);
app.use('/packages', packageRoutes);
app.use('/booking', bookingRoutes);
app.use('/admin', adminRoutes);

// Penanganan 404 Not Found
app.use((req, res, next) => {
  res.status(404).render('login', { 
    error: 'Halaman yang Anda cari tidak ditemukan.', 
    success: null, 
    user: req.session.user || null 
  });
});

// Penanganan Error Global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Terjadi kesalahan internal pada server.');
});

// --- MODIFIKASI VERCEL: Jalankan listen HANYA di lokal saja ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server Booking Bromo berjalan di http://localhost:${PORT}`);
  });
}

// --- MODIFIKASI VERCEL: Wajib ekspor app ---
module.exports = app;