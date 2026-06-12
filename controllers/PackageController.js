const PackageModel = require('../models/PackageModel');

class PackageController {
  static async renderCatalog(req, res) {
    try {
      const packages = await PackageModel.getAll();
      res.render('index', { 
        packages, 
        user: req.session.user || null 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan saat memuat paket wisata.');
    }
  }

  static async renderDetail(req, res) {
    const { id } = req.params;
    try {
      const pkg = await PackageModel.findById(id);
      if (!pkg) {
        return res.status(404).send('Paket wisata tidak ditemukan.');
      }
      res.render('package-detail', { 
        package: pkg, 
        user: req.session.user || null 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan saat memuat detail paket.');
    }
  }
}

module.exports = PackageController;
