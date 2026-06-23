(async function(){
  const user = await renderShell("dashboard");
  if(!user) return;
  document.getElementById("new-btn").style.display = "inline-flex";
  const name = (user.user_metadata?.name||"").split(" ")[0]||"there";
  const hour = new Date().getHours();
  const g = hour<12?"Good morning":hour<18?"Good afternoon":"Good evening";
  document.getElementById("greeting").textContent = `${g}, ${name} 👋`;

  const {data:entries,error} = await supabaseClient
    .from("diary_entries").select("*").eq("archived",false).order("created_at",{ascending:false});
  if(error){ document.getElementById("greeting-sub").textContent="Couldn't load entries."; toast(error.message,true); return; }

  const total=entries.length;
  const favs=entries.filter(e=>e.favorite).length;
  const now=new Date();
  const monthly=entries.filter(e=>{const d=new Date(e.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;
  const streak=computeStreak(entries.map(e=>e.created_at));

  document.getElementById("greeting-sub").textContent = total===0
    ? "Your journal is waiting for its first entry."
    : `${total} ${total===1?"entry":"entries"} · ${streak} day streak`;

  document.getElementById("stat-grid").innerHTML = `
    <div class="card stat-card"><div class="num">${total}</div><div class="label">Total entries</div></div>
    <div class="card stat-card"><div class="num">${streak}🔥</div><div class="label">Streak</div></div>
    <div class="card stat-card"><div class="num">${favs}</div><div class="label">Favorites</div></div>
    <div class="card stat-card"><div class="num">${monthly}</div><div class="label">This month</div></div>`;

  const wrap=document.getElementById("recent-entries");
  const recent=entries.slice(0,10);
  if(recent.length===0){
    wrap.innerHTML=`<div class="empty-state"><div class="glyph">📓</div><h3>No entries yet</h3><p>Write your first entry and it'll show up here.</p><a href="entry.html" class="btn btn-primary" style="margin-top:16px;">Write first entry</a></div>`;
    return;
  }
  wrap.innerHTML=recent.map(e=>`
    <div class="entry-row">
      <div class="entry-date">${formatDate(e.created_at)}</div>
      <div class="entry-body">
        <a href="entry.html?id=${e.id}"><h3>${escapeHtml(e.title||"Untitled entry")}</h3></a>
        <p>${escapeHtml(stripHtml(e.content)).slice(0,140)}</p>
        <div class="entry-meta">
          ${e.mood?`<span class="mood-badge">${moodEmoji(e.mood)} ${moodLabel(e.mood)}</span>`:""}
          <span class="pill">${escapeHtml(e.category||"Personal")}</span>
          ${e.favorite?`<span style="color:var(--brass);">★</span>`:""}
        </div>
      </div>
    </div>`).join("");
})();
