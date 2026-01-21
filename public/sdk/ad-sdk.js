(function () {
  const overlayId = "x402-ad-overlay";
  const defaultEventsEndpoint = "/api/events";
  const state = {
    appId: null,
    eventsEndpoint: defaultEventsEndpoint,
    adUnitId: "demo-unit",
    currentAd: null,
    eventQueue: [],
  };

  const styles = `
    #${overlayId} {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      display: grid;
      place-items: center;
      z-index: 2147483647;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
    }
    #${overlayId} .ad-card {
      background: linear-gradient(135deg, #0f172a, #1f2937);
      color: #e5e7eb;
      width: min(480px, 90vw);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 25px 70px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.08);
    }
    #${overlayId} .ad-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    #${overlayId} .ad-pill { font-size:12px; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,0.08); }
    #${overlayId} .ad-cta { margin-top:16px; width:100%; background:#f97316; color:#0f172a; border:none; border-radius:12px; padding:12px 14px; font-weight:600; cursor:pointer; }
    #${overlayId} .ad-cta:hover { background:#fb923c; }
    #${overlayId} .ad-progress { height:6px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; margin-top:10px; }
    #${overlayId} .ad-progress-bar { height:100%; background:#22d3ee; width:0%; transition:width 0.2s ease; }
  `;

  function ensureStyle() {
    if (document.getElementById(`${overlayId}-style`)) return;
    const style = document.createElement("style");
    style.id = `${overlayId}-style`;
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function sendEvent(event) {
    if (!state.appId) return;
    const payload = {
      appId: state.appId,
      adUnitId: event.adUnitId || "demo-unit",
      event: event.event,
      ts: Date.now(),
    };
    fetch(state.eventsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  function dismissOverlay() {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.remove();
  }

  function renderMockAd(type, onComplete, opts) {
    ensureStyle();
    dismissOverlay();

    const overlay = document.createElement("div");
    overlay.id = overlayId;

    const card = document.createElement("div");
    card.className = "ad-card";

    card.innerHTML = `
      <div class="ad-header">
        <div>
          <div style="font-weight:700;">Sponsored content</div>
          <div style="font-size:14px; opacity:0.8;">${type.toUpperCase()} · ${opts?.adUnitId || "demo-unit"}</div>
        </div>
        <span class="ad-pill">Ad</span>
      </div>
      <div style="background:rgba(255,255,255,0.06); border-radius:12px; height:180px; display:grid; place-items:center; color:#cbd5e1; font-weight:600; letter-spacing:0.5px;">
        Your ${type} ad goes here
      </div>
      <div class="ad-progress"><div class="ad-progress-bar"></div></div>
      <button class="ad-cta" type="button">I want this</button>
    `;

    const cta = card.querySelector(".ad-cta");
    const progressBar = card.querySelector(".ad-progress-bar");
    let elapsed = 0;
    const duration = opts?.durationMs || 4000;
    const interval = setInterval(() => {
      elapsed += 200;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (pct >= 100) {
        clearInterval(interval);
        onComplete?.();
        dismissOverlay();
      }
    }, 200);

    cta?.addEventListener("click", () => {
      clearInterval(interval);
      onComplete?.("click");
      dismissOverlay();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        clearInterval(interval);
        onComplete?.("skip");
        dismissOverlay();
      }
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function init(opts = {}) {
    state.appId = opts.appId;
    state.eventsEndpoint = opts.eventsEndpoint || defaultEventsEndpoint;
    state.adUnitId = opts.adUnitId || state.adUnitId;
    return { appId: state.appId, eventsEndpoint: state.eventsEndpoint };
  }

  function showAd(options = {}) {
    if (!state.appId) {
      throw new Error("Call init({ appId }) before showAd");
    }
    const type = options.type || "video";
    const adUnitId = options.adUnitId || state.adUnitId || "demo-unit";
    const onComplete = (result) => {
      sendEvent({ event: result === "skip" ? "skip" : "complete", adUnitId });
      options.onComplete && options.onComplete(result || "complete");
    };

    sendEvent({ event: "start", adUnitId });
    renderMockAd(type, onComplete, { adUnitId, durationMs: options.durationMs });
  }

  function autoInitFromScript() {
    const current = document.currentScript;
    if (!current) return;
    const appId = current.getAttribute("data-app-id");
    const endpoint = current.getAttribute("data-events-endpoint");
    const adUnitId = current.getAttribute("data-ad-unit");
    if (appId) init({ appId, eventsEndpoint: endpoint, adUnitId });
  }

  window.x402Ad = { init, showAd, dismissOverlay };
  autoInitFromScript();
})();
