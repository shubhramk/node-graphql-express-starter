const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/domains', require('./domains'));
router.use('/roles', require('./roles'));
router.use('/domainslog', require('./domainsLog'));

module.exports = router;