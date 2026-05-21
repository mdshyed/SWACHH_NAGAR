const { Server } = require('socket.io');
const logger = require('./logger');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === (process.env.CLIENT_URL || '')) {
          return cb(null, true);
        }
        cb(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  logger.info('Socket.io server initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { init, getIO };
