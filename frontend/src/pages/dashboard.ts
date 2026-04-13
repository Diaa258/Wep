import { api } from "../lib/api";
import { analytics } from "../lib/analytics";
import { clear, createGameForm, createDashboardStructure, createAddGameButton, createModalOverlay, createModalContainer, createViewsModalContent, el } from "../lib/dom";
import { refreshBookings, refreshAnalytics, handleAutoGeneration } from "../lib/fun";



export async function renderDashboard(container: HTMLElement) {
  clear(container);
  container.className = "page fade";

  const { wrap, panel } = createDashboardStructure();
  container.append(wrap);

  await analytics.pageView("/dashboard");
  clear(panel);

  // Create modal elements (initially hidden)
  const overlay = createModalOverlay();
  const form = createGameForm();
  const modalContainer = createModalContainer("Add New Game", form);
  overlay.append(modalContainer);
  document.body.append(overlay);

  // Get form elements
  const genBtn = form.querySelector("#gen") as HTMLButtonElement;
  const notice = form.querySelector("#g-notice") as HTMLDivElement;
  const closeBtn = modalContainer.querySelector(".modal-close") as HTMLButtonElement;

  // Modal close function
  const closeModal = () => {
    overlay.style.display = "none";
    form.reset();
    notice.className = "notice";
    notice.textContent = "";
    delete (form as any)._preFetchedData;
  };

  // Auto generation functionality
  genBtn.addEventListener("click", async () => {
    const name = (form.querySelector("#g-name") as HTMLInputElement).value.trim();
    await handleAutoGeneration(name, form, genBtn, notice);
  });

  // Form submission
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    notice.className = "notice";
    notice.textContent = "";

    const name = (form.querySelector("#g-name") as HTMLInputElement).value.trim();
    const priceRaw = (form.querySelector("#g-price") as HTMLInputElement).value.trim();
    const description = (form.querySelector("#g-desc") as HTMLTextAreaElement).value.trim();

    if (!name) {
      notice.className = "notice err";
      notice.textContent = "Game name is required.";
      return;
    }

    if (description.length > 1000) {
      notice.className = "notice err";
      notice.textContent = "Description must be 1000 characters or less.";
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]") as HTMLButtonElement;
    genBtn.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Adding...";
    notice.textContent = "";

    try {
      const price = priceRaw ? Number(priceRaw) : undefined;

      // Store pre-fetched data if we have it
      const preFetchedData = (form as any)._preFetchedData || null;

      // autoGenerate should be true when we have pre-fetched data
      const autoGenerate = preFetchedData ? true : description.length === 0;

      // Debug: log what we're sending
      console.log("Sending to backend:", {
        name,
        autoGenerate,
        preFetchedData,
        description: description || undefined
      });

      await api.createGame({
        name,
        price: typeof price === "number" && Number.isFinite(price) ? price : undefined,
        description: description || undefined,
        autoGenerate,
        preFetchedData
      });
      notice.className = "notice ok";
      notice.textContent = "Game added successfully!";
      form.reset();
      // Clear pre-fetched data
      delete (form as any)._preFetchedData;
      await refreshAnalytics(panel);
      await refreshBookings(panel);
      
      // Close modal after successful submission
      setTimeout(closeModal, 1500);
    } catch (e) {
      notice.className = "notice err";
      notice.textContent = String((e as Error).message || e);
    } finally {
      genBtn.disabled = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Game";
    }
  });

  // Add global function for add game modal
  (window as any).openAddGameModal = () => {
    overlay.style.display = "flex";
  };

  // Close modal when close button is clicked
  closeBtn.addEventListener("click", closeModal);

  // Close modal when overlay is clicked
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Close modal with Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && overlay.style.display === "flex") {
      closeModal();
    }
  };
  document.addEventListener("keydown", handleEscape);

  // Initially hide modal
  overlay.style.display = "none";

  // Create views modal elements (initially hidden)
  const viewsOverlay = createModalOverlay();
  const viewsModalContainer = createModalContainer("Views per Game", el("div", { class: "skeleton" }));
  viewsOverlay.append(viewsModalContainer);
  document.body.append(viewsOverlay);

  // Get views modal close button
  const viewsCloseBtn = viewsModalContainer.querySelector(".modal-close") as HTMLButtonElement;

  // Views modal close function
  const closeViewsModal = () => {
    viewsOverlay.style.display = "none";
  };

  // Function to show views modal with data
  const showViewsModal = async () => {
    const analyticsHost = panel.querySelector("#analytics-host") as HTMLElement;
    if (!analyticsHost || !(analyticsHost as any)._analyticsData) {
      return;
    }

    const { an, games } = (analyticsHost as any)._analyticsData;
    
    // Create modal content
    const modalContent = createViewsModalContent(
      games,
      an.viewsByGameId || {},
      an.timeByGameIdMs || {},
      async (gameId: string, gameName: string) => {
        try {
          await api.deleteGame(gameId);
          // Refresh analytics data
          await refreshAnalytics(panel, showViewsModal);
          // Update modal content
          const newAnalyticsHost = panel.querySelector("#analytics-host") as HTMLElement;
          if (newAnalyticsHost && (newAnalyticsHost as any)._analyticsData) {
            const { an: newAn, games: newGames } = (newAnalyticsHost as any)._analyticsData;
            const newContent = createViewsModalContent(
              newGames,
              newAn.viewsByGameId || {},
              newAn.timeByGameIdMs || {},
              async (id: string, name: string) => {
                await api.deleteGame(id);
                await refreshAnalytics(panel, showViewsModal);
                showViewsModal(); // Refresh modal
              }
            );
            viewsModalContainer.querySelector(".modal-body")!.innerHTML = "";
            viewsModalContainer.querySelector(".modal-body")!.append(newContent);
          }
        } catch (e) {
          alert(`Error deleting game: ${String((e as Error).message || e)}`);
        }
      }
    );

    // Update modal body
    viewsModalContainer.querySelector(".modal-body")!.innerHTML = "";
    viewsModalContainer.querySelector(".modal-body")!.append(modalContent);
    
    // Show modal
    viewsOverlay.style.display = "flex";
  };

  // Close views modal when close button is clicked
  viewsCloseBtn.addEventListener("click", closeViewsModal);

  // Close views modal when overlay is clicked
  viewsOverlay.addEventListener("click", (e) => {
    if (e.target === viewsOverlay) {
      closeViewsModal();
    }
  });

  // Close views modal with Escape key
  const handleViewsEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && viewsOverlay.style.display === "flex") {
      closeViewsModal();
    }
  };
  document.addEventListener("keydown", handleViewsEscape);

  // Initially hide views modal
  viewsOverlay.style.display = "none";

  await refreshAnalytics(panel, showViewsModal);
  await refreshBookings(panel);
}


