/**
 * L.O.G.A.N Guard — v1.0
 * À inclure dans CHAQUE page HTML de tes apps.
 * Place ce script le plus tôt possible dans le <head>, AVANT tout autre contenu.
 *
 * Usage :
 *   <script src="logan-guard.js"></script>
 * ou en inline (copie le contenu directement dans un <script> tag).
 */

(async function loganGuard() {
  const SUPABASE_URL = 'https://tkimdlsokrqdfpkfapgc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraW1kbHNva3JxZGZwa2ZhcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODAwMjIsImV4cCI6MjA5NTk1NjAyMn0.WRHXtuRXkcgqJuUqrfVAHlk6grSJzo13sJ7101yPLl8';
  const LOGAN_URL    = 'https://iamtsuba.github.io/L.O.G.A.N';
  const SESSION_KEY  = 'sb_session';

  // ── Masquer le contenu pendant la vérification ──────────────────────────
  document.documentElement.style.visibility = 'hidden';

  function redirect() {
    // Redirige vers LOGAN avec l'URL actuelle en paramètre de retour
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.replace(LOGAN_URL + '?return=' + returnUrl);
  }

  function allow() {
    document.documentElement.style.visibility = '';
  }

  async function refreshToken(refreshToken) {
    const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) throw new Error('expired');
    return res.json();
  }

  async function checkActive(userId, token) {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/user_apps?user_id=eq.' + userId + '&select=active',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + token } }
    );
    const rows = await res.json();
    if (!rows || rows.length === 0) return true; // pas encore de ligne = actif par défaut
    return Number(rows[0].active) !== 0;
  }

  function showLicenseError() {
    document.documentElement.style.visibility = '';
    document.body.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: system-ui, sans-serif;
          background: #f7f6f3;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; padding: 2rem;
        }
        .card {
          background: #fff; border-radius: 16px; padding: 2.5rem 2rem;
          max-width: 380px; width: 100%; text-align: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          border: 0.5px solid rgba(0,0,0,0.1);
        }
        .icon {
          width: 56px; height: 56px; border-radius: 12px;
          background: #fdf0ef; display: flex; align-items: center;
          justify-content: center; margin: 0 auto 1.25rem; font-size: 28px;
        }
        h2 { font-size: 20px; margin-bottom: 8px; color: #1a1a18; }
        p  { font-size: 14px; color: #6b6b66; margin-bottom: 1.5rem; line-height: 1.6; }
        a  {
          display: inline-block; padding: 10px 24px;
          background: #1a1a18; color: #fff; border-radius: 8px;
          text-decoration: none; font-size: 14px; font-weight: 500;
        }
        a:hover { opacity: 0.85; }
      </style>
      <div class="card">
        <div class="icon">🔒</div>
        <h2>Accès suspendu</h2>
        <p>Votre licence n'est plus valide.<br>Contactez l'administrateur L.O.G.A.N.</p>
        <a href="${LOGAN_URL}">Retour à L.O.G.A.N</a>
      </div>
    `;
  }

  try {
    let session = null;

    // 1. Chercher le token dans localStorage (même domaine GitHub Pages)
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try { session = JSON.parse(raw); } catch(e) {}
    }

    // 2. Sinon chercher dans l'URL (?logan_token=...)
    if (!session) {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('logan_token');
      const r = params.get('logan_refresh');
      const u = params.get('logan_user');
      if (t && u) {
        session = { token: t, refreshToken: r, user: { id: u }, savedAt: Date.now() };
        // Sauvegarder pour les prochaines visites
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        // Nettoyer l'URL
        const clean = new URL(window.location.href);
        clean.searchParams.delete('logan_token');
        clean.searchParams.delete('logan_refresh');
        clean.searchParams.delete('logan_user');
        window.history.replaceState({}, '', clean.toString());
      }
    }

    if (!session || !session.token || !session.user) {
      redirect(); return;
    }

    // 3. Rafraîchir le token si expiré (> 55 min)
    const ageSeconds = (Date.now() - (session.savedAt || 0)) / 1000;
    if (ageSeconds > 3300 && session.refreshToken) {
      try {
        const data = await refreshToken(session.refreshToken);
        session = { token: data.access_token, refreshToken: data.refresh_token, user: data.user, savedAt: Date.now() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch(e) {
        redirect(); return;
      }
    }

    // 4. Vérifier la licence (active)
    const active = await checkActive(session.user.id, session.token);
    if (!active) {
      showLicenseError(); return;
    }

    // 5. Tout est bon — exposer l'ID utilisateur et afficher la page
    window.LOGAN_USER_ID  = session.user.id;
    window.LOGAN_TOKEN    = session.token;
    window.LOGAN_USER     = session.user;
    allow();

  } catch(e) {
    console.warn('[LOGAN Guard] Erreur :', e);
    redirect();
  }

})();
