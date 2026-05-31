export function ThemeInitScript() {
  const script = `
(function () {
  try {
    var raw = localStorage.getItem("owner-theme");
    var theme = "dark";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && (parsed.state.theme === "light" || parsed.state.theme === "dark")) {
        theme = parsed.state.theme;
      }
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
