require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connect: connectDB } = require('./config/database');
const { init: initSocket } = require('./config/socket');
const { initSockets } = require('./sockets');
const { startEscalationCron } = require('./services/escalation.service');
const { verifyConnection: verifyCloudinary } = require('./config/cloudinary');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();
  await verifyCloudinary();

  const server = http.createServer(app);
  initSocket(server);
  initSockets();
  startEscalationCron();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Kill the process and retry.`);
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    logger.info(`🚀 Swachh Nagar API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
};

bootstrap();
