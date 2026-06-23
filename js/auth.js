/* auth.js — signup, login, logout, password reset */

function initSignupForm(){
  const form=document.getElementById("signup-form");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const name=document.getElementById("name").value.trim();
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const confirm=document.getElementById("confirm-password").value;
    const errorEl=document.getElementById("form-error");
    errorEl.classList.remove("show");
    if(password!==confirm){ errorEl.textContent="Passwords don't match."; errorEl.classList.add("show"); return; }
    if(password.length<8){ errorEl.textContent="Password must be at least 8 characters."; errorEl.classList.add("show"); return; }
    const btn=form.querySelector("button[type=submit]");
    btn.disabled=true; btn.textContent="Creating account...";
    const {error}=await supabaseClient.auth.signUp({email,password,options:{data:{name}}});
    btn.disabled=false; btn.textContent="Create account";
    if(error){ errorEl.textContent=error.message; errorEl.classList.add("show"); return; }
    toast("Account created! Check your inbox to verify your email.");
    setTimeout(()=>window.location.href="login.html",2000);
  });
}

function initLoginForm(){
  const form=document.getElementById("login-form");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const errorEl=document.getElementById("form-error");
    errorEl.classList.remove("show");
    const btn=form.querySelector("button[type=submit]");
    btn.disabled=true; btn.textContent="Signing in...";
    const {error}=await supabaseClient.auth.signInWithPassword({email,password});
    btn.disabled=false; btn.textContent="Sign in";
    if(error){ errorEl.textContent=error.message; errorEl.classList.add("show"); return; }
    window.location.href="dashboard.html";
  });
}

function initForgotForm(){
  const form=document.getElementById("forgot-form");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const email=document.getElementById("email").value.trim();
    const btn=form.querySelector("button[type=submit]");
    btn.disabled=true; btn.textContent="Sending...";
    const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/reset-password.html"});
    btn.disabled=false; btn.textContent="Send reset link";
    if(error){ toast(error.message,true); return; }
    toast("Reset link sent — check your inbox.");
  });
}

function initResetForm(){
  const form=document.getElementById("reset-form");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const password=document.getElementById("password").value;
    const confirm=document.getElementById("confirm-password").value;
    const errorEl=document.getElementById("form-error");
    errorEl.classList.remove("show");
    if(password!==confirm){ errorEl.textContent="Passwords don't match."; errorEl.classList.add("show"); return; }
    const {error}=await supabaseClient.auth.updateUser({password});
    if(error){ errorEl.textContent=error.message; errorEl.classList.add("show"); return; }
    toast("Password updated — sign in with your new password.");
    setTimeout(()=>window.location.href="login.html",1800);
  });
}

function initLogout(){
  document.querySelectorAll("[data-logout]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      await supabaseClient.auth.signOut();
      window.location.href="login.html";
    });
  });
}
