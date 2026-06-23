/**
 * L.O.G.A.N Guard — v3.1
 * À placer en PREMIER dans le <head> de chaque app HTML.
 * Chemin : https://iamtsuba.github.io/L.O.G.A.N/logan-guard.js
 */
(async function loganGuard() {

  const SUPABASE_URL = 'https://tkimdlsokrqdfpkfapgc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraW1kbHNva3JxZGZwa2ZhcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODAwMjIsImV4cCI6MjA5NTk1NjAyMn0.WRHXtuRXkcgqJuUqrfVAHlk6grSJzo13sJ7101yPLl8';
  const LOGAN_URL    = 'https://iamtsuba.github.io/L.O.G.A.N';
  const SESSION_KEY  = 'sb_session';

  document.documentElement.style.visibility = 'hidden';

  function allow() {
    document.documentElement.style.visibility = '';
  }

  function showBlocked(message) {
    document.documentElement.style.visibility = '';
    document.body.innerHTML = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
          background:#1a1a18;display:flex;align-items:center;justify-content:center;
          min-height:100vh;padding:1.5rem;}
        .logan-block-card{background:#242420;border-radius:18px;padding:2.5rem 2rem;
          max-width:400px;width:100%;text-align:center;
          box-shadow:0 8px 40px rgba(0,0,0,.4);border:.5px solid rgba(255,255,255,.08);}
        .logan-block-icon{font-size:48px;margin-bottom:1.25rem;}
        .logan-block-card h2{font-size:20px;color:#f0ede6;margin-bottom:10px;
          font-weight:700;line-height:1.3;}
        .logan-block-card p{font-size:13px;color:#9b9b8e;margin-bottom:1.75rem;
          line-height:1.6;}
        .logan-block-card a{display:inline-block;padding:12px 28px;
          background:#e8563a;color:#fff;border-radius:9px;text-decoration:none;
          font-size:14px;font-weight:600;transition:opacity .15s;}
        .logan-block-card a:hover{opacity:.85;}
      </style>
      <div class="logan-block-card">
        <div class="logan-block-icon">🔒</div>
        <h2>Accès impossible<br>sans authentification sur<br><span style="color:#e8563a">L.O.G.A.N.</span></h2>
        <p>${message}</p>
        <a href="${LOGAN_URL}">Accéder à L.O.G.A.N →</a>
      </div>`;
  }

  // ── 1. Récupérer la session (URL params en priorité, sinon localStorage) ──
  let session = null;
  const params     = new URLSearchParams(window.location.search);
  const urlToken   = params.get('logan_token');
  const urlRefresh = params.get('logan_refresh');
  const urlUser    = params.get('logan_user');

  if (urlToken && urlUser) {
    session = { token: urlToken, refreshToken: urlRefresh || '', user: { id: urlUser }, savedAt: Date.now() };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch(e) {}
    try {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('logan_token');
      clean.searchParams.delete('logan_refresh');
      clean.searchParams.delete('logan_user');
      window.history.replaceState({}, '', clean.toString());
    } catch(e) {}
  }

  if (!session) {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) session = JSON.parse(raw);
    } catch(e) {}
  }

  // Aucune session → bloqué
  if (!session || !session.token || !session.user || !session.user.id) {
    showBlocked("Vous devez d'abord vous connecter à votre tableau de bord L.O.G.A.N pour accéder à cette application.");
    return;
  }

  // ── 2. Rafraîchir le token si nécessaire ────────────────────────────────
  // savedAt absent ou invalide → on tente le refresh immédiatement
  const ageMin = session.savedAt ? (Date.now() - session.savedAt) / 60000 : 999;
  if (ageMin > 55 && session.refreshToken) {
    try {
      const res  = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ refresh_token: session.refreshToken })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        session = { token: data.access_token, refreshToken: data.refresh_token || session.refreshToken, user: data.user || session.user, savedAt: Date.now() };
        try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch(e) {}
      } else {
        // Refresh échoué mais on a quand même un token — on tente de continuer
        // (le token original est peut-être encore valide < 1h)
        session.savedAt = Date.now();
        try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch(e) {}
      }
    } catch(e) {
      // Erreur réseau → on laisse passer avec le token existant
    }
  }

  // ── 3. Vérification de la licence (active) ────────────────────────────────
  try {
    const res  = await fetch(
      SUPABASE_URL + '/rest/v1/user_apps?user_id=eq.' + session.user.id + '&select=active',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + session.token } }
    );
    const rows = await res.json();
    if (res.ok && rows && rows.length > 0 && rows[0].active !== null && rows[0].active !== undefined) {
      if (Number(rows[0].active) === 0) {
        showBlocked("Votre licence n'est plus valide. Veuillez contacter l'administrateur L.O.G.A.N.");
        return;
      }
    }
  } catch(e) {
    // Erreur réseau : on laisse passer
  }

  // ── 4. Exposer les variables LOGAN et afficher la page ───────────────────
  window.LOGAN_USER_ID = session.user.id;
  window.LOGAN_TOKEN   = session.token;
  window.LOGAN_USER    = session.user;
  allow();

})();
