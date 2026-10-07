/* Keep in sync with themeInitScript() in src/lib/theme.ts */
(function () {
  try {
    var cookieName = "mindvault-theme-v2";
    var m = document.cookie.match(
      new RegExp("(?:^|; )" + cookieName + "=([^;]*)"),
    );
    var pref = m ? decodeURIComponent(m[1]) : "system";
    var resolved =
      pref === "light" || pref === "dark"
        ? pref
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    var el = document.getElementById("mv-app");
    if (el) {
      el.classList.remove("light", "dark");
      el.classList.add("mv-app", resolved);
    }
  } catch {}
})();
