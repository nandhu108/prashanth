'use strict';

const express = require('express');
const { createRegistration, getRegistrationByCode } = require('../controllers/publicRegistrationController');

const router = express.Router();

router.post('/', createRegistration);
router.get('/:code', getRegistrationByCode);

module.exports = router;
