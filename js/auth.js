/* ============================================================
   Authentication — signup, login, logout, password reset
   ============================================================ */

function setupPasswordToggle(){
  document.querySelectorAll("[data-toggle-pw]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.togglePw);
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "Show" : "Hide";
    });
  });
}

/* ---------- signup ---------- */
function initSignupForm(){
  const form = document.getElementById("signup-form");
  if(!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm-password").value;
    const errorEl = document.getElementById("form-error");
    errorEl.classList.remove("show");

    if(password !== confirm){
      errorEl.textContent = "Passwords don't match.";
      errorEl.classList.add("show");
      return;
    }
    if(password.length < 8){
      errorEl.textContent = "Password must be at least 8 characters.";
      errorEl.classList.add("show");
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    const { error } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: { name } }
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";

    if(error){
      errorEl.textContent = error.message;
      errorEl.classList.add("show");
      return;
    }
    toast("Account created — check your inbox to verify your email.");
    setTimeout(() => window.location.href = "login.html", 1800);
  });
}

/* ---------- login ---------- */
function initLoginForm(){
  const form = document.getElementById("login-form");
  if(!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("form-error");
    errorEl.classList.remove("show");

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = "Sign in";

    if(error){
      errorEl.textContent = error.message;
      errorEl.classList.add("show");
      return;
    }
    window.location.href = "dashboard.html";
  });
}

/* ---------- forgot password ---------- */
function initForgotForm(){
  const form = document.getElementById("forgot-form");
  if(!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password.html"
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Send reset link";

    if(error){ toast(error.message, true); return; }
    toast("Reset link sent — check your inbox.");
  });
}

/* ---------- reset password (landed from email link) ---------- */
function initResetForm(){
  const form = document.getElementById("reset-form");
  if(!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm-password").value;
    const errorEl = document.getElementById("form-error");
    errorEl.classList.remove("show");

    if(password !== confirm){
      errorEl.textContent = "Passwords don't match.";
      errorEl.classList.add("show");
      return;
    }
    const { error } = await supabaseClient.auth.updateUser({ password });
    if(error){ errorEl.textContent = error.message; errorEl.classList.add("show"); return; }
    toast("Password updated — sign in with your new password.");
    setTimeout(() => window.location.href = "login.html", 1800);
  });
}

/* ---------- logout ---------- */
function initLogout(){
  document.querySelectorAll("[data-logout]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  });
}
