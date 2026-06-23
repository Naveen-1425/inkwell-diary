/* ============================================================
   App shell — desktop sidebar + mobile bottom nav
   ============================================================ */

const NAV_ITEMS = [
  { key:"dashboard", href:"dashboard.html", label:"Home",     icon:"M3 11l9-8 9 8M5 9v10h14V9" },
  { key:"calendar",  href:"calendar.html",  label:"Calendar", icon:"M4 7h16M4 7v12h16V7M4 7l1-3h14l1 3M8 11h2m2 0h2m-6 4h2m2 0h2" },
  { key:"entry",     href:"entry.html",     label:"Write",    fab:true },
  { key:"search",    href:"search.html",    label:"Search",   icon:"M11 11a6 6 0 100-12 6 6 0 000 12zM21 21l-4.3-4.3" },
  { key:"profile",   href:"profile.html",   label:"Profile",  icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

const SIDEBAR_NAV = [
  { key:"dashboard", href:"dashboard.html", label:"Dashboard", icon:"M3 11l9-8 9 8M5 9v10h14V9" },
  { key:"entry",     href:"entry.html",     label:"New Entry", icon:"M12 5v14M5 12h14" },
  { key:"calendar",  href:"calendar.html",  label:"Calendar",  icon:"M4 7h16M4 7v12h16V7M4 7l1-3h14l1 3M8 11h2m2 0h2m-6 4h2m2 0h2" },
  { key:"search",    href:"search.html",    label:"Search",    icon:"M11 11a6 6 0 100-12 6 6 0 000 12zM21 21l-4.3-4.3" },
  { key:"favorites", href:"favorites.html", label:"Favorites", icon:"M12 21s-7.5-4.6-10-9C.5 8 2 4 6 4c2 0 4 1.4 6 4 2-2.6 4-4 6-4 4 0 5.5 4 4 8-2.5 4.4-10 9-10 9z" },
];

function svgIcon(d){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

async function renderShell(activeKey){
  const user = await requireAuth();
  if(!user) return null;
  const name = user.user_metadata?.name || "";

  /* --- Desktop Sidebar --- */
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.innerHTML = `
    <div class="sidebar-brand"><span class="dot"></span> Inkwell</div>
    <nav>${SIDEBAR_NAV.map(item=>`
      <a href="${item.href}" class="${item.key===activeKey?"active":""}">
        ${svgIcon(item.icon)} ${item.label}
      </a>`).join("")}
    </nav>
    <div class="sidebar-footer">
      <div class="theme-toggle">
        <button data-theme-btn="midnight" title="Midnight">🌙</button>
        <button data-theme-btn="paper" title="Paper">☀️</button>
      </div>
      <a href="profile.html" style="display:flex;align-items:center;gap:10px;padding:8px 4px;">
        <div class="avatar">${initials(name,user.email)}</div>
        <div style="min-width:0;">
          <div style="font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${escapeHtml(name||"Your Profile")}</div>
          <div style="font-size:.72rem;color:var(--ink-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${escapeHtml(user.email)}</div>
        </div>
      </a>
      <button class="btn btn-ghost btn-sm" data-logout style="width:100%;">Sign out</button>
    </div>`;
  document.body.insertBefore(sidebar, document.body.firstChild);

  /* --- Mobile Bottom Nav --- */
  const bottomNav = document.createElement("nav");
  bottomNav.className = "bottom-nav";
  bottomNav.innerHTML = NAV_ITEMS.map(item=>{
    if(item.fab) return `
      <a href="${item.href}" class="fab" aria-label="New entry">
        ${svgIcon("M12 5v14M5 12h14")}
      </a>`;
    return `
      <a href="${item.href}" class="${item.key===activeKey?"active":""}" aria-label="${item.label}">
        ${svgIcon(item.icon)}
        <span>${item.label}</span>
      </a>`;
  }).join("");
  document.body.appendChild(bottomNav);

  document.body.classList.add("app-shell");
  initTheme();
  initLogout();
  return user;
}
