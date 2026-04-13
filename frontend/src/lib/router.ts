type RouteHandler = (params: Record<string, string>) => Promise<void> | void;

type Route = {
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
};

function compile(pathPattern: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = [];
  const regex =
    "^" +
    pathPattern
      .replace(/\//g, "\\/")
      .replace(/:([A-Za-z0-9_]+)/g, (_m, k) => {
        keys.push(String(k));
        return "([^\\/]+)";
      }) +
    "$";
  return { pattern: new RegExp(regex), keys };
}

export class Router {
  private routes: Route[] = [];
  private onRouteChange?: (path: string) => void;
  private currentPath: string = window.location.pathname;

  constructor(onRouteChange?: (path: string) => void) {
    this.onRouteChange = onRouteChange;
  }

  register(pathPattern: string, handler: RouteHandler) {
    const { pattern, keys } = compile(pathPattern);
    this.routes.push({ pattern, keys, handler });
  }

  start() {
    window.addEventListener("popstate", () => this.resolve());
    this.resolve();
  }

  navigate(path: string) {
    const from = this.currentPath;
    history.pushState({}, "", path);
    this.resolve(from);
  }

  private resolve(fromOverride?: string) {
    const to = window.location.pathname;
    const from = fromOverride ?? this.currentPath;
    this.currentPath = to;

    window.dispatchEvent(
      new CustomEvent("route-change", {
        detail: { from, to }
      })
    );

    this.onRouteChange?.(to);

    for (const r of this.routes) {
      const match = to.match(r.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => {
        params[k] = decodeURIComponent(match[i + 1]);
      });

      void r.handler(params);
      return;
    }

    history.replaceState({}, "", "/");
    this.currentPath = "/";
    void this.routes[0]?.handler({});
  }
}
