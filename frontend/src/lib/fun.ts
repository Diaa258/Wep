



import { api, Game } from "./api";
import { analytics } from "./analytics";
import { clear, el } from "./dom";
import { searchGameInfo } from "./search";
import { Router } from "./router";

function card(game: Game, router: Router): HTMLElement {
  const img = game.images && game.images.length > 0 ? game.images[0] : "https://picsum.photos/seed/" + encodeURIComponent(game.name) + "/900/600";

  const root = el("article", { class: "card" }, [
    el("div", { class: "cardMedia" }, [
      el("img", { src: img, alt: game.name, loading: "lazy" }),
      el("div", { class: "discGlow" })
    ]),
    el("div", { class: "cardBody" }, [
      el("h3", { class: "cardTitle" }, [game.name]),
      el("p", { class: "cardDesc" }, [game.shortDescription]),
      el("p", { class: "cardDesc" }, [`Price: ${game.price} EGP`]),
      el("div", { class: "row" }, [
        el("button", { class: "btn primary", type: "button" }, ["احجز"])
      ])
    ])
  ]);

  const btn = root.querySelector("button") as HTMLButtonElement;
  btn.addEventListener("click", () => {
    // Create booking modal
    const overlay = el("div", { class: "modal-overlay" }, []);
    const form = el("form", {}, [
      el("h3", {}, [`احجز ${game.name}`]),
      el("div", { class: "field" }, [
        el("label", { for: "bk-name" }, ["الاسم"]),
        el("input", { id: "bk-name", name: "name", placeholder: "اسمك" })
      ]),
      el("div", { class: "field" }, [
        el("label", { for: "bk-phone" }, ["رقم الهاتف"]),
        el("input", { id: "bk-phone", name: "phone", placeholder: "+20 ..." })
      ]),
      el("button", { class: "btn primary", type: "submit" }, ["تأكيد الحجز"]),
      el("div", { class: "notice", id: "bk-notice" }, [""])
    ]) as HTMLFormElement;
    
    const modalContainer = el("div", { class: "modal-container" }, [
      el("div", { class: "modal-header" }, [
        el("h3", {}, [`حجز ${game.name}`]),
        el("button", { class: "modal-close", type: "button" }, ["×"])
      ]),
      el("div", { class: "modal-body" }, [
        el("p", { class: "heroSub" }, [`السعر: ${game.price} جنيه مصري`]),
        form
      ])
    ]);
    
    overlay.append(modalContainer);
    document.body.append(overlay);
    
    // Modal close function
    const closeModal = () => {
      overlay.remove();
    };
    
    // Close modal when close button is clicked
    const closeBtn = modalContainer.querySelector(".modal-close") as HTMLButtonElement;
    closeBtn.addEventListener("click", closeModal);
    
    // Close modal when overlay is clicked
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    
    // Close modal with Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleEscape);
    
    // Handle form submission
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      
      const name = (form.querySelector("#bk-name") as HTMLInputElement).value.trim();
      const phone = (form.querySelector("#bk-phone") as HTMLInputElement).value.trim();
      const notice = form.querySelector("#bk-notice") as HTMLDivElement;
      const submitBtn = form.querySelector("button[type='submit']") as HTMLButtonElement;
      
      if (!name || !phone) {
        notice.className = "notice err";
        notice.textContent = "يرجى ملء جميع الحقول";
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = "جاري الحجز...";
      
      try {
        await api.createBooking({ gameId: game.id, name, phone });
        notice.className = "notice ok";
        notice.textContent = "تم الحجز بنجاح! سنتواصل معك قريباً.";
        (form.querySelector("#bk-name") as HTMLInputElement).value = "";
        (form.querySelector("#bk-phone") as HTMLInputElement).value = "";
        
        // Close modal after successful submission
        setTimeout(closeModal, 2000);
      } catch (e) {
        notice.className = "notice err";
        notice.textContent = String((e as Error).message || e);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "تأكيد الحجز";
      }
    });
    
    // Show modal
    overlay.style.display = "flex";
  });

  return root;
}

export function formatMs(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}



export function msToMin(ms: number) {
  if (ms < 60000) {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${s}s`;
  }
  const min = ms / 60000;
  return `${min.toFixed(1)}m`;
}

export async function refreshBookings(panel: HTMLElement) {
  const hostId = "bookings-host";
  const existing = panel.querySelector(`#${hostId}`);
  if (existing) existing.remove();

  const host = el("div", { id: hostId }, [
    el("h3", {}, ["Bookings (newest first)"]),
    el("div", { class: "skeleton" })
  ]);
  panel.append(host);

  try {
    const bookings = await api.getBookings();
    clear(host);

    host.append(el("h3", {}, ["Bookings (newest first)"]));

    const rows = bookings.map((b) => {
      const contactedBtn = el("button", { 
        class: "btn btn-contacted",
        style: b.contacted 
          ? "background: var(--muted); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: not-allowed; font-size: 12px; font-weight: 600;"
          : "background: var(--ok); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s ease;"
      }, [b.contacted ? "تم التواصل" : "Contacted"]);
      
      if (b.contacted) {
        contactedBtn.disabled = true;
      } else {
        contactedBtn.addEventListener("click", async () => {
          try {
            await api.updateBookingContacted(b.id, true);
            // Refresh the bookings to show updated state
            await refreshBookings(panel);
          } catch (e) {
            alert(`Error updating booking: ${String((e as Error).message || e)}`);
          }
        });
      }
      
      const row = el("tr", {
        style: b.contacted ? "opacity: 0.5;" : ""
      }, [
        el("td", {}, [b.gameName]),
        el("td", {}, [b.name]),
        el("td", {}, [b.phone]),
        el("td", {}, [contactedBtn])
      ]);
      
      return row;
    });

    host.append(
      el("table", { class: "table" }, [
        el("thead", {}, [
          el("tr", {}, [
            el("th", {}, ["Game"]),
            el("th", {}, ["Customer"]),
            el("th", {}, ["Phone"]),
            el("th", {}, ["Actions"])
          ])
        ]),
        el("tbody", {}, rows)
      ])
    );
  } catch (e) {
    clear(host);
    host.append(
      el("div", { class: "notice err" }, [String((e as Error).message || e)])
    );
  }
}

export async function refreshAnalytics(panel: HTMLElement, onShowViews?: () => void) {
  const hostId = "analytics-host";
  const existing = panel.querySelector(`#${hostId}`);
  if (existing) existing.remove();

  const host = el("div", { id: hostId }, [
    el("h3", {}, ["Analytics"]),
    el("div", { class: "skeleton" })
  ]);
  panel.append(host);

  try {
    const [an, games, bookings] = await Promise.all([api.getAnalytics(), api.listGames(), api.getBookings()]);

    clear(host);

    // Count contacted bookings
    const contactedCount = bookings.filter(b => b.contacted).length;

    host.append(
      el("div", { class: "kpis" }, [
        kpi("Total visitors", String(an.totalVisitors)),
        kpi("Contacted customers", String(contactedCount)),
        kpi("Total pages tracked", String(Object.keys(an.viewsByPath || {}).length)),
        kpi("Games", String(games.length))
      ])
    );

    // Store analytics data for the modal
    (host as any)._analyticsData = { an, games };
    
    // Add buttons container
    const buttonsContainer = el("div", { class: "buttons-container" }, []);
    
    // Add larger views button
    const viewsBtn = el("button", { class: "btn btn-large", type: "button" }, ["games list"]);
    viewsBtn.addEventListener("click", () => {
      if (onShowViews) onShowViews();
    });
    buttonsContainer.append(viewsBtn);
    
    // Add larger add game button
    const addGameBtn = el("button", { class: "btn btn-large", type: "button" }, ["Add New Game"]);
    addGameBtn.addEventListener("click", () => {
      // This will be handled in dashboard.ts
      if ((window as any).openAddGameModal) {
        (window as any).openAddGameModal();
      }
    });
    buttonsContainer.append(addGameBtn);
    
    host.append(buttonsContainer);
  } catch (e) {
    clear(host);
    host.append(
      el("div", { class: "notice err" }, [String((e as Error).message || e)])
    );
  }
}

export function kpi(label: string, value: string): HTMLElement {
  return el("div", { class: "kpi" }, [
    el("div", { class: "label" }, [label]),
    el("div", { class: "value" }, [value])
  ]);
}

export function viewsTable(
  games: Game[],
  viewsByGameId: Record<string, number>,
  timeByGameIdMs: Record<string, number>
): HTMLElement {
  const rows = games
    .slice(0, 20)
    .map((g) => {
      const views = viewsByGameId[g.id] || 0;
      const time = timeByGameIdMs[g.id] || 0;
      
      const deleteBtn = el("button", { 
        class: "btn btn-danger",
        style: "background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;"
      }, ["Delete"]);
      
      deleteBtn.addEventListener("click", async () => {
        if (confirm(`Are you sure you want to delete "${g.name}"? This will also remove all related bookings and analytics data.`)) {
          try {
            await api.deleteGame(g.id);
            // Refresh the analytics table
            const panel = deleteBtn.closest(".panel") as HTMLElement;
            if (panel) {
              await refreshAnalytics(panel);
            }
          } catch (e) {
            alert(`Error deleting game: ${String((e as Error).message || e)}`);
          }
        }
      });
      
      return el("tr", {}, [
        el("td", {}, [g.name]),
        el("td", {}, [String(views)]),
        el("td", {}, [msToMin(time)]),
        el("td", {}, [deleteBtn])
      ]);
    });

  return el("table", { class: "table" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", {}, ["Game"]),
        el("th", {}, ["Views"]),
        el("th", {}, ["Time spent"]),
        el("th", {}, ["Actions"])
      ])
    ]),
    el("tbody", {}, rows)
  ]);
}

export async function handleAutoGeneration(
  name: string,
  form: HTMLFormElement,
  genBtn: HTMLButtonElement,
  notice: HTMLDivElement
) {
  if (!name) {
    notice.className = "notice err";
    notice.textContent = "Enter a game name first.";
    return;
  }
  notice.className = "notice";
  notice.textContent = "";
  genBtn.disabled = true;
  genBtn.textContent = "Fetching...";

  try {
    const info = await searchGameInfo(name);
    if (!info) {
      notice.className = "notice err";
      notice.textContent = "No info found for that name.";
      return;
    }
    const descField = form.querySelector("#g-desc") as HTMLTextAreaElement;
    descField.value = info.description || "";
    if (info.image) {
      // Optionally show image as a small preview next to description
      const existingImg = form.querySelector("#g-img-preview") as HTMLImageElement;
      if (existingImg) existingImg.remove();
      const img = document.createElement("img");
      img.id = "g-img-preview";
      img.src = info.image;
      img.alt = "preview";
      img.style.cssText = "max-width: 120px; max-height: 160px; border-radius: 8px; margin-top: 8px; border: 1px solid rgba(255,255,255,0.2);";
      descField.parentNode?.insertBefore(img, descField.nextSibling);
    }
    // Store pre-fetched data for when game is saved
    (form as any)._preFetchedData = info;
    notice.className = "notice ok";
    notice.textContent = "Info loaded. You can edit before saving.";
  } catch (e) {
    notice.className = "notice err";
    notice.textContent = String((e as Error).message || e);
  } finally {
    genBtn.disabled = false;
    genBtn.textContent = "Generate Details Automatically";
  }
}

export async function renderHome(container: HTMLElement, router: Router) {
  clear(container);
  container.className = "page fade";

  container.append(
    el("section", { class: "hero container" }, [
      el("h1", { class: "heroTitle" }, ["Book Your Next Game Disc"]),
      el("p", { class: "heroSub" }, [
        "A minimal, modern layout that feels like a disc shelf — swipe horizontally, explore, then book in seconds."
      ])
    ])
  );

  const stage = el("section", { class: "stage" }, [
    el("div", { class: "ribbon" }),
    el("div", { class: "container" }, [
      el("div", { class: "skeleton", id: "home-skel" })
    ])
  ]);
  container.append(stage);

  await analytics.pageView("/");

  try {
    const games = await api.listGames();
    const lane = el("div", { class: "discLane" }, games.map((g) => card(g, router)));

    const host = stage.querySelector(".container") as HTMLElement;
    clear(host);
    host.append(lane);
  } catch (e) {
    const host = stage.querySelector(".container") as HTMLElement;
    clear(host);
    host.append(
      el("div", { class: "panel" }, [
        el("h3", {}, ["Could not load games"]),
        el("p", { class: "heroSub" }, [String((e as Error).message || e)])
      ])
    );
  }
}
