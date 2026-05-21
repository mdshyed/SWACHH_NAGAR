const { getIO } = require('../config/socket');
const socketAuthMiddleware = require('./middleware/socketAuth.middleware');
const logger = require('../config/logger');

const MAP_ROOM = 'room:map'; // global public room all map viewers join

const initSockets = () => {
  const io = getIO();
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    // Authenticated users join their personal room
    if (socket.user) {
      const userId = socket.user._id.toString();
      socket.join(`user:${userId}`);
      logger.info(`Socket connected: user ${userId}`);
    } else {
      logger.info(`Socket connected: guest ${socket.id}`);
    }

    // Any client (auth or guest) can join the public map room
    socket.on('join:map', () => {
      socket.join(MAP_ROOM);
    });

    socket.on('leave:map', () => {
      socket.leave(MAP_ROOM);
    });

    socket.on('join:ward', (wardId) => {
      if (wardId) socket.join(`ward:${wardId}`);
    });

    socket.on('leave:ward', (wardId) => {
      if (wardId) socket.leave(`ward:${wardId}`);
    });

    socket.on('disconnect', () => {
      const who = socket.user ? `user ${socket.user._id}` : `guest ${socket.id}`;
      logger.info(`Socket disconnected: ${who}`);
    });
  });
};

module.exports = { initSockets, MAP_ROOM };
