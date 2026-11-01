// Gemeinsame Datenschicht: Supabase (live) oder localStorage (Demo-Modus).
(function () {
  const C = window.TP_CONFIG;

  // Demo-Modus für Interessenten: ?demo=1 → Beispieldaten nur im eigenen Browser, ohne Anmeldung, nie die Live-Datenbank.
  // ?film=1 → eigener Datenraum für das Erklärvideo auf der Homepage (stört die Demo der Besucher nicht).
  const params = new URLSearchParams(location.search);
  const film = params.get('film') === '1';
  const NS = film ? 'tpf_' : 'tp_';
  if (params.get('demo') === '1') sessionStorage.setItem('tp_demo', '1');
  const demo = film || sessionStorage.getItem('tp_demo') === '1';
  const live = !demo && !!(C.SUPABASE_URL && C.SUPABASE_KEY && window.supabase);
  const sb = live ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY) : null;
  const listeners = {};

  const lget = t => { try { return JSON.parse(localStorage.getItem(NS + 'data_' + t)) || []; } catch (e) { return []; } };
  const lset = (t, rows) => localStorage.setItem(NS + 'data_' + t, JSON.stringify(rows));
  const emit = t => (listeners[t] || []).forEach(cb => cb());

  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith(NS + 'data_')) emit(e.key.slice(NS.length + 5));
  });

  const store = {
    live,

    async list(table, opts = {}) {
      if (live) {
        let q = sb.from(table).select('*');
        if (opts.ids) q = q.in('id', opts.ids);
        q = table === 'tickets' ? q.order('created_at', { ascending: false }) : q.order('id', { ascending: true });
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data || [];
      }
      let rows = lget(table);
      if (opts.ids) rows = rows.filter(r => opts.ids.includes(r.id));
      return table === 'tickets' ? rows.sort((a, b) => b.id - a.id) : rows.sort((a, b) => a.id - b.id);
    },

    async insert(table, row) {
      if (live) {
        const { data, error } = await sb.from(table).insert([row]).select();
        if (error) throw new Error(error.message);
        return data[0];
      }
      const rows = lget(table);
      const full = Object.assign({ id: rows.reduce((m, r) => Math.max(m, r.id), 0) + 1, created_at: new Date().toISOString() }, row);
      rows.push(full);
      lset(table, rows);
      emit(table);
      return full;
    },

    async update(table, id, patch) {
      if (live) {
        const { error } = await sb.from(table).update(patch).eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      lset(table, lget(table).map(r => r.id === id ? Object.assign({}, r, patch) : r));
      emit(table);
    },

    async remove(table, id) {
      if (live) {
        const { error } = await sb.from(table).delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      lset(table, lget(table).filter(r => r.id !== id));
      emit(table);
    },

    // Kundenportal: nur über Funktionen, kein Tabellenzugriff. token = geheimer Schlüssel pro Anfrage.
    async submitTicket(t) {
      if (live) {
        const { data, error } = await sb.rpc('submit_ticket', {
          p_customer_name: t.customer_name, p_email: t.email, p_phone: t.phone, p_address: t.address,
          p_object_name: t.object_name, p_trade: t.trade, p_complaint: t.complaint, p_urgency: t.urgency
        });
        if (error) throw new Error(error.message);
        return { id: data[0].ticket_id, token: data[0].token };
      }
      const row = await store.insert('tickets', Object.assign({ status: 'Neu' }, t));
      return { id: row.id, token: String(row.id) };
    },

    async myTickets(tokens) {
      if (!tokens.length) return [];
      if (live) {
        const { data, error } = await sb.rpc('my_tickets', { p_tokens: tokens });
        if (error) throw new Error(error.message);
        return data || [];
      }
      return store.list('tickets', { ids: tokens.map(Number) });
    },

    subscribe(table, cb) {
      (listeners[table] = listeners[table] || []).push(cb);
      if (live) {
        sb.channel('tp:' + table + ':' + Math.random().toString(36).slice(2))
          .on('postgres_changes', { event: '*', schema: 'public', table }, cb)
          .subscribe();
      }
    }
  };

  function seedDemo() {
    if (!demo || localStorage.getItem(NS + 'demo_seeded')) return;
    const now = new Date().toISOString();
    const done = { tech: 'Hans Müller', hours: 1.5, rate: 125, diagnosis: 'Bestehende Leitung geprüft, in Ordnung', treatment: 'Zwei Steckdosen gesetzt, Anschluss und Sicherung geprüft',
      materialDesc: '2x Steckdose UP, Kabel', labor: '187.50', mat: '45.00', fee: '0.00', netto: '232.50', vat: '18.83', brutto: '251.33', date: new Date().toLocaleDateString('de-CH') };
    lset('team', [
      { id: 1, created_at: now, name: 'Hans Müller', category: 'Meister', role: 'Meister', rate: 125, phone: '+41 79 111 22 33', status: 'Bereit' },
      { id: 2, created_at: now, name: 'Peter Keller', category: 'Arbeiter', role: 'Arbeiter', rate: 95, phone: '+41 79 222 33 44', status: 'Unterwegs' },
      { id: 3, created_at: now, name: 'Lukas Meier', category: 'Lehrling', role: 'Lehrling', rate: 45, phone: '+41 79 333 44 55', status: 'Bereit' }
    ]);
    lset('customers', [
      { id: 1, created_at: now, name: 'Markus Weber', email: 'markus.weber@example.ch', phone: '+41 79 987 65 43', address: 'Bahnhofstr. 12, 8001 Zürich', objects: 'Einfamilienhaus mit Ölheizung (Baujahr 2004)', notes: 'Stammkunde seit 2023' },
      { id: 2, created_at: now, name: 'Stefan Fischer', email: 'stefan.fischer@example.ch', phone: '+41 78 555 44 33', address: 'Hauptstr. 88, 5400 Baden', objects: 'Mietwohnung 3. OG, Bad und Küche', notes: 'Schlüssel beim Nachbarn hinterlegt' }
    ]);
    const seedTickets = [
      { id: 1, created_at: now, customer_name: 'Markus Weber', email: 'markus.weber@example.ch', phone: '+41 79 987 65 43', address: 'Bahnhofstr. 12, 8001 Zürich', object_name: 'Heizung Keller', trade: 'Heizung', complaint: 'Heizung ausgefallen, Wasser tropft aus dem Kessel', urgency: 'Notfall', status: 'Neu', tech: null, report: null },
      { id: 2, created_at: now, customer_name: 'Stefan Fischer', email: 'stefan.fischer@example.ch', phone: '+41 78 555 44 33', address: 'Hauptstr. 88, 5400 Baden', object_name: 'WC Obergeschoss', trade: 'Sanitär', complaint: 'WC läuft ununterbrochen, Spülkasten defekt', urgency: 'Dringend', status: 'In Bearbeitung', tech: 'Peter Keller', report: null },
      { id: 3, created_at: now, customer_name: 'Lea Frei', email: 'lea.frei@example.ch', phone: '+41 76 123 45 67', address: 'Seestrasse 5, 8700 Küsnacht', object_name: 'Steckdosen Küche', trade: 'Elektro', complaint: 'Zwei zusätzliche Steckdosen in der Küche', urgency: 'Normal', status: 'Abgeschlossen & Verrechnet', tech: 'Hans Müller', report: done }
    ];
    lset('tickets', film ? [seedTickets[2]] : seedTickets);
    localStorage.setItem(NS + 'demo_seeded', '1');
  }
  seedDemo();

  function demoBar() {
    if (!demo || film) return;
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9999;background:#10201e;color:#fff8ef;font:600 12px Inter,system-ui,sans-serif;padding:8px 14px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center;white-space:nowrap;max-width:94vw';
    bar.innerHTML = '<span>🔧 Demo mit Beispieldaten</span><a href="apps.html" style="color:#fbbf24">Alle Apps</a><a href="#" id="tp-demo-reset" style="color:#ff6b57">Zurücksetzen</a><a href="index.html" id="tp-demo-exit" style="color:#fff8ef;opacity:.7">Beenden</a>';
    document.body.appendChild(bar);
    document.getElementById('tp-demo-reset').onclick = e => {
      e.preventDefault();
      ['tickets', 'team', 'customers'].forEach(t => localStorage.removeItem('tp_data_' + t));
      localStorage.removeItem('tp_demo_seeded'); localStorage.removeItem('tp_my_tokens');
      location.reload();
    };
    document.getElementById('tp-demo-exit').onclick = () => sessionStorage.removeItem('tp_demo');
  }
  document.addEventListener('DOMContentLoaded', demoBar);

  // Firmenname und Logo aus branding.js in Titel und Kopfzeile übernehmen
  function applyBrand() {
    const B = window.BRAND; if (!B || !B.short) return;
    document.title = document.title.replace(/CraftFlow/g, B.short);
    const h1 = document.querySelector('header h1');
    if (h1) {
      [...h1.childNodes].forEach(n => { if (n.nodeType === 3) n.textContent = n.textContent.replace(/CraftFlow/g, B.short); });
      if (B.logo) {
        const img = document.createElement('img');
        img.src = B.logo; img.alt = B.short; img.style.cssText = 'height:22px;width:auto;border-radius:4px;display:inline-block;vertical-align:middle;margin-right:6px';
        h1.insertBefore(img, h1.firstChild);
        // Emoji-Symbol durch das Logo ersetzen
        const first = h1.childNodes[1]; if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s*\S{1,2}\s/, ' ');
      }
    }
  }
  document.addEventListener('DOMContentLoaded', applyBrand);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (Math.round(n * 100) / 100).toFixed(2);

  function calcInvoice({ hours = 0, rate = 0, mat = 0, fee = 0 }) {
    const labor = hours * rate;
    const netto = labor + mat + fee;
    const vat = netto * C.VAT_RATE;
    return { labor, mat, fee, netto, vat, brutto: netto + vat };
  }

  // Anmeldung: live = Supabase Auth (E-Mail + Passwort, Rolle aus Tabelle staff); Demo = Passwort aus config.js
  const auth = {
    live, demo,
    async role() {
      if (demo) return 'praxis';
      if (!live) return sessionStorage.getItem('tp_demo_role');
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      const r = await sb.rpc('my_role');
      return r.error ? null : r.data;
    },
    async login(email, pw, allowed) {
      if (!live) {
        const role = pw === C.PASSWORDS.praxis ? 'praxis' : (pw === C.PASSWORDS.team ? 'team' : null);
        if (!role || !allowed.includes(role)) return { ok: false, error: 'Falsches Passwort!' };
        sessionStorage.setItem('tp_demo_role', role);
        return { ok: true, role };
      }
      const { error } = await sb.auth.signInWithPassword({ email: (email || '').trim(), password: pw });
      if (error) return { ok: false, error: 'E-Mail oder Passwort falsch.' };
      const role = await auth.role();
      if (!role || !allowed.includes(role)) {
        await sb.auth.signOut();
        return { ok: false, error: 'Dieses Konto hat keinen Zugriff auf diesen Bereich.' };
      }
      return { ok: true, role };
    },
    async resume(allowed) {
      const role = await auth.role();
      return !!role && allowed.includes(role);
    },
    // Dialog "Passwort ändern" für angemeldete Benutzer (nur im Live-Betrieb)
    // mode 'team': nur die Meister-Zentrale setzt das gemeinsame Monteur-Passwort (ohne Abfrage des alten)
    async changePassword(mode) {
      if (!live) { alert('Im Demo-Modus kann das Passwort nicht geändert werden.'); return; }
      const team = mode === 'team';
      const { data } = await sb.auth.getSession();
      const email = data.session && data.session.user.email;
      if (!email || document.getElementById('tp-pw-modal')) return;
      const box = document.createElement('div');
      box.id = 'tp-pw-modal';
      box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
      const f = 'width:100%;padding:10px 12px;margin-top:4px;border-radius:10px;border:1px solid #334155;background:#020617;color:#f1f5f9;font-size:14px;box-sizing:border-box';
      const l = 'display:block;margin-top:12px;font-size:12px;color:#94a3b8';
      box.innerHTML = '<div style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:20px;width:100%;max-width:360px;color:#f1f5f9;font-family:inherit">'
        + '<div style="font-weight:700;font-size:16px">' + (team ? '🔑 Monteur-Passwort setzen' : '🔑 Passwort ändern') + '</div>'
        + '<div id="tp-pw-user" style="font-size:12px;color:#94a3b8;margin-top:2px"></div>'
        + (team ? '' : '<label style="' + l + '">Aktuelles Passwort<input id="tp-pw-old" type="password" autocomplete="current-password" style="' + f + '"></label>')
        + '<label style="' + l + '">Neues Passwort (mind. 8 Zeichen)<input id="tp-pw-new" type="password" autocomplete="new-password" style="' + f + '"></label>'
        + '<label style="' + l + '">Neues Passwort wiederholen<input id="tp-pw-new2" type="password" autocomplete="new-password" style="' + f + '"></label>'
        + '<div id="tp-pw-msg" style="margin-top:12px;font-size:12px;min-height:16px"></div>'
        + '<div style="display:flex;gap:8px;margin-top:8px"><button id="tp-pw-cancel" style="flex:1;padding:10px;border-radius:10px;border:1px solid #334155;background:transparent;color:#cbd5e1;cursor:pointer">Abbrechen</button>'
        + '<button id="tp-pw-save" style="flex:1;padding:10px;border-radius:10px;border:0;background:#f59e0b;color:#0f172a;font-weight:700;cursor:pointer">Speichern</button></div></div>';
      document.body.appendChild(box);
      const $ = id => box.querySelector('#' + id);
      $('tp-pw-user').textContent = team ? 'Gilt für alle Monteure (gemeinsamer Team-Login)' : email;
      const say = (t, ok) => { $('tp-pw-msg').textContent = t; $('tp-pw-msg').style.color = ok ? '#34d399' : '#f87171'; };
      $('tp-pw-cancel').onclick = () => box.remove();
      $('tp-pw-save').onclick = async () => {
        const oldPw = team ? '' : $('tp-pw-old').value, n1 = $('tp-pw-new').value, n2 = $('tp-pw-new2').value;
        if (n1.length < 8) return say('Das neue Passwort braucht mindestens 8 Zeichen.');
        if (n1 !== n2) return say('Die neuen Passwörter stimmen nicht überein.');
        if (!team && n1 === oldPw) return say('Das neue Passwort muss anders sein.');
        $('tp-pw-save').disabled = true;
        let err;
        if (team) err = (await sb.rpc('set_team_password', { p_password: n1 })).error;
        else {
          const chk = await sb.auth.signInWithPassword({ email, password: oldPw });
          if (chk.error) { $('tp-pw-save').disabled = false; return say('Das aktuelle Passwort ist falsch.'); }
          err = (await sb.auth.updateUser({ password: n1 })).error;
        }
        if (err) { $('tp-pw-save').disabled = false; return say('Fehler: ' + err.message); }
        say('Passwort geändert.', true);
        setTimeout(() => box.remove(), 1200);
      };
      $(team ? 'tp-pw-new' : 'tp-pw-old').focus();
    },
    async logout() {
      sessionStorage.removeItem('tp_demo_role');
      if (demo) { sessionStorage.removeItem('tp_demo'); location.href = 'index.html'; return; }
      if (live) await sb.auth.signOut();
      location.reload();
    }
  };

  window.TP = { store, auth, esc, money, calcInvoice, C, ns: NS, film };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  // Knopf "Als App installieren" (PC, Android): erscheint nur, wenn der Browser die Installation dieser App anbietet
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    const b = document.createElement('button');
    b.textContent = '📲 Als App installieren';
    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9998;padding:10px 14px;border-radius:999px;border:0;background:#f59e0b;color:#0f172a;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4)';
    b.onclick = () => { e.prompt(); e.userChoice.finally(() => b.remove()); };
    document.body.appendChild(b);
  });
})();
