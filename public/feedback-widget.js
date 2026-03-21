/**
 * Vanta Signal — Embeddable Feedback Widget
 * Usage:
 *   <script src="https://vantasignal.lovable.app/feedback-widget.js"
 *           data-endpoint="https://fwmrhpayssaiuhqzzeig.supabase.co/functions/v1/feedback-widget"
 *           data-theme="dark"
 *           defer></script>
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var endpoint = script && script.getAttribute("data-endpoint");
  if (!endpoint) {
    console.warn("[VantaFeedback] Missing data-endpoint attribute.");
    return;
  }
  var theme = (script && script.getAttribute("data-theme")) || "light";

  /* ── Colours ── */
  var C =
    theme === "dark"
      ? {
          bg: "#1a1a2e",
          card: "#16213e",
          border: "#334155",
          text: "#e2e8f0",
          muted: "#94a3b8",
          accent: "#6366f1",
          accentHover: "#818cf8",
          inputBg: "#0f172a",
          success: "#22c55e",
          error: "#ef4444",
        }
      : {
          bg: "#ffffff",
          card: "#f8fafc",
          border: "#e2e8f0",
          text: "#1e293b",
          muted: "#64748b",
          accent: "#6366f1",
          accentHover: "#818cf8",
          inputBg: "#ffffff",
          success: "#22c55e",
          error: "#ef4444",
        };

  var SUBJECTS = [
    "General",
    "UX",
    "AI",
    "Strategy",
    "Design",
    "Performance",
    "Integrations",
    "Mobile",
    "Security",
    "Infrastructure",
  ];

  /* ── Shadow DOM host ── */
  var host = document.createElement("div");
  host.id = "vanta-feedback-widget";
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: "closed" });

  /* ── Styles ── */
  var style = document.createElement("style");
  style.textContent = [
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    ".vf-fab { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; width: 52px; height: 52px; border-radius: 50%; border: none; background: " + C.accent + "; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(99,102,241,.4); transition: transform .2s, background .2s; font-size: 22px; }",
    ".vf-fab:hover { transform: scale(1.08); background: " + C.accentHover + "; }",
    ".vf-overlay { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,.4); display: none; }",
    ".vf-overlay.open { display: block; }",
    ".vf-modal { position: fixed; bottom: 88px; right: 24px; z-index: 2147483647; width: 380px; max-height: 520px; background: " + C.bg + "; border: 1px solid " + C.border + "; border-radius: 12px; overflow: hidden; display: none; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,.18); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
    ".vf-modal.open { display: flex; }",
    ".vf-header { padding: 16px 20px 12px; border-bottom: 1px solid " + C.border + "; display: flex; justify-content: space-between; align-items: center; }",
    ".vf-header h3 { font-size: 15px; font-weight: 700; color: " + C.text + "; letter-spacing: -.02em; }",
    ".vf-close { background: none; border: none; color: " + C.muted + "; cursor: pointer; font-size: 18px; padding: 4px; }",
    ".vf-body { padding: 16px 20px; overflow-y: auto; flex: 1; }",
    ".vf-field { margin-bottom: 14px; }",
    ".vf-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: " + C.muted + "; margin-bottom: 6px; }",
    ".vf-input, .vf-textarea, .vf-select { width: 100%; border: 1px solid " + C.border + "; border-radius: 6px; padding: 8px 10px; font-size: 13px; color: " + C.text + "; background: " + C.inputBg + "; outline: none; transition: border-color .15s; }",
    ".vf-input:focus, .vf-textarea:focus, .vf-select:focus { border-color: " + C.accent + "; }",
    ".vf-textarea { min-height: 100px; resize: vertical; line-height: 1.5; }",
    ".vf-submit { width: 100%; padding: 10px; border: none; border-radius: 6px; background: " + C.accent + "; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }",
    ".vf-submit:hover { background: " + C.accentHover + "; }",
    ".vf-submit:disabled { opacity: .5; cursor: not-allowed; }",
    ".vf-msg { text-align: center; padding: 40px 20px; }",
    ".vf-msg p { font-size: 14px; color: " + C.text + "; margin-top: 8px; }",
    ".vf-msg .icon { font-size: 32px; }",
    "@media (max-width: 440px) { .vf-modal { right: 12px; left: 12px; width: auto; bottom: 80px; } }",
  ].join("\n");
  shadow.appendChild(style);

  /* ── FAB ── */
  var fab = document.createElement("button");
  fab.className = "vf-fab";
  fab.innerHTML = "&#9993;"; // ✉
  fab.title = "Send Feedback";
  shadow.appendChild(fab);

  /* ── Overlay ── */
  var overlay = document.createElement("div");
  overlay.className = "vf-overlay";
  shadow.appendChild(overlay);

  /* ── Modal ── */
  var modal = document.createElement("div");
  modal.className = "vf-modal";
  modal.innerHTML = [
    '<div class="vf-header"><h3>Send Feedback</h3><button class="vf-close">&times;</button></div>',
    '<div class="vf-body">',
    '  <div class="vf-field"><label class="vf-label">Your Name</label><input class="vf-input" id="vf-author" placeholder="Optional" maxlength="100"></div>',
    '  <div class="vf-field"><label class="vf-label">Subject</label><select class="vf-select" id="vf-subject">' +
      SUBJECTS.map(function (s) { return "<option value=\"" + s + "\">" + s + "</option>"; }).join("") +
      "</select></div>",
    '  <div class="vf-field"><label class="vf-label">Feedback</label><textarea class="vf-textarea" id="vf-narrative" placeholder="What\'s on your mind?" maxlength="10000"></textarea></div>',
    '  <div class="vf-field"><label class="vf-label">ChatGPT Link (optional)</label><input class="vf-input" id="vf-link" placeholder="https://chatgpt.com/share/..." maxlength="2000"></div>',
    '  <button class="vf-submit" id="vf-send">Submit Feedback</button>',
    "</div>",
  ].join("\n");
  shadow.appendChild(modal);

  /* ── State ── */
  var isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    modal.classList.toggle("open", isOpen);
    overlay.classList.toggle("open", isOpen);
  }

  fab.addEventListener("click", toggle);
  overlay.addEventListener("click", toggle);
  modal.querySelector(".vf-close").addEventListener("click", toggle);

  /* ── Submit ── */
  modal.querySelector("#vf-send").addEventListener("click", function () {
    var btn = modal.querySelector("#vf-send");
    var narrative = modal.querySelector("#vf-narrative").value.trim();
    if (!narrative) {
      modal.querySelector("#vf-narrative").style.borderColor = C.error;
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending…";

    var links = [];
    var linkVal = modal.querySelector("#vf-link").value.trim();
    if (linkVal) links.push(linkVal);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: modal.querySelector("#vf-author").value.trim() || "External",
        subject: modal.querySelector("#vf-subject").value,
        narrative: narrative,
        chatgpt_links: links,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok) {
          showMessage("✓", "Feedback sent — thank you!", C.success);
        } else {
          showMessage("✗", data.error || "Something went wrong.", C.error);
        }
      })
      .catch(function () {
        showMessage("✗", "Network error. Please try again.", C.error);
      });
  });

  function showMessage(icon, text, color) {
    var body = modal.querySelector(".vf-body");
    body.innerHTML =
      '<div class="vf-msg"><div class="icon" style="color:' +
      color +
      '">' +
      icon +
      "</div><p>" +
      text +
      "</p></div>";
    setTimeout(function () {
      toggle();
      // Reset form after close
      setTimeout(function () {
        body.innerHTML = buildForm();
        bindSubmit();
      }, 300);
    }, 2000);
  }

  function buildForm() {
    return [
      '<div class="vf-field"><label class="vf-label">Your Name</label><input class="vf-input" id="vf-author" placeholder="Optional" maxlength="100"></div>',
      '<div class="vf-field"><label class="vf-label">Subject</label><select class="vf-select" id="vf-subject">' +
        SUBJECTS.map(function (s) { return "<option value=\"" + s + "\">" + s + "</option>"; }).join("") +
        "</select></div>",
      '<div class="vf-field"><label class="vf-label">Feedback</label><textarea class="vf-textarea" id="vf-narrative" placeholder="What\'s on your mind?" maxlength="10000"></textarea></div>',
      '<div class="vf-field"><label class="vf-label">ChatGPT Link (optional)</label><input class="vf-input" id="vf-link" placeholder="https://chatgpt.com/share/..." maxlength="2000"></div>',
      '<button class="vf-submit" id="vf-send">Submit Feedback</button>',
    ].join("\n");
  }

  function bindSubmit() {
    var btn = modal.querySelector("#vf-send");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var narrative = modal.querySelector("#vf-narrative").value.trim();
      if (!narrative) {
        modal.querySelector("#vf-narrative").style.borderColor = C.error;
        return;
      }
      btn.disabled = true;
      btn.textContent = "Sending…";
      var links = [];
      var linkVal = modal.querySelector("#vf-link").value.trim();
      if (linkVal) links.push(linkVal);
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: modal.querySelector("#vf-author").value.trim() || "External",
          subject: modal.querySelector("#vf-subject").value,
          narrative: narrative,
          chatgpt_links: links,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.ok) showMessage("✓", "Feedback sent — thank you!", C.success);
          else showMessage("✗", data.error || "Something went wrong.", C.error);
        })
        .catch(function () {
          showMessage("✗", "Network error. Please try again.", C.error);
        });
    });
  }
})();
