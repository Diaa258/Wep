import express from "express";
import cors from "cors";
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
} from "./db";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/games", async (_req, res) => {
  const games = await listGames();
  res.json(games);
});

app.get("/games/:id", async (req, res) => {
  const game = await getGame(req.params.id);
  if (!game) {
    res.status(404).json({ message: "Game not found" });
    return;
  }
  res.json(game);
});

app.delete("/games/:id", async (req, res) => {
  const game = await getGame(req.params.id);
  if (!game) {
    res.status(404).json({ message: "Game not found" });
    return;
  }
  
  await deleteGame(req.params.id);
  res.status(200).json({ message: "Game deleted successfully" });
});

app.post("/games", async (req, res) => {
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

  // Use pre-fetched data when autoGenerate is true and preFetchedData is provided
  let finalDescription = description;
  let finalImages = images;

  console.log("Backend received:", { autoGenerate, preFetchedData, description, images });

  if (autoGenerate && preFetchedData) {
    console.log("Using pre-fetched data:", preFetchedData);
    finalDescription = preFetchedData.description || description;
    if (preFetchedData.image) {
      finalImages = [preFetchedData.image];
      console.log("Setting image to:", preFetchedData.image);
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
});

app.post("/bookings", async (req, res) => {
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
});

app.get("/bookings", async (_req, res) => {
  const bookings = await listBookingsView();
  res.json(bookings);
});

app.patch("/bookings/:id/contacted", async (req, res) => {
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
});

app.post("/analytics/events", async (req, res) => {
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
});

app.get("/analytics", async (_req, res) => {
  const analytics = await getAnalytics();
  res.json(analytics);
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
