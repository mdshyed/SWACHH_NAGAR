const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const hashToken = (token) => bcrypt.hash(token, 10);

const compareToken = (plain, hashed) => bcrypt.compare(plain, hashed);

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, compareToken };
