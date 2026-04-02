import { createApp } from '../src/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const app = createApp();

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Wrap Express app for serverless
  return new Promise((resolve, reject) => {
    const next = (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    };
    
    // @ts-ignore - Express compatibility
    app(req, res, next);
  });
}
