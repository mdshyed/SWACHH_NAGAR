const jwt = require('jsonwebtoken');
const User = require('../../models/User.model');

// Optional auth: authenticated users get socket.user set; guests get socket.user = null
// and can only join public rooms.
const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    socket.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select('name role isActive isBanned');
    if (!user || !user.isActive || user.isBanned) {
      socket.user = null;
      return next();
    }
    socket.user = user;
    next();
  } catch {
    socket.user = null;
    next();
  }
};

module.exports = socketAuthMiddleware;
