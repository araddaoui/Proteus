import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.logLevel,
  base: { service: 'proteus' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.token', '*.privateKey'],
    censor: '[REDACTED]',
  },
});
