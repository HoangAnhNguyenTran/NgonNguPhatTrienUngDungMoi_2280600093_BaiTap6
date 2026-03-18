var express = require("express");
var router = express.Router();
let userController = require("../controllers/users");
let bcrypt = require("bcrypt");
const { CheckLogin } = require("../utils/authHandler");
const { body } = require("express-validator");
const { validatedResult } = require("../utils/validateHandler");
const { signAccessToken } = require("../utils/jwtHandler");

router.post("/register", async function (req, res, next) {
  try {
    let { username, password, email } = req.body;
    let newUser = await userController.CreateAnUser(
      username,
      password,
      email,
      "69b0ddec842e41e8160132b8",
    );
    res.send(newUser);
  } catch (error) {
    res.status(404).send(error.message);
  }
});
router.post("/login", async function (req, res, next) {
  try {
    let { username, password } = req.body;
    let user = await userController.GetAnUserByUsername(username);
    if (!user) {
      res.status(404).send({
        message: "thong tin dang nhap sai",
      });
      return;
    }
    if (user.lockTime > Date.now()) {
      res.status(404).send({
        message: "ban dang bi ban",
      });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      user.loginCount = 0;
      await user.save();
      let token = signAccessToken({ id: user._id.toString() });
      res.send(token);
    } else {
      user.loginCount++;
      if (user.loginCount == 3) {
        user.loginCount = 0;
        user.lockTime = Date.now() + 3600 * 1000;
      }
      await user.save();
      res.status(404).send({
        message: "thong tin dang nhap sai",
      });
    }
  } catch (error) {
    res.status(404).send({
      message: error.message,
    });
  }
});
router.get("/me", CheckLogin, function (req, res, next) {
  res.send(req.user);
});

router.post(
  "/changepassword",
  CheckLogin,
  [
    body("oldpassword")
      .notEmpty()
      .withMessage("oldpassword khong duoc de trong"),
    body("newpassword")
      .notEmpty()
      .withMessage("newpassword khong duoc de trong")
      .bail()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
      })
      .withMessage(
        "newpassword it nhat 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet",
      ),
  ],
  validatedResult,
  async function (req, res, next) {
    try {
      let { oldpassword, newpassword } = req.body;
      let user = req.user;

      const isOldPasswordValid = await bcrypt.compare(
        oldpassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        res.status(400).send({
          message: "oldpassword khong dung",
        });
        return;
      }

      const isSameAsCurrentPassword = await bcrypt.compare(
        newpassword,
        user.password,
      );
      if (isSameAsCurrentPassword) {
        res.status(400).send({
          message: "newpassword khong duoc trung voi mat khau cu",
        });
        return;
      }

      user.password = newpassword;
      await user.save();

      res.send({
        message: "doi mat khau thanh cong",
      });
    } catch (error) {
      res.status(400).send({
        message: error.message,
      });
    }
  },
);

module.exports = router;
