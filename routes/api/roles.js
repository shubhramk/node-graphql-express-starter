const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Roles = mongoose.model('Roles');
const request = require('request');
/*
 * Get All roles
 */
router.get('/all', auth.required, (req, res, next) => {
    Roles.find({},"roleID label", function (err, roles) {
        if (err){
            return res.status(400).json({
                errors: {
                    message: err.message
                }
            });
        };
        res.json(roles);
    });
});

module.exports = router;  