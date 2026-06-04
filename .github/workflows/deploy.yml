/**
 * L.O.G.A.N Guard — v2.1 (debug visuel)
 */
(async function loganGuard() {

  const SUPABASE_URL = 'https://tkimdlsokrqdfpkfapgc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraW1kbHNva3JxZGZwa2ZhcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODAwMjIsImV4cCI6MjA5NTk1NjAyMn0.WRHXtuRXkcgqJuUqrfVAHlk6grSJzo13sJ7101yPLl8';
  const LOGAN_URL    = 'https://iamtsuba.github.io/L.O.G.A.N';
  const SESSION_KEY  = 'sb_session';
  const DEBUG        = true; // ← mettre false une fois que tout marche

  document.documentElement.style.visibility = 'hidden';

  const steps = [];
  function log(icon, msg) {
    steps.push(icon + ' ' + msg);
    console.log('[LOGAN Guard]', icon, msg);
  }

  function showDebug(title, color) {
    document.documentElement.style.visibility = '';
    document.body.innerHTML = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,sans-serif;background:#f7f6f3;padding:1.5rem;min-height:100vh}
        h2{font-size:18px;margin-bottom:1rem;color:${color}}
        .step{background:#fff;border:.5px solid #e0e0dc;border-radius:10px;
          padding:10px 14px;margin-bottom:8px;font-size:13px;line-height:1.5;
          word-break:break-all;color:#1a1a18}
        .back{display:inline-block;margin-top:1rem;padding:10px 20px;
          background:#1a1a18;color:#fff;border-radius:8px;text-decoration:none;font-size:14px}
      </style>
      <h2>${title}</h2>
      ${steps.map(s => `<div class="step">${s}</div>`).join('')}
      <a class="back" href="${LOGAN_URL}">← Retour à L.O.G.A.N</a>
    `;
  }

  function allow() {
    document.documentElement.style.visibility = '';
    log('✅', 'Accès autorisé');
  }

  function redirect(reason) {
    log('🚫', 'Blocage : ' + reason);
    if (DEBUG) {
      showDebug('🔍 Debug L.O.G.A.N Guard', '#c0392b');
    } else {
      window.location.replace(LOGAN_URL + '?return=' + encodeURIComponent(window.location.href));
    }
  }

  function showLicenseError() {
    log('🔒', 'Licence inactive');
    document.documentElement.style.visibility = '';
    document.body.innerHTML = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,sans-serif;background:#f7f6f3;display:flex;
          align-items:center;justify-content:center;min-height:100vh;padding:2rem}
        .card{background:#fff;border-radius:16px;padding:2.5rem 2rem;max-width:380px;
          width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
        .icon{font-size:40px;margin-bottom:1rem}
        h2{font-size:20px;margin-bottom:8px;color:#1a1a18}
        p{font-size:14px;color:#6b6b66;margin-bottom:1.5rem;line-height:1.6}
        a{display:inline-block;padding:10px 24px;background:#1a1a18;color:#fff;
          border-radius:8px;text-decoration:none;font-size:14px;font-weight:500}
      </style>
      <div class="card">
        <div class="icon">🔒</div>
        <h2>Accès suspendu</h2>
        <p>Votre licence L.O.G.A.N n'est plus valide.<br>Contactez l'administrateur.</p>
        <a href="${LOGAN_URL}">Retour à L.O.G.A.N</a>
      </div>`;
  }

  // ── 1. Session depuis l'URL ──────────────────────────────────────────────
  let session = null;
  const params     = new URLSearchParams(window.location.search);
  const urlToken   = params.get('logan_token');
  const urlRefresh = params.get('logan_refresh');
  const urlUser    = params.get('logan_user');

  if (urlToken && urlUser) {
    log('🔗', 'Token trouvé dans l\'URL (user: ' + urlUser.substring(0,8) + '...)');
    session = { token: urlToken, refreshToken: urlRefresh || '', user: { id: urlUser }, savedAt: Date.now() };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      log('💾', 'Session sauvegardée dans localStorage');
    } catch(e) {
      log('⚠️', 'localStorage indisponible : ' + e.message);
    }
    try {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('logan_token');
      clean.searchParams.delete('logan_refresh');
      clean.searchParams.delete('logan_user');
      window.history.replaceState({}, '', clean.toString());
    } catch(e) {}
  }

  // ── 2. Session depuis localStorage ──────────────────────────────────────
  if (!session) {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        session = JSON.parse(raw);
        log('📦', 'Session trouvée dans localStorage (user: ' + (session?.user?.id || '?').substring(0,8) + '...)');
      } else {
        log('❌', 'localStorage vide — aucune session');
      }
    } catch(e) {
      log('❌', 'Erreur lecture localStorage : ' + e.message);
    }
  }

  if (!session || !session.token || !session.user || !session.user.id) {
    redirect('aucune session valide'); return;
  }

  // ── 3. Refresh si token ancien ───────────────────────────────────────────
  const ageMin = (Date.now() - (session.savedAt || 0)) / 60000;
  log('⏱️', 'Age du token : ' + Math.round(ageMin) + ' min');

  if (ageMin > 55 && session.refreshToken) {
    log('🔄', 'Rafraîchissement du token...');
    try {
      const res  = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ refresh_token: session.refreshToken })
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) throw new Error(JSON.stringify(data));
      session = { token: data.access_token, refreshToken: data.refresh_token, user: data.user, savedAt: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      log('✅', 'Token rafraîchi');
    } catch(e) {
      log('❌', 'Refresh échoué : ' + e.message);
      redirect('token expiré'); return;
    }
  }

  // ── 4. Vérification licence Supabase ────────────────────────────────────
  log('🔍', 'Vérification licence user_id=' + session.user.id.substring(0,8) + '...');
  try {
    const res  = await fetch(
      SUPABASE_URL + '/rest/v1/user_apps?user_id=eq.' + session.user.id + '&select=active',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + session.token } }
    );
    const rows = await res.json();
    log('📋', 'Réponse Supabase : ' + JSON.stringify(rows));

    if (!res.ok) {
      log('⚠️', 'Erreur Supabase HTTP ' + res.status + ' — accès accordé par défaut');
    } else if (rows && rows.length > 0 && rows[0].active !== null && rows[0].active !== undefined) {
      if (Number(rows[0].active) === 0) {
        showLicenseError(); return;
      }
      log('✅', 'Licence active = ' + rows[0].active);
    } else {
      log('ℹ️', 'Aucune ligne user_apps — accès accordé par défaut');
    }
  } catch(e) {
    log('⚠️', 'Erreur réseau licence : ' + e.message + ' — accès accordé');
  }

  // ── 5. Exposer les variables LOGAN ───────────────────────────────────────
  window.LOGAN_USER_ID = session.user.id;
  window.LOGAN_TOKEN   = session.token;
  window.LOGAN_USER    = session.user;

  allow();

  // En mode debug, afficher un bandeau discret en bas
  if (DEBUG) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1a1a18;color:#f7cc00;' +
      'font-size:11px;padding:6px 12px;z-index:99999;font-family:monospace;';
    bar.textContent = '🛡 LOGAN Guard OK — user: ' + session.user.id.substring(0,8) + '...';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(bar));
  }

})();
