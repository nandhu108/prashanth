'use strict';

const express = require('express');
const { submitFeedback } = require('../controllers/publicFeedbackController');

const router = express.Router();

router.post('/', submitFeedback);

module.exports = router;
