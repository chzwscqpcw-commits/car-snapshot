(function () {
  "use strict";

  var SITE_URL = "https://www.freeplatecheck.co.uk";

  function init() {
    // Find the script tag to read data attributes
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    var scriptTag = scripts[scripts.length - 1];
    var theme = (scriptTag && scriptTag.getAttribute("data-theme")) || "dark";
    var targetId =
      (scriptTag && scriptTag.getAttribute("data-target")) || "fpc-widget";

    var container = document.getElementById(targetId);
    if (!container) return;

    // Theme styles
    var isDark = theme === "dark";
    var styles = {
      bg: isDark ? "#1e293b" : "#ffffff",
      border: isDark ? "#334155" : "#e2e8f0",
      headerText: isDark ? "#f1f5f9" : "#0f172a",
      subtitleText: isDark ? "#94a3b8" : "#64748b",
      footerText: isDark ? "#94a3b8" : "#64748b",
      footerLink: isDark ? "#60a5fa" : "#2563eb",
      inputBg: "#fbbf24",
      inputText: "#0f172a",
      buttonBg: isDark ? "#3b82f6" : "#2563eb",
      buttonHoverBg: isDark ? "#2563eb" : "#1d4ed8",
      buttonText: "#ffffff",
    };

    // Build the widget HTML
    var wrapper = document.createElement("div");
    wrapper.style.cssText =
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
      "max-width:400px;width:100%;box-sizing:border-box;" +
      "background:" + styles.bg + ";" +
      "border:1px solid " + styles.border + ";" +
      "border-radius:12px;padding:20px;margin:0 auto;";

    // Header
    var header = document.createElement("div");
    header.style.cssText = "margin-bottom:16px;text-align:center;";
    header.innerHTML =
      '<div style="font-size:18px;font-weight:700;color:' +
      styles.headerText +
      ';margin-bottom:4px;">Free Plate Check</div>' +
      '<div style="font-size:13px;color:' +
      styles.subtitleText +
      ';">Check any UK vehicle free</div>';
    wrapper.appendChild(header);

    // Form
    var form = document.createElement("form");
    form.style.cssText = "display:flex;gap:8px;margin-bottom:12px;";
    form.setAttribute("autocomplete", "off");

    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter reg";
    input.maxLength = 8;
    input.setAttribute("aria-label", "Vehicle registration number");
    input.style.cssText =
      "flex:1;min-width:0;padding:10px 12px;font-size:16px;font-weight:700;" +
      "text-transform:uppercase;letter-spacing:1px;border:2px solid #d97706;" +
      "border-radius:6px;outline:none;box-sizing:border-box;" +
      "background:" + styles.inputBg + ";color:" + styles.inputText + ";";

    var button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Check Vehicle";
    button.style.cssText =
      "padding:10px 16px;font-size:14px;font-weight:600;" +
      "border:none;border-radius:6px;cursor:pointer;white-space:nowrap;" +
      "background:" + styles.buttonBg + ";color:" + styles.buttonText + ";" +
      "transition:background 0.2s;";

    button.addEventListener("mouseenter", function () {
      button.style.background = styles.buttonHoverBg;
    });
    button.addEventListener("mouseleave", function () {
      button.style.background = styles.buttonBg;
    });

    form.appendChild(input);
    form.appendChild(button);
    wrapper.appendChild(form);

    // Footer
    var footer = document.createElement("div");
    footer.style.cssText =
      "text-align:center;font-size:11px;color:" + styles.footerText + ";";
    footer.innerHTML =
      'Powered by <a href="' +
      SITE_URL +
      '?utm_source=widget&utm_medium=embed" target="_blank" rel="noopener" style="color:' +
      styles.footerLink +
      ';text-decoration:none;">Free Plate Check</a>';
    wrapper.appendChild(footer);

    // Handle submit
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var reg = input.value.replace(/\s+/g, "").toUpperCase();
      if (!reg) return;
      window.open(
        SITE_URL + "/?vrm=" + encodeURIComponent(reg) + "&utm_source=widget&utm_medium=embed",
        "_blank",
        "noopener"
      );
    });

    container.appendChild(wrapper);
  }

  // Auto-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
