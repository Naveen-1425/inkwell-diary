/* ============================================================
   Calendar — monthly grid with entry/mood indicators
   ============================================================ */

let calCursor = new Date();
let allEntries = [];

(async function init(){
  const user = await renderShell("calendar");
  if(!user) return;

  document.getElementById("prev-month").addEventListener("click", () => { calCursor.setMonth(calCursor.getMonth() - 1); renderCalendar(); });
  document.getElementById("next-month").addEventListener("click", () => { calCursor.setMonth(calCursor.getMonth() + 1); renderCalendar(); });

  const { data, error } = await supabaseClient.from("diary_entries").select("*").eq("archived", false);
  if(error){ toast(error.message, true); return; }
  allEntries = data;
  renderCalendar();
})();

function renderCalendar(){
  const year = calCursor.getFullYear();
  const month = calCursor.getMonth();
  document.getElementById("month-label").textContent = calCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const entriesByDay = {};
  allEntries.forEach(e => {
    const d = new Date(e.created_at);
    if(d.getFullYear() === year && d.getMonth() === month){
      const day = d.getDate();
      (entriesByDay[day] = entriesByDay[day] || []).push(e);
    }
  });

  let cells = "";
  for(let i = 0; i < firstDay; i++) cells += `<div class="cal-cell empty"></div>`;

  for(let day = 1; day <= daysInMonth; day++){
    const dayEntries = entriesByDay[day] || [];
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    const mood = dayEntries.find(e => e.mood)?.mood;
    cells += `
      <div class="cal-cell ${dayEntries.length ? 'has-entry' : ''} ${isToday ? 'today' : ''}" data-day="${day}">
        <span>${day}</span>
        ${dayEntries.length ? `<span class="mood-dot" title="${dayEntries.length} entr${dayEntries.length===1?'y':'ies'}">${mood ? moodEmoji(mood) : ''}</span>` : ''}
      </div>`;
  }

  document.getElementById("cal-grid").innerHTML = cells;
  document.querySelectorAll(".cal-cell[data-day]").forEach(cell => {
    cell.addEventListener("click", () => showDayDetail(parseInt(cell.dataset.day), entriesByDay[cell.dataset.day] || []));
  });
}

function showDayDetail(day, entries){
  const panel = document.getElementById("day-detail");
  const date = new Date(calCursor.getFullYear(), calCursor.getMonth(), day);
  document.getElementById("day-detail-title").textContent = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  if(entries.length === 0){
    document.getElementById("day-detail-entries").innerHTML = `
      <div class="empty-state" style="padding:30px 10px;">
        <p>No entries this day.</p>
        <a href="entry.html" class="btn btn-primary btn-sm" style="margin-top:14px;">Write one</a>
      </div>`;
  } else {
    document.getElementById("day-detail-entries").innerHTML = entries.map(e => `
      <div class="entry-row">
        <div class="entry-date">${e.mood ? moodEmoji(e.mood) : '📝'}</div>
        <div class="entry-body">
          <a href="entry.html?id=${e.id}"><h3>${escapeHtml(e.title || "Untitled entry")}</h3></a>
          <p>${escapeHtml(stripHtml(e.content)).slice(0, 140)}</p>
          <div class="entry-meta"><span class="pill">${escapeHtml(e.category || "Personal")}</span></div>
        </div>
      </div>
    `).join("");
  }
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
