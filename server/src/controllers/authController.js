const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { wrap, HttpError } = require('../middleware/error');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isStr = (v) => typeof v === 'string'; // rejects objects like {"$gt":""} (NoSQL injection)

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

exports.register = wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (![name, email, password].every(isStr)) throw new HttpError(400, 'Name, email and password are required');
  if (name.trim().length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (await User.exists({ email: email.toLowerCase() })) throw new HttpError(409, 'Email is already registered');

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

exports.login = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (![email, password].every(isStr)) throw new HttpError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  // Same message for unknown email and wrong password: do not reveal which accounts exist.
  if (!user || !(await user.matches(password))) throw new HttpError(401, 'Invalid email or password');
  res.json({ token: sign(user), user: publicUser(user) });
});

exports.me = wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: publicUser(user) });
});
