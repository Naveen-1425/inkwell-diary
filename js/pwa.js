/* pwa.js — service worker registration + install banner */

let deferredPrompt = null;

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("/service-worker.js").catch(()=>{});
  });
}

window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();
  deferredPrompt=e;
  if(window.innerWidth<=880 && !sessionStorage.getItem("inkwell-install-dismissed")){
    showBanner();
  }
});

function showBanner(){
  if(window.matchMedia("(display-mode: standalone)").matches) return;
  let b=document.getElementById("install-banner");
  if(!b){
    b=document.createElement("div");
    b.id="install-banner";
    b.innerHTML=`<p>📱 <b>Add Inkwell</b> to your home screen for quick access.</p>
      <button class="btn btn-primary btn-sm" id="install-yes">Install</button>
      <button class="btn btn-icon" id="install-no">✕</button>`;
    document.body.appendChild(b);
    document.getElementById("install-yes").onclick=async()=>{
      b.classList.remove("show");
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt=null;
    };
    document.getElementById("install-no").onclick=()=>{
      b.classList.remove("show");
      sessionStorage.setItem("inkwell-install-dismissed","1");
    };
  }
  b.classList.add("show");
}

window.addEventListener("appinstalled",()=>{
  const b=document.getElementById("install-banner");
  if(b) b.classList.remove("show");
});
