const db = require("./db");
const settings = require("./settings");

function authMiddleware(request, response, next) {
  const path = request.path;
  if (settings.PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return next();
  }

  const user = db.getUserBySession(request.get("x-session"));
  if (!user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  request.user = user;
  return next();
}

module.exports = { authMiddleware };