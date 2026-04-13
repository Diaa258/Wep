import { VercelRequest, VercelResponse } from '@vercel/node';
import { addBooking, listBookingsView } from '../backend/src/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const bookings = await listBookingsView();
      return res.json(bookings);
    }

    if (req.method === 'POST') {
      const { gameId, name, phone } = req.body;

      if (!gameId) {
        return res.status(400).json({ message: "gameId is required" });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "name is required" });
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({ message: "phone is required" });
      }

      const booking = await addBooking({ gameId, name, phone });
      return res.status(201).json({ message: "Booking saved", booking });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.status(405).end();
  } catch (error) {
    console.error('Bookings API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
