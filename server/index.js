require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, "data.json");

if (!ANTHROPIC_API_KEY) {
  console.error("ERREUR: la variable d'environnement ANTHROPIC_API_KEY n'est pas definie.");
  process.exit(1);
}

const ZONES_DEFAULT = [
  { zone: "ZONE 1", commercial: "Rania", telephone: "", villes: ["Berkane", "Agadir", "Dakhla", "Guelmim", "Laâyoune", "Fès", "Oujda", "Marrakech", "Safi", "Ouarzazate", "Guercif", "Inezgane", "Aït Melloul"] },
  { zone: "ZONE 2", commercial: "Houria", telephone: "", villes: ["Casablanca", "Jemaa Shaim", "Kasba Tadla", "Settat", "Oualad Taima", "Béni Mellal", "Khouribga", "Mohammedia", "Fkih Ben Salah", "Ben Slimane"] },
  { zone: "ZONE 3", commercial: "Niemat", telephone: "", villes: ["Larache", "Ksar El Kébir", "Tiflet", "Kénitra", "Rabat", "Salé", "Tanger", "Témara", "Skhirat", "Jorf El Melha"] },
  { zone: "ZONE 4", commercial: "Fatima", telephone: "", villes: ["Chefchaouen", "Fnideq", "Imzouren", "Khénifra", "M'diq", "Al Hoceïma", "Meknès", "Souk Larbaa", "Taza", "Sidi Slimane", "Tétouan", "Khémisset", "Nador", "Ouezzane"] },
  { zone: "ZONE 5", commercial: "Ibtissam", telephone: "", villes: ["Chtouka Aït Baha", "Bouarfa", "Tan-Tan", "Kelaat Sraghna", "Essaouira", "El Jadida", "Berrechid", "El Youssoufia", "Had Soualem", "Azrou", "Séfrou", "Sidi Kacem", "Boujdour", "Taroudant", "Tiznit", "Errachidia", "Tinghir", "Zagora"] }
];

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    return { config: { salesEmail: "commercial@mlslabo.ma", sheetsUrl: "", zones: ZONES_DEFAULT }, leads: [], unanswered: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'appel a l'API Anthropic." });
  }
});

app.get("/api/config", (req, res) => {
  res.json(loadDb().config);
});

app.post("/api/config", (req, res) => {
  const db = loadDb();
  db.config = req.body;
  saveDb(db);
  res.json({ ok: true });
});

app.get("/api/leads", (req, res) => {
  res.json(loadDb().leads);
});

app.post("/api/leads", (req, res) => {
  const db = loadDb();
  const lead = { id: Date.now() + "-" + Math.random().toString(36).slice(2), ...req.body };
  db.leads.push(lead);
  saveDb(db);
  res.json(lead);
});

app.get("/api/unanswered", (req, res) => {
  res.json(loadDb().unanswered);
});

app.post("/api/unanswered", (req, res) => {
  const db = loadDb();
  const item = { id: Date.now() + "-" + Math.random().toString(36).slice(2), ...req.body };
  db.unanswered.push(item);
  saveDb(db);
  res.json(item);
});

app.delete("/api/unanswered/:id", (req, res) => {
  const db = loadDb();
  db.unanswered = db.unanswered.filter((q) => q.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true });
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log("Serveur proxy demarre sur le port " + PORT);
});
