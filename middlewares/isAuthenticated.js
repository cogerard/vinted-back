const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // j'enlève "Bearer" de devant mon token
  const userToken = req.headers.authorization.replace("Bearer ", "");

  // Je dois aller chercher dans la collection User un doc dont la clé token contient ma variable token
  const user = await User.findOne({ token: userToken }).select("account");
  req.user = user;
  next();
};

module.exports = isAuthenticated;
