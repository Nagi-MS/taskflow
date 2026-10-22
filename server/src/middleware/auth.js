const jwt = require('jsonwebtoken');
const { HttpError } = require('./error');

// Authentication: verifies the Bearer token and exposes req.userId.
module.exports = function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Not logged in'));
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch (err) {
    next(err); // JsonWebTokenError / TokenExpiredError -> 401 in error handler
  }
};
