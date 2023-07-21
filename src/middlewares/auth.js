const JWT = require("jsonwebtoken");


module.exports = async (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res
        .status(400)
        .send({ status: false, message: "Token must be Present" });
    }
    token = token.slice(7);
    // console.log(token);

    JWT.verify(token, 'secret123', function (error, decodedToken) {
      if (error) {
        return res
          .status(401)
          .send({ status: false, message: "Invalid Token.", error: error });
      } else {
        req.id = decodedToken.id;
        req.otp = decodedToken.otp;
        req.mobileNumber = decodedToken.mobileNumber;
        // console.log(req.id);
        next();
      }
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};




