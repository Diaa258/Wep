import { VercelRequest, VercelResponse } from '@vercel/node';
import { listGames, getGame, addGame, deleteGame } from '../backend/src/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      if (req.query.id) {
        const game = await getGame(req.query.id as string);
        if (!game) {
          return res.status(404).json({ message: "Game not found" });
        }
        return res.json(game);
      } else {
        const games = await listGames();
        return res.json(games);
      }
    }

    if (req.method === 'POST') {
      const { name, price, shortDescription, description, images, autoGenerate, preFetchedData } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "name is required" });
      }

      let finalDescription = description;
      let finalImages = images;

      if (autoGenerate && preFetchedData) {
        finalDescription = preFetchedData.description || description;
        if (preFetchedData.image) {
          finalImages = [preFetchedData.image];
        }
      }

      const game = await addGame({
        name,
        price: typeof price === "number" ? price : undefined,
        shortDescription,
        description: finalDescription,
        images: finalImages,
        autoGenerate: Boolean(autoGenerate)
      });

      return res.status(201).json(game);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: "id is required" });
      }

      const game = await getGame(id as string);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      await deleteGame(id as string);
      return res.status(200).json({ message: "Game deleted successfully" });
    }

    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    res.status(405).end();
  } catch (error) {
    console.error('Games API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
