const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');

class AuthController {
  static renderRegister(req, res) {
    if (req.session.user) {
      return res.redirect('/');
    }
    res.render('register', { error: null, success: null, user: null });
  }

  static async register(req, res) {
    const { username, email, password, phone } = req.body;
    try {
      // Validasi input kosong
      if (!username || !email || !password || !phone) {
        return res.render('register', { error: 'Semua field harus diisi!', success: null, user: null });
      }

      // Cek username unik
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return res.render('register', { error: 'Username sudah digunakan!', success: null, user: null });
      }

      // Cek email unik
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.render('register', { error: 'Email sudah terdaftar!', success: null, user: null });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan user
      await UserModel.create({
        username,
        email,
        password: hashedPassword,
        phone,
        role: 'customer'
      });

      res.render('login', { success: 'Registrasi berhasil! Silakan login.', error: null, user: null });
    } catch (error) {
      console.error(error);
      res.render('register', { error: 'Terjadi kesalahan sistem, silakan coba lagi.', success: null, user: null });
    }
  }

  static renderLogin(req, res) {
    if (req.session.user) {
      return res.redirect('/');
    }
    res.render('login', { error: null, success: null, user: null });
  }

  static async login(req, res) {
    const { username, password } = req.body;
    try {
      if (!username || !password) {
        return res.render('login', { error: 'Username dan password wajib diisi!', success: null, user: null });
      }

      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.render('login', { error: 'Username atau password salah!', success: null, user: null });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.render('login', { error: 'Username atau password salah!', success: null, user: null });
      }

      // Simpan session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      if (user.role === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/');
      }
    } catch (error) {
      console.error(error);
      res.render('login', { error: 'Terjadi kesalahan sistem, silakan coba lagi.', success: null, user: null });
    }
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
      res.redirect('/');
    });
  }

  // Middleware Auth
  static isAuthenticated(req, res, next) {
    if (req.session.user) {
      return next();
    }
    res.redirect('/auth/login');
  }

  static isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    res.status(403).send('Forbidden: Akses khusus Administrator.');
  }
}

module.exports = AuthController;
