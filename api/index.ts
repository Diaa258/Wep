import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import express from 'express';
import {
  addBooking,
  addGame,
  deleteGame,
  getAnalytics,
  getGame,
  ingestAnalyticsEvent,
  listBookingsView,
  listGames,
  readDb,
  writeDb
} from '../backend/src/db';

const app = express();

// CORS middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get('/health', (_req: VercelRequest, res: VercelResponse) => {
  res.json({ ok: true });
});

// Games routes
app.get('/games', async (_req: VercelRequest, res: VercelResponse) => {
  try {
    const games = await listGames();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/games/:id', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const game = await getGame(req.params.id);
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

app.delete('/games/:id', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const game = await getGame(req.params.id);
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }
    
    await deleteGame(req.params.id);
    res.status(200).json({ message: "Game deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

app.post('/games', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { name, price, shortDescription, description, images, autoGenerate, preFetchedData } = req.body as {
      name?: string;
      price?: number;
      shortDescription?: string;
      description?: string;
      images?: string[];
      autoGenerate?: boolean;
      preFetchedData?: {
        description?: string;
        image?: string;
        wiki?: string;
      };
    };

    if (!name || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
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

    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Bookings routes
app.post('/bookings', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { gameId, name, phone } = req.body as {
      gameId?: string;
      name?: string;
      phone?: string;
    };

    if (!gameId) {
      res.status(400).json({ message: "gameId is required" });
      return;
    }

    const game = await getGame(gameId);
    if (!game) {
      res.status(400).json({ message: "Invalid gameId" });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({ message: "phone is required" });
      return;
    }

    const booking = await addBooking({ gameId, name, phone });
    res.status(201).json({ message: "Booking saved", booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.get('/bookings', async (_req: VercelRequest, res: VercelResponse) => {
  try {
    const bookings = await listBookingsView();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.patch('/bookings/:id/contacted', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { contacted } = req.body as { contacted?: boolean };
    
    if (typeof contacted !== "boolean") {
      res.status(400).json({ message: "contacted field is required and must be boolean" });
      return;
    }

    const db = await readDb();
    const booking = db.bookings.find((b) => b.id === req.params.id);
    
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    booking.contacted = contacted;
    
    await writeDb((db) => {
      const index = db.bookings.findIndex((b) => b.id === req.params.id);
      if (index !== -1) {
        db.bookings[index] = booking;
      }
    });

    res.json({ message: "Booking updated successfully", booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Analytics routes
app.post('/analytics/events', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { visitorId, type, path, gameId, durationMs } = req.body as {
      visitorId?: string;
      type?: "page_view" | "game_view" | "game_time";
      path?: string;
      gameId?: string;
      durationMs?: number;
    };

    if (!visitorId || !visitorId.trim()) {
      res.status(400).json({ message: "visitorId is required" });
      return;
    }

    if (!type) {
      res.status(400).json({ message: "type is required" });
      return;
    }

    if (!path) {
      res.status(400).json({ message: "path is required" });
      return;
    }

    const event = await ingestAnalyticsEvent({
      visitorId,
      type,
      path,
      gameId,
      durationMs
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create analytics event' });
  }
});

app.get('/analytics', async (_req: VercelRequest, res: VercelResponse) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default app;
