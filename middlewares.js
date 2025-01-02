const jwt = require("jsonwebtoken");
const UserModel = require("./models/userModel");

function ProtectedRoute(req, res, next) {
  if (req.cookies.token) {
    const data = jwt.verify(req.cookies.token, "mySecretKey");
    req.user = data;
  } else {
    // res.send("You need to logged in first...");
    res.redirect("/login");
  }
  next();
}

async function isUserExist(req, res, next) {
  const user = await UserModel.findOne({ email: req.body.email });
  // console.log("isUserExist ", user ? true : false);
  if (user) {
    res.redirect("/login");
  } else {
    next();
  }
}

module.exports = {
  ProtectedRoute,
  isUserExist,
};
