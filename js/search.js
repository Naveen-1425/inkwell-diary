/* ============================================================
   Search — text search + category/favorite/archive filters
   ============================================================ */

let searchEntries = [];
let activeStatus = "all";
let activeCategory = null;

(async function init(){
  const user = await renderShell("search");
  if(!user) return;

  const { data, error } = await supabaseClient.from("diary_entries").select("*").order("created_at", { ascending: false });
  if(error){ toast(error.message, true); return; }
  searchEntries = data;

  renderCategoryChips();
  bindFilters();
  document.getElementById("search-input").addEventListener("input", renderResults);
  renderResults();
})();

function renderCategoryChips(){
  const used = [...new Set(searchEntries.map(e => e.category).filter(Boolean))];
  document.getElementById("category-chips").innerHTML = used.map(c =>
    `<button class="filter-chip" data-cat="${c}">${c}</button>`
  ).join("");
  document.querySelectorAll("[data-cat]").forEach(chip => {
    chip.addEventListener("click", () => {
      activeCategory = activeCategory === chip.dataset.cat ? null : chip.dataset.cat;
      document.querySelectorAll("[data-cat]").forEach(c => c.classList.toggle("active", c.dataset.cat === activeCategory));
      renderResults();
    });
  });
}

function bindFilters(){
  document.querySelectorAll("[data-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      activeStatus = chip.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(c => c.classList.toggle("active", c === chip));
      renderResults();
    });
  });
}

function renderResults(){
  const q = document.getElementById("search-input").value.trim().toLowerCase();

  let filtered = searchEntries.filter(e => {
    if(activeStatus === "favorites" && !e.favorite) return false;
    if(activeStatus === "archived" && !e.archived) return false;
    if(activeStatus !== "archived" && e.archived) return false;
    if(activeCategory && e.category !== activeCategory) return false;
    if(q){
      const haystack = `${e.title || ""} ${stripHtml(e.content || "")} ${e.mood || ""}`.toLowerCase();
      if(!haystack.includes(q)) return false;
    }
    return true;
  });

  const wrap = document.getElementById("results");
  if(filtered.length === 0){
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🔍</div>
        <h3>No entries found</h3>
        <p>Try a different search term or filter.</p>
      </div>`;
    return;
  }

  wrap.innerHTML = filtered.map(e => `
    <div class="entry-row">
      <div class="entry-date">${formatDate(e.created_at)}</div>
      <div class="entry-body">
        <a href="entry.html?id=${e.id}"><h3>${escapeHtml(e.title || "Untitled entry")}</h3></a>
        <p>${escapeHtml(stripHtml(e.content)).slice(0, 160)}</p>
        <div class="entry-meta">
          ${e.mood ? `<span class="mood-badge">${moodEmoji(e.mood)} ${moodLabel(e.mood)}</span>` : ""}
          <span class="pill">${escapeHtml(e.category || "Personal")}</span>
          ${e.favorite ? `<span style="color:var(--brass);">★</span>` : ""}
          ${e.archived ? `<span class="pill" style="color:var(--ink-faint);">Archived</span>` : ""}
        </div>
      </div>
    </div>
  `).join("");
}
