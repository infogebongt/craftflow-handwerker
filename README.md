# CraftFlow – Handwerker Suite

Meldung, Einsatzplanung, Rapport und Rechnung für Handwerksbetriebe (Sanitär, Heizung, Elektro, Schlüsseldienst u. a.). Reine Browser-App, keine Build-Schritte.

| Datei | Zweck |
|---|---|
| `index.html` | Verkaufs-Homepage mit Preis |
| `apps.html` | Einstieg in die drei Apps (Demo mit `?demo=1`) |
| `kunden_app.html` | Kundenportal: Auftrag oder Notfall melden |
| `monteur_app.html` | Monteur-App: zugewiesene Einsätze, Navi, Anruf, Rapport |
| `meister_dashboard.html` | Meister-Zentrale: Aufträge zuteilen, Kundenkartei, Team & Tarife, Rechnungen als PDF |
| `config.js` | Firmendaten, MwSt., Supabase-Zugang |
| `store.js` | Datenschicht (Supabase, lokaler Demo-Modus) |
| `supabase_setup.sql` | Tabellen, Rechte und Funktionen für den Live-Betrieb |

## Demo

`index.html` im Browser öffnen oder per Webserver ausliefern. «Demo ansehen» öffnet die Apps mit Beispieldaten, ohne Anmeldung, nur im Browser des Besuchers.

## Live-Betrieb

1. Neues Supabase-Projekt anlegen, `supabase_setup.sql` im SQL-Editor ausführen.
2. Benutzer unter Authentication > Users anlegen und in `staff` eintragen (`role` = `praxis` für die Meister-Zentrale, `team` für Monteure):
   `insert into staff (user_id, role) values ('<user-uuid>', 'team');`
3. `SUPABASE_URL` und `SUPABASE_KEY` (publishable key) in `config.js` eintragen.
4. Ordner auf einen Webserver legen (Netlify, Vercel, GitHub Pages).

## Rechte

- Meister-Zentrale: alles. Monteur-App: Aufträge lesen und bearbeiten, Team lesen.
- Kunden sind nicht angemeldet. Sie können nur über die Funktionen `submit_ticket` und `my_tickets` einen Auftrag melden und mit ihrem geheimen Token ihre eigenen Aufträge sehen. Kein direkter Tabellenzugriff.
- Die Passwörter in `config.js` gelten nur im Demo-Modus ohne Supabase.

## Hinweise

Stundensätze (Lehrling 45 / Arbeiter 95 / Meister 125 CHF/h) sind Beispielwerte, MwSt. 8.1 % (CH). Vor echten Kundendaten: Datenschutzerklärung und Auftragsverarbeitung mit Supabase klären.
