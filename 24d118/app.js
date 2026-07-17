/* ============================================================
   NAV / SHELL
   ============================================================ */

const Nav = {
  el: null,

  render() {
    Nav.el = document.getElementById("topbar");
    Nav.el.innerHTML = `
      <a href="#/digest" class="wordmark"><span class="dot"></span>FIELDNOTES</a>
      <nav class="tabs">
        <a href="#/digest" data-route="digest">Digest</a>
        <a href="#/bookshelf" data-route="bookshelf">Bookshelf</a>
        <a href="#/trending" data-route="trending">Trending</a>
        <a href="#/setup" data-route="setup">Preferences</a>
      </nav>
    `;
  },

  setActive(routeName) {
    if (!Nav.el) return;
    Nav.el.querySelectorAll("a[data-route]").forEach((a) => {
      a.classList.toggle("active", a.dataset.route === routeName);
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  Nav.render();
  Router.init(document.getElementById("app"));
});
