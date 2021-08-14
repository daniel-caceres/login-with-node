const express = require('express');
const authController = require('../controllers/auth');
const {promisify} = require('util')

const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render("index", {
      user: req.user
    });
  } else {
    res.render("index")
  }
});

router.get("/profile", authController.isLoggedIn, (req, res) => {
  if ( req.user ) {
    res.render('profile', {
      user: req.user
    });  
  } else {
    res.redirect('/login');
  }
});

module.exports = router