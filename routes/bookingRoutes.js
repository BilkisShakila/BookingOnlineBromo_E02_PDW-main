const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/BookingController');
const AuthController = require('../controllers/AuthController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Validasi ekstensi
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Hanya file gambar (jpg, jpeg, png, gif) yang diperbolehkan!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB
});

// Semua route booking memerlukan otentikasi
router.use(AuthController.isAuthenticated);

router.get('/new', BookingController.renderBookingForm);
router.post('/new', BookingController.createBooking);

router.get('/history', BookingController.renderHistory);
router.post('/payment', upload.single('payment_proof'), BookingController.uploadPaymentProof);

router.post('/cancel/:id', BookingController.cancelBooking);

module.exports = router;
