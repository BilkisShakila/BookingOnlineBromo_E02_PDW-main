const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
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
    cb(null, 'pkg-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Hanya file gambar (jpg, jpeg, png, gif, webp) yang diperbolehkan!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB
});

// Semua route admin memerlukan otentikasi admin
router.use(AuthController.isAuthenticated);
router.use(AuthController.isAdmin);

router.get('/', AdminController.renderDashboard);
router.post('/booking/approve/:id', AdminController.approveBooking);
router.post('/booking/reject/:id', AdminController.rejectBooking);

// CRUD Paket Wisata
router.get('/packages', AdminController.renderPackages);
router.post('/packages/create', upload.single('image'), AdminController.createPackage);
router.post('/packages/update/:id', upload.single('image'), AdminController.updatePackage);
router.post('/packages/delete/:id', AdminController.deletePackage);

module.exports = router;
