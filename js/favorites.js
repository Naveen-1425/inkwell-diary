/* ============================================================
   Favorites — list of starred entries
   ============================================================ */

(async function init(){
  const user = await renderShell("favorites");
  if(!user) return;

  const { data, error } = await supabaseClient
    .from("diary_entries").select("*")
    .eq("favorite", true).eq("archived", false)
    .order("created_at", { ascending: false });

  if(error){ toast(error.message, true); return; }

  const wrap = document.getElementById("favorites-list");
  if(data.length === 0){
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="glyph">★</div>
        <h3>No favorites yet</h3>
        <p>Star an entry while writing or editing to pin it here.</p>
      </div>`;
    return;
  }

  wrap.innerHTML = data.map(e => `
    <div class="entry-row">
      <div class="entry-date">${formatDate(e.created_at)}</div>
      <div class="entry-body">
        <a href="entry.html?id=${e.id}"><h3>${escapeHtml(e.title || "Untitled entry")}</h3></a>
        <p>${escapeHtml(stripHtml(e.content)).slice(0, 160)}</p>
        <div class="entry-meta">
          ${e.mood ? `<span class="mood-badge">${moodEmoji(e.mood)} ${moodLabel(e.mood)}</span>` : ""}
          <span class="pill">${escapeHtml(e.category || "Personal")}</span>
          <span style="color:var(--brass);">★</span>
        </div>
      </div>
    </div>
  `).join("");
})();
