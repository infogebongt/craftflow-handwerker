// Technische Konfiguration. Firmenname, Adresse usw. kommen aus branding.js.
// Ohne SUPABASE_URL/KEY läuft alles im Demo-Modus (Daten nur im Browser dieses Geräts).
// Für den Echtbetrieb: eigenes Supabase-Projekt pro Kunde anlegen, supabase_setup.sql ausführen, hier eintragen.
const B = window.BRAND || {};
window.TP_CONFIG = {
  SUPABASE_URL: "https://yggegnhnzocxncgdzihe.supabase.co",
  SUPABASE_KEY: "sb_publishable_R9t3CWdoM7vzCbClh2yx8Q_lXE4pWgc",

  // Nur für den Demo-Modus ohne Supabase. Im Live-Betrieb melden sich Firma/Team per E-Mail + Passwort (Supabase Auth) an.
  PASSWORDS: {
    praxis: "Firma2026",
    team: "Monteur2026"
  },

  PRACTICE: {
    name: B.name || "Ihre Firma",
    address: B.address || "",
    uid: B.uid || "",
    iban: B.iban || "",           // leer = Rechnung ohne QR-Einzahlungsschein
    phone: B.phone || ""
  },

  VAT_RATE: 0.081,
  PAYMENT_DAYS: 30
};
