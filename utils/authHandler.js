let userController = require("../controllers/users");
const { verifyAccessToken } = require("./jwtHandler");
module.exports = {
  CheckLogin: async function (req, res, next) {
    try {
      if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith("Bearer")
      ) {
        res.status(404).send({
          message: "ban chua dang nhap",
        });
        return;
      }
      let token = req.headers.authorization.split(" ")[1];
      let result = verifyAccessToken(token);
      let user = await userController.GetAnUserById(result.id);
      if (!user) {
        res.status(404).send({
          message: "ban chua dang nhap",
        });
        return;
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(404).send({
        message: "ban chua dang nhap",
      });
    }
  },
};
