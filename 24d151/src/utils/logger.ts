export const logger = {
  info: (msg: string, ...data: any[]) => {
    if (import.meta.env.MODE !== 'production') {
      console.info(`[INFO] ${msg}`, ...data);
    }
  },
  warn: (msg: string, ...data: any[]) => {
    console.warn(`[WARN] ${msg}`, ...data);
  },
  error: (msg: string, ...data: any[]) => {
    console.error(`[ERROR] ${msg}`, ...data);
  }
};
