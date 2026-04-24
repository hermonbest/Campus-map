// Logger utility for consistent debug output across the React Native mobile app
export const logger = {
  info: (step: string, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [${step}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (step: string, message: string, error: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${step}] ${message}`, error);
  },
  success: (step: string, message: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SUCCESS] [${step}] ✓ ${message}`);
  },
  warn: (step: string, message: string) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [${step}] ⚠ ${message}`);
  }
};
