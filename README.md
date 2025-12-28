# 💰 Fluxby - Financieel Dashboard

Een moderne, lokale applicatie voor het visualiseren en analyseren van je bankgegevens. Upload CSV-exports van je bank en krijg direct inzicht in je financiën.

![Dashboard Preview](docs/dashboard-preview.png)

## ✨ Functies

- **📊 Overzichtelijk Dashboard** - Bekijk je inkomsten, uitgaven en saldo in één oogopslag
- **📈 Grafieken & Analyses** - Interactieve grafieken voor trends en categorieën
- **📁 CSV Import** - Upload eenvoudig CSV-exports van ING (meer banken volgen)
- **🏷️ Automatische Categorisatie** - Transacties worden automatisch gecategoriseerd
- **💬 Chat Assistent** - Stel vragen over je financiële data
- **📱 Moderne Interface** - Strak design met een prettige gebruikerservaring
- **🔒 100% Lokaal** - Alle data blijft op je eigen computer

## 🚀 Snel Starten

### Vereisten

- Node.js 22 of hoger
- npm 10 of hoger

### Installatie

```bash
# Clone de repository
git clone <repository-url>
cd finance

# Installeer dependencies
npm install

# Bouw het shared package
npm run build -w packages/shared

# Start de applicatie
npm run dev
```

De applicatie is nu beschikbaar op:

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001

## 📂 Project Structuur

```
finance/
├── apps/
│   ├── api/           # Express.js backend
│   │   ├── src/
│   │   │   ├── db/        # SQLite database schema
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── services/  # Business logic
│   │   │   └── index.ts   # Server entry point
│   │   └── data/          # SQLite database bestanden
│   │
│   └── web/           # React frontend
│       ├── src/
│       │   ├── components/  # UI componenten
│       │   ├── pages/       # Pagina componenten
│       │   ├── lib/         # Utilities & API client
│       │   └── main.tsx     # App entry point
│       └── public/          # Statische bestanden
│
└── packages/
    └── shared/        # Gedeelde types & utilities
```

## 📖 Gebruik

### CSV Importeren

1. Ga naar de **Importeren** pagina
2. Selecteer je bank (momenteel alleen ING)
3. Sleep je CSV-bestand naar het upload veld of klik om te selecteren
4. De transacties worden automatisch verwerkt en gecategoriseerd

**Let op:**

- Transacties vóór de huidige maand worden slechts één keer geïmporteerd
- Bij het importeren van data voor de huidige maand worden bestaande entries voor die maand eerst gewist

### Dashboard

Het dashboard toont:

- Totaal saldo over alle rekeningen
- Inkomsten en uitgaven van de huidige maand
- Grafiek met maandelijkse trends
- Verdeling per categorie
- Recente transacties

### Transacties

- Bekijk alle transacties in een overzichtelijke tabel
- Filter op periode, categorie of zoekterm
- Sorteer op datum, bedrag of omschrijving
- Pas categorieën handmatig aan

### Analyses

- Uitgebreide grafieken en statistieken
- Vergelijk periodes
- Bekijk uitgavenpatronen per categorie
- Identificeer trends

### Budgetten

- Stel budgetten in per categorie
- Volg je voortgang gedurende de maand
- Ontvang visuele feedback bij overschrijding

### Chat

- Stel vragen in natuurlijke taal over je financiën
- Toegankelijk via de zwevende chat knop of de Chat pagina
- Voorbeeldvragen:
  - "Hoeveel heb ik uitgegeven aan boodschappen deze maand?"
  - "Wat zijn mijn grootste uitgaven?"
  - "Vergelijk mijn uitgaven van vorige maand met deze maand"

## 🏦 Ondersteunde Banken

| Bank     | Status         |
| -------- | -------------- |
| ING      | ✅ Ondersteund |
| Rabobank | 🔜 Gepland     |
| ABN AMRO | 🔜 Gepland     |
| SNS      | 🔜 Gepland     |

## 🛠️ Technische Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui componenten
- Recharts voor grafieken
- TanStack Query & Table

### Backend

- Express.js
- TypeScript
- SQLite (better-sqlite3)
- Multer voor file uploads
- PapaParse voor CSV parsing

## 🔧 Configuratie

### Database

De SQLite database wordt automatisch aangemaakt in `data/fluxby.db`. Deze map wordt niet meegenomen in git.

### Categorisatie Regels

Pas automatische categorisatie aan via de **Categorieën** pagina. Voeg regels toe gebaseerd op:

- Tegenrekening
- Omschrijving (bevat tekst)
- Bedrag range

## 📝 Scripts

```bash
# Start development servers
npm run dev

# Alleen API server
npm run dev:api

# Alleen web app
npm run dev:web

# Build alles
npm run build

# Type checking
npm run typecheck
```

## 🤝 Bijdragen

Bijdragen zijn welkom! Open een issue of pull request voor:

- Bug fixes
- Nieuwe bank formaten
- Feature suggesties
- Documentatie verbeteringen

## 📄 Licentie

MIT License - Zie [LICENSE](LICENSE) voor details.

---

<p align="center">
  Gemaakt met ❤️ voor beter financieel inzicht
</p>
