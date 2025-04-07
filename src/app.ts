import express from 'express'
import cors from 'cors'
import diagnosticRoutes from './routes/diagnosticRoutes';
import config from './config/config';
import 'colors';

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: config.api.corsOrigin }));
app.use(express.json());

// Routes
app.use(config.api.baseUrl + '/diagnostic', diagnosticRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🔍 Health check requested'.cyan);
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (config.logging.showErrors) {
    console.error('❌ Unhandled error:'.red, err);
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.server.isDevelopment ? err.message : 'An unexpected error occurred'
  });
});

export default app;