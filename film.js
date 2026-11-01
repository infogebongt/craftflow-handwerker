// Erklärfilm: spielt den Ablauf in den echten Apps (Demo-Daten, getrennter Datenraum ?film=1) automatisch ab.
(function () {
  const $ = id => document.getElementById(id);
  const stage = $('film-stage');
  if (!stage) return;

  const F = { portal: $('film-portal'), tech: $('film-tech'), dash: $('film-dash') };
  const cap = $('film-caption'), pills = [...document.querySelectorAll('#film-steps [data-step]')];
  const btnPlay = $('film-play'), btnReplay = $('film-replay'), bar = $('film-bar'), end = $('film-end');
  const URLS = { portal: 'kunden_app.html', tech: 'monteur_app.html', dash: 'meister_dashboard.html' };
  const STEPS = [
    '1 · Der Kunde meldet den Notfall, rund um die Uhr, ohne Anruf.',
    '2 · Die Meister-Zentrale zeigt ihn sofort. Der Meister teilt den Arbeiter zu.',
    '3 · Der Arbeiter sieht den Auftrag auf dem Handy und dokumentiert den Einsatz.',
    '4 · Die Rechnung mit MwSt. entsteht automatisch.',
    '5 · Der Kunde sieht live: erledigt und verrechnet.'
  ];

  let runId = 0, paused = false, started = false;
  const cancelled = id => id !== runId;
  const sleep = (ms, id) => new Promise((res, rej) => {
    let t = 0;
    (function tick() {
      if (cancelled(id)) return rej('cancel');
      if (paused) return setTimeout(tick, 100);
      t += 50; if (t >= ms) return res();
      setTimeout(tick, 50);
    })();
  });

  // Größe an den Container anpassen (Bühne ist 1000 x 560)
  function fit() {
    const w = stage.parentElement.clientWidth, s = Math.min(1, w / 1000);
    stage.style.transform = 'scale(' + s + ')';
    stage.parentElement.style.height = (560 * s) + 'px';
  }
  new ResizeObserver(fit).observe(stage.parentElement); fit();

  function setStep(i) {
    cap.textContent = STEPS[i];
    bar.style.width = (i / STEPS.length * 100) + '%';
    pills.forEach((p, k) => p.className = 'h-1.5 flex-1 rounded-full transition-colors ' + (k < i ? 'bg-amber-500' : k === i ? 'bg-amber-400 animate-pulse' : 'bg-white/20'));
  }

  function loadFrame(name, id) {
    return new Promise(res => {
      const f = F[name];
      f.onload = () => { try { f.contentWindow.alert = () => {}; } catch (e) {} setTimeout(res, name === 'dash' ? 1600 : 900); };
      f.src = URLS[name] + '?film=1&r=' + Date.now();
    });
  }

  async function setVal(win, id, text, speed, rid) {
    const el = win.document.getElementById(id);
    el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(250, rid);
    el.value = '';
    for (const ch of text) { el.value += ch; el.dispatchEvent(new win.Event('input', { bubbles: true })); await sleep(speed, rid); }
  }
  async function pick(win, id, value, rid) {
    const el = win.document.getElementById(id);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(350, rid);
    el.value = value; el.dispatchEvent(new win.Event('change', { bubbles: true }));
    await sleep(350, rid);
  }
  async function hl(el, ms, rid) {
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const old = el.style.boxShadow, tr = el.style.transition;
    el.style.transition = 'box-shadow .25s';
    el.style.boxShadow = '0 0 0 3px #f59e0b, 0 0 26px 4px rgba(245,158,11,.55)';
    try { await sleep(ms, rid); } finally { el.style.boxShadow = old; el.style.transition = tr; }
  }
  function phone(which) {
    F.portal.style.opacity = which === 'portal' ? 1 : 0; F.portal.style.pointerEvents = which === 'portal' ? 'auto' : 'none';
    F.tech.style.opacity = which === 'tech' ? 1 : 0; F.tech.style.pointerEvents = which === 'tech' ? 'auto' : 'none';
  }

  async function run() {
    const rid = ++runId; paused = false; setPlayIcon();
    end.classList.add('hidden'); setStep(0); bar.style.width = '0%';
    Object.keys(localStorage).filter(k => k.startsWith('tpf_')).forEach(k => localStorage.removeItem(k));
    try {
      await Promise.all([loadFrame('portal', rid), loadFrame('tech', rid), loadFrame('dash', rid)]);
      phone('portal');
      const P = F.portal.contentWindow, D = F.dash.contentWindow, T = F.tech.contentWindow;
      await sleep(600, rid);

      // 1 Kunde meldet
      setStep(0);
      await setVal(P, 'cust-name', 'Markus Weber', 28, rid);
      await setVal(P, 'cust-email', 'markus.weber@example.ch', 14, rid);
      await setVal(P, 'cust-phone', '+41 79 987 65 43', 22, rid);
      await setVal(P, 'cust-address', 'Bahnhofstr. 12, 8001 Zürich', 16, rid);
      await setVal(P, 'obj-name', 'Heizung Keller', 28, rid);
      await pick(P, 'pet-trade', 'Heizung', rid);
      await pick(P, 'urgency', 'Notfall', rid);
      await setVal(P, 'complaint', 'Heizung ausgefallen, Wasser tropft aus dem Kessel', 20, rid);
      await hl(P.document.querySelector('button[onclick="sendRequest()"]'), 900, rid);
      await P.sendRequest();
      await sleep(700, rid);
      P.document.getElementById('my-list').scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(1400, rid);

      // 2 Zentrale
      setStep(1);
      await D.load();
      await sleep(500, rid);
      await hl(D.document.querySelector('#content .border-l-4'), 1800, rid);
      const sel = D.document.querySelector('#content select');
      await hl(sel, 700, rid);
      sel.value = 'Peter Keller'; sel.dispatchEvent(new D.Event('change', { bubbles: true }));
      await sleep(900, rid);
      await D.load();
      await hl(D.document.querySelector('#content .border-l-4'), 1500, rid);

      // 3 Arbeiter
      setStep(2);
      phone('tech');
      await T.load();
      const me = T.document.getElementById('me'); me.value = 'Peter Keller'; T.selectMe();
      await sleep(900, rid);
      await hl(T.document.querySelector('#list > div'), 2000, rid);
      const job = T.eval('tickets').find(t => t.tech === 'Peter Keller' && t.status !== 'Abgeschlossen & Verrechnet');
      T.openModal(job.id);
      await sleep(700, rid);
      await pick(T, 'rap-hours', '1.5', rid);
      await setVal(T, 'rap-diagnosis', 'Druckventil am Kessel defekt', 20, rid);
      await setVal(T, 'rap-treatment', 'Ventil ersetzt, Anlage entlüftet, Druck geprüft', 16, rid);
      await setVal(T, 'rap-material', '1x Druckventil, Dichtungen', 20, rid);
      await setVal(T, 'rap-mat-cost', '85', 90, rid);
      await setVal(T, 'rap-fee', '30', 90, rid);
      await hl(T.document.querySelector('button[onclick="submitReport()"]'), 1000, rid);
      await T.submitReport();
      await sleep(1200, rid);

      // 4 Rechnung
      setStep(3);
      await D.load();
      D.switchTab('invoices');
      await sleep(700, rid);
      await hl(D.document.querySelector('#content tbody tr'), 2800, rid);

      // 5 Kunde sieht Status
      setStep(4);
      phone('portal');
      await P.renderMine();
      await sleep(600, rid);
      await hl(P.document.querySelector('#my-list > div'), 2600, rid);

      bar.style.width = '100%';
      pills.forEach(p => p.className = 'h-1.5 flex-1 rounded-full bg-amber-500');
      cap.textContent = 'Fertig: vom Notfall bis zur Rechnung in einer App.';
      end.classList.remove('hidden');
      btnPlay.textContent = '✓ Fertig';
    } catch (e) { if (e !== 'cancel') console.error(e); }
  }

  function setPlayIcon() { btnPlay.textContent = paused ? '▶ Weiter' : '⏸ Pause'; }
  btnPlay.onclick = () => { if (!started) { started = true; run(); return; } paused = !paused; setPlayIcon(); };
  btnReplay.onclick = () => { started = true; run(); };
  $('film-end-replay').onclick = () => { started = true; run(); };

  // Startet automatisch, sobald der Film sichtbar ist
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting && !started) { started = true; run(); o.disconnect(); } }), { threshold: 0.5 }).observe(stage.parentElement);
})();
