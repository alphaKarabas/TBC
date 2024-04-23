const Router = require("express");
const User = require("../models/User");
const { check } = require("express-validator");
const router = new Router();
const AuthController = require("../controllers/AuthController");
const authMiddleware = require("../middleware/auth.middleware");
const ruleMiddleware = require("../middleware/rule.middleware");

router.post(
  "/registration",
  [
    check("email", "Uncorrect email")
      .isEmail()
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject(`User with email ${value} already exist`);
          }
        });
      }),
    check("phoneNumber", "Uncorrect phone number").isMobilePhone("any"), //Don't work
    check(
      "password",
      "Password must be longer then 8 and shorter than 32"
    ).isLength({ min: 8, max: 32 }),
  ],
  AuthController.registration
);

router.post(
  "/login",
  [
    check("email", "Email is empty").notEmpty(),
    check("password", "Password is empty").notEmpty(),
  ],
  AuthController.login
);

router.get("/auth", [authMiddleware, ruleMiddleware], AuthController.auth);

module.exports = router;