/**
 * Creates an HTML element with optional attributes and children
 * @param tag - The HTML tag name to create
 * @param attrs - Optional record of attributes to set on the element
 * @param children - Optional array of child nodes or strings
 * @returns The created HTML element
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else node.setAttribute(k, v);
    }
  }
  if (children) {
    for (const c of children) {
      node.append(c instanceof Node ? c : document.createTextNode(c));
    }
  }
  return node;
}

/**
 * Clears all content from an HTML element
 * @param node - The HTML element to clear
 */
export function clear(node: HTMLElement) {
  node.innerHTML = "";
}

/**
 * Creates a complete form for adding a new game
 * @returns HTMLFormElement - The game creation form with name, price, description fields and buttons
 */
export function createGameForm(): HTMLFormElement {
  return el("form", {}, [
    el("h3", {}, ["Add new game"]),
    el("div", { class: "field" }, [
      el("label", { for: "g-name" }, ["Name"]),
      el("input", { id: "g-name", name: "name", placeholder: "Game name" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "g-price" }, ["Price (EGP)"]),
      el("input", { id: "g-price", name: "price", placeholder: "200" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "g-desc" }, ["Description"]),
      el("textarea", { id: "g-desc", name: "description", placeholder: "Optional..." })
    ]),
    el("div", { class: "row" }, [
      el("button", { class: "btn", type: "button", id: "gen" }, [
        "Generate Details Automatically"
      ]),
      el("button", { class: "btn primary", type: "submit" }, ["Add Game"])
    ]),
    el("div", { class: "notice", id: "g-notice" }, [""])
  ]) as HTMLFormElement;
}

/**
 * Creates the basic dashboard structure with title, subtitle, and panel
 * @returns Object containing the wrapper element and panel element
 */
export function createDashboardStructure(): { wrap: HTMLElement; panel: HTMLElement } {
  const wrap = el("div", { class: "container" }, [
    el("h1", { class: "heroTitle" }, ["Dashboard"]),
    el("p", { class: "heroSub" }, []),
    el("div", { class: "panel" }, [el("div", { class: "skeleton" })])
  ]);
  
  const panel = wrap.querySelector(".panel") as HTMLElement;
  
  return { wrap, panel };
}

/**
 * Query selector with error handling - finds an element and throws if not found
 * @param root - The parent node to search within
 * @param sel - The CSS selector to search for
 * @returns The found element of type T
 * @throws Error if element is not found
 */
export function qs<T extends Element>(root: ParentNode, sel: string): T {
  const found = root.querySelector(sel);
  if (!found) throw new Error(`Missing element: ${sel}`);
  return found as T;
}

/**
 * Creates the basic details page structure with skeleton loader
 * @returns Object containing the wrapper element
 */
export function createDetailsStructure(): { wrap: HTMLElement } {
  const wrap = el("div", { class: "container" }, [
    el("div", { class: "skeleton" })
  ]);
  
  return { wrap };
}

/**
 * Creates the error structure for when a game is not found
 * @param error - The error message to display
 * @returns HTMLElement - The error panel element
 */
export function createGameNotFoundStructure(error: string): HTMLElement {
  return el("div", { class: "panel" }, [
    el("h2", {}, ["Game not found"]),
    el("p", { class: "heroSub" }, [error]),
    el("button", { class: "btn", type: "button" }, ["Back"])
  ]);
}

/**
 * Creates the left panel structure for game details
 * @param game - The game object containing name, price, description, and images
 * @returns HTMLElement - The left panel element
 */
export function createGameLeftPanel(game: { name: string; price: number; description: string; images?: string[] }): HTMLElement {
  return el("div", { class: "panel" }, [
    el("h2", {}, [game.name]),
    el("p", { class: "heroSub" }, [`Price: ${game.price} EGP`]),
    el("p", { class: "heroSub" }, [game.description]),
    el(
      "div",
      { class: "gallery" },
      (game.images && game.images.length > 0 ? game.images : ["https://picsum.photos/seed/" + encodeURIComponent(game.name) + "/900/600"]).map((src) => el("img", { src, alt: game.name, loading: "lazy" }))
    )
  ]);
}

/**
 * Creates the booking form structure
 * @returns HTMLFormElement - The booking form element
 */
export function createBookingForm(): HTMLFormElement {
  return el("form", {}, [
    el("h3", {}, ["Book this disc"]),
    el("div", { class: "field" }, [
      el("label", { for: "bk-name" }, ["Name"]),
      el("input", { id: "bk-name", name: "name", placeholder: "Your name" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "bk-phone" }, ["Phone"]),
      el("input", { id: "bk-phone", name: "phone", placeholder: "+20 ..." })
    ]),
    el("button", { class: "btn primary", type: "submit" }, ["احجز الآن"]),
    el("div", { class: "notice", id: "bk-notice" }, [""])
  ]) as HTMLFormElement;
}

/**
 * Creates the right panel structure with booking form and notice
 * @param form - The booking form element
 * @returns HTMLElement - The right panel element
 */
export function createGameRightPanel(form: HTMLFormElement): HTMLElement {
  const right = el("div", { class: "panel" }, []);
  right.append(form);
  right.append(
    el("div", { class: "notice" }, [
      "Time on page will be tracked automatically after you leave this page."
    ])
  );
  return right;
}

/**
 * Creates the session display structure
 * @param start - The start time in milliseconds
 * @param formatMs - Function to format milliseconds
 * @returns HTMLElement - The session display element
 */
export function createSessionDisplay(start: number, formatMs: (ms: number) => string): HTMLElement {
  return el("div", { class: "container" }, [
    el("div", { class: "notice" }, [`Session: ${formatMs(performance.now() - start)}`])
  ]);
}

/**
 * Creates a modal overlay with backdrop
 * @returns HTMLElement - The modal overlay element
 */
export function createModalOverlay(): HTMLElement {
  return el("div", { class: "modal-overlay" }, []);
}

/**
 * Creates a modal container with close button
 * @param title - The modal title
 * @param content - The content to display inside the modal
 * @returns HTMLElement - The modal container element
 */
export function createModalContainer(title: string, content: HTMLElement): HTMLElement {
  return el("div", { class: "modal-container" }, [
    el("div", { class: "modal-header" }, [
      el("h3", {}, [title]),
      el("button", { class: "modal-close", type: "button" }, ["×"])
    ]),
    el("div", { class: "modal-body" }, [content])
  ]);
}

/**
 * Creates an "Add Game" button for opening the modal
 * @returns HTMLButtonElement - The button element
 */
export function createAddGameButton(): HTMLButtonElement {
  return el("button", { class: "btn btn-large", type: "button" }, ["Add New Game"]) as HTMLButtonElement;
}

/**
 * Creates a "Views per Game" button for opening the modal
 * @returns HTMLButtonElement - The button element
 */
export function createViewsButton(): HTMLButtonElement {
  return el("button", { class: "btn", type: "button" }, ["Games List"]) as HTMLButtonElement;
}

/**
 * Creates the content for the views per game modal
 * @param games - Array of games
 * @param viewsByGameId - Record of views by game ID
 * @param timeByGameIdMs - Record of time spent by game ID
 * @param onDeleteGame - Callback function for deleting a game
 * @returns HTMLElement - The views table content
 */
export function createViewsModalContent(
  games: any[], 
  viewsByGameId: Record<string, number>, 
  timeByGameIdMs: Record<string, number>,
  onDeleteGame: (gameId: string, gameName: string) => Promise<void>
): HTMLElement {
  // Helper function to format milliseconds to minutes
  function msToMin(ms: number) {
    if (ms < 60000) {
      const s = Math.max(0, Math.round(ms / 1000));
      return `${s}s`;
    }
    const min = ms / 60000;
    return `${min.toFixed(1)}m`;
  }
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
          await onDeleteGame(g.id, g.name);
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
