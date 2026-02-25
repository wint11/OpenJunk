import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  duration?: number;
  status?: number;
}

export async function writeLog(entry: LogEntry) {
  const logDir = path.join(process.cwd(), 'logs');
  
  // Ensure logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const logFile = path.join(logDir, `${dateStr}.log`);

  const logLine = `[${entry.timestamp}] [Status:${entry.status || 'N/A'}] ${entry.method} ${entry.url} - IP:${entry.ip} - UA:${entry.userAgent}${entry.duration ? ` - ${entry.duration}ms` : ''}\n`;

  try {
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}
