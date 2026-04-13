import { clear, el } from "../lib/dom";

export function renderPreview(parent: HTMLElement, data: { description: string; image: string; wiki: string }, onAccept?: () => void) {
  const children: Array<Node | string> = [
    el("h3", {}, ["Preview (from web)"]),
    el("div", { class: "field" }, [
      el("label", {}, ["Fetched description"]),
      el("textarea", { readonly: "", style: "min-height: 120px; background: rgba(0,0,0,0.2)" }, [data.description || "(no description)"])
    ])
  ];

  if (data.image) {
    children.push(
      el("div", { class: "field" }, [
        el("label", {}, ["Fetched image"]),
        el("img", { src: data.image, alt: "preview", style: "max-width: 280px; max-height: 180px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1)" })
      ])
    );
  }

  if (data.wiki) {
    children.push(
      el("div", { class: "notice ok" }, [
        el("a", { href: data.wiki, target: "_blank", rel: "noopener noreferrer", style: "color: inherit" }, ["Source (Wikipedia)"])
      ])
    );
  }

  if (onAccept) {
    children.push(el("button", { class: "btn primary", type: "button" }, ["Use this data"]));
  }

  const host = el("div", { class: "panel", style: "margin-top: 18px" }, children);

  if (onAccept) {
    host.querySelector("button")?.addEventListener("click", () => onAccept());
  }

  clear(parent);
  parent.append(host);
  return host;
}
