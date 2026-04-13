import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAnalytics, ingestAnalyticsEvent } from '../backend/src/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const analytics = await getAnalytics();
      return res.json(analytics);
    }

    if (req.method === 'POST') {
      const { visitorId, type, path, gameId, durationMs } = req.body;

      if (!visitorId || !visitorId.trim()) {
        return res.status(400).json({ message: "visitorId is required" });
      }

      if (!type) {
        return res.status(400).json({ message: "type is required" });
      }

      if (!path) {
        return res.status(400).json({ message: "path is required" });
      }

      const event = await ingestAnalyticsEvent({
        visitorId,
        type,
        path,
        gameId,
        durationMs
      });

      return res.status(201).json(event);
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.status(405).end();
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
