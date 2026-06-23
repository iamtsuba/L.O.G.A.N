/**
 * L.O.G.A.N Guard — v4.0
 * À placer en PREMIER dans le <head> de chaque sous-app.
 * Chemin : /L.O.G.A.N/logan-guard.js
 *
 * Comportement :
 *  1. Cherche une session (params URL → localStorage 'sb_session')
 *  2. Si trouvée et valide → injecte window.LOGAN_USER_ID et laisse passer
 *  3. Si absente → affiche un formulaire de connexion email/mot de passe
 *     (identique à celui de L.O.G.A.N). Après connexion réussie → recharge.
 */
(async function loganGuard() {

  const SUPABASE_URL = 'https://tkimdlsokrqdfpkfapgc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraW1kbHNva3JxZGZwa2ZhcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODAwMjIsImV4cCI6MjA5NTk1NjAyMn0.WRHXtuRXkcgqJuUqrfVAHlk6grSJzo13sJ7101yPLl8';
  const LOGAN_URL    = 'https://iamtsuba.github.io/L.O.G.A.N';
  const SESSION_KEY  = 'sb_session';

  // Masquer la page le temps de vérifier la session
  document.documentElement.style.visibility = 'hidden';

  function allow() {
    document.documentElement.style.visibility = '';
  }

  // ── Helper fetch Supabase ──
  async function sbAuth(path, body) {
    const res = await fetch(SUPABASE_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Erreur de connexion');
    return data;
  }

  function saveSession(user, token, refreshToken) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, refreshToken, savedAt: Date.now() }));
    } catch(e) {}
  }

  // ── Expose la session et lance l'app ──
  function applySession(session) {
    window.LOGAN_USER_ID = session.user.id;
    window.LOGAN_TOKEN   = session.token;
    window.LOGAN_USER    = session.user;
    allow();
  }

  // ── Écran de connexion (style L.O.G.A.N) ──
  function showLogin(prefillMsg) {
    document.documentElement.style.visibility = '';
    document.body.innerHTML = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
          background:#1a1a18;display:flex;align-items:center;justify-content:center;
          min-height:100vh;padding:1.5rem;}
        .lg-card{background:#242420;border-radius:18px;padding:2.5rem 2rem;
          max-width:380px;width:100%;text-align:center;
          box-shadow:0 8px 40px rgba(0,0,0,.4);border:.5px solid rgba(255,255,255,.08);}
        .lg-logo{font-size:22px;font-weight:800;color:#f0ede6;letter-spacing:1px;margin-bottom:6px;}
        .lg-logo span{color:#e8563a;}
        .lg-sub{font-size:13px;color:#9b9b8e;margin-bottom:1.75rem;}
        .lg-field{margin-bottom:14px;text-align:left;}
        .lg-field label{display:block;font-size:12px;color:#9b9b8e;margin-bottom:5px;}
        .lg-field input{width:100%;padding:12px 14px;border-radius:9px;
          border:1px solid #3a3a34;background:#1a1a18;color:#f0ede6;font-size:14px;outline:none;}
        .lg-field input:focus{border-color:#e8563a;}
        .lg-btn{width:100%;padding:13px;background:#e8563a;color:#fff;border:none;
          border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s;margin-top:6px;}
        .lg-btn:hover{opacity:.9;}
        .lg-btn:disabled{opacity:.5;cursor:not-allowed;}
        .lg-msg{font-size:13px;margin-top:12px;min-height:18px;}
        .lg-msg.err{color:#ff6b6b;}
        .lg-link{display:block;margin-top:18px;font-size:12px;color:#9b9b8e;text-decoration:none;}
        .lg-link:hover{color:#e8563a;}
        .lg-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);
          border-top-color:#fff;border-radius:50%;animation:lgspin .6s linear infinite;vertical-align:middle;}
        @keyframes lgspin{to{transform:rotate(360deg);}}
      </style>
      <div class="lg-card">
        <div class="lg-logo">L.<span>O</span>.G.<span>A</span>.N</div>
        <div class="lg-sub">Connectez-vous pour accéder à cette application</div>
        <div class="lg-field">
          <label>Email</label>
          <input type="email" id="lg-email" autocomplete="username" placeholder="vous@exemple.com"/>
        </div>
        <div class="lg-field">
          <label>Mot de passe</label>
          <input type="password" id="lg-pwd" autocomplete="current-password" placeholder="••••••••"/>
        </div>
        <button class="lg-btn" id="lg-submit">Se connecter</button>
        <div class="lg-msg" id="lg-msg">${prefillMsg || ''}</div>
        <a class="lg-link" href="${LOGAN_URL}">← Retour au catalogue L.O.G.A.N</a>
      </div>`;

    const emailEl = document.getElementById('lg-email');
    const pwdEl   = document.getElementById('lg-pwd');
    const btnEl   = document.getElementById('lg-submit');
    const msgEl   = document.getElementById('lg-msg');

    async function doLogin() {
      const email = emailEl.value.trim();
      const pwd   = pwdEl.value;
      msgEl.className = 'lg-msg';
      msgEl.textContent = '';
      if (!email || !pwd) { msgEl.className = 'lg-msg err'; msgEl.textContent = 'Veuillez remplir tous les champs.'; return; }
      btnEl.disabled = true;
      btnEl.innerHTML = '<span class="lg-spin"></span>';
      try {
        const data = await sbAuth('/auth/v1/token?grant_type=password', { email, password: pwd });
        const session = { user: data.user, token: data.access_token, refreshToken: data.refresh_token, savedAt: Date.now() };
        saveSession(session.user, session.token, session.refreshToken);
        // Recharger la page : le guard retrouvera la session dans localStorage
        location.reload();
      } catch(e) {
        msgEl.className = 'lg-msg err';
        msgEl.textContent = /invalid/i.test(e.message) ? 'Email ou mot de passe incorrect.' : e.message;
        btnEl.disabled = false;
        btnEl.textContent = 'Se connecter';
      }
    }

    btnEl.addEventListener('click', doLogin);
    [emailEl, pwdEl].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }));
    emailEl.focus();
  }

  // ════════════════════════════════════════════════════
  //  1. Récupérer la session
  // ════════════════════════════════════════════════════
  let session = null;

  // 1a. Params URL (passés par L.O.G.A.N via window.open)
  const params     = new URLSearchParams(window.location.search);
  const urlToken   = params.get('logan_token');
  const urlRefresh = params.get('logan_refresh');
  const urlUser    = params.get('logan_user');

  if (urlToken && urlUser) {
    session = { token: urlToken, refreshToken: urlRefresh || '', user: { id: urlUser }, savedAt: Date.now() };
    saveSession(session.user, session.token, session.refreshToken);
    // Nettoyer l'URL
    try {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('logan_token');
      clean.searchParams.delete('logan_refresh');
      clean.searchParams.delete('logan_user');
      window.history.replaceState({}, '', clean.toString());
    } catch(e) {}
  }

  // 1b. localStorage (session existante, partagée avec L.O.G.A.N)
  if (!session) {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token && parsed.user && parsed.user.id) {
          session = parsed;
        }
      }
    } catch(e) {}
  }

  // ════════════════════════════════════════════════════
  //  2. Aucune session → formulaire de connexion
  // ════════════════════════════════════════════════════
  if (!session) {
    showLogin();
    return;
  }

  // ════════════════════════════════════════════════════
  //  3. Rafraîchir le token si vieux (> 55 min)
  // ════════════════════════════════════════════════════
  const ageMin = session.savedAt ? (Date.now() - session.savedAt) / 60000 : 999;
  if (ageMin > 55 && session.refreshToken) {
    try {
      const data = await sbAuth('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refreshToken });
      if (data.access_token) {
        session = {
          token: data.access_token,
          refreshToken: data.refresh_token || session.refreshToken,
          user: data.user || session.user,
          savedAt: Date.now()
        };
        saveSession(session.user, session.token, session.refreshToken);
      }
    } catch(e) {
      // Refresh échoué → la session est probablement expirée → reconnexion
      try { localStorage.removeItem(SESSION_KEY); } catch(_) {}
      showLogin('Votre session a expiré, veuillez vous reconnecter.');
      return;
    }
  }

  // ════════════════════════════════════════════════════
  //  4. Vérification licence (active) — non bloquant si erreur réseau
  // ════════════════════════════════════════════════════
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/user_apps?user_id=eq.' + session.user.id + '&select=active',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + session.token } }
    );
    const rows = await res.json();
    if (res.ok && Array.isArray(rows) && rows.length > 0 && rows[0].active !== null && rows[0].active !== undefined) {
      if (Number(rows[0].active) === 0) {
        document.documentElement.style.visibility = '';
        document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a18;color:#f0ede6;font-family:system-ui,sans-serif;text-align:center;padding:2rem;">
          <div><div style="font-size:48px;margin-bottom:1rem;">🔒</div>
          <h2 style="margin-bottom:8px;">Licence inactive</h2>
          <p style="color:#9b9b8e;font-size:14px;">Contactez l'administrateur L.O.G.A.N.</p></div></div>`;
        return;
      }
    }
  } catch(e) { /* erreur réseau → on laisse passer */ }

  // ════════════════════════════════════════════════════
  //  5. Tout est OK → exposer la session et afficher l'app
  // ════════════════════════════════════════════════════
  applySession(session);
  // Notifier l'app que le guard est prêt
  if (typeof window.__loganReady === 'function') window.__loganReady();

})();
