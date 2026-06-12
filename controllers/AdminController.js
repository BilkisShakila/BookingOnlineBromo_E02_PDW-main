const BookingModel = require('../models/BookingModel');
const PackageModel = require('../models/PackageModel');
const PaymentModel = require('../models/PaymentModel');
const fs = require('fs');
const path = require('path');

class AdminController {
  static async renderDashboard(req, res) {
    try {
      const bookings = await BookingModel.getAllWithDetails();
      
      // Ambil bukti pembayaran detail untuk pemesanan yang menunggu verifikasi
      for (let booking of bookings) {
        if (booking.payment_id) {
          const payment = await PaymentModel.findByBookingId(booking.id);
          booking.payment_details = payment;
        }
      }

      res.render('admin/dashboard', { 
        bookings, 
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Gagal memuat dashboard admin.');
    }
  }

  static async approveBooking(req, res) {
    const { id } = req.params;
    try {
      const booking = await BookingModel.findById(id);
      if (!booking) {
        return res.redirect('/admin?error=Transaksi+tidak+ditemukan.');
      }

      // Update status booking ke approved
      await BookingModel.updateStatus(id, 'approved');

      // Update status payment ke verified jika ada
      const payment = await PaymentModel.findByBookingId(id);
      if (payment) {
        await PaymentModel.updateStatus(payment.id, 'verified');
      }

      res.redirect('/admin?success=Transaksi+berhasil+disetujui.');
    } catch (error) {
      console.error(error);
      res.redirect('/admin?error=Gagal+menyetujui+transaksi.');
    }
  }

  static async rejectBooking(req, res) {
    const { id } = req.params;
    try {
      const booking = await BookingModel.findById(id);
      if (!booking) {
        return res.redirect('/admin?error=Transaksi+tidak+ditemukan.');
      }

      // Update status booking ke rejected
      await BookingModel.updateStatus(id, 'rejected');

      // Update status payment ke failed jika ada
      const payment = await PaymentModel.findByBookingId(id);
      if (payment) {
        await PaymentModel.updateStatus(payment.id, 'failed');
      }

      res.redirect('/admin?success=Transaksi+berhasil+ditolak.');
    } catch (error) {
      console.error(error);
      res.redirect('/admin?error=Gagal+menolak+transaksi.');
    }
  }

  static async renderPackages(req, res) {
    try {
      const packages = await PackageModel.getAll();
      res.render('admin/packages', { 
        packages, 
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Gagal memuat manajemen paket.');
    }
  }

  static async createPackage(req, res) {
    const { name, description, price_per_person } = req.body;
    try {
      if (!name || !description || !price_per_person || !req.file) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.redirect('/admin/packages?error=Semua+field+termasuk+gambar+paket+harus+diisi.');
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      await PackageModel.create({
        name,
        description,
        price_per_person: parseFloat(price_per_person),
        image_url: imageUrl
      });

      res.redirect('/admin/packages?success=Paket+wisata+berhasil+ditambahkan.');
    } catch (error) {
      console.error(error);
      if (req.file) fs.unlinkSync(req.file.path);
      res.redirect('/admin/packages?error=Gagal+menambahkan+paket+wisata.');
    }
  }

  static async updatePackage(req, res) {
    const { id } = req.params;
    const { name, description, price_per_person } = req.body;
    try {
      if (!name || !description || !price_per_person) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.redirect('/admin/packages?error=Nama,+deskripsi,+dan+harga+harus+diisi.');
      }

      let updateData = {
        name,
        description,
        price_per_person: parseFloat(price_per_person)
      };

      if (req.file) {
        updateData.image_url = `/uploads/${req.file.filename}`;
        
        // Hapus gambar lama jika ada
        const oldPkg = await PackageModel.findById(id);
        if (oldPkg && oldPkg.image_url && oldPkg.image_url.startsWith('/uploads/')) {
          const oldFilePath = path.join(__dirname, '../public', oldPkg.image_url);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      await PackageModel.update(id, updateData);
      res.redirect('/admin/packages?success=Paket+wisata+berhasil+diperbarui.');
    } catch (error) {
      console.error(error);
      if (req.file) fs.unlinkSync(req.file.path);
      res.redirect('/admin/packages?error=Gagal+memperbarui+paket+wisata.');
    }
  }

  static async deletePackage(req, res) {
    const { id } = req.params;
    try {
      const pkg = await PackageModel.findById(id);
      if (!pkg) {
        return res.redirect('/admin/packages?error=Paket+tidak+ditemukan.');
      }

      // Hapus gambar terkait
      if (pkg.image_url && pkg.image_url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../public', pkg.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await PackageModel.delete(id);
      res.redirect('/admin/packages?success=Paket+wisata+berhasil+dihapus.');
    } catch (error) {
      console.error(error);
      res.redirect('/admin/packages?error=Gagal+menghapus+paket+wisata.');
    }
  }
}

module.exports = AdminController;
