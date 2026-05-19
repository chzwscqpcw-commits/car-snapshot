/**
 * Free Plate Check — embeddable widget (v2)
 *
 * Drop-in vanilla JS embed for partner sites. No framework, no external CSS,
 * no font downloads. All styles inline; scoped class names (fpc-*) to avoid
 * host-page collisions.
 *
 * Usage:
 *   <div id="fpc-widget"></div>
 *   <script src="https://www.freeplatecheck.co.uk/widget.js"
 *           data-theme="dark"
 *           data-size="full"
 *           data-accent="cyan"
 *           data-style="modern"
 *           data-target="fpc-widget"></script>
 *
 * Data attributes (all optional):
 *   data-theme   : dark (default) | light
 *   data-size    : full (default) | compact
 *   data-accent  : cyan (default) | emerald | amber | violet
 *   data-style   : modern (default) | plate    -- plate keeps old yellow border
 *   data-target  : container ID (default: fpc-widget)
 */
(function () {
  "use strict";

  var SITE_URL = "https://www.freeplatecheck.co.uk";
  var MONO_STACK =
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
  var SANS_STACK =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif";

  // ─── Accent palettes ───
  var ACCENTS = {
    cyan: {
      from: "#22d3ee",
      to: "#3b82f6",
      pillBg: "rgba(34,211,238,0.12)",
      pillText: "#67e8f9",
      ring: "rgba(34,211,238,0.35)",
    },
    emerald: {
      from: "#10b981",
      to: "#06b6d4",
      pillBg: "rgba(16,185,129,0.12)",
      pillText: "#6ee7b7",
      ring: "rgba(16,185,129,0.35)",
    },
    amber: {
      from: "#f59e0b",
      to: "#f97316",
      pillBg: "rgba(245,158,11,0.12)",
      pillText: "#fbbf24",
      ring: "rgba(245,158,11,0.35)",
    },
    violet: {
      from: "#8b5cf6",
      to: "#ec4899",
      pillBg: "rgba(139,92,246,0.12)",
      pillText: "#c4b5fd",
      ring: "rgba(139,92,246,0.35)",
    },
  };

  // ─── Theme palettes ───
  function themeColours(isDark) {
    return isDark
      ? {
          bg: "#0f172a",
          bgInner: "#020617",
          border: "#1e293b",
          heading: "#f1f5f9",
          subtle: "#94a3b8",
          muted: "#64748b",
          inputBg: "#020617",
          inputText: "#f8fafc",
          inputBorder: "#334155",
          pillBorder: "#1e293b",
        }
      : {
          bg: "#ffffff",
          bgInner: "#f8fafc",
          border: "#e2e8f0",
          heading: "#0f172a",
          subtle: "#475569",
          muted: "#64748b",
          inputBg: "#ffffff",
          inputText: "#0f172a",
          inputBorder: "#cbd5e1",
          pillBorder: "#e2e8f0",
        };
  }

  // ─── BoltMark SVG ───
  function boltMark(gradId, height) {
    var h = height || 18;
    var w = Math.round((h * 24) / 32);
    return (
      '<svg viewBox="0 0 24 32" width="' + w + '" height="' + h + '" fill="none" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#22d3ee"/>' +
      '<stop offset="100%" stop-color="#3b82f6"/>' +
      "</linearGradient></defs>" +
      '<path d="M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z" ' +
      'fill="url(#' + gradId + ')"/>' +
      "</svg>"
    );
  }

  // ─── Arrow icon ───
  function arrowSvg(colour) {
    return (
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M5 12h14M13 5l7 7-7 7" stroke="' + colour + '" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
  }

  // ─── Read attributes ───
  function readConfig() {
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    var s = scripts[scripts.length - 1];
    var get = function (k, fallback) {
      var v = s && s.getAttribute("data-" + k);
      return v || fallback;
    };
    var theme = get("theme", "dark");
    var size = get("size", "full");
    var accent = get("accent", "cyan");
    var style = get("style", "modern");
    var target = get("target", "fpc-widget");
    if (theme !== "dark" && theme !== "light") theme = "dark";
    if (size !== "full" && size !== "compact") size = "full";
    if (!ACCENTS[accent]) accent = "cyan";
    if (style !== "modern" && style !== "plate") style = "modern";
    return { theme: theme, size: size, accent: accent, style: style, target: target };
  }

  // ─── Build the widget ───
  function init() {
    var cfg = readConfig();
    var container = document.getElementById(cfg.target);
    if (!container) return;

    var isDark = cfg.theme === "dark";
    var isCompact = cfg.size === "compact";
    var c = themeColours(isDark);
    var a = ACCENTS[cfg.accent];
    var gradId = "fpc-grad-" + Math.random().toString(36).slice(2, 8);

    // ─── Wrapper ───
    var wrapper = document.createElement("div");
    wrapper.className = "fpc-widget";
    wrapper.style.cssText = [
      "font-family:" + SANS_STACK,
      "max-width:" + (isCompact ? "340px" : "420px"),
      "width:100%",
      "box-sizing:border-box",
      "background:" + c.bg,
      "border:1px solid " + c.border,
      "border-radius:14px",
      "padding:" + (isCompact ? "12px 14px" : "20px"),
      "margin:0 auto",
      "color:" + c.heading,
    ].join(";");

    // ─── Header (full only) ───
    if (!isCompact) {
      var header = document.createElement("div");
      header.style.cssText = "display:flex;align-items:center;gap:9px;margin-bottom:14px;";
      header.innerHTML =
        boltMark(gradId, 20) +
        '<div style="line-height:1.15;">' +
        '<div style="font-family:' + MONO_STACK + ';font-size:14px;font-weight:600;' +
        "letter-spacing:-0.01em;color:" + c.heading + ';">' +
        'Free<span style="color:' + a.from + ';">Plate</span>Check' +
        "</div>" +
        '<div style="font-size:11px;color:' + c.muted + ';margin-top:1px;">' +
        "Free UK vehicle report" +
        "</div>" +
        "</div>";
      wrapper.appendChild(header);
    }

    // ─── Form ───
    var form = document.createElement("form");
    form.setAttribute("autocomplete", "off");
    form.style.cssText = "display:flex;gap:8px;" + (isCompact ? "align-items:center;" : "");

    if (isCompact) {
      var mark = document.createElement("div");
      mark.style.cssText = "flex-shrink:0;display:flex;align-items:center;";
      mark.innerHTML = boltMark(gradId, 18);
      form.appendChild(mark);
    }

    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter reg";
    input.maxLength = 8;
    input.setAttribute("aria-label", "Vehicle registration number");
    var plateBorder = cfg.style === "plate"
      ? "2px solid #d97706"
      : "1px solid " + c.inputBorder;
    var plateBg = cfg.style === "plate" ? "#fbbf24" : c.inputBg;
    var plateText = cfg.style === "plate" ? "#0f172a" : c.inputText;
    input.style.cssText = [
      "flex:1",
      "min-width:0",
      "padding:" + (isCompact ? "9px 11px" : "11px 13px"),
      "font-family:" + MONO_STACK,
      "font-size:" + (isCompact ? "14px" : "15px"),
      "font-weight:600",
      "text-transform:uppercase",
      "letter-spacing:0.1em",
      "border:" + plateBorder,
      "border-radius:8px",
      "outline:none",
      "box-sizing:border-box",
      "background:" + plateBg,
      "color:" + plateText,
      "transition:border-color 0.15s, box-shadow 0.15s",
    ].join(";");
    input.addEventListener("focus", function () {
      if (cfg.style === "modern") {
        input.style.borderColor = a.from;
        input.style.boxShadow = "0 0 0 3px " + a.ring;
      }
    });
    input.addEventListener("blur", function () {
      if (cfg.style === "modern") {
        input.style.borderColor = c.inputBorder;
        input.style.boxShadow = "none";
      }
    });

    var button = document.createElement("button");
    button.type = "submit";
    button.innerHTML =
      '<span>' + (isCompact ? "Go" : "Check") + "</span>" + arrowSvg("#ffffff");
    button.setAttribute("aria-label", "Run free vehicle check");
    button.style.cssText = [
      "display:inline-flex",
      "align-items:center",
      "gap:6px",
      "padding:" + (isCompact ? "9px 12px" : "11px 16px"),
      "font-family:" + SANS_STACK,
      "font-size:" + (isCompact ? "13px" : "14px"),
      "font-weight:600",
      "border:none",
      "border-radius:8px",
      "cursor:pointer",
      "white-space:nowrap",
      "background:linear-gradient(135deg," + a.from + "," + a.to + ")",
      "color:#ffffff",
      "box-shadow:0 4px 14px -4px " + a.ring,
      "transition:transform 0.1s, box-shadow 0.15s",
    ].join(";");
    button.addEventListener("mouseenter", function () {
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 6px 18px -4px " + a.ring;
    });
    button.addEventListener("mouseleave", function () {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 4px 14px -4px " + a.ring;
    });

    form.appendChild(input);
    form.appendChild(button);
    wrapper.appendChild(form);

    // ─── Value pills (full only) ───
    if (!isCompact) {
      var pills = document.createElement("div");
      pills.style.cssText =
        "display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;";
      var labels = ["MOT", "Tax", "Valuation", "ULEZ", "Recalls"];
      for (var i = 0; i < labels.length; i++) {
        var pill = document.createElement("span");
        pill.textContent = labels[i];
        pill.style.cssText = [
          "display:inline-block",
          "padding:3px 9px",
          "font-size:10.5px",
          "font-weight:500",
          "letter-spacing:0.04em",
          "background:" + a.pillBg,
          "color:" + a.pillText,
          "border:1px solid " + c.pillBorder,
          "border-radius:999px",
        ].join(";");
        pills.appendChild(pill);
      }
      wrapper.appendChild(pills);
    }

    // ─── Footer ───
    var footer = document.createElement("div");
    footer.style.cssText = isCompact
      ? "margin-top:8px;font-size:10px;color:" + c.muted + ";text-align:right;"
      : "margin-top:14px;padding-top:12px;border-top:1px solid " + c.border +
        ";display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:" + c.muted + ";";
    var brandLink =
      'Powered by <a href="' + SITE_URL +
      '?utm_source=widget&utm_medium=embed" target="_blank" rel="noopener" ' +
      'style="color:' + a.from + ';text-decoration:none;font-weight:500;">' +
      "Free Plate Check</a>";
    if (isCompact) {
      footer.innerHTML = brandLink;
    } else {
      footer.innerHTML =
        '<span>' + brandLink + '</span>' +
        '<span style="font-size:10px;color:' + c.muted + ';">Free · No signup</span>';
    }
    wrapper.appendChild(footer);

    // ─── Submit handler ───
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var reg = input.value.replace(/\s+/g, "").toUpperCase();
      if (!reg) {
        input.style.borderColor = "#ef4444";
        input.focus();
        return;
      }
      var qs =
        "?vrm=" + encodeURIComponent(reg) +
        "&utm_source=widget&utm_medium=embed&utm_content=" +
        encodeURIComponent(cfg.size + "-" + cfg.accent);
      window.open(SITE_URL + "/" + qs, "_blank", "noopener");
    });

    container.appendChild(wrapper);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
