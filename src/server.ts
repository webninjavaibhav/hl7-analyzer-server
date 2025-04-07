/**
 * Import required dependencies
 * app - Express application instance
 * config - Application configuration
 */
import app from './app';
import config from './config/config';
import 'colors';

/**
 * Start the Express server
 * Listens on configured port and logs server status
 */
app.listen(config.server.port, () => {
  console.log(`🚀 Server is running on port ${config.server.port}`.cyan);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`.green);
});