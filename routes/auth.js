const express = require("express");
const authController = require('../controllers/auth');

const router = express.Router();


// register y login son funciones creadas en controllers/auth
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
