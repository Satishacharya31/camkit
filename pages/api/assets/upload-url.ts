/**
 * This route is intentionally unused.
 * All file uploads go through POST /api/assets which streams files server-side to Azure.
 * No SAS / direct-browser-to-Azure needed.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    return res.status(410).json({ error: 'This endpoint is no longer used. Upload via POST /api/assets.' });
}