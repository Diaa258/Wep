import fs from "fs/promises";
import path from "path";
import { DbShape, Game, Booking, AnalyticsEvent, BookingView } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const DB_TMP_PATH = path.join(DATA_DIR, "db.tmp.json");

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

let writeLock: Promise<void> = Promise.resolve();

async function ensureDbExists() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const existing = JSON.parse(raw) as DbShape;
    let didNormalize = false;

    if (existing.games && existing.games.length > 0) {
      for (const g of existing.games as Array<Partial<Game> & { id: string }>) {
        if (typeof (g as Game).price !== "number") {
          (g as Game).price = 200;
          didNormalize = true;
        }
      }
    }

    // Migrate existing bookings to add contacted field
    if (existing.bookings && existing.bookings.length > 0) {
      for (const b of existing.bookings as Array<Partial<Booking> & { id: string }>) {
        if (typeof (b as Booking).contacted !== "boolean") {
          (b as Booking).contacted = false;
          didNormalize = true;
        }
      }
    }

    const needsSeed =
      !existing.games ||
      existing.games.length === 0;

    if (needsSeed) {
      const seedGames: Game[] = [
        {
          id: "g_1",
          name: "Elden Ring",
          price: 350,
          shortDescription: "An epic dark-fantasy action RPG.",
          description:
            "Elden Ring is a vast action RPG set in a hauntingly beautiful world. Explore open landscapes, discover hidden dungeons, and face formidable foes as you shape your own path.",
          images: [
            "https://picsum.photos/seed/eldenring1/900/600",
            "https://picsum.photos/seed/eldenring2/900/600",
            "https://picsum.photos/seed/eldenring3/900/600"
          ],
          createdAt: nowIso()
        },
        {
          id: "g_2",
          name: "God of War Ragnarök",
          price: 400,
          shortDescription: "A mythic journey through the Nine Realms.",
          description:
            "Join Kratos and Atreus as they confront prophecy and powerful gods. A cinematic combat experience with emotional storytelling and stunning environments.",
          images: [
            "https://picsum.photos/seed/gow1/900/600",
            "https://picsum.photos/seed/gow2/900/600"
          ],
          createdAt: nowIso()
        }
      ];

      const next: DbShape = {
        games: seedGames,
        bookings: existing.bookings || [],
        analytics: existing.analytics || {
          totalVisitors: 0,
          visitorIds: [],
          viewsByPath: {},
          viewsByGameId: {},
          timeByGameIdMs: {},
          events: []
        }
      };

      await fs.writeFile(DB_PATH, JSON.stringify(next, null, 2), "utf-8");
    } else if (didNormalize) {
      await fs.writeFile(DB_PATH, JSON.stringify(existing, null, 2), "utf-8");
    }
  } catch {
    const seed: DbShape = {
      games: [
        {
          id: "g_1",
          name: "Elden Ring",
          price: 350,
          shortDescription: "An epic dark-fantasy action RPG.",
          description:
            "Elden Ring is a vast action RPG set in a hauntingly beautiful world. Explore open landscapes, discover hidden dungeons, and face formidable foes as you shape your own path.",
          images: [
            "https://picsum.photos/seed/eldenring1/900/600",
            "https://picsum.photos/seed/eldenring2/900/600",
            "https://picsum.photos/seed/eldenring3/900/600"
          ],
          createdAt: nowIso()
        },
        {
          id: "g_2",
          name: "God of War Ragnarök",
          price: 400,
          shortDescription: "A mythic journey through the Nine Realms.",
          description:
            "Join Kratos and Atreus as they confront prophecy and powerful gods. A cinematic combat experience with emotional storytelling and stunning environments.",
          images: [
            "https://picsum.photos/seed/gow1/900/600",
            "https://picsum.photos/seed/gow2/900/600"
          ],
          createdAt: nowIso()
        }
      ],
      bookings: [],
      analytics: {
        totalVisitors: 0,
        visitorIds: [],
        viewsByPath: {},
        viewsByGameId: {},
        timeByGameIdMs: {},
        events: []
      }
    };

    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<DbShape> {
  await ensureDbExists();
  await writeLock;
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw) as DbShape;
}

export async function writeDb(updater: (db: DbShape) => void): Promise<DbShape> {
  await ensureDbExists();

  writeLock = writeLock.then(async () => {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const db = JSON.parse(raw) as DbShape;
    updater(db);

    const next = JSON.stringify(db, null, 2);
    await fs.writeFile(DB_TMP_PATH, next, "utf-8");
    try {
      await fs.rename(DB_TMP_PATH, DB_PATH);
    } catch {
      await fs.unlink(DB_PATH).catch(() => undefined);
      await fs.rename(DB_TMP_PATH, DB_PATH);
    }
  });

  await writeLock;
  return readDb();
}

export async function listGames(): Promise<Game[]> {
  const db = await readDb();
  return db.games;
}

export async function getGame(id: string): Promise<Game | undefined> {
  const db = await readDb();
  return db.games.find((g) => g.id === id);
}

export async function addGame(input: {
  name: string;
  price?: number;
  shortDescription?: string;
  description?: string;
  images?: string[];
  autoGenerate?: boolean;
}): Promise<Game> {
  const game: Game = {
    id: makeId("g"),
    name: input.name.trim(),
    price: typeof input.price === "number" && Number.isFinite(input.price) ? input.price : 200,
    shortDescription:
      (input.shortDescription && input.shortDescription.trim()) ||
      `A new adventure: ${input.name.trim()}.`,
    description:
      (input.description && input.description.trim()) ||
      `Experience ${input.name.trim()} — a thrilling game with immersive gameplay, memorable moments, and a world worth exploring.`,
    images:
      input.images && input.images.length > 0
        ? input.images
        : [],
    createdAt: nowIso()
  };

  if (input.autoGenerate) {
    // Only override description if no custom description provided
    if (!input.description) {
      game.description =
        `${game.name} is an action-packed experience designed for quick sessions or deep dives. ` +
        `Expect a polished core loop, satisfying progression, and a strong sense of discovery.`;
    }
    // Use first 100 characters of description as shortDescription, or fallback
    const descToUse = game.description || `A new adventure: ${game.name}.`;
    game.shortDescription = descToUse.length > 100 
      ? descToUse.substring(0, 97) + "..." 
      : descToUse;
    // Only set default images if no custom images provided
    if (!input.images || input.images.length === 0) {
      game.images = [];
    }
  }

  await writeDb((db) => {
    db.games.unshift(game);
  });

  return game;
}

export async function addBooking(input: {
  gameId: string;
  name: string;
  phone: string;
}): Promise<Booking> {
  const booking: Booking = {
    id: makeId("b"),
    gameId: input.gameId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    contacted: false,
    createdAt: nowIso()
  };

  await writeDb((db) => {
    db.bookings.unshift(booking);
  });

  return booking;
}

export async function listBookingsView(): Promise<BookingView[]> {
  const db = await readDb();
  const byId = new Map(db.games.map((g) => [g.id, g] as const));

  return [...db.bookings]
    .sort((a, b) => {
      const ta = Date.parse(a.createdAt);
      const tb = Date.parse(b.createdAt);
      return tb - ta;
    })
    .map((b) => {
      const game = byId.get(b.gameId);
      return {
        ...b,
        gameName: game?.name || "(deleted game)"
      };
    });
}

export async function ingestAnalyticsEvent(input: {
  visitorId: string;
  type: "page_view" | "game_view" | "game_time";
  path: string;
  gameId?: string;
  durationMs?: number;
}): Promise<AnalyticsEvent> {
  const event: AnalyticsEvent = {
    id: makeId("a"),
    visitorId: input.visitorId,
    type: input.type,
    path: input.path,
    gameId: input.gameId,
    durationMs: input.durationMs,
    createdAt: nowIso()
  };

  await writeDb((db) => {
    const visitorKnown = db.analytics.visitorIds.includes(input.visitorId);
    if (!visitorKnown) {
      db.analytics.visitorIds.push(input.visitorId);
      db.analytics.totalVisitors += 1;
    }

    db.analytics.viewsByPath[input.path] = (db.analytics.viewsByPath[input.path] || 0) + 1;

    if (input.type === "game_view" && input.gameId) {
      db.analytics.viewsByGameId[input.gameId] =
        (db.analytics.viewsByGameId[input.gameId] || 0) + 1;
    }

    if (input.type === "game_time" && input.gameId && typeof input.durationMs === "number") {
      db.analytics.timeByGameIdMs[input.gameId] =
        (db.analytics.timeByGameIdMs[input.gameId] || 0) + input.durationMs;
    }

    db.analytics.events.unshift(event);
    db.analytics.events = db.analytics.events.slice(0, 5000);
  });

  return event;
}

export async function deleteGame(id: string): Promise<void> {
  await writeDb((db) => {
    db.games = db.games.filter((g) => g.id !== id);
    
    // Also remove related bookings
    db.bookings = db.bookings.filter((b) => b.gameId !== id);
    
    // Clean up analytics data for this game
    delete db.analytics.viewsByGameId[id];
    delete db.analytics.timeByGameIdMs[id];
    
    // Remove analytics events related to this game
    db.analytics.events = db.analytics.events.filter((e) => e.gameId !== id);
  });
}

export async function getAnalytics(): Promise<DbShape["analytics"]> {
  const db = await readDb();
  return db.analytics;
}
