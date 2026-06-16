import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_helpers.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.status(200).json({ status: 'ok' });
}
