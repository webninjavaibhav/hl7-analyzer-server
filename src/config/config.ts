import dotenv from 'dotenv';

dotenv.config();

interface ServerConfig {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

interface ApiConfig {
  baseUrl: string;
  corsOrigin: string;
}

interface LoggingConfig {
  level: string;
  showErrors: boolean;
}

interface Config {
  server: ServerConfig;
  api: ApiConfig;
  logging: LoggingConfig;
}

const config: Config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    showErrors: process.env.SHOW_ERRORS === 'true',
  },
};

export default config;