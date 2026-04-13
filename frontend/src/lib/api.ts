export type Game = {
  id: string;
  name: string;
  price: number;
  shortDescription: string;
  description: string;
  images: string[];
  createdAt: string;
};

export type BookingView = {
  id: string;
  gameId: string;
  gameName: string;
  name: string;
  phone: string;
  contacted: boolean;
  createdAt: string;
};

export type Analytics = {
  totalVisitors: number;
  visitorIds: string[];
  viewsByPath: Record<string, number>;
  viewsByGameId: Record<string, number>;
  timeByGameIdMs: Record<string, number>;
  events: unknown[];
};

const API_BASE = (import.meta as any).env.PROD ? "/_/backend" : "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export const api = {
  listGames: () => request<Game[]>("/games"),
  getGame: (id: string) => request<Game>(`/games/${encodeURIComponent(id)}`),
  deleteGame: (id: string) =>
    request<{ message: string }>(`/games/${encodeURIComponent(id)}`, {
      method: "DELETE"
    }),
  createGame: (input: {
    name: string;
    price?: number;
    description?: string;
    shortDescription?: string;
    images?: string[];
    autoGenerate?: boolean;
    preFetchedData?: {
      description?: string;
      image?: string;
      wiki?: string;
    };
  }) =>
    request<Game>("/games", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  createBooking: (input: { gameId: string; name: string; phone: string }) =>
    request<{ message: string }>("/bookings", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  updateBookingContacted: (id: string, contacted: boolean) =>
    request<{ message: string; booking: BookingView }>(`/bookings/${encodeURIComponent(id)}/contacted`, {
      method: "PATCH",
      body: JSON.stringify({ contacted })
    }),
  sendEvent: (input: {
    visitorId: string;
    type: "page_view" | "game_view" | "game_time";
    path: string;
    gameId?: string;
    durationMs?: number;
  }) =>
    request("/analytics/events", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  getAnalytics: () => request<Analytics>("/analytics"),
  getBookings: () => request<BookingView[]>("/bookings")
};
