/* ============================================================
   ROUTER
   Minimal hash router. Routes:
   #/setup                preference setup page
   #/digest                daily digest feed
   #/article/:id           article detail
   #/bookshelf              saved articles
   #/trending                word cloud
   ============================================================ */

const Router = {
  root: null,

  init(rootEl) {
    Router.root = rootEl;
    window.addEventListener("hashchange", Router.render);
    Router.render();
  },

  navigate(path) {
    window.location.hash = path;
  },

  parse() {
    const hash = window.location.hash.replace(/^#/, "") || "/setup";
    const parts = hash.split("/").filter(Boolean);
    return { name: parts[0] || "setup", params: parts.slice(1) };
  },

  render() {
    const { name, params } = Router.parse();
    const prefs = Store.getPrefs();

    // gate: everything except setup requires prefs to exist
    if (name !== "setup" && !prefs) {
      Router.navigate("/setup");
      return;
    }

    Nav.setActive(name);
    Router.root.innerHTML = "";

    switch (name) {
      case "setup":
        Pages.setup(Router.root);
        break;
      case "digest":
        Pages.digest(Router.root);
        break;
      case "article":
        Pages.article(Router.root, params[0]);
        break;
      case "bookshelf":
        Pages.bookshelf(Router.root);
        break;
      case "trending":
        Pages.trending(Router.root);
        break;
      default:
        Pages.setup(Router.root);
    }
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  },
};
