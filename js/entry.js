let currentUser=null,currentEntryId=null,autosaveTimer=null,imageFile=null,imageUrl=null,selectedMood=null,isFavorite=false,isArchived=false;

(async function(){
  currentUser=await renderShell(null);
  if(!currentUser) return;
  renderMoodPicker(); renderCategoryOptions(); bindToolbar(); bindActions();
  const params=new URLSearchParams(window.location.search);
  currentEntryId=params.get("id");
  if(currentEntryId) await loadEntry(currentEntryId);
  document.getElementById("editor").addEventListener("input",()=>{updateCounts();scheduleAutosave();});
  document.getElementById("title").addEventListener("input",scheduleAutosave);
  updateCounts();
})();

function renderMoodPicker(){
  const wrap=document.getElementById("mood-picker");
  wrap.innerHTML=MOODS.map(m=>`<button type="button" class="mood-opt" data-mood="${m.key}">${m.emoji}<span>${m.label}</span></button>`).join("");
  wrap.querySelectorAll(".mood-opt").forEach(btn=>btn.addEventListener("click",()=>{
    selectedMood=selectedMood===btn.dataset.mood?null:btn.dataset.mood;
    wrap.querySelectorAll(".mood-opt").forEach(b=>b.classList.toggle("selected",b.dataset.mood===selectedMood));
    scheduleAutosave();
  }));
}

function renderCategoryOptions(){
  document.getElementById("category").innerHTML=CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join("");
}

function bindToolbar(){
  document.querySelectorAll(".rt-toolbar button").forEach(btn=>btn.addEventListener("click",()=>{
    document.getElementById("editor").focus();
    document.execCommand(btn.dataset.cmd,false,btn.dataset.val||null);
    updateCounts(); scheduleAutosave();
  }));
  document.getElementById("image-input").addEventListener("change",async(e)=>{
    const file=e.target.files[0]; if(!file) return;
    imageFile=file;
    const reader=new FileReader();
    reader.onload=()=>{
      document.getElementById("image-preview").innerHTML=`<div style="position:relative;display:inline-block;"><img src="${reader.result}" style="max-height:140px;border-radius:var(--radius-sm);border:1px solid var(--paper-line);"><button type="button" id="remove-image" class="btn btn-icon" style="position:absolute;top:6px;right:6px;background:var(--paper);">✕</button></div>`;
      document.getElementById("remove-image").addEventListener("click",()=>{imageFile=null;imageUrl=null;document.getElementById("image-preview").innerHTML="";document.getElementById("image-input").value="";});
    };
    reader.readAsDataURL(file);
  });
}

function bindActions(){
  document.getElementById("save-btn").addEventListener("click",()=>saveEntry(true));
  document.getElementById("favorite-btn").addEventListener("click",async()=>{
    isFavorite=!isFavorite;
    document.getElementById("favorite-btn").style.color=isFavorite?"var(--brass)":"var(--ink-faint)";
    if(currentEntryId) await saveEntry(false);
  });
  document.getElementById("archive-btn").addEventListener("click",async()=>{
    const ok=await confirmModal({title:"Archive this entry?",message:"You can restore it later from search.",confirmText:"Archive",danger:false});
    if(!ok) return;
    isArchived=true; await saveEntry(false); toast("Entry archived."); window.location.href="dashboard.html";
  });
  document.getElementById("delete-btn").addEventListener("click",async()=>{
    const ok=await confirmModal({title:"Delete this entry?",message:"This can't be undone.",confirmText:"Delete"});
    if(!ok) return;
    const {error}=await supabaseClient.from("diary_entries").delete().eq("id",currentEntryId);
    if(error){toast(error.message,true);return;}
    toast("Entry deleted."); window.location.href="dashboard.html";
  });
}

async function loadEntry(id){
  const {data,error}=await supabaseClient.from("diary_entries").select("*").eq("id",id).single();
  if(error){toast("Couldn't load entry.",true);return;}
  document.getElementById("page-title").textContent="Edit entry";
  document.getElementById("title").value=data.title||"";
  document.getElementById("editor").innerHTML=data.content||"";
  document.getElementById("category").value=data.category||"Personal";
  selectedMood=data.mood; isFavorite=data.favorite; isArchived=data.archived; imageUrl=data.image_url;
  document.querySelectorAll(".mood-opt").forEach(b=>b.classList.toggle("selected",b.dataset.mood===selectedMood));
  document.getElementById("favorite-btn").style.color=isFavorite?"var(--brass)":"var(--ink-faint)";
  document.getElementById("archive-btn").style.display="inline-flex";
  document.getElementById("delete-btn").style.display="inline-flex";
  document.getElementById("draft-status").textContent=`Last updated ${timeAgo(data.updated_at)}`;
  if(imageUrl){
    document.getElementById("image-preview").innerHTML=`<img src="${imageUrl}" style="max-height:140px;border-radius:var(--radius-sm);border:1px solid var(--paper-line);">`;
  }
  const {data:et}=await supabaseClient.from("entry_tags").select("tags(name)").eq("entry_id",id);
  if(et) document.getElementById("tags").value=et.map(t=>t.tags?.name).filter(Boolean).join(", ");
  updateCounts();
}

function updateCounts(){
  const wc=wordCount(document.getElementById("editor").innerHTML);
  document.getElementById("word-count").textContent=wc;
  document.getElementById("read-time").textContent=Math.max(1,Math.round(wc/200))+" min";
}

function scheduleAutosave(){
  document.getElementById("autosave-note").textContent="Saving...";
  clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(()=>saveEntry(false),1800);
}

function collectPayload(){
  return {user_id:currentUser.id,title:document.getElementById("title").value.trim(),content:document.getElementById("editor").innerHTML,category:document.getElementById("category").value,mood:selectedMood,favorite:isFavorite,archived:isArchived,image_url:imageUrl};
}

async function uploadImage(){
  if(!imageFile) return imageUrl;
  const ext=imageFile.name.split(".").pop();
  const path=`${currentUser.id}/${Date.now()}.${ext}`;
  const {error}=await supabaseClient.storage.from("diary-images").upload(path,imageFile);
  if(error){toast("Image upload failed.",true);return imageUrl;}
  imageFile=null;
  return supabaseClient.storage.from("diary-images").getPublicUrl(path).data.publicUrl;
}

async function saveEntry(showToast){
  const title=document.getElementById("title").value.trim();
  const html=document.getElementById("editor").innerHTML;
  if(!title&&wordCount(html)===0){if(showToast)toast("Write something before saving.",true);return;}
  imageUrl=await uploadImage();
  const payload=collectPayload();
  let result;
  if(currentEntryId){
    result=await supabaseClient.from("diary_entries").update(payload).eq("id",currentEntryId).select().single();
  } else {
    result=await supabaseClient.from("diary_entries").insert(payload).select().single();
  }
  if(result.error){document.getElementById("autosave-note").textContent="";if(showToast)toast(result.error.message,true);return;}
  if(!currentEntryId){
    currentEntryId=result.data.id;
    window.history.replaceState({},"",`entry.html?id=${currentEntryId}`);
    document.getElementById("page-title").textContent="Edit entry";
    document.getElementById("archive-btn").style.display="inline-flex";
    document.getElementById("delete-btn").style.display="inline-flex";
  }
  await syncTags(currentEntryId);
  document.getElementById("draft-status").textContent="Last updated just now";
  document.getElementById("autosave-note").textContent="Saved ✓";
  setTimeout(()=>document.getElementById("autosave-note").textContent="",2000);
  if(showToast) toast("Entry saved.");
}

async function syncTags(entryId){
  const names=document.getElementById("tags").value.split(",").map(t=>t.trim()).filter(Boolean);
  await supabaseClient.from("entry_tags").delete().eq("entry_id",entryId);
  for(const name of names){
    let {data:ex}=await supabaseClient.from("tags").select("id").eq("name",name).eq("user_id",currentUser.id).maybeSingle();
    let tagId;
    if(ex){tagId=ex.id;}
    else{const {data:cr,error}=await supabaseClient.from("tags").insert({name,user_id:currentUser.id}).select().single();if(error)continue;tagId=cr.id;}
    await supabaseClient.from("entry_tags").insert({entry_id:entryId,tag_id:tagId});
  }
}
