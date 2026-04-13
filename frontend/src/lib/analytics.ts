import { api } from "./api";

function getVisitorId(): string {
  const key = "gd_visitor_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = `v_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, created);
  return created;
}

const visitorId = getVisitorId();

export const analytics = {
  visitorId,

  async pageView(path: string) {
    try {
      await api.sendEvent({ visitorId, type: "page_view", path });
    } catch {
      // ignore
    }
  },

  async gameView(path: string, gameId: string) {
    try {
      await api.sendEvent({ visitorId, type: "game_view", path, gameId });
    } catch {
      // ignore
    }
  },

  async gameTime(path: string, gameId: string, durationMs: number) {
    try {
      await api.sendEvent({
        visitorId,
        type: "game_time",
        path,
        gameId,
        durationMs
      });
    } catch {
      // ignore
    }
  }
};
