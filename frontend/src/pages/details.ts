import { api, Game } from "../lib/api";
import { analytics } from "../lib/analytics";
import { clear, el, createDetailsStructure, createGameNotFoundStructure, createGameLeftPanel, createBookingForm, createGameRightPanel, createSessionDisplay } from "../lib/dom";
import { Router } from "../lib/router";
import { formatMs } from "../lib/fun";

export async function renderDetails(
  container: HTMLElement,
  router: Router,
  params: { id: string }
) {
  clear(container);
  container.className = "page fade";

  const { wrap } = createDetailsStructure();
  container.append(wrap);

  const path = `/game/${params.id}`;
  await analytics.pageView(path);

  let start = performance.now();
  let game: Game;

  try {
    game = await api.getGame(params.id);
  } catch (e) {
    clear(wrap);
    const errorStructure = createGameNotFoundStructure(String((e as Error).message || e));
    wrap.append(errorStructure);
    (wrap.querySelector("button") as HTMLButtonElement).addEventListener("click", () =>
      router.navigate("/")
    );
    return;
  }

  await analytics.gameView(path, game.id);

  clear(wrap);

  const left = createGameLeftPanel(game);
  const form = createBookingForm();
  const right = createGameRightPanel(form);

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = form.querySelector("button") as HTMLButtonElement;
    const notice = form.querySelector("#bk-notice") as HTMLDivElement;

    const fd = new FormData(form as HTMLFormElement);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();

    notice.className = "notice";
    notice.textContent = "";

    if (!name || !phone) {
      notice.className = "notice err";
      notice.textContent = "Please enter name and phone.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Booking...";

    try {
      await api.createBooking({ gameId: game.id, name, phone });
      notice.className = "notice ok";
      notice.textContent = "Booked successfully! We will contact you soon.";
      (form.querySelector("#bk-name") as HTMLInputElement).value = "";
      (form.querySelector("#bk-phone") as HTMLInputElement).value = "";
    } catch (e) {
      notice.className = "notice err";
      notice.textContent = String((e as Error).message || e);
    } finally {
      btn.disabled = false;
      btn.textContent = "احجز الآن";
    }
  });


  const grid = el("div", { class: "grid2" }, [left, right]);
  wrap.append(grid);

  let sent = false;
  const onLeave = () => {
    if (sent) return;
    sent = true;
    const durationMs = Math.max(0, Math.round(performance.now() - start));
    void analytics.gameTime(path, game.id, durationMs);
  };

  window.addEventListener("beforeunload", onLeave, { once: true });

  const routeHandler = (ev: Event) => {
    const ce = ev as CustomEvent<{ from: string; to: string }>;
    if (ce.detail?.from === path && ce.detail?.to !== path) {
      onLeave();
      window.removeEventListener("route-change", routeHandler as EventListener);
    }
  };

  window.addEventListener("route-change", routeHandler as EventListener);

  wrap.append(createSessionDisplay(start, formatMs));
}
