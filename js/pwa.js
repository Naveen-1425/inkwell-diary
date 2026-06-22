/* ============================================================
   PWA — service worker registration + install banner
   ============================================================ */

let deferredInstallPrompt = null;

/* ---- register service worker ---- */
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .catch(err => console.warn("SW registration failed:", err));
  });
}

/* ---- capture install prompt ---- */
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

function showInstallBanner(){
  // Don't show if already installed (standalone mode)
  if(window.matchMedia("(display-mode: standalone)").matches) return;
  // Don't show on desktop (rough check: screen width > 880px)
  if(window.innerWidth > 880) return;

  let banner = document.getElementById("install-banner");
  if(!banner){
    banner = document.createElement("div");
    banner.id = "install-banner";
    banner.innerHTML = `
      <p>📱 <b>Add Inkwell to your home screen</b> for quick access, like an app.</p>
      <button class="btn btn-primary btn-sm" id="install-yes">Install</button>
      <button class="btn btn-icon" id="install-no" title="Dismiss" style="flex-shrink:0;">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById("install-yes").addEventListener("click", async () => {
      banner.classList.remove("show");
      if(!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
    });
    document.getElementById("install-no").addEventListener("click", () => {
      banner.classList.remove("show");
      sessionStorage.setItem("inkwell-install-dismissed", "1");
    });
  }

  if(sessionStorage.getItem("inkwell-install-dismissed")) return;
  banner.classList.add("show");
}

/* ---- installed event ---- */
window.addEventListener("appinstalled", () => {
  const banner = document.getElementById("install-banner");
  if(banner) banner.classList.remove("show");
  deferredInstallPrompt = null;
});
