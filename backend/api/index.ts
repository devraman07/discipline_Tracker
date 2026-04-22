import { createApp } from '../src/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize app once for container reuse across requests
let app: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!app) {
    app = createApp();
  }
  return app;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  try {
    const expressApp = getApp();
    
    // Wrap Express app for serverless
    return new Promise((resolve, reject) => {
      const next = (err?: any) => {
        if (err) {
          console.error('[Serverless] Express error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      };
      
      // @ts-ignore - Express compatibility with Vercel
      expressApp(req, res, next);
    });
  } catch (error) {
    console.error('[Serverless] Fatal error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
