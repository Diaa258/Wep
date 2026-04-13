import "./styles.css";
import { Router } from "./lib/router";
import { el, qs, clear } from "./lib/dom";
import { renderHome } from "./pages/home";
import { renderDetails } from "./pages/details";
import { renderDashboard } from "./pages/dashboard";

const app = qs<HTMLElement>(document, "#app");

const shell = el("div", {}, [
  el("header", { class: "topbar" }, [
    el("div", { class: "container nav" }, [
      el("a", { class: "brand", href: "/" }, [
        el("div", { class: "brandMark" }),
        el("div", {}, ["Game Discs"])
      ]),
      el("nav", { class: "navlinks" }, [
        el("a", { class: "pill", href: "/" }, ["Home"]),
        el("a", { class: "pill", href: "/dashboard" }, ["Dashboard"])
      ])
    ])
  ]),
  el("main", { id: "view" }, [])
]);

app.append(shell);

const view = qs<HTMLElement>(document, "#view");

function setActive(path: string) {
  const links = Array.from(document.querySelectorAll(".navlinks .pill")) as HTMLAnchorElement[];
  for (const a of links) {
    const isActive = a.getAttribute("href") === path;
    a.classList.toggle("active", isActive);
  }
}

const router = new Router((path) => {
  setActive(path === "/" ? "/" : path);
});

router.register("/", () => renderHome(view, router));
router.register("/game/:id", (p) => renderDetails(view, router, { id: p.id }));
router.register("/dashboard", () => renderDashboard(view));

router.start();

// Link interception for SPA navigation
shell.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const a = target.closest("a") as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href) return;
  if (!href.startsWith("/")) return;

  e.preventDefault();
  router.navigate(href);
});

// Basic fallback if JS breaks
window.addEventListener("error", () => {
  clear(view);
  view.append(
    el("div", { class: "page container" }, [
      el("div", { class: "panel" }, [
        el("h2", {}, ["Something went wrong"]),
        el("p", { class: "heroSub" }, ["Refresh the page and try again."])
      ])
    ])
  );
});
