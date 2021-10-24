const { jwt } = require("../utils");

const bookAuth = async (req, res, next) => {
  try {
    const token = req.header("x-api-key");
    if (!token) {
      res
        .status(403)
        .send({
          status: false,
          message: `Missing authentication token in request`,
        });
      return;
    }

    const decoded = await jwt.verifyToken(req, res, token);


    if (!decoded) {
      res
        .status(403)
        .send({
          status: false,
          message: `Invalid authentication token in request`,
        });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error(`Error! ${error.message}`);
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = bookAuth;
