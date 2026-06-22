/* ============================================================
   Entry editor — create, edit, autosave, mood, tags, image
   ============================================================ */

let currentUser = null;
let currentEntryId = null;
let autosaveTimer = null;
let imageFile = null;
let imageUrl = null;
let selectedMood = null;
let isFavorite = false;
let isArchived = false;

(async function init(){
  currentUser = await renderShell(null); // no sidebar item highlighted for editor
  if(!currentUser) return;

  renderMoodPicker();
  renderCategoryOptions();
  bindToolbar();
  bindActions();

  const params = new URLSearchParams(window.location.search);
  currentEntryId = params.get("id");

  if(currentEntryId){
    await loadEntry(currentEntryId);
  } else {
    document.getElementById("favorite-btn").style.opacity = ".4";
  }

  document.getElementById("editor").addEventListener("input", () => {
    updateCounts();
    scheduleAutosave();
  });
  document.getElementById("title").addEventListener("input", scheduleAutosave);
  updateCounts();
})();

function renderMoodPicker(){
  const wrap = document.getElementById("mood-picker");
  wrap.innerHTML = MOODS.map(m => `
    <button type="button" class="mood-opt" data-mood="${m.key}">
      ${m.emoji}<span>${m.label}</span>
    </button>`).join("");
  wrap.querySelectorAll(".mood-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMood = selectedMood === btn.dataset.mood ? null : btn.dataset.mood;
      wrap.querySelectorAll(".mood-opt").forEach(b => b.classList.toggle("selected", b.dataset.mood === selectedMood));
      scheduleAutosave();
    });
  });
}

function renderCategoryOptions(){
  const sel = document.getElementById("category");
  sel.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
}

function bindToolbar(){
  document.querySelectorAll(".rt-toolbar button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("editor").focus();
      document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
      updateCounts();
      scheduleAutosave();
    });
  });

  document.getElementById("image-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    imageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("image-preview").innerHTML = `
        <div style="position:relative;display:inline-block;">
          <img src="${reader.result}" style="max-height:160px;border-radius:var(--radius-sm);border:1px solid var(--paper-line);">
          <button type="button" id="remove-image" class="btn btn-icon" style="position:absolute;top:6px;right:6px;background:var(--paper);">✕</button>
        </div>`;
      document.getElementById("remove-image").addEventListener("click", () => {
        imageFile = null; imageUrl = null;
        document.getElementById("image-preview").innerHTML = "";
        document.getElementById("image-input").value = "";
        scheduleAutosave();
      });
    };
    reader.readAsDataURL(file);
    scheduleAutosave();
  });
}

function bindActions(){
  document.getElementById("save-btn").addEventListener("click", () => saveEntry(true));
  document.getElementById("favorite-btn").addEventListener("click", async () => {
    isFavorite = !isFavorite;
    document.getElementById("favorite-btn").style.color = isFavorite ? "var(--brass)" : "";
    if(currentEntryId) await saveEntry(false);
  });
  document.getElementById("archive-btn").addEventListener("click", async () => {
    const ok = await confirmModal({ title: "Archive this entry?", message: "You can restore it later from your archive.", confirmText: "Archive", danger: false });
    if(!ok) return;
    isArchived = true;
    await saveEntry(false);
    toast("Entry archived.");
    window.location.href = "dashboard.html";
  });
  document.getElementById("delete-btn").addEventListener("click", async () => {
    const ok = await confirmModal({ title: "Delete this entry?", message: "This can't be undone.", confirmText: "Delete" });
    if(!ok) return;
    const { error } = await supabaseClient.from("diary_entries").delete().eq("id", currentEntryId);
    if(error){ toast(error.message, true); return; }
    toast("Entry deleted.");
    window.location.href = "dashboard.html";
  });
  document.getElementById("duplicate-btn").addEventListener("click", async () => {
    const payload = collectPayload();
    delete payload.id;
    const { data, error } = await supabaseClient.from("diary_entries").insert(payload).select().single();
    if(error){ toast(error.message, true); return; }
    toast("Entry duplicated.");
    window.location.href = `entry.html?id=${data.id}`;
  });
}

async function loadEntry(id){
  const { data, error } = await supabaseClient.from("diary_entries").select("*").eq("id", id).single();
  if(error){ toast("Couldn't load entry.", true); return; }

  document.getElementById("page-title").textContent = "Edit entry";
  document.getElementById("title").value = data.title || "";
  document.getElementById("editor").innerHTML = data.content || "";
  document.getElementById("category").value = data.category || "Personal";
  selectedMood = data.mood;
  isFavorite = data.favorite;
  isArchived = data.archived;
  imageUrl = data.image_url;

  document.querySelectorAll(".mood-opt").forEach(b => b.classList.toggle("selected", b.dataset.mood === selectedMood));
  document.getElementById("favorite-btn").style.opacity = "1";
  document.getElementById("favorite-btn").style.color = isFavorite ? "var(--brass)" : "";
  document.getElementById("archive-btn").style.display = "inline-flex";
  document.getElementById("delete-btn").style.display = "inline-flex";
  document.getElementById("duplicate-btn").style.display = "inline-flex";
  document.getElementById("draft-status").textContent = `Last updated ${timeAgo(data.updated_at)}`;

  if(imageUrl){
    document.getElementById("image-preview").innerHTML = `
      <div style="position:relative;display:inline-block;">
        <img src="${imageUrl}" style="max-height:160px;border-radius:var(--radius-sm);border:1px solid var(--paper-line);">
        <button type="button" id="remove-image" class="btn btn-icon" style="position:absolute;top:6px;right:6px;background:var(--paper);">✕</button>
      </div>`;
    document.getElementById("remove-image").addEventListener("click", () => {
      imageFile = null; imageUrl = null;
      document.getElementById("image-preview").innerHTML = "";
      scheduleAutosave();
    });
  }

  // tags
  const { data: entryTags } = await supabaseClient
    .from("entry_tags").select("tags(name)").eq("entry_id", id);
  if(entryTags){
    document.getElementById("tags").value = entryTags.map(t => t.tags?.name).filter(Boolean).join(", ");
  }

  updateCounts();
}

function updateCounts(){
  const html = document.getElementById("editor").innerHTML;
  const wc = wordCount(html);
  document.getElementById("word-count").textContent = wc;
  document.getElementById("read-time").textContent = Math.max(1, Math.round(wc / 200)) + " min";
}

function scheduleAutosave(){
  document.getElementById("autosave-note").textContent = "Saving...";
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveEntry(false), 1500);
}

function collectPayload(){
  return {
    id: currentEntryId,
    user_id: currentUser.id,
    title: document.getElementById("title").value.trim(),
    content: document.getElementById("editor").innerHTML,
    category: document.getElementById("category").value,
    mood: selectedMood,
    favorite: isFavorite,
    archived: isArchived,
    image_url: imageUrl,
  };
}

async function uploadImageIfNeeded(){
  if(!imageFile) return imageUrl;
  const ext = imageFile.name.split(".").pop();
  const path = `${currentUser.id}/${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage.from("diary-images").upload(path, imageFile);
  if(error){ toast("Image upload failed: " + error.message, true); return imageUrl; }
  const { data } = supabaseClient.storage.from("diary-images").getPublicUrl(path);
  imageFile = null;
  return data.publicUrl;
}

async function saveEntry(showToast){
  const title = document.getElementById("title").value.trim();
  const html = document.getElementById("editor").innerHTML;
  if(!title && wordCount(html) === 0){
    if(showToast) toast("Write something before saving.", true);
    return;
  }

  imageUrl = await uploadImageIfNeeded();
  const payload = collectPayload();

  let result;
  if(currentEntryId){
    const { id, ...updateFields } = payload;
    result = await supabaseClient.from("diary_entries").update(updateFields).eq("id", currentEntryId).select().single();
  } else {
    const { id, ...insertFields } = payload;
    result = await supabaseClient.from("diary_entries").insert(insertFields).select().single();
  }

  if(result.error){
    document.getElementById("autosave-note").textContent = "";
    if(showToast) toast(result.error.message, true);
    return;
  }

  if(!currentEntryId){
    currentEntryId = result.data.id;
    window.history.replaceState({}, "", `entry.html?id=${currentEntryId}`);
    document.getElementById("page-title").textContent = "Edit entry";
    document.getElementById("archive-btn").style.display = "inline-flex";
    document.getElementById("delete-btn").style.display = "inline-flex";
    document.getElementById("duplicate-btn").style.display = "inline-flex";
    document.getElementById("favorite-btn").style.opacity = "1";
  }

  await syncTags(currentEntryId);

  document.getElementById("draft-status").textContent = `Last updated just now`;
  document.getElementById("autosave-note").textContent = "Saved";
  setTimeout(() => { document.getElementById("autosave-note").textContent = ""; }, 1800);
  if(showToast) toast("Entry saved.");
}

async function syncTags(entryId){
  const raw = document.getElementById("tags").value;
  const names = raw.split(",").map(t => t.trim()).filter(Boolean);

  await supabaseClient.from("entry_tags").delete().eq("entry_id", entryId);
  if(names.length === 0) return;

  for(const name of names){
    let { data: existing } = await supabaseClient.from("tags").select("id").eq("name", name).eq("user_id", currentUser.id).maybeSingle();
    let tagId;
    if(existing){
      tagId = existing.id;
    } else {
      const { data: created, error } = await supabaseClient.from("tags").insert({ name, user_id: currentUser.id }).select().single();
      if(error) continue;
      tagId = created.id;
    }
    await supabaseClient.from("entry_tags").insert({ entry_id: entryId, tag_id: tagId });
  }
}
