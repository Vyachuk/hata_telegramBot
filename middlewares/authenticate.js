const jwt = require("jsonwebtoken");

const { HttpError, ctrlWrapper } = require("../helpers");

const { JWT_SECRET, ACCESS_TOKEN } = process.env;

const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");
  if (bearer !== "Bearer") {
    throw HttpError(401, "Not authorized");
  }
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    // const user = await User.findById(id);
    if (id !== "admin" && token !== ACCESS_TOKEN) {
      throw HttpError(401, "Not authorized");
    }
    // req.user = user;
    next();
  } catch {
    throw HttpError(401, "Not authorized");
  }
};

module.exports = ctrlWrapper(authenticate);
