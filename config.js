// Zentrale Konfiguration der CraftFlow Handwerker-Suite.
// Ohne SUPABASE_URL/KEY läuft alles im Demo-Modus (Daten nur im Browser dieses Geräts).
// Für den Echtbetrieb mit mehreren Geräten: supabase_setup.sql ausführen und hier eintragen.
window.TP_CONFIG = {
  SUPABASE_URL: "https://yggegnhnzocxncgdzihe.supabase.co",
  SUPABASE_KEY: "sb_publishable_R9t3CWdoM7vzCbClh2yx8Q_lXE4pWgc",

  // Nur für den Demo-Modus ohne Supabase. Im Live-Betrieb melden sich Firma/Team per E-Mail + Passwort (Supabase Auth) an.
  PASSWORDS: {
    praxis: "Firma2026",
    team: "Monteur2026"
  },

  PRACTICE: {
    name: "CraftFlow Haustechnik AG",
    address: "Musterstrasse 12 | 8000 Zürich",
    uid: "CHE-123.456.789 MWST",
    phone: "+41 44 000 00 00"
  },

  VAT_RATE: 0.081,
  PAYMENT_DAYS: 30
};
