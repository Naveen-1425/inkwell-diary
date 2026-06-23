/* ============================================================
   Shared utilities
   ============================================================ */

const MOODS = [
  { key:"happy",    emoji:"😊", label:"Happy" },
  { key:"excited",  emoji:"😁", label:"Excited" },
  { key:"calm",     emoji:"😌", label:"Calm" },
  { key:"neutral",  emoji:"😐", label:"Neutral" },
  { key:"sad",      emoji:"😔", label:"Sad" },
  { key:"angry",    emoji:"😡", label:"Angry" },
  { key:"stressed", emoji:"😩", label:"Stressed" },
];

const CATEGORIES = ["Personal","Family","Friends","Work","Study","Travel","Health","Finance","Goals","Memories"];

function moodEmoji(key){ const m=MOODS.find(m=>m.key===key); return m?m.emoji:"📝"; }
function moodLabel(key){ const m=MOODS.find(m=>m.key===key); return m?m.label:"—"; }

/* theme */
function initTheme(){
  const saved = localStorage.getItem("diary-theme") || "midnight";
  document.documentElement.setAttribute("data-theme", saved==="midnight"?"":saved);
  document.querySelectorAll("[data-theme-btn]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.themeBtn===saved);
    btn.addEventListener("click",()=>setTheme(btn.dataset.themeBtn));
  });
}
function setTheme(name){
  document.documentElement.setAttribute("data-theme", name==="midnight"?"":name);
  localStorage.setItem("diary-theme", name);
  document.querySelectorAll("[data-theme-btn]").forEach(btn=>btn.classList.toggle("active", btn.dataset.themeBtn===name));
}

/* toast */
function toast(message, isError=false){
  let el=document.getElementById("toast");
  if(!el){ el=document.createElement("div"); el.id="toast"; document.body.appendChild(el); }
  el.textContent=message;
  el.style.borderLeft=isError?"3px solid var(--danger)":"3px solid var(--brass)";
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove("show"),3200);
}

/* auth guards */
async function requireAuth(){
  const { data:{ session } }=await supabaseClient.auth.getSession();
  if(!session){ window.location.href="login.html"; return null; }
  return session.user;
}
async function redirectIfAuthed(){
  const { data:{ session } }=await supabaseClient.auth.getSession();
  if(session) window.location.href="dashboard.html";
}

/* formatting */
function formatDate(iso){ return new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
function formatDateLong(iso){ return new Date(iso).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}); }
function timeAgo(iso){
  const diff=(Date.now()-new Date(iso).getTime())/1000;
  if(diff<60) return "just now";
  if(diff<3600) return Math.floor(diff/60)+"m ago";
  if(diff<86400) return Math.floor(diff/3600)+"h ago";
  if(diff<86400*7) return Math.floor(diff/86400)+"d ago";
  return formatDate(iso);
}
function wordCount(html){ const t=html.replace(/<[^>]*>/g," ").trim(); return t?t.split(/\s+/).filter(Boolean).length:0; }
function stripHtml(html){ const d=document.createElement("div"); d.innerHTML=html||""; return d.textContent||""; }
function escapeHtml(str){ const d=document.createElement("div"); d.textContent=str||""; return d.innerHTML; }
function initials(name,email){ const src=(name&&name.trim())||email||"?"; return src.trim().split(/\s+/).map(p=>p[0]).join("").slice(0,2).toUpperCase(); }

/* streak */
function computeStreak(dates){
  const daySet=new Set(dates.map(d=>new Date(d).toDateString()));
  let streak=0, cursor=new Date();
  if(!daySet.has(cursor.toDateString())) cursor.setDate(cursor.getDate()-1);
  while(daySet.has(cursor.toDateString())){ streak++; cursor.setDate(cursor.getDate()-1); }
  return streak;
}

/* sidebar toggle (desktop only, kept for safety) */
function initSidebarToggle(){
  const btn=document.querySelector(".menu-toggle");
  const sidebar=document.querySelector(".sidebar");
  if(!btn||!sidebar) return;
  btn.addEventListener("click",()=>sidebar.classList.toggle("open"));
}

/* confirm modal — slides up from bottom on mobile */
function confirmModal({title,message,confirmText="Delete",danger=true}){
  return new Promise(resolve=>{
    const overlay=document.createElement("div");
    overlay.className="modal-overlay show";
    overlay.innerHTML=`
      <div class="modal">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel">Cancel</button>
          <button class="btn ${danger?"btn-danger":"btn-primary"}" data-act="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click",e=>{
      if(e.target===overlay||e.target.dataset.act==="cancel"){ overlay.remove(); resolve(false); }
      else if(e.target.dataset.act==="confirm"){ overlay.remove(); resolve(true); }
    });
  });
}
