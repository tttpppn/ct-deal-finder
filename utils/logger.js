import fs from 'fs';
import path from 'path';
import { LOGS_DIR } from '../config.js';

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOGS_DIR, `ct-deal-finder-${new Date().toISOString().split('T')[0]}.log`);

const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, data = null) {
  const timestamp = formatTimestamp();
  const logEntry = data
    ? `[${timestamp}] ${level}: ${message} | ${JSON.stringify(data)}`
    : `[${timestamp}] ${level}: ${message}`;

  console.log(logEntry);

  try {
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

export const logger = {
  error: (message, data) => log(LEVELS.ERROR, message, data),
  warn: (message, data) => log(LEVELS.WARN, message, data),
  info: (message, data) => log(LEVELS.INFO, message, data),
  debug: (message, data) => log(LEVELS.DEBUG, message, data),
};
