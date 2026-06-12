const BookingModel = require('../models/BookingModel');
const PackageModel = require('../models/PackageModel');
const PaymentModel = require('../models/PaymentModel');
const fs = require('fs');
const path = require('path');

class BookingController {
  static async renderBookingForm(req, res) {
    const { packageId } = req.query;
    try {
      if (!packageId) {
        return res.redirect('/');
      }
      const pkg = await PackageModel.findById(packageId);
      if (!pkg) {
        return res.status(404).send('Paket wisata tidak ditemukan.');
      }
      res.render('booking', { 
        package: pkg, 
        user: req.session.user 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan sistem.');
    }
  }

  static async createBooking(req, res) {
    const { package_id, travel_date, total_participants } = req.body;
    const userId = req.session.user.id;
    try {
      if (!package_id || !travel_date || !total_participants) {
        return res.status(400).send('Mohon lengkapi semua field formulir.');
      }

      const pkg = await PackageModel.findById(package_id);
      if (!pkg) {
        return res.status(404).send('Paket tidak ditemukan.');
      }

      const price = parseFloat(pkg.price_per_person);
      const participantsCount = parseInt(total_participants);
      const totalPrice = price * participantsCount;

      await BookingModel.create({
        user_id: userId,
        package_id: package_id,
        travel_date: travel_date,
        total_participants: participantsCount,
        total_price: totalPrice
      });

      res.redirect('/booking/history');
    } catch (error) {
      console.error(error);
      res.status(500).send('Gagal membuat pemesanan.');
    }
  }

  static async renderHistory(req, res) {
    const userId = req.session.user.id;
    try {
      const bookings = await BookingModel.findByUserId(userId);
      res.render('history', { 
        bookings, 
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Gagal memuat riwayat pemesanan.');
    }
  }

  static async uploadPaymentProof(req, res) {
    const { booking_id, amount_paid, bank_name, account_holder } = req.body;
    
    try {
      if (!req.file) {
        return res.redirect('/booking/history?error=Silakan+pilih+file+bukti+pembayaran.');
      }

      if (!booking_id || !amount_paid || !bank_name || !account_holder) {
        // Hapus file jika upload form tidak valid
        fs.unlinkSync(req.file.path);
        return res.redirect('/booking/history?error=Mohon+lengkapi+seluruh+data+form+bukti+transfer.');
      }

      const booking = await BookingModel.findById(booking_id);
      if (!booking) {
        fs.unlinkSync(req.file.path);
        return res.redirect('/booking/history?error=Transaksi+pemesanan+tidak+ditemukan.');
      }

      // Pastikan booking ini milik user yang login
      if (booking.user_id !== req.session.user.id) {
        fs.unlinkSync(req.file.path);
        return res.redirect('/booking/history?error=Akses+ditolak.');
      }

      const paymentProofUrl = `/uploads/${req.file.filename}`;

      // Simpan pembayaran
      await PaymentModel.create({
        booking_id: parseInt(booking_id),
        amount_paid: parseFloat(amount_paid),
        bank_name: bank_name,
        account_holder: account_holder,
        payment_proof_url: paymentProofUrl
      });

      // Update status booking menjadi 'waiting_verification'
      await BookingModel.updateStatus(booking_id, 'waiting_verification');

      res.redirect('/booking/history?success=Bukti+pembayaran+berhasil+diunggah.+Harap+tunggu+konfirmasi+admin.');
    } catch (error) {
      console.error(error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.redirect('/booking/history?error=Terjadi+kesalahan+saat+mengunggah+bukti.');
    }
  }

  static async cancelBooking(req, res) {
    const { id } = req.params;
    const userId = req.session.user.id;
    try {
      const success = await BookingModel.cancel(id, userId);
      if (success) {
        res.redirect('/booking/history?success=Pemesanan+berhasil+dibatalkan.');
      } else {
        res.redirect('/booking/history?error=Pemesanan+tidak+dapat+dibatalkan+(mungkin+status+sudah+berubah).');
      }
    } catch (error) {
      console.error(error);
      res.redirect('/booking/history?error=Gagal+membatalkan+pemesanan.');
    }
  }
}

module.exports = BookingController;
