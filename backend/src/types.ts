export type Game = {
  id: string;
  name: string;
  price: number;
  shortDescription: string;
  description: string;
  images: string[];
  createdAt: string;
};

export type Booking = {
  id: string;
  gameId: string;
  name: string;
  phone: string;
  contacted: boolean;
  createdAt: string;
};

export type BookingView = Booking & {
  gameName: string;
};

export type AnalyticsEventType =
  | "page_view"
  | "game_view"
  | "game_time";

export type AnalyticsEvent = {
  id: string;
  visitorId: string;
  type: AnalyticsEventType;
  path: string;
  gameId?: string;
  durationMs?: number;
  createdAt: string;
};

export type DbShape = {
  games: Game[];
  bookings: Booking[];
  analytics: {
    totalVisitors: number;
    visitorIds: string[];
    viewsByPath: Record<string, number>;
    viewsByGameId: Record<string, number>;
    timeByGameIdMs: Record<string, number>;
    events: AnalyticsEvent[];
  };
};
