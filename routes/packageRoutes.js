const express = require('express');
const router = express.Router();
const PackageController = require('../controllers/PackageController');

router.get('/:id', PackageController.renderDetail);

module.exports = router;
