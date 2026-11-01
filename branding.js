// Alles, was pro Kunde anders ist: Name, Logo, Farbe, Kontakt, Leistungen.
// Demo-Firma der CraftFlow-Verkaufsseite. Diese eine Datei anpassen (oder neuer-kunde.ps1 benutzen), dann sind Homepage, Apps und Rechnungen angepasst.
window.BRAND = {
  name: "CraftFlow Haustechnik AG",
  short: "CraftFlow",
  claim: "Ihr Partner für Sanitär, Heizung und Elektro",
  intro: "Schnell vor Ort, sauber gearbeitet, fair verrechnet. Melden Sie Ihr Anliegen in einer Minute online, wir melden uns umgehend.",

  logo: "",                      // z. B. "logo.png" (Datei in diesen Ordner legen). Leer = Initialen
  color: "#d97706",              // Hauptfarbe der Homepage
  heroImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1600&q=80",

  phone: "+41 44 000 00 00",
  email: "info@muster-haustechnik.ch",
  address: "Musterstrasse 12 | 8000 Zürich",
  uid: "CHE-123.456.789 MWST",
  iban: "CH93 0076 2011 6238 5295 7",                      // Beispiel-IBAN für die Demo (Rechnung mit QR-Zahlteil)
  hours: "Mo bis Fr 7.00 bis 17.00 Uhr, Notdienst rund um die Uhr",

  // Auswahl "Gewerk" im Meldeformular
  trades: ["Sanitär", "Heizung", "Elektro", "Schlüsseldienst", "Dach / Spengler", "Glas", "Rohrreinigung", "Anderes"],

  services: [
    { icon: "🚿", title: "Sanitär", text: "Reparaturen, Rohrbrüche, Neuinstallationen und Badumbauten." },
    { icon: "🔥", title: "Heizung", text: "Wartung, Störungsbehebung und Ersatz von Heizungsanlagen." },
    { icon: "⚡", title: "Elektro", text: "Installationen, Störungen, Kontrollen und Erweiterungen." },
    { icon: "🚨", title: "Notdienst", text: "Wasserschaden, Heizungsausfall, Stromausfall: Wir kommen schnell." }
  ],

  about: "Wir sind ein Familienbetrieb mit langjähriger Erfahrung. Zuverlässigkeit und transparente Preise sind für uns selbstverständlich."
};
