import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Create a router for our logging endpoints
const router = express.Router();

// Rate limit to prevent abuse
const logLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: { error: 'Too many log requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Directory where logs will be stored
const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure the log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Define log file paths
const ERROR_LOG = path.join(LOG_DIR, 'client-errors.log');
const INFO_LOG = path.join(LOG_DIR, 'client-info.log');

/**
 * Middleware to handle client-side logs
 */
router.post('/log', logLimiter, (req: Request, res: Response) => {
  try {
    const { level, message, timestamp, url, userAgent, ...meta } = req.body;
    
    // Basic validation
    if (!level || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Format the log entry
    const logEntry = JSON.stringify({
      timestamp: timestamp || new Date().toISOString(),
      level,
      message,
      url,
      userAgent,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      meta
    });
    
    // Write to the appropriate log file
    const logFile = level === 'error' ? ERROR_LOG : INFO_LOG;
    fs.appendFile(logFile, logEntry + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
    
    // For critical errors, also log to console
    if (level === 'error') {
      console.error(`[CLIENT ERROR] ${message} - ${url} - User: ${req.user?.id || 'anonymous'}`);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling log request:', error);
    return res.status(500).json({ error: 'Failed to process log' });
  }
});

export default router;
