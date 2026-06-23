let profileUser=null;
(async function(){
  profileUser=await renderShell(null); if(!profileUser) return;
  const {data:profile}=await supabaseClient.from("profiles").select("*").eq("id",profileUser.id).single();
  document.getElementById("name").value=profile?.name||profileUser.user_metadata?.name||"";
  document.getElementById("email").value=profileUser.email;
  document.getElementById("bio").value=profile?.bio||"";
  document.getElementById("profile-form").addEventListener("submit",saveProfile);
  document.getElementById("password-form").addEventListener("submit",changePassword);
  document.getElementById("export-btn").addEventListener("click",exportJournal);
  document.getElementById("delete-account-btn").addEventListener("click",deleteAccount);
  initTheme();
})();

async function saveProfile(e){
  e.preventDefault();
  const name=document.getElementById("name").value.trim();
  const bio=document.getElementById("bio").value.trim();
  const {error:a}=await supabaseClient.auth.updateUser({data:{name}});
  const {error:p}=await supabaseClient.from("profiles").upsert({id:profileUser.id,name,email:profileUser.email,bio});
  if(a||p){toast((a||p).message,true);return;}
  toast("Profile updated.");
}

async function changePassword(e){
  e.preventDefault();
  const password=document.getElementById("new-password").value;
  if(password.length<8){toast("Password must be at least 8 characters.",true);return;}
  const {error}=await supabaseClient.auth.updateUser({password});
  if(error){toast(error.message,true);return;}
  document.getElementById("new-password").value="";
  toast("Password updated.");
}

async function exportJournal(){
  const {data:entries,error}=await supabaseClient.from("diary_entries").select("*").order("created_at",{ascending:true});
  if(error){toast(error.message,true);return;}
  if(entries.length===0){toast("No entries to export yet.",true);return;}
  const text=entries.map(e=>[`Title: ${e.title||"Untitled"}`,`Date: ${formatDateLong(e.created_at)}`,`Category: ${e.category||"Personal"}`,`Mood: ${e.mood?moodLabel(e.mood):"—"}`,"",stripHtml(e.content||""),"","—".repeat(40),""].join("\n")).join("\n");
  const blob=new Blob([text],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="inkwell-journal.txt"; a.click();
  URL.revokeObjectURL(url); toast("Journal exported.");
}

async function deleteAccount(){
  const ok=await confirmModal({title:"Delete your account?",message:"Permanently deletes all entries, tags, and your profile. Can't be undone.",confirmText:"Delete everything"});
  if(!ok) return;
  await supabaseClient.from("diary_entries").delete().eq("user_id",profileUser.id);
  await supabaseClient.from("tags").delete().eq("user_id",profileUser.id);
  await supabaseClient.from("profiles").delete().eq("id",profileUser.id);
  await supabaseClient.auth.signOut();
  toast("Account deleted.");
  setTimeout(()=>window.location.href="index.html",1500);
}
