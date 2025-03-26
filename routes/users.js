const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// User model
const User = require('../models/User');

// Login
router.get('/login', (req, res) => {
    res.render('Login');
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'An error occurred while logging out.');
            return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

// Register
router.get('/register', (req, res) => {
    res.render('Register');
});

// Register Handle
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    // Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        // Render the register page with errors
        res.render('Register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        // Validation passed
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    // User exists
                    errors.push({ msg: 'Email is already registered' });
                    res.render('Register', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                } else {
                    const newUser = new User({
                        name,
                        email,
                        password
                    });

                    // Hash Password
                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) {
                            console.error(err);
                            req.flash('error_msg', 'An error occurred. Please try again.');
                            return res.redirect('/users/register');
                        }
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) {
                                console.error(err);
                                req.flash('error_msg', 'An error occurred. Please try again.');
                                return res.redirect('/users/register');
                            }
                            // Set password to hashed
                            newUser.password = hash;
                            // Save user
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in');
                                    res.redirect('/users/login');
                                })
                                .catch(err => {
                                    console.error(err);
                                    req.flash('error_msg', 'An error occurred. Please try again.');
                                    res.redirect('/users/register');
                                });
                        });
                    });
                }
            })
            .catch(err => {
                console.error(err);
                req.flash('error_msg', 'An error occurred. Please try again.');
                res.redirect('/users/register');
            });
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

module.exports = router;