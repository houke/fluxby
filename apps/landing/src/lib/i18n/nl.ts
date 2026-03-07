// Dutch translations for the Fluxby landing page

export interface LandingTranslationKeys {
  nav: {
    features: string;
    screenshots: string;
    getStarted: string;
  };
  downloads: {
    title: string;
    description: string;
    mac: {
      name: string;
      description: string;
      aarchLabel: string;
      x64Label: string;
    };
    windows: {
      name: string;
      description: string;
      label: string;
      x64Label: string;
      arm64Label: string;
    };
    linux: {
      name: string;
      description: string;
      label: string;
      appimageLabel: string;
      debLabel: string;
      rpmLabel: string;
    };
    pwa: {
      name: string;
      description: string;
      installButton: string;
      installedBadge: string;
      browserInstructions: {
        ios: string;
        android: string;
        desktop: string;
      };
    };
    note: string;
  };
  common: {
    copied: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    getStarted: string;
    scrollDown: string;
  };
  features: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  screenshots: {
    title: string;
    titleHighlight: string;
    titleEnd: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
      features: string[];
    }>;
  };
  developer: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    features: Array<{
      title: string;
      description: string;
    }>;
    endpointsTitle: string;
    moreEndpoints: string;
    viewDocs: string;
    tryApp: string;
  };
  cta: {
    title: {
      part1: string;
      highlight: string;
      part2: string;
    };
    description: string;
    getStarted: string;
  };
  footer: {
    description: string;
    product: {
      title: string;
      features: string;
      pricing: string;
      updates: string;
      about: string;
    };
    support: {
      title: string;
      helpCenter: string;
      developerDocs: string;
      privacyPolicy: string;
      termsOfService: string;
    };
    copyright: string;
    github: string;
  };
  testimonials: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: Array<{
      name: string;
      role: string;
      content: string;
      avatar: string;
    }>;
    stats: {
      users: string;
      usersLabel: string;
      saved: string;
      savedLabel: string;
      rating: string;
      ratingLabel: string;
      countries: string;
      countriesLabel: string;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helpSection?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helpCenter?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legal?: Record<string, any>;
  errors: {
    notFound: string;
    notFoundDescription: string;
    goHome: string;
    goBack: string;
  };
  animations: {
    dashboard: {
      total: string;
      categories: Record<string, string>;
    };
    transactions: {
      date: string;
      income: string;
      categories: Record<string, string>;
    };
    categories: {
      groups: Record<string, string>;
      subcategories: Record<string, string>;
    };
    budgets: {
      leftThisMonth: string;
      spent: string;
      budget: string;
      remaining: string;
      overBudget: string;
      categories: Record<string, string>;
    };
    analytics: {
      title: string;
      month: string;
      total: string;
      income: string;
      expenses: string;
    };
    subscriptions: {
      monthlyTotal: string;
      active: string;
      pending: string;
      frequencies: Record<string, string>;
      nextPayment: string;
      priceIncrease: string;
      update: string;
    };
    import: {
      dropzone: string;
      or: string;
      browse: string;
      uploading: string;
      processing: string;
      detecting: string;
      importing: string;
      done: string;
      transactionsImported: string;
      dragHint: string;
    };
    sync?: {
      discovering: string;
      connecting: string;
      syncing: string;
      complete: string;
      device1: string;
      device2: string;
      transactions: string;
      categories: string;
      p2pEncrypted: string;
    };
  };
}

export const nl: LandingTranslationKeys = {
  // Navigation
  nav: {
    features: 'Functies',
    screenshots: 'Screenshots',
    getStarted: 'Aan de slag',
  },
  downloads: {
    title: 'Download Fluxby',
    description:
      'Kies je platform en begin vandaag nog met het beheren van je financiën.',
    mac: {
      name: 'macOS',
      description: 'Voor Apple Silicon en Intel Macs',
      aarchLabel: 'Apple Silicon',
      x64Label: 'Intel Mac',
    },
    windows: {
      name: 'Windows',
      description: 'Voor Windows 10 en 11',
      label: 'Download voor Windows',
      x64Label: 'x64',
      arm64Label: 'ARM64',
    },
    linux: {
      name: 'Linux',
      description: 'Packages voor alle grote Linux distributies.',
      label: 'Download',
      appimageLabel: 'AppImage',
      debLabel: 'DEB',
      rpmLabel: 'RPM',
    },
    pwa: {
      name: 'Browser (PWA)',
      description:
        'Installeer direct vanuit je browser. Geen download nodig, werkt offline.',
      installButton: 'Installeren als app',
      installedBadge: 'Geïnstalleerd',
      browserInstructions: {
        ios: 'Tik op het Deel-icoon en dan "Zet op beginscherm"',
        android: 'Tik op het menu (⋮) en dan "Toevoegen aan startscherm"',
        desktop: 'Klik op het installatie-icoon in de adresbalk',
      },
    },
    note: 'Je hoeft niets te installeren om Fluxby te gebruiken; het werkt volledig in je browser. Deze downloads zijn beschikbaar voor gebruikers die de voorkeur geven aan een dedicated applicatie op hun systeem.',
  },
  common: {
    copied: 'Gekopieerd!',
  },

  // Hero
  hero: {
    title: 'Ontmoet',
    subtitle: 'je schattige financiële mascotte!',
    description:
      'Maak geldbeheer leuk met je eigen digitale mascotte. Volg uitgaven, stel doelen en krijg betere inzichten in je uitgaven! Volledig gratis voor altijd.',
    getStarted: 'Beginnen 🚀',
    scrollDown: 'Scroll naar beneden',
  },

  // Features
  features: {
    title: 'Waarom kiezen voor',
    titleHighlight: 'Fluxby',
    subtitle:
      'Meer dan alleen een financiële app - Fluxby is je financiële mascotte die geldbeheer heerlijk en stressvrij maakt.',
    items: [
      {
        title: 'Slimme transactie tracking',
        description:
          'Categoriseer automatisch je uitgaven en inkomsten met AI-gestuurde herkenning. Fluxby leert je uitgavenpatronen en suggereert betere manieren om te sparen.',
      },
      {
        title: 'Mooie analytics',
        description:
          'Prachtige grafieken die het begrijpen van je financiën leuk maken. Zie je geld groeien met interactieve visualisaties.',
      },
      {
        title: 'Budget doelen',
        description:
          'Stel schattige budgetdoelen in met Fluxby die je aanmoedigt. Bekijk je voortgang met leuke animaties en feestelijke confetti.',
      },
      {
        title: '100% lokaal & privé',
        description:
          'Je financiële data verlaat nooit je apparaat. Geen cloud, geen servers, geen tracking - alles blijft op je computer waar het thuishoort.',
      },
      {
        title: 'Apparaat synchronisatie',
        description:
          'Synchroniseer je data tussen apparaten op hetzelfde netwerk. Peer-to-peer sync betekent dat je data direct tussen je apparaten reist - geen cloud nodig.',
      },
      {
        title: 'Bank CSV import',
        description:
          'Exporteer eenvoudig transacties van je bank en importeer ze in Fluxby. Werkt met meerdere banken.',
      },
    ],
  },

  // Screenshots
  screenshots: {
    title: 'Zie',
    titleHighlight: 'Fluxby',
    titleEnd: 'in actie',
    subtitle:
      'Mooie, intuïtieve interface ontworpen om financieel beheer leuk te maken voor iedereen.',
    items: [
      {
        title: 'Dashboard overzicht',
        description:
          'Krijg een compleet beeld van je financiële gezondheid in één oogopslag. Zie je maandelijkse inkomsten, uitgaven en spaartrend met mooie visualisaties.',
        features: [
          'Realtime saldo updates',
          'Maandelijkse inkomsten vs uitgaven grafiek',
          'Recente transacties lijst',
        ],
      },
      {
        title: 'Transactie beheer',
        description:
          'Categoriseer en volg eenvoudig al je uitgaven en inkomsten. Slimme categorisatie helpt je uitgavenpatronen te begrijpen.',
        features: [
          'Auto-categorisatie',
          'Zoeken en filteren',
          'Bulk bewerking',
        ],
      },
      {
        title: 'Budget planning',
        description:
          'Stel je uitgavendoelen in en monitor ze met visuele voortgangsbalken. Blijf op koers en krijg meldingen wanneer je limieten nadert.',
        features: [
          'Aangepaste budget categorieën',
          'Voortgang tracking',
          'Uitgaven alerts',
        ],
      },
      {
        title: 'Analytics & inzichten',
        description:
          'Duik diep in je financiële data met uitgebreide analytics. Begrijp waar je geld naartoe gaat met categorie-indelingen.',
        features: [
          'Categorie cirkeldiagrammen',
          'Trend analyse',
          'Jaar-op-jaar vergelijking',
        ],
      },
      {
        title: 'Categorie beheer',
        description:
          'Maak en pas categorieën aan die passen bij je levensstijl. Wijs kleuren, iconen toe en stel automatische categorisatie regels in.',
        features: [
          'Aangepaste kleuren & iconen',
          'Auto-categorisatie regels',
          'Subcategorie ondersteuning',
        ],
      },
      {
        title: 'Abonnementen tracker',
        description:
          'Houd al je terugkerende betalingen bij. Fluxby detecteert automatisch je abonnementen en waarschuwt bij prijswijzigingen.',
        features: [
          'Automatische detectie',
          'Prijswijziging alerts',
          'Maandelijks overzicht',
        ],
      },
      {
        title: 'Eenvoudige CSV import',
        description:
          'Importeer je banktransacties in seconden. Sleep je CSV-export en Fluxby doet de rest.',
        features: [
          'Drag & drop upload',
          'Meerdere bank ondersteuning',
          'Duplicaat detectie',
        ],
      },
      {
        title: 'Apparaat synchronisatie',
        description:
          'Houd je data gesynchroniseerd op al je apparaten. Peer-to-peer sync betekent dat je data direct tussen apparaten reist - geen cloud nodig.',
        features: [
          'Directe apparaat-naar-apparaat sync',
          'End-to-end versleuteld',
          'Werkt op lokaal netwerk',
        ],
      },
    ],
  },

  // Developer
  developer: {
    badge: 'Developer API',
    title: 'Bouw met',
    titleHighlight: 'Fluxby API',
    subtitle:
      'Krijg programmatisch toegang tot je financiële data. Maak aangepaste integraties, dashboards of automatiseer je workflows.',
    features: [
      {
        title: 'RESTful API',
        description:
          'Schone REST endpoints voor alle data operaties. Transacties, categorieën, budgetten en analytics.',
      },
      {
        title: 'OpenAPI/Swagger',
        description:
          'Interactieve API documentatie op /api/docs. Probeer endpoints direct in je browser.',
      },
      {
        title: 'Eenvoudige integratie',
        description:
          'JSON responses, standaard HTTP methodes. Bouw aangepaste dashboards of automatiseringen.',
      },
    ],
    endpointsTitle: 'API endpoints',
    moreEndpoints: '... en 20+ meer endpoints',
    viewDocs: 'Bekijk API docs',
    tryApp: 'Probeer de app',
  },

  // Help Center Section (Landing)
  helpSection: {
    badge: 'Helpcentrum',
    title: 'Hulp nodig?',
    titleHighlight: 'We staan voor je klaar',
    subtitle:
      'Van startgidsen tot gedetailleerde API-documentatie, vind alles wat je nodig hebt om het meeste uit Fluxby te halen.',
    avatarBadge: 'Hier om te helpen!',
    cardTitle: 'Je vriendelijke gids voor Fluxby',
    cardDescription:
      'Of je nu net begint of op zoek bent naar geavanceerde tips, ons Helpcentrum heeft alles wat je nodig hebt. Blader door gidsen, leer over budgetteren of duik in de API.',
    visitHelpCenter: 'Naar Helpcentrum',
    viewApiDocs: 'API Docs',
    features: [
      {
        title: 'Gebruikershandleiding',
        description:
          'Stap-voor-stap gidsen om je op weg te helpen en alle functies van Fluxby te leren beheersen.',
      },
      {
        title: 'API Documentatie',
        description:
          'Complete API-referentie voor developers die integraties willen bouwen.',
      },
      {
        title: 'Privacy & Beveiliging',
        description:
          'Leer hoe Fluxby je financiële data lokaal privé en veilig houdt.',
      },
    ],
    quickLinks: 'Snelle links:',
    linkBankConnection: 'Bank koppelen',
    linkBudgeting: 'Budgetteren',
    linkPrivacy: 'Privacy',
  },

  // CTA
  cta: {
    title: {
      part1: 'Klaar om te zien',
      highlight: 'waar',
      part2: 'je geld naartoe gaat?',
    },
    description:
      'Begin vandaag met Fluxby om transacties te volgen, uitgaven te categoriseren en te begrijpen waar je geld naartoe gaat — snel, privé en duidelijk.',
    getStarted: 'Beginnen 🚀',
  },

  // Footer
  footer: {
    description:
      'Fluxby is je persoonlijke financiële mascotte die geldbeheer leuk en stressvrij maakt. 100% lokaal, privé en schattig.',
    product: {
      title: 'Product',
      features: 'Functies',
      pricing: 'Prijzen',
      updates: 'Updates',
      about: 'Over',
    },
    support: {
      title: 'Ondersteuning',
      helpCenter: 'Helpcentrum',
      developerDocs: 'Developer Docs',
      privacyPolicy: 'Privacybeleid',
      termsOfService: 'Gebruiksvoorwaarden',
    },
    copyright: '© Fluxby. Alle rechten voorbehouden.',
    github: 'Bekijk op GitHub',
  },
  testimonials: {
    title: 'Geliefd door',
    titleHighlight: 'Iedereen',
    subtitle:
      'Sluit je aan bij duizenden blije gebruikers die hun relatie met geld hebben getransformeerd.',
    items: [
      {
        name: 'Sarah Chen',
        role: 'Freelance Designer',
        content:
          'Fluxby maakte het beheren van mijn freelance inkomsten zo leuk! De schattige animaties motiveren me echt om regelmatig mijn financiën te checken.',
        avatar: '👩‍🎨',
      },
      {
        name: 'Marcus Johnson',
        role: 'Kleine Ondernemer',
        content:
          'Eindelijk een financiële app die niet als een verplichting voelt. De interface van Fluxby is prachtig en de inzichten zijn echt nuttig.',
        avatar: '👨‍💼',
      },
      {
        name: 'Emma Rodriguez',
        role: 'Student',
        content:
          'Als iemand die een hekel had aan budgetteren, heeft Fluxby alles veranderd. De digitale mascotte maakt sparen belonend!',
        avatar: '👩‍🎓',
      },
    ],
    stats: {
      users: '10K+',
      usersLabel: 'Blije Gebruikers',
      saved: '€2M+',
      savedLabel: 'Geld Bespaard',
      rating: '4.9⭐',
      ratingLabel: 'App Store Score',
      countries: '50+',
      countriesLabel: 'Landen',
    },
  },
  docs: {
    badge: 'Docs',
    backToHome: 'Terug naar Home',
    swaggerDocs: 'Swagger Docs',
    footerText: 'Gebouwd met ❤️ voor developers.',
    nav: {
      gettingStarted: 'Aan de slag',
      introduction: 'Introductie',
      authentication: 'Authenticatie',
      architecture: 'Architectuur',
      profiles: 'Profielen & Multi-Tenancy',
      errors: 'Foutafhandeling',
      coreResources: 'Core Resources',
      accounts: 'Rekeningen',
      transactions: 'Transacties',
      categories: 'Categorieën',
      budgets: 'Budgetten',
      subscriptions: 'Abonnementen',
      analytics: 'Analytics',
      addressBook: 'Adresboek',
      import: 'Import',
      data: 'Data beheer',
      tools: 'Tools',
      openapi: 'OpenAPI Spec',
      apiReference: 'Swagger Docs',
      helpCenter: 'Helpcentrum',
    },
    // Introduction page
    introduction: {
      title: 'Fluxby API Documentatie',
      subtitle:
        'Bouw krachtige integraties met je financiële gegevens. Toegang tot transacties, categorieën, budgetten en analyses via onze RESTful API.',
      quickStartTitle: 'Snelstart',
      quickStartText:
        'Ga binnen enkele minuten aan de slag. De API draait lokaal op http://localhost:3001/api zonder authenticatie voor lokale ontwikkeling.',
      whatCanYouBuildTitle: 'Wat kun je bouwen?',
      useCases: [
        {
          title: 'Aangepaste dashboards',
          description:
            'Bouw gepersonaliseerde financiële dashboards met je favoriete visualisatie library.',
        },
        {
          title: 'Automatiseringen',
          description:
            'Maak scripts die automatisch transacties categoriseren of rapporten genereren.',
        },
        {
          title: 'Mobiele apps',
          description:
            'Bouw mobiele companion apps die synchroniseren met je Fluxby data.',
        },
        {
          title: 'Notificaties',
          description:
            'Stel alerts in voor budgetlimieten, ongebruikelijke uitgaven of terugkerende betalingen.',
        },
      ],
      makeFirstRequest: 'Maak je eerste request',
      makeFirstRequestText:
        'Hier is een eenvoudig voorbeeld om je dashboard statistieken op te halen:',
      requestTitle: 'Request',
      responseTitle: 'Response',
      baseUrlTitle: 'Base URL',
      baseUrlText: 'Alle API endpoints zijn relatief aan de base URL:',
      nextStepsTitle: 'Volgende stappen',
      nextSteps: [
        'Leer over Authenticatie',
        'Begrijp Profielen & Multi-Tenancy',
        'Verken de Transacties API',
      ],
    },
    // Authentication page
    authentication: {
      title: 'Authenticatie',
      subtitle: 'Leer hoe je je API requests authenticeert met Fluxby.',
      localNote: 'Lokale Ontwikkeling',
      localNoteText:
        'Fluxby draait volledig op je lokale machine. Er zijn geen API keys of OAuth flows nodig - neem simpelweg je Profiel ID op in requests.',
      profileIdTitle: 'De Profiel ID gebruiken',
      profileIdText:
        'Alle API requests moeten de X-Profile-ID header bevatten. Dit identificeert welke profiel data je wilt benaderen.',
      getProfileIdTitle: 'Je Profiel ID ophalen',
      option1Title: 'Optie 1: Vanuit de App',
      option1Text:
        'Open Fluxby in je browser, ga naar Instellingen → Profiel, en kopieer je Profiel ID.',
      option2Title: 'Optie 2: API Call',
      option2Text: 'Lijst alle profielen via het profielen endpoint:',
      errorHandlingTitle: 'Ontbrekende Profiel ID',
      errorHandlingText:
        'Als je de X-Profile-ID header niet opneemt, ontvang je een 401 foutmelding:',
      errorResponse: 'Foutmelding Response',
    },

    // Architecture page
    architecture: {
      title: 'Local-First Architectuur',
      subtitle:
        'Fluxby gebruikt een local-first architectuur waarbij al je data lokaal wordt opgeslagen en versleuteld. Geen cloud, geen servers die je data kunnen lezen.',
      zeroKnowledgeTitle: 'Zero-Knowledge Design',
      zeroKnowledgeText:
        'Alleen jij hebt toegang tot je data. De master key bestaat alleen in het geheugen en wordt nooit opgeslagen.',
      platformsTitle: 'Ondersteunde Platformen',
      webDesc:
        'Draait in de browser met SQLite WASM. Data opgeslagen in OPFS (Origin Private File System).',
      desktopDesc: 'Native app voor Windows, macOS en Linux met Tauri 2.0.',
      headlessDesc:
        'Lokale API server voor scripts, automations en externe tools.',
      securityTitle: 'Privacy Lock & Beveiliging',
      securityText:
        'Je data wordt beschermd door een PIN/wachtwoord vergrendeling. Het wachtwoord wordt geverifieerd via PBKDF2 (100k iteraties). Alle data blijft lokaal in je browser - het wordt nooit naar externe servers verzonden.',
      privacyNote:
        'Let op: Het wachtwoord beschermt toegang tot je data via de UI. De database zelf wordt onversleuteld opgeslagen in OPFS. Voor bescherming tegen meekijkers en ongeautoriseerde toegang.',
      autoLockTitle: 'Auto-Lock',
      autoLockWeb: 'Master key wordt gewist bij page refresh of tab sluiten',
      autoLockDesktop: 'Master key wordt gewist bij app sluiten',
      autoLockIdle: 'Na 15 minuten inactiviteit wordt automatisch vergrendeld',
      syncTitle: 'Synchronisatie',
      syncText:
        'Fluxby gebruikt peer-to-peer synchronisatie via WebRTC. Data gaat direct tussen je apparaten zonder tussenkomst van een server.',
      syncSchemaTitle: 'Sync Schema',
      conflictTitle: 'Conflict Resolutie (LWW)',
      conflictText:
        'Bij conflicten wint de meest recente wijziging (Last-Write-Wins). Bij gelijke timestamps beslist de device_id.',
      storageTitle: 'Storage Adapters',
      backupTitle: 'Backup & Herstel',
      backupText:
        'Je kunt op elk moment een backup maken van je data. Backups bevatten je complete database en kunnen worden hersteld op elk apparaat.',
      backupDesktop:
        'Bestand → Backup opslaan... exporteert naar je Documents map',
      backupWeb: 'Instellingen → Backup download een .fluxby bestand',
      backupFormat: '.fluxby bestanden bevatten metadata + database dump',
      tipTitle: 'Tip',
      tipText:
        'Maak regelmatig backups! Bij verlies van je PIN/wachtwoord kun je alleen herstellen vanaf een backup.',

      apiVsWebTitle: 'API Server vs Web App: aparte databases',
      apiVsWebIntro:
        'Het is belangrijk om te begrijpen dat de API server en de web app volledig gescheiden databases gebruiken. Dit is een bewuste architectuurbeslissing voor maximale privacy.',
      importantTitle: 'Belangrijk',
      apiSeparateDbText:
        'De API server kan NIET verbinden met je versleutelde web app database. Je master password wordt nooit gedeeld met de API server. Als je data wilt gebruiken via de API, moet je eerst een JSON export maken vanuit de web app en deze importeren in de API server.',
      dataFlowTitle: 'Data migratie workflow',
      dataFlowText:
        'Om je data te gebruiken met de API server voor automations of custom integraties:',
      whySeparateTitle: 'Waarom gescheiden databases?',
      whySeparate1:
        'Zero-Knowledge: je master password verlaat nooit de browser. De API server kan je versleutelde data niet ontcijferen.',
      whySeparate2:
        'Privacy: je financiële data in de web app is volledig geïsoleerd en versleuteld.',
      whySeparate3:
        'Flexibiliteit: ontwikkelaars kunnen werken met een aparte, onversleutelde database zonder risico voor echte data.',
      whySeparate4:
        'Serverless: de web app werkt volledig offline (bijv. GitHub Pages) - geen server nodig.',
    },
    // Profiles page
    profiles: {
      title: 'Profielen & Multi-Tenancy',
      subtitle:
        'Beheer meerdere financiële profielen voor verschillende doeleinden - persoonlijk, zakelijk of project-gebaseerde tracking.',
      useCaseTitle: 'Toepassingen',
      useCase1: 'Scheid persoonlijke en zakelijke financiën',
      useCase2: 'Volg uitgaven voor specifieke projecten',
      useCase3: 'Beheer financiën voor meerdere gezinsleden',
      howItWorksTitle: 'Hoe Multi-Tenancy werkt',
      howItWorksText:
        'Elk profiel fungeert als een volledig geïsoleerde omgeving. Transacties, categorieën, budgetten en analytics zijn allemaal gebonden aan een specifiek profiel.',
      isolation: 'Data Isolatie',
      isolationDesc:
        'Elk profiel heeft zijn eigen transacties, categorieën en budgetten.',
      switching: 'Makkelijk Wisselen',
      switchingDesc:
        'Wissel tussen profielen door de X-Profile-ID header aan te passen.',
      customization: 'Volledige Aanpassing',
      customizationDesc:
        'Elk profiel kan verschillende categorieën, budgetten en instellingen hebben.',
      listProfilesTitle: 'Profielen Ophalen',
      listProfilesText: 'Haal alle profielen op om te zien wat beschikbaar is:',
      createProfileTitle: 'Profiel Aanmaken',
      createProfileText:
        'Maak een nieuw profiel aan met een naam en type (personal of business):',
      profileTypesTitle: 'Profiel Types',
      tableType: 'Type',
      tableDescription: 'Beschrijving',
      personalDesc:
        'Voor het bijhouden van persoonlijke financiën, huishoudelijke uitgaven en spaardoelen.',
      businessDesc:
        'Voor freelance inkomsten, zakelijke uitgaven en project-gebaseerde tracking.',
      profileTypes: [
        {
          type: 'personal',
          description: 'Persoonlijke financiën',
          emoji: '👤',
        },
        {
          type: 'business',
          description: 'Zakelijke/freelance financiën',
          emoji: '💼',
        },
        {
          type: 'shared',
          description: 'Gezamenlijke/huishouden financiën',
          emoji: '👥',
        },
        { type: 'savings', description: 'Spaardoelen tracking', emoji: '🎯' },
        {
          type: 'investing',
          description: "Beleggingsportfolio's",
          emoji: '📈',
        },
      ],
      endpointsTitle: 'Profiel Endpoints',
      listProfiles: 'Lijst alle profielen',
      createProfile: 'Maak nieuw profiel',
      getProfile: 'Haal profiel op op ID',
      updateProfile: 'Update profiel',
      deleteProfile: 'Verwijder profiel',
      switchProfile: 'Wissel actief profiel',
      exampleTitle: 'Voorbeeld: Maak een Profiel',
      requestTitle: 'Request',
      responseTitle: 'Response',
      dataIsolationTitle: 'Data Isolatie',
      dataIsolationText: 'Elk profiel bevat zijn eigen:',
      dataIsolationItems: [
        'Bankrekeningen',
        'Transacties',
        'Categorieën en auto-categorisatie regels',
        'Budgetten',
        'Adresboek contacten',
      ],
      dataIsolationNote:
        'Data wordt nooit gedeeld tussen profielen. Het verwijderen van een profiel verwijdert permanent alle bijbehorende data.',
    },
    // Errors page
    errors: {
      title: 'Foutafhandeling',
      subtitle:
        'Leer hoe je fouten van de Fluxby API interpreteert en afhandelt.',
      httpStatusTitle: 'HTTP Status Codes',
      httpStatusText: 'De API gebruikt standaard HTTP status codes:',
      statusCodes: [
        { code: '200', description: 'OK - Request succesvol' },
        { code: '201', description: 'Created - Resource succesvol aangemaakt' },
        {
          code: '400',
          description: 'Bad Request - Ongeldige request parameters',
        },
        { code: '404', description: 'Not Found - Resource niet gevonden' },
        {
          code: '500',
          description: 'Internal Server Error - Er ging iets mis',
        },
      ],
      errorResponseTitle: 'Fout Response Formaat',
      errorResponseText:
        'Wanneer een fout optreedt, retourneert de API een JSON response met details:',
      commonErrorsTitle: 'Veelvoorkomende Fouten',
      invalidProfileTitle: 'Ongeldig Profiel ID',
      invalidProfileText:
        'Dit treedt op wanneer de X-Profile-ID header een ID bevat dat niet bestaat.',
      missingFieldsTitle: 'Verplichte Velden Ontbreken',
      missingFieldsText:
        'Dit treedt op wanneer verplichte velden niet zijn opgegeven in de request body.',
      resourceNotFoundTitle: 'Resource Niet Gevonden',
      resourceNotFoundText:
        'Dit treedt op wanneer je een resource probeert te benaderen die niet bestaat.',
      bestPracticesTitle: 'Best Practices',
      bestPractices: [
        'Controleer altijd de HTTP status code voordat je de response body parsed',
        'Implementeer retry logica voor 5xx fouten',
        'Log foutdetails voor debugging doeleinden',
        'Toon gebruikersvriendelijke foutmeldingen aan eindgebruikers',
      ],
    },
    // Accounts page
    accounts: {
      title: 'Rekeningen',
      subtitle:
        'Beheer bankrekeningen en volg saldi over al je financiële rekeningen.',
      listTitle: 'Rekeningen ophalen',
      listText: 'Haal alle rekeningen op voor het huidige profiel:',
      createTitle: 'Rekening aanmaken',
      createText: 'Voeg een nieuwe bankrekening toe:',
      requestBody: 'Request body',
      tableField: 'Veld',
      tableType: 'Type',
      tableRequired: 'Verplicht',
      tableDescription: 'Beschrijving',
      nameDesc: 'Weergavenaam voor de rekening',
      typeDesc: 'checking, savings of credit',
      ibanDesc: 'IBAN van de rekening',
      balanceDesc: 'Startsaldo (standaard: 0)',
      deleteTitle: 'Rekening verwijderen',
      deleteText:
        'Verwijder een rekening. Transacties gekoppeld aan deze rekening blijven behouden maar worden ontkoppeld.',
      deleteAllTitle: 'Alle rekeningen verwijderen',
      deleteAllText:
        'Verwijder alle rekeningen voor het huidige profiel. Alle transacties blijven behouden maar worden ontkoppeld van hun rekeningen.',
      noteTitle: 'Let op',
      noteText:
        'Beide verwijder endpoints behouden transacties door hun account_id op NULL te zetten. Transacties blijven toegankelijk maar zijn niet langer gekoppeld aan een rekening.',
      endpointsTitle: 'Rekening Endpoints',
      endpoints: {
        list: 'Lijst alle rekeningen',
        create: 'Maak nieuwe rekening',
        get: 'Haal rekening op op ID',
        update: 'Update rekening',
        delete: 'Verwijder rekening',
        reorder: 'Verander rekening volgorde',
      },
      accountObjectTitle: 'Het Rekening Object',
      fieldsTitle: 'Velden',
      fields: {
        id: 'Unieke identifier',
        iban: 'IBAN rekeningnummer',
        name: 'Display naam',
        type: 'Rekening type (checking, savings, credit)',
        currentBalance: 'Huidig saldo',
        sortOrder: 'Display volgorde',
        createdAt: 'Aanmaak timestamp',
      },
      createAccountTitle: 'Maak een Rekening',
      requestTitle: 'Request',
      responseTitle: 'Response',
      accountTypesTitle: 'Rekening Types',
      accountTypes: [
        { type: 'checking', description: 'Standaard betaalrekening' },
        { type: 'savings', description: 'Spaarrekening' },
        { type: 'credit', description: 'Creditcard rekening' },
      ],
    },
    // Transactions page
    transactions: {
      title: 'Transacties',
      subtitle:
        'Zoek, filter en beheer je financiële transacties. Importeer vanuit bankexports of maak handmatig aan.',
      listTitle: 'Transacties ophalen',
      listText: 'Haal transacties op met krachtige filteropties:',
      queryParams: 'Query parameters',
      startDateDesc: 'Filter vanaf deze datum (JJJJ-MM-DD)',
      endDateDesc: 'Filter tot deze datum (JJJJ-MM-DD)',
      categoryDesc: 'Filter op categorie ID of naam',
      typeDesc: 'inkomsten of uitgaven',
      searchDesc: 'Zoek in omschrijving en tegenpartij',
      limitDesc: 'Aantal resultaten (standaard: 50, max: 500)',
      pageDesc: 'Paginanummer voor paginering',
      updateTitle: 'Transactie bijwerken',
      updateText:
        'Wijzig een transactie om de categorie te veranderen, notities toe te voegen of andere velden bij te werken:',
      importTitle: 'Importeren vanuit CSV',
      importText: 'Bulk import transacties vanuit je bankexport:',
      supportedBanks: 'Ondersteunde banken',
      supportedBanksText:
        'Momenteel worden ING en ASN Bank CSV exports ondersteund. Meer banken worden toegevoegd in toekomstige updates.',
      endpointsTitle: 'Transactie Endpoints',
      endpoints: {
        list: 'Lijst transacties (met filters)',
        get: 'Haal transactie op op ID',
        update: 'Update transactie',
        delete: 'Verwijder transactie',
        deleteAll: 'Verwijder alle transacties',
      },
      transactionObjectTitle: 'Het Transactie Object',
      fieldsTitle: 'Velden',
      fields: {
        id: 'Unieke identifier',
        accountId: 'Gekoppelde rekening ID',
        date: 'Transactie datum',
        amount: 'Bedrag (positief = inkomsten, negatief = uitgaven)',
        description: 'Transactie omschrijving',
        opposingAccountIban: 'Tegenrekening IBAN',
        opposingAccountName: 'Tegenrekening naam',
        categoryId: 'Gekoppelde categorie ID',
        type: 'Type: income of expense',
        notes: 'Gebruiker notities',
      },
      filteringTitle: 'Transacties Filteren',
      filteringText:
        'Het GET /api/transactions endpoint ondersteunt uitgebreide filtering:',
      filterParams: {
        accountId: 'Filter op rekening',
        categoryId: 'Filter op categorie',
        startDate: 'Transacties vanaf datum',
        endDate: 'Transacties tot datum',
        type: 'Filter op type (income/expense)',
        search: 'Zoek in omschrijving',
        minAmount: 'Minimum bedrag',
        maxAmount: 'Maximum bedrag',
      },
      exampleTitle: 'Voorbeeld: Gefilterde Transacties',
      requestTitle: 'Request',
      responseTitle: 'Response',
    },
    // Categories page
    categories: {
      title: 'Categorieën',
      subtitle:
        'Organiseer je transacties met aangepaste categorieën. Stel kleuren, iconen en automatische categorisatieregels in.',
      listTitle: 'Categorieën ophalen',
      listText: 'Haal alle categorieën op met transactie-aantallen:',
      createTitle: 'Categorie aanmaken',
      createText: 'Voeg een nieuwe categorie toe met aangepaste stijl:',
      requestBody: 'Request body',
      nameDesc: 'Weergavenaam van de categorie',
      colorDesc: 'Hex kleurcode (bijv. #22c55e)',
      iconDesc: 'Emoji icoon voor de categorie',
      typeDesc: 'inkomsten of uitgaven',
      updateTitle: 'Categorie bijwerken',
      updateText: 'Wijzig een bestaande categorie:',
      deleteTitle: 'Categorie verwijderen',
      deleteText:
        'Verwijder een categorie. Transacties worden ongecategoriseerd:',
      autoCategorizationTitle: 'Auto-categorisatie',
      autoCategorizationText:
        'Fluxby kan transacties automatisch categoriseren op basis van regels die je definieert. Stel regels in via de app onder Categorieën → Regels, of gebruik de API voor aangepaste automatisering.',
      endpointsTitle: 'Categorie Endpoints',
      endpoints: {
        list: 'Lijst alle categorieën',
        create: 'Maak nieuwe categorie',
        get: 'Haal categorie op op ID',
        update: 'Update categorie',
        delete: 'Verwijder categorie',
      },
      categoryObjectTitle: 'Het Categorie Object',
      fieldsTitle: 'Velden',
      fields: {
        id: 'Unieke identifier',
        name: 'Categorie naam',
        icon: 'Emoji icoon',
        color: 'Hex kleur code',
        description: 'Optionele beschrijving',
      },
      createCategoryTitle: 'Maak een Categorie',
      requestTitle: 'Request',
      responseTitle: 'Response',
      ruleEndpoints: {
        list: 'Lijst alle regels',
        create: 'Maak nieuwe regel',
        delete: 'Verwijder regel',
        apply: 'Pas regel toe op bestaande transacties',
        applyAll: 'Pas alle regels toe',
      },
      ruleExampleTitle: 'Voorbeeld: Maak een Regel',
      ruleExampleText:
        "Dit zal automatisch alle transacties die 'albert heijn' of 'jumbo' bevatten categoriseren:",
    },
    // Budgets page
    budgets: {
      title: 'Budgetten',
      subtitle:
        'Stel bestedingslimieten in en volg je voortgang. Ontvang meldingen wanneer je budgetlimieten nadert of overschrijdt.',
      listTitle: 'Budgetten ophalen',
      listText: 'Haal alle budgetten op met huidige bestedingsvoortgang:',
      progressNote: 'Voortgang bijhouden',
      progressNoteText:
        'De API berekent automatisch het bestede bedrag, resterend budget en percentage voor elke budgetperiode.',
      createTitle: 'Budget aanmaken',
      createText: 'Stel een nieuw budget in met een bestedingslimiet:',
      requestBody: 'Request body',
      nameDesc: 'Weergavenaam van het budget',
      amountDesc: "Budgetlimiet in euro's",
      categoryIdDesc: 'Koppeling aan een specifieke categorie',
      periodDesc: 'wekelijks, maandelijks of jaarlijks',
      updateTitle: 'Budget bijwerken',
      updateText: 'Wijzig een budgetlimiet of instellingen:',
      deleteTitle: 'Budget verwijderen',
      deleteText: 'Verwijder een budget:',
      endpointsTitle: 'Budget Endpoints',
      endpoints: {
        list: 'Lijst alle budgetten met voortgang',
        create: 'Maak nieuw budget',
        update: 'Update budget',
        delete: 'Verwijder budget',
      },
      budgetObjectTitle: 'Het Budget Object',
      fieldsTitle: 'Velden',
      fields: {
        id: 'Unieke identifier',
        categoryId: 'Gekoppelde categorie (null voor totaal budget)',
        amount: 'Budget limiet in euros',
        period: 'Budget periode',
        spent: 'Uitgegeven dit periode (berekend)',
        remaining: 'Resterend budget (berekend)',
        percentage: 'Percentage gebruikt (berekend)',
      },
      createBudgetTitle: 'Maak een Budget',
      requestTitle: 'Request',
      responseTitle: 'Response',
      budgetTypesTitle: 'Budget Types',
      budgetTypes: [
        {
          type: 'Categorie Budget',
          description:
            'Stel een limiet in voor een specifieke categorie (bijv. €500 voor Boodschappen)',
        },
        {
          type: 'Totaal Budget',
          description:
            'Stel een overall maandelijkse uitgavenlimiet in door categoryId weg te laten',
        },
      ],
      progressTrackingTitle: 'Voortgang Volgen',
      progressTrackingText:
        'Wanneer je budgetten ophaalt, zijn de spent, remaining en percentage velden automatisch berekend op basis van transacties in de huidige periode.',
    },
    // Subscriptions page
    subscriptions: {
      title: 'Abonnementen',
      subtitle:
        'Detecteer en beheer terugkerende betalingen automatisch. Krijg inzicht in je maandelijkse vaste lasten.',
      detectionNote: 'Automatische detectie',
      detectionNoteText:
        'Fluxby analyseert je transactiehistorie en detecteert automatisch terugkerende patronen. Patronen worden gedetecteerd wanneer dezelfde merchant minimaal 3 keer voorkomt met regelmatige intervallen.',
      objectTitle: 'Het Patroon Object',
      objectText:
        'Een recurring pattern representeert een gedetecteerd abonnement of terugkerende betaling.',
      fields: {
        id: 'Unieke identifier',
        merchantName: 'Naam van de merchant',
        patternType: 'weekly, biweekly, monthly, quarterly, yearly',
        avgAmount: 'Gemiddeld bedrag (negatief voor uitgaven)',
        lastAmount: 'Laatste afgeschreven bedrag',
        nextExpectedDate: 'Verwachte volgende afschrijfdatum',
        isConfirmed: 'Of het patroon door de gebruiker is bevestigd',
        isVariable: 'Of het bedrag varieert (>10% afwijking)',
        transactionCount: 'Aantal keer dat dit patroon is gedetecteerd',
      },
      listTitle: 'Patronen ophalen',
      listText: 'Haal alle gedetecteerde terugkerende patronen op:',
      params: {
        activeOnly: 'Alleen actieve patronen (default: true)',
        startDate: 'Startdatum',
        endDate: 'Einddatum',
      },
      statsTitle: 'Statistieken ophalen',
      statsText: 'Krijg een overzicht van je terugkerende kosten:',
      calendarTitle: 'Verwachte betalingen',
      calendarText: 'Haal verwachte betalingen op voor een datumbereik:',
      detectTitle: 'Patronen detecteren',
      detectText: 'Voer patroondetectie uit op je transactiehistorie:',
      detectNote: 'Detectie criteria',
      detectCriteria: {
        minTransactions: 'Minimaal 3 transacties van dezelfde merchant',
        minSpan: 'Transacties moeten over minimaal 2 maanden verspreid zijn',
        consistency: 'Consistente intervallen (±3 dagen tolerantie)',
      },
      actionsTitle: 'Patronen beheren',
      actionsText:
        'Bevestig patronen als echte abonnementen of negeer false positives:',
      confirmTitle: 'Patroon bevestigen',
      dismissTitle: 'Patroon negeren',
      deleteTitle: 'Patroon verwijderen',
      patternTypesTitle: 'Patroon types',
      patternTypesText: 'Fluxby detecteert de volgende patronen:',
      intervalColumn: 'Interval',
      exampleColumn: 'Voorbeeld',
      days: 'dagen',
      examples: {
        weekly: 'Wekelijkse boodschappen',
        biweekly: 'Tweewekelijkse loon',
        monthly: 'Netflix, Spotify, huur',
        quarterly: 'Kwartaalabonnement',
        yearly: 'Jaarabonnement, verzekering',
      },
      endpointsTitle: 'Alle Endpoints',
      endpoints: {
        list: 'Lijst alle patronen op',
        stats: 'Haal statistieken op',
        calendar: 'Haal verwachte betalingen op',
        detect: 'Voer patroondetectie uit',
        confirm: 'Bevestig een patroon',
        dismiss: 'Negeer een patroon',
        delete: 'Verwijder een patroon',
      },
    },
    // Analytics page
    analytics: {
      title: 'Analyses',
      subtitle:
        'Krijg inzicht in je bestedingspatronen met uitgebreide analyse-endpoints.',
      dashboardTitle: 'Dashboard statistieken',
      dashboardText: 'Krijg een overzicht van je financiële gezondheid:',
      monthlyTitle: 'Maandelijkse data',
      monthlyText:
        'Haal gedetailleerde maandstatistieken op met dagelijkse uitsplitsing:',
      queryParams: 'Query parameters',
      yearDesc: 'Jaar (bijv. 2024)',
      monthDesc: 'Maand (1-12)',
      categoriesTitle: 'Categorie uitsplitsing',
      categoriesText: 'Bekijk hoe uitgaven verdeeld zijn over categorieën:',
      tipTitle: 'Pro tip',
      tipText:
        'Combineer analyse-endpoints met transactiefilters om aangepaste rapporten te maken. Vergelijk bijvoorbeeld uitgaven tussen maanden of volg categorie trends over tijd.',
      endpointsTitle: 'Analytics Endpoints',
      endpoints: {
        dashboard: 'Dashboard statistieken overzicht',
        monthly: 'Maandelijkse breakdown',
        categories: 'Uitgaven per categorie',
        trends: 'Inkomsten/uitgaven trends',
      },
      dashboardFieldsTitle: 'Response Velden',
      dashboardFields: {
        totalIncome: 'Totaal inkomsten in periode',
        totalExpenses: 'Totaal uitgaven in periode',
        balance: 'Netto balans (inkomsten - uitgaven)',
        transactionCount: 'Aantal transacties',
        topCategories: 'Top uitgave categorieën',
      },
      categoryTitle: 'Categorie Analytics',
      categoryText: 'Analyseer uitgaven per categorie:',
    },
    // Address Book page
    addressBook: {
      title: 'Adresboek',
      subtitle:
        'Beheer contacten en tegenpartijen uit je transacties. Koppel automatisch transacties aan contacten, schoon namen op en beheer gedeelde IBANs.',
      overviewTitle: '📒 Wat is het adresboek?',
      overviewText:
        'Het adresboek haalt automatisch tegenpartijen uit je transacties op basis van IBAN en naam. Het helpt je bij het organiseren van contacten, opschonen van rommelige banknamen en bijhouden van uitgaven per handelaar.',
      endpointsTitle: 'Adresboek endpoints',
      listTitle: 'Contacten ophalen',
      listText:
        'Haal alle contacten op met transactiestatistieken. Ondersteunt filteren en sorteren.',
      createTitle: 'Contact aanmaken',
      createText:
        'Handmatig een nieuw adresboekcontact aanmaken. Transacties worden automatisch gekoppeld.',
      cleanupRulesTitle: 'Naam opschoonregels',
      cleanupRulesText:
        'Maak regels om automatisch rommelige banknamen op te schonen. Regels kunnen letterlijke tekst of regex patronen gebruiken.',
      sharedIbansTitle: 'Gedeelde IBANs (betalingsverwerkers)',
      sharedIbansText:
        'Sommige IBANs worden gedeeld door meerdere handelaren (zoals iDEAL of PayPal). Markeer deze als gedeeld om contact-tracking op handelaarsniveau mogelijk te maken.',
      sharedIbansNote: 'Waarom gedeelde IBANs?',
      sharedIbansExplanation:
        'Betalingsverwerkers zoals iDEAL, Mollie en PayPal gebruiken één IBAN voor duizenden verschillende handelaren. Door deze als gedeeld te markeren, volgt Fluxby de werkelijke handelaarsnaam in plaats van alleen de IBAN.',
      mergeTitle: 'Contacten samenvoegen & splitsen',
      mergeText:
        'Combineer dubbele contacten of splits contacten die meerdere handelaren vertegenwoordigen.',
      multiIbanTitle: 'Multi-IBAN contacten',
      multiIbanText:
        'Sommige contacten (zoals grote bedrijven) kunnen meerdere IBANs hebben. Je kunt extra IBANs aan één contact koppelen.',
      objectTitle: 'Het contact object',
      endpoints: {
        list: 'Lijst alle contacten met transactie statistieken',
        create: 'Maak nieuw contact',
        get: 'Haal contact op met ID',
        update: 'Update contact',
        delete: 'Contacten verwijderen',
      },
      params: {
        search: 'Zoek op naam of IBAN',
        sortBy:
          'Sorteer veld: name, transactionCount, totalExpenses, lastTransactionDate',
        sortOrder: 'Sorteer richting: asc of desc',
      },
      cleanupEndpoints: {
        list: 'Lijst alle opschoon regels',
        create: 'Maak opschoon regel',
        delete: 'Verwijder opschoon regel',
        apply: 'Pas alle regels toe op contacten',
      },
      sharedEndpoints: {
        list: 'Lijst alle gedeelde IBANs',
        create: 'Voeg gedeelde IBAN toe',
        delete: 'Verwijder gedeelde IBAN',
        detect: 'Auto-detecteer gedeelde IBANs',
      },
      mergeEndpoints: {
        merge: 'Voeg contacten samen tot één',
        duplicates: 'Auto-detecteer en voeg duplicaten samen',
        split: 'Splits contact in meerdere',
      },
      ibanEndpoints: {
        list: 'Lijst IBANs voor contact',
        add: 'Voeg IBAN toe aan contact',
        remove: 'Verwijder IBAN van contact',
      },
      fields: {
        id: 'Unieke identifier',
        iban: 'Primaire IBAN',
        name: 'Weergavenaam (kan opgeschoond zijn)',
        originalName: 'Originele banknaam (voor gedeelde IBANs)',
        description: 'Optionele beschrijving',
        notes: 'Gebruiker notities',
        transactionCount: 'Aantal gekoppelde transacties',
        totalIncome: 'Totaal inkomsten van dit contact',
        totalExpenses: 'Totaal uitgaven aan dit contact',
        netAmount: 'Netto bedrag (inkomsten - uitgaven)',
        lastTransactionDate: 'Datum van meest recente transactie',
      },
    },
    // Import page
    import: {
      title: 'Import',
      subtitle:
        'Importeer banktransacties vanuit CSV-bestanden. Ondersteunt momenteel ING bankformaat met automatische accountdetectie en duplicaatpreventie.',
      csvTitle: 'CSV importeren',
      csvText:
        'Upload en importeer een CSV-bestand met banktransacties. Het systeem detecteert automatisch accounts, voorkomt duplicaten, past categorieregels toe en schoont tegenpartijnamen op met je opschoonregels.',
      formData: 'Form Data',
      fileDesc: 'CSV-bestand (max 10MB)',
      bankDesc:
        "Banktype (standaard: 'ing'). Momenteel wordt alleen 'ing' ondersteund.",
      previewTitle: 'CSV voorvertoning',
      previewText:
        'Bekijk een CSV-bestand voordat je importeert. Toont gedetecteerde accounts, datumbereik en voorbeeldtransacties.',
      historyTitle: 'Importgeschiedenis',
      historyText:
        'Haal een lijst op van alle eerdere imports met hun status en transactieaantallen.',
      tipTitle: 'Tip',
      tipText:
        'Het importsysteem past automatisch je categorieregels toe om transacties te categoriseren, past naam-opschoonregels toe om tegenpartijnamen op te schonen en voegt nieuwe contacten toe aan je adresboek.',
    },
    // Data management page
    data: {
      title: 'Data beheer',
      subtitle:
        'Exporteer en importeer volledige datasets voor backupdoeleinden, of reset alle data naar de demo-status.',
      exportTitle: 'Data exporteren',
      exportText:
        'Exporteer alle data als JSON-bestand voor backup of migratie doeleinden.',
      importTitle: 'Data importeren',
      importText:
        'Importeer een volledige dataset uit een JSON-backup. Let op: dit vervangt alle bestaande data.',
      resetTitle: 'Data resetten',
      resetText:
        'Reset alle data en herstel de demo-status. Dit verwijdert ALLE data over alle profielen en maakt een nieuw demo-profiel aan met standaard categorieën. Dit kan niet ongedaan gemaakt worden.',
      warningTitle: 'Let op',
      warningText:
        'De reset endpoint verwijdert ALLE data over ALLE profielen. Dit is bedoeld voor een volledige reset naar factory settings. Maak eerst een backup met de export functie als je je data wilt behouden.',
    },
    // OpenAPI specification page
    openapi: {
      title: 'OpenAPI Specificatie',
      subtitle:
        'Download de complete OpenAPI 3.0 specificatie voor de Fluxby API.',
      download: 'Download JSON',
      copy: 'Kopieer naar klembord',
      openInSwagger: 'Open in Swagger UI',
      howToUse: 'Hoe te gebruiken',
      withSwagger: 'Met Swagger UI',
      swaggerStep1: 'Ga naar /api/docs in je browser',
      swaggerStep2: 'Bekijk alle beschikbare endpoints',
      swaggerStep3: 'Test endpoints direct in de browser',
      swaggerStep4: 'Bekijk request/response voorbeelden',
      withPostman: 'Met Postman',
      postmanStep1: 'Importeer de OpenAPI spec in Postman',
      postmanStep2: 'Genereer een collectie van alle endpoints',
      postmanStep3: 'Configureer environment variables',
      postmanStep4: 'Test endpoints met automatisch gegenereerde requests',
      withCode: 'In je code',
      codeDescription:
        'Gebruik de OpenAPI spec om client libraries te genereren voor je favoriete programmeertaal.',
      withBruno: 'Met Bruno',
      brunoDescription:
        'Bruno is een open-source API client die perfect werkt met OpenAPI specs.',
      brunoStep1: 'Importeer de OpenAPI spec in Bruno',
      brunoStep2: 'Genereer een collectie van alle endpoints',
      brunoStep3: 'Configureer environment variables',
      brunoStep4: 'Test endpoints met automatisch gegenereerde requests',
      downloadBruno: 'Download Bruno',
      viewCollection: 'Bekijk Fluxby Collectie',
      specPreview: 'OpenAPI Specificatie Voorvertoning',
    },
    // Common docs strings
    common: {
      method: 'Methode',
      endpoint: 'Endpoint',
      description: 'Beschrijving',
      queryParams: 'Query Parameters',
      param: 'Parameter',
      type: 'Type',
      field: 'Veld',
      tableField: 'Veld',
      tableType: 'Type',
      tableRequired: 'Verplicht',
      tableDescription: 'Beschrijving',
      yes: 'Ja',
      no: 'Nee',
    },
  },
  helpCenter: {
    badge: 'Helpcentrum',
    userGuide: 'Gebruikersgids',
    developerHub: 'Developer Hub',
    footerText: 'We helpen je graag verder.',
    search: 'Zoeken...',
    userSubtitle: 'Leer hoe je Fluxby gebruikt',
    devSubtitle: 'Bouw met de Fluxby API',
    userNav: {
      gettingStarted: 'Aan de slag',
      welcome: 'Welkom',
      bankConnection: 'Bank verbinden',
      firstSteps: 'Eerste stappen',
      installation: 'Installatie',
      features: 'Functies',
      transactions: 'Transacties',
      bulkDelete: 'Bulk verwijderen',
      categories: 'Categorieën',
      accounts: 'Rekeningen',
      addressBook: 'Adresboek',
      budgeting: 'Budgetteren & Analytics',
      createBudget: 'Budget maken',
      subscriptions: 'Abonnementen',
      understandAnalytics: 'Analytics begrijpen',
      security: 'Beveiliging & Privacy',
      sync: 'Apparaat synchronisatie',
      dataPrivacy: 'Je data & privacy',
    },
    devNav: {
      gettingStarted: 'Aan de slag',
      introduction: 'Introductie',
      apiKeys: 'API Keys',
      apiReference: 'API Referentie',
      endpoints: 'Endpoints',
      webhooks: 'Webhooks',
      resources: 'Resources',
      swagger: 'Swagger Docs',
      devDocs: 'Developer Docs',
    },
    home: {
      title: 'Hoe kunnen we je helpen?',
      subtitle: 'Vind antwoorden op je vragen over Fluxby',
      userGuideTitle: 'Gebruikersgids',
      userGuideDesc:
        'Leer hoe je je geld beheert, budgetten instelt en uitgaven volgt met Fluxby.',
      userItem1: 'Verbind je bankrekening',
      userItem2: 'Maak budgetten & doelen',
      userItem3: 'Begrijp je privacy',
      devHubTitle: 'Developer Hub',
      devHubDesc:
        'Bouw integraties met de Fluxby API. Toegang tot documentatie, endpoints en webhooks.',
      getStarted: 'Aan de slag',
      viewDocs: 'Bekijk documentatie',
      popularArticles: 'Populaire artikelen',
      article1: 'Je bank verbinden',
      article1Desc: 'Leer hoe je transacties importeert',
      article2: 'Een budget maken',
      article2Desc: 'Stel je eerste maandbudget in',
      article3: 'API documentatie',
      article3Desc: 'Volledige API referentie voor developers',
    },
    firstSteps: {
      title: 'Eerste stappen met Fluxby',
      subtitle:
        'Begin met Fluxby in slechts enkele minuten. Deze gids legt de nieuwe onboarding uit.',
      step1Title: 'Stap 1: Inloggen & onboarding',
      step1Text:
        'Wanneer je Fluxby voor het eerst opent, word je begeleid door een korte onboarding wizard. Je kunt inloggen, een wachtwoord instellen en je eerste profiel aanmaken (bijv. "Persoonlijk" of "Gezin").',
      step2Title: 'Stap 2: Exporteren vanuit je bank',
      step2Text:
        'Log in op de website of app van je bank en exporteer je transacties als CSV-bestand. De meeste banken bieden deze optie in de "Export" of "Download" sectie.',
      step3Title: 'Stap 3: Importeer je transacties',
      step3Text:
        'Ga naar de Import pagina in Fluxby en sleep je CSV-bestand, of klik om te bladeren. Fluxby detecteert automatisch het formaat en importeert je transacties.',
      step4Title: 'Stap 4: Categoriseer transacties',
      step4Text:
        'Na het importeren ga je naar de Transacties pagina om je transacties te categoriseren. Klik op een transactie om een categorie toe te wijzen. Fluxby leert van je keuzes en zal vergelijkbare transacties in de toekomst automatisch categoriseren.',
      step5Title: 'Stap 5: Verken je dashboard',
      step5Text:
        'Ga nu naar het Dashboard om je financiële overzicht te zien! Je ziet je saldo, uitgaven per categorie en recente transacties.',
      nextStepsTitle: 'Wat nu?',
      next1: 'Stel budgetten in om je uitgavendoelen te volgen',
      next2: 'Maak aangepaste categorieën voor betere organisatie',
      next3:
        'Voeg contacten toe in het Adresboek om bij te houden met wie je transacties doet',
      next4:
        'Importeer regelmatig transacties om je gegevens up-to-date te houden',
    },
    installation: {
      title: 'Fluxby installeren',
      subtitle:
        'Fluxby werkt in je browser zonder installatie, maar je kunt het ook als app installeren voor een betere ervaring.',
      desktopTitle: 'Desktop (Windows, macOS, Linux)',
      desktopText:
        'Voor de beste ervaring op desktop, download de native app van onze Downloads pagina. Native apps bieden betere prestaties en werken offline.',
      browserTitle: 'Webbrowser',
      browserText:
        'Fluxby werkt direct in je browser. Bezoek de app URL en begin met gebruiken - geen installatie nodig. Je data wordt lokaal in je browser opgeslagen.',
      iosTitle: 'iPhone & iPad',
      iosIntro:
        'Fluxby kan als Progressive Web App (PWA) worden geïnstalleerd op je iPhone of iPad. Dit geeft je een app-achtige ervaring met een beginscherm icoon.',
      iosStep1Title: 'Open in Safari',
      iosStep1Text:
        'Open Fluxby in Safari (niet Chrome of een andere browser). Safari is vereist voor PWA installatie op iOS.',
      iosStep2Title: 'Tik op de Deel knop',
      iosStep2Text:
        'Tik op de Deel knop onderaan Safari (het vierkant met een pijl omhoog).',
      iosStep3Title: 'Zet op beginscherm',
      iosStep3Text:
        'Scroll naar beneden en tik op "Zet op beginscherm". Je moet mogelijk naar rechts scrollen om deze optie te vinden.',
      iosStep4Title: 'Bevestigen',
      iosStep4Text:
        'Tik op "Voeg toe" rechtsboven. Fluxby verschijnt nu op je beginscherm zoals elke andere app.',
      iosTipTitle: 'Tip',
      iosTipText:
        'Eenmaal geïnstalleerd opent Fluxby in volledig scherm zonder de Safari adresbalk. Je data wordt lokaal op je apparaat opgeslagen en synchroniseert tussen je geïnstalleerde apps via peer-to-peer sync.',
      androidTitle: 'Android',
      androidIntro:
        'Op Android kun je Fluxby als PWA installeren vanuit Chrome of andere browsers.',
      androidStep1Title: 'Open in Chrome',
      androidStep1Text:
        'Open Fluxby in Chrome (of een andere compatibele browser zoals Edge).',
      androidStep2Title: 'Zoek naar de installatieprompt',
      androidStep2Text:
        'Chrome kan een "App installeren" banner onderaan tonen. Als je deze ziet, tik op "Installeren".',
      androidStep3Title: 'Of gebruik het menu',
      androidStep3Text:
        'Tik op het drie-puntjes menu in Chrome en selecteer "App installeren" of "Toevoegen aan startscherm".',
      dataStorageTitle: 'Over je data',
      dataStorageText:
        'Ongeacht hoe je Fluxby opent, je data wordt lokaal op je apparaat opgeslagen. Als je Fluxby in een browser gebruikt, wordt je data in die browser opgeslagen. Als je de app installeert, wordt data in de app opgeslagen. Gebruik de sync functie om je data gesynchroniseerd te houden tussen apparaten.',
    },
    bankConnection: {
      title: 'Je bankrekening verbinden',
      subtitle: 'Importeer transacties van je bank om je financiën te volgen.',
      howItWorksTitle: 'Hoe het werkt',
      howItWorksText:
        'Fluxby gebruikt CSV imports om je banktransacties in de app te brengen. Deze aanpak zorgt ervoor dat je data 100% lokaal op je apparaat blijft - geen cloud verbindingen nodig.',
      step1Title: 'Stap 1: Exporteren van je bank',
      step1Text:
        'Log in op je online banking en download je transactiegeschiedenis als CSV-bestand. De meeste banken bieden deze optie in de rekening overzichten of transactie geschiedenis sectie.',
      step2Title: 'Stap 2: Importeren in Fluxby',
      step2Text:
        'Navigeer naar de Import pagina in Fluxby en sleep je CSV-bestand, of klik om te bladeren.',
      step3Title: 'Stap 3: Controleren en categoriseren',
      step3Text:
        'Na het importeren categoriseert Fluxby automatisch je transacties op basis van je regels. Je kunt categorieën controleren en aanpassen indien nodig.',
      tipTitle: 'Pro Tip',
      tipText:
        'Stel auto-categorisatie regels in om transacties van specifieke verkopers automatisch te taggen. Dit bespaart je tijd bij toekomstige imports!',
      supportedTitle: 'Ondersteunde banken',
      supportedText: 'Momenteel ondersteunt Fluxby CSV imports van:',
      moreComingSoon: 'Meer banken komen binnenkort...',
    },
    budgeting: {
      title: 'Een maandbudget maken',
      subtitle:
        'Stel uitgavenlimieten in en volg je voortgang met visuele budgetten.',
      whatIsTitle: 'Wat is een budget?',
      whatIsText:
        'Een budget in Fluxby is een uitgavenlimiet die je instelt voor een specifieke categorie of je totale maandelijkse uitgaven. Als je transacties doet, volgt Fluxby automatisch je uitgaven ten opzichte van deze limieten.',
      createTitle: 'Je eerste budget maken',
      step1: 'Navigeer naar de Budgetten pagina vanuit de zijbalk',
      step2: 'Klik op "Nieuw Budget" om het aanmaak dialoog te openen',
      step3: 'Selecteer een categorie (of laat leeg voor totaal budget)',
      step4: 'Voer je budgetbedrag in en selecteer de periode',
      step5: 'Klik op Opslaan om je budget te maken',
      typesTitle: 'Budget types',
      categoryBudgetTitle: 'Categorie budgetten',
      categoryBudgetText:
        'Stel een limiet in voor een specifieke categorie zoals Boodschappen, Entertainment of Vervoer. Dit helpt je uitgaven in specifieke gebieden te beheersen.',
      totalBudgetTitle: 'Totaal budget',
      totalBudgetText:
        'Stel een totale maandelijkse uitgavenlimiet in over alle categorieën. Dit geeft je een overzicht van je totale uitgaven.',
      bestPracticeTitle: 'Best Practice',
      bestPracticeText:
        'Begin met een totaal budget gebaseerd op je typische maandelijkse uitgaven, voeg dan categorie-specifieke budgetten toe voor gebieden waar je wilt bezuinigen.',
      trackingTitle: 'Je voortgang volgen',
      trackingText:
        'De budget kaarten tonen je uitgaven voortgang in real-time. De circulaire voortgangsindicator vult zich naarmate je je limiet nadert, van kleur veranderend van groen naar geel naar rood.',
    },
    subscriptions: {
      title: 'Abonnementen beheren',
      subtitle:
        'Houd al je terugkerende betalingen bij en krijg meldingen bij prijswijzigingen.',
      whatIsTitle: 'Wat zijn abonnementen in Fluxby?',
      whatIsText:
        'Fluxby detecteert automatisch terugkerende betalingen in je transacties, zoals streaming diensten, sportschool abonnementen en nutsvoorzieningen. Je krijgt een overzicht van al je maandelijkse vaste lasten en wordt gewaarschuwd wanneer prijzen veranderen.',
      detectionTitle: 'Hoe werkt automatische detectie?',
      detectionText:
        'Wanneer je transacties importeert, analyseert Fluxby de patronen in je betalingen. Als een betaling regelmatig terugkeert (wekelijks, maandelijks, per kwartaal of jaarlijks), wordt deze automatisch herkend als een abonnement.',
      step1: 'Importeer je transacties via de Import pagina',
      step2: 'Fluxby analyseert automatisch terugkerende patronen',
      step3: 'Bevestig gedetecteerde abonnementen of wijs ze af',
      step4: 'Bekijk je totale maandelijkse vaste lasten in het overzicht',
      confirmTitle: 'Abonnementen bevestigen of afwijzen',
      confirmText:
        'Niet alle gedetecteerde patronen zijn daadwerkelijk abonnementen. Je kunt zelf aangeven welke terugkerende betalingen je als abonnement wilt bijhouden:',
      confirmButton: 'Bevestigen',
      confirmButtonText:
        'Het patroon wordt toegevoegd aan je actieve abonnementen',
      dismissButton: 'Afwijzen',
      dismissButtonText: 'Het patroon wordt genegeerd en niet meer getoond',
      tipTitle: 'Tip',
      tipText:
        'Bevestig alleen echte abonnementen die je wilt volgen. Dit houdt je overzicht overzichtelijk en je maandelijkse totaal nauwkeurig.',
      priceAlertsTitle: 'Prijswijziging meldingen',
      priceAlertsText:
        'Fluxby houdt de bedragen van je abonnementen bij. Als een abonnement ineens meer of minder kost dan normaal, krijg je een melding. Je kunt dan kiezen om het nieuwe bedrag te accepteren of te negeren.',
      priceIncreaseTitle: 'Prijsstijging',
      priceIncreaseText:
        'Een rood pijltje omhoog geeft aan dat een abonnement duurder is geworden. Dit kan betekenen dat de dienst haar prijzen heeft verhoogd.',
      priceDecreaseTitle: 'Prijsdaling',
      priceDecreaseText:
        'Een groen pijltje omlaag geeft aan dat je minder hebt betaald dan normaal. Dit kan een tijdelijke korting of promotie zijn.',
      monthlyOverviewTitle: 'Maandelijks overzicht',
      monthlyOverviewText:
        'Bovenaan de Abonnementen pagina zie je het totaalbedrag dat je maandelijks uitgeeft aan abonnementen. Dit helpt je om inzicht te krijgen in je vaste lasten en waar je mogelijk kunt besparen.',
      bestPracticeTitle: 'Best practice',
      bestPracticeText:
        'Controleer regelmatig je abonnementen. Veel mensen betalen voor diensten die ze niet meer gebruiken. Door je abonnementen te monitoren kun je eenvoudig geld besparen.',
    },
    privacy: {
      title: 'Je data & privacy',
      subtitle:
        'Fluxby is ontworpen met privacy voorop. Je financiële data blijft op je apparaat.',
      localFirstTitle: '100% Lokaal',
      localFirstText:
        'In tegenstelling tot de meeste finance apps, draait Fluxby volledig op je computer. Je transactiedata, budgetten en categorieën worden opgeslagen in een lokale SQLite database - ze verlaten nooit je apparaat.',
      noCloud: 'Geen cloud opslag',
      noCloudDesc: 'Data blijft op je machine',
      noTracking: 'Geen tracking',
      noTrackingDesc: 'We analyseren je uitgaven nooit',
      fullControl: 'Volledige controle',
      fullControlDesc: 'Verwijder alle data op elk moment',
      howWorksTitle: 'Hoe het werkt',
      howWorksText:
        'Fluxby draait volledig in je browser met SQLite en WebAssembly. Je data wordt lokaal opgeslagen in je browser (OPFS) of op je apparaat wanneer je de desktop app gebruikt. Geen servers nodig, geen externe verbindingen.',
      dataLocationTitle: 'Waar wordt mijn data opgeslagen?',
      dataLocationText:
        'Je data wordt opgeslagen in je browser via OPFS (Origin Private File System) voor de web app, of in je lokale app data map voor de desktop app. Je data verlaat nooit je apparaat.',
      deleteDataTitle: 'Je data verwijderen',
      deleteDataText:
        'Om al je financiële data volledig te verwijderen, kun je de Data Management sectie in Instellingen gebruiken, of je browser data wissen. Er is geen account om te sluiten of data om aan te vragen - het is allemaal lokaal.',
      warningTitle: 'Belangrijk',
      warningText:
        'Aangezien alle data lokaal wordt opgeslagen, overweeg om je data regelmatig te exporteren als je deze wilt bewaren. Je kunt synchroniseren tussen apparaten met de peer-to-peer sync functie.',
    },
    devIntro: {
      title: 'Developer Hub',
      subtitle:
        'Bouw integraties met de Fluxby API. Krijg programmatisch toegang tot je financiële data.',
      quickStartTitle: 'Snel aan de slag',
      quickStartText:
        'Voor ontwikkeling en headless mode, draai de Fluxby API server lokaal op http://localhost:3001/api. De hoofd web app draait volledig in je browser - geen backend nodig.',
      whatCanBuildTitle: 'Wat kun je bouwen?',
      customDashboards: 'Aangepaste Dashboards',
      customDashboardsDesc:
        'Bouw gepersonaliseerde visualisaties met je favoriete charting library',
      automations: 'Automatiseringen',
      automationsDesc:
        'Maak scripts die transacties categoriseren of rapporten genereren',
      mobileApps: 'Mobiele Apps',
      mobileAppsDesc:
        'Bouw mobiele companions die synchroniseren met je Fluxby data',
      notifications: 'Notificaties',
      notificationsDesc:
        'Stel alerts in voor budgetlimieten of ongewone uitgaven',
      resourcesTitle: 'Resources',
      fullDocsTitle: 'Volledige API Documentatie',
      fullDocsDesc: 'Complete referentie voor alle endpoints',
      swaggerTitle: 'Swagger UI',
      swaggerDesc: 'Interactieve API explorer',
    },
    placeholders: {
      bankExport: 'Bank Export Scherm',
      bankExportDesc:
        'Toon het bank selectie scherm met grote banken (ING, Rabobank, ABN AMRO). Markeer de export/download optie.',
      importPage: 'Import Pagina',
      importPageDesc:
        'Toon de Fluxby import pagina met het drag & drop gebied gemarkeerd. Voeg een voorbeeld toe van een succesvolle import met transactie telling.',
      budgetOverview: 'Budget Overzicht',
      budgetOverviewDesc:
        'Toon de Budget pagina met meerdere budget kaarten. Voeg een budget toe op 75% benutting met de circulaire voortgangsbalk, en categorie breakdown eronder.',
      budgetProgress: 'Budget Voortgang',
      budgetProgressDesc:
        'Toon een budget kaart met de circulaire voortgangsindicator in verschillende stadia (25%, 75%, 100%). Toon de bestede vs resterende bedragen.',
    },
    animations: {
      profile: {
        title: 'Nieuw profiel',
        placeholder: 'Persoonlijk',
        button: 'Aanmaken',
      },
      import: {
        dropText: 'Sleep CSV hier',
        fileName: 'transacties.csv',
        processing: 'Verwerken...',
      },
      dashboard: {
        balance: 'Saldo',
        income: 'Inkomsten',
        expenses: 'Uitgaven',
      },
      transactions: {
        search: 'Zoeken...',
        items: ['🛒 Albert Heijn', '⛽ Shell', '🍽️ Restaurant', '📺 Netflix'],
      },
      categories: {
        items: [
          { emoji: '🛒', name: 'Boodschappen', color: '#34D399' },
          { emoji: '🚗', name: 'Vervoer', color: '#3B82F6' },
          { emoji: '🍽️', name: 'Uit eten', color: '#F97316' },
          { emoji: '🎬', name: 'Entertainment', color: '#8B5CF6' },
        ],
      },
      budget: {
        title: 'Budget',
        spent: 'Uitgegeven',
        remaining: 'Resterend',
      },
      subscriptions: {
        title: 'Abonnementen',
        monthly: 'Maandelijks',
        netflix: 'Netflix',
        spotify: 'Spotify',
        gym: 'Sportschool',
      },
      accounts: {
        checking: 'Betaalrekening',
        savings: 'Spaarrekening',
      },
      trends: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'],
        income: 'Inkomsten',
        expenses: 'Uitgaven',
      },
      addressBook: {
        contacts: [
          { name: 'Albert Heijn', count: 24 },
          { name: 'Shell', count: 12 },
          { name: 'NS', count: 8 },
        ],
      },
      export: {
        formats: ['JSON', 'CSV'],
        exporting: 'Exporteren...',
      },
    },
  },

  // Legal pages
  legal: {
    privacyTitle: 'Privacybeleid',
    termsTitle: 'Gebruiksvoorwaarden',
    privacy: {
      lastUpdated: 'Laatst bijgewerkt:',
      introTitle: '1. Introductie',
      introText:
        'Dit Privacybeleid beschrijft hoe Fluxby ("wij", "ons" of "de App") met jouw gegevens omgaat.',
      introPhilosophy:
        'Wij geloven dat jouw financiële gegevens alleen van jou zijn. De kernfilosofie van deze App is absolute privacy. Wij beheren geen servers, wij vereisen geen gebruikersaccounts, en wij volgen jouw gedrag niet.',
      localFirstTitle: '2. De "Local-First" Architectuur',
      localFirstSubtitle: 'Alle gegevens blijven op jouw apparaat.',
      localFirstText:
        'Deze App werkt als een standalone hulpmiddel. Wanneer je uitgaven invoert, transacties categoriseert, of bankafschriften importeert, wordt die informatie lokaal opgeslagen in de interne opslag van jouw apparaat.',
      noCloudTitle: 'Geen Cloud Sync:',
      noCloudText: 'Wij synchroniseren jouw gegevens niet naar cloudservers.',
      noAccountsTitle: 'Geen Accounts:',
      noAccountsText:
        'Je hoeft geen gebruikersnaam of wachtwoord bij ons aan te maken.',
      noAITitle: 'Geen Third-Party AI:',
      noAIText:
        'Wij sturen jouw financiële beschrijvingen of adresboekgegevens niet naar externe AI-modellen (zoals OpenAI of Google Gemini) voor verwerking. Alle logica wordt lokaal uitgevoerd op de processor van je apparaat.',
      dataAccessTitle: '3. Gegevens Die We Benaderen',
      dataAccessText:
        'Om functionaliteit te bieden, kan de App toestemming vragen om specifieke gegevens op jouw apparaat te benaderen.',
      transactionDataTitle: 'A. Financiële Transactiegegevens',
      transactionDataText:
        "Wanneer je handmatig gegevens invoert of bestanden importeert (zoals CSV's of bankafschriften), verwerkt de App deze informatie om grafieken en categorieën te maken. Deze verwerking gebeurt direct op jouw apparaat. Wij zien (en kunnen) deze gegevens niet zien.",
      addressBookTitle: 'B. Adresboek / Contacten',
      addressBookText:
        'De App heeft een adresboekfunctie om transacties te koppelen aan specifieke personen of entiteiten. Als je toegang geeft tot je contacten, leest de App alleen deze gegevens om namen weer te geven binnen de App. Je contactenlijst wordt nooit geüpload of gedeeld.',
      fileStorageTitle: 'C. Bestandsopslag',
      fileStorageText:
        'De App heeft toegang tot je bestandsopslag nodig om bankafschriften te importeren en back-ups van je administratie op te slaan.',
      aiDisclosureTitle: '4. AI-Ontwikkeling Disclosure',
      aiDisclosureText:
        'Let op: de codebase voor deze App is volledig gegenereerd met behulp van Kunstmatige Intelligentie.',
      aiDisclosureDetails:
        'Vanuit een privacyperspectief betekent dit dat de app is ontworpen om te functioneren op basis van logica gegenereerd door AI-prompts. Hoewel we de AI hebben geïnstrueerd om strikt vast te houden aan lokale opslagprincipes, is er geen menselijk toezichtteam dat een backend database monitort—omdat er geen backend database is.',
      securityTitle: '5. Gegevensbeveiliging en Back-ups',
      securityText:
        'Omdat wij jouw gegevens niet opslaan, kunnen wij jouw gegevens niet herstellen als ze verloren gaan.',
      yourResponsibilityTitle: 'Jouw Verantwoordelijkheid:',
      yourResponsibilityText:
        'Jij bent verantwoordelijk voor de beveiliging van je fysieke apparaat.',
      backupsTitle: 'Back-ups:',
      backupsText:
        'Als je de App verwijdert of je telefoon verliest, zijn je financiële gegevens verloren, tenzij je gebruik hebt gemaakt van de ingebouwde back-upfuncties van je apparaat (bijv. iCloud Backup of Android Backup) of handmatig je gegevens hebt geëxporteerd.',
      thirdPartyTitle: '6. Third-Party Diensten',
      thirdPartyText:
        'De App integreert niet met third-party analytics of advertentienetwerken.',
      thirdPartyOS:
        'De App draait echter op een besturingssysteem (iOS of Android) dat mogelijk gebruiksstatistieken verzamelt onafhankelijk van onze App. Raadpleeg het privacybeleid van Apple of Google over hoe zij app-gebruiksgegevens verwerken.',
      changesTitle: '7. Wijzigingen in Dit Beleid',
      changesText:
        'We kunnen dit Privacybeleid van tijd tot tijd bijwerken. Aangezien we geen e-mailadressen verzamelen, kunnen we je niet direct informeren over wijzigingen. Je wordt geadviseerd deze pagina periodiek te bekijken voor eventuele wijzigingen.',
      contactTitle: '8. Contact',
      contactText:
        'Als je vragen hebt over hoe de App lokaal werkt op jouw apparaat, kun je',
      contactGithub: 'contact met mij opnemen op GitHub',
    },
    terms: {
      lastUpdated: 'Laatst bijgewerkt:',
      aiDisclaimerTitle:
        '1. De "Vibe Coded" Disclaimer (AI-Gegenereerde Software)',
      aiDisclaimerImportant:
        'BELANGRIJK: Je erkent en gaat ermee akkoord dat deze Applicatie volledig is geschreven en ontwikkeld door Kunstmatige Intelligentie (AI) op basis van prompts verstrekt door de ontwikkelaar.',
      experimentalNatureTitle: 'Experimentele Aard:',
      experimentalNatureText:
        'Deze software moet worden beschouwd als experimenteel.',
      noHumanReviewTitle: 'Geen Menselijke Code Review:',
      noHumanReviewText:
        'De code heeft geen professionele menselijke beveiligingsaudit of standaard enterprise-niveau kwaliteitsborging (QA) ondergaan.',
      unpredictabilityTitle: 'Onvoorspelbaarheid:',
      unpredictabilityText:
        'AI-gegenereerde code kan hallucinaties, logische fouten, of onverwacht gedrag bevatten dat een menselijke ontwikkelaar zou vermijden.',
      useAtOwnRisk: 'Je gebruikt deze applicatie volledig op eigen risico.',
      noFinancialAdviceTitle: '2. Geen Financieel Advies',
      noFinancialAdviceText:
        'Deze App is een hulpmiddel voor organisatie en visualisatie. Het is geen financieel adviseur, accountant of belastingprofessional.',
      calculationErrorsTitle: 'Rekenfouten:',
      calculationErrorsText:
        'Door de AI-gegenereerde aard van de code, kan de App wiskundige fouten maken, transacties verkeerd categoriseren, of onjuiste totalen weergeven.',
      noRelianceTitle: 'Geen Afhankelijkheid:',
      noRelianceText:
        'Je mag nooit uitsluitend op deze App vertrouwen voor belastingaangifte, bedrijfsboekhouding, of kritieke financiële beslissingen. Controleer cijfers altijd met je daadwerkelijke bankafschriften.',
      licenseTitle: '3. Gebruikslicentie',
      licenseText:
        'Wij verlenen je een persoonlijke, herroepbare, niet-exclusieve, niet-overdraagbare licentie om de App op je apparaat te gebruiken. Wij behouden het recht voor om de App op elk moment zonder kennisgeving stop te zetten.',
      userDataTitle: '4. Gebruikersgegevens en Verantwoordelijkheid',
      userDataText:
        'Zoals vermeld in ons Privacybeleid, werkt deze App offline en slaat gegevens lokaal op.',
      dataControllerTitle: 'Jij bent de Data Controller:',
      dataControllerText:
        'Jij bent als enige verantwoordelijk voor het maken van back-ups van je gegevens.',
      dataLossTitle: 'Gegevensverlies:',
      dataLossText:
        'De Ontwikkelaar is niet verantwoordelijk voor enig verlies van gegevens, corruptie van bestanden, of onmogelijkheid om je uitgavengeschiedenis te benaderen.',
      liabilityTitle: '5. Beperking van Aansprakelijkheid',
      liabilityText:
        'VOOR ZOVER WETTELIJK TOEGESTAAN, IS DE ONTWIKKELAAR NIET AANSPRAKELIJK VOOR ENIGE SCHADE.',
      liabilityIncludes: 'Dit omvat, maar is niet beperkt tot:',
      directDamagesTitle: 'Directe, Indirecte of Gevolgschade:',
      directDamagesText: 'Verlies van winst, gegevens of goodwill.',
      financialDiscrepanciesTitle: 'Financiële Discrepanties:',
      financialDiscrepanciesText:
        'Eventuele financiële verliezen als gevolg van vertrouwen op de berekeningen of categoriseringen van de App.',
      bugsTitle: 'Bugs en Glitches:',
      bugsText:
        'Eventuele problemen voortkomend uit de AI-gegenereerde codebase.',
      soleRemedy:
        'Je enige remedie voor ontevredenheid met de App is om de App niet meer te gebruiken.',
      asIsTitle: '6. "AS IS" en "AS AVAILABLE"',
      asIsText:
        'De App wordt geleverd op een "AS IS" basis. De Ontwikkelaar wijst expliciet alle garanties af, expliciet of impliciet, inclusief garanties van verkoopbaarheid, geschiktheid voor een bepaald doel, en niet-inbreuk.',
      noGuarantee: 'Wij garanderen niet dat:',
      requirementsGuarantee: 'De App aan je eisen zal voldoen.',
      uninterruptedGuarantee:
        'De App ononderbroken, tijdig, veilig of foutloos zal zijn.',
      resultsGuarantee:
        'De resultaten verkregen uit het gebruik van de App nauwkeurig of betrouwbaar zullen zijn.',
      indemnificationTitle: '7. Vrijwaring',
      indemnificationText:
        'Je gaat ermee akkoord de Ontwikkelaar te vrijwaren en schadeloos te stellen voor alle claims, schade, aansprakelijkheden, kosten en uitgaven (inclusief juridische kosten) voortvloeiend uit jouw gebruik van de App of jouw schending van deze Voorwaarden.',
      governingLawTitle: '8. Toepasselijk Recht',
      governingLawText:
        'Deze Voorwaarden worden beheerst door het recht van Nederland, zonder rekening te houden met de bepalingen inzake conflicten van wetgeving.',
      acknowledgement:
        'Door Fluxby te gebruiken, erken je dat je deze overeenkomst hebt gelezen, begrijpt, en akkoord gaat met het feit dat dit een AI-gegenereerde tool is die zonder garantie wordt geleverd.',
    },
    featuresTitle: 'Alle functies',
    featuresPage: {
      intro:
        'Ontdek alles wat Fluxby te bieden heeft. Van slimme transactie tracking tot prachtige analytics - alles wat je nodig hebt om je financiën te beheren.',
      smartTracking: {
        title: 'Slimme transactie tracking',
        description:
          'Categoriseer automatisch je uitgaven en inkomsten met AI-gestuurde herkenning. Fluxby leert je uitgavenpatronen en suggereert betere manieren om te sparen.',
        highlights: [
          'Automatische categorisatie',
          'Patroonherkenning',
          'Slimme suggesties',
        ],
      },
      analytics: {
        title: 'Mooie analytics',
        description:
          'Prachtige grafieken die het begrijpen van je financiën leuk maken. Zie je geld groeien met interactieve visualisaties.',
        highlights: [
          'Interactieve grafieken',
          'Trend analyse',
          'Categorie verdeling',
        ],
      },
      budgets: {
        title: 'Budget doelen',
        description:
          'Stel schattige budgetdoelen in met Fluxby die je aanmoedigt. Bekijk je voortgang met leuke animaties.',
        highlights: [
          'Maandelijkse limieten',
          'Voortgang tracking',
          'Overschrijding alerts',
        ],
      },
      privacy: {
        title: '100% lokaal & privé',
        description:
          'Je financiële data verlaat nooit je apparaat. Geen cloud, geen servers, geen tracking - alles blijft op je computer.',
        highlights: [
          'Geen cloud opslag',
          'Geen accounts nodig',
          'Volledige privacy',
        ],
      },
      bankImport: {
        title: 'Bank CSV import',
        description:
          'Exporteer eenvoudig transacties van je bank en importeer ze in Fluxby. Werkt met meerdere banken.',
        highlights: [
          'Meerdere banken ondersteuning',
          'Drag & drop upload',
          'Duplicaat detectie',
        ],
      },
      customization: {
        title: 'Persoonlijke ervaring',
        description:
          "Pas Fluxby aan met verschillende thema's en instellingen. Maak financieel beheer uniek van jou.",
        highlights: [
          'Donkere modus',
          'Aanpasbare categorieën',
          'Eigen kleuren & iconen',
        ],
      },
      peer2peer: {
        title: 'Peer-to-peer sync',
        description:
          'Synchroniseer je data veilig tussen apparaten zonder cloud server. Je apparaten praten direct met elkaar.',
        highlights: [
          'End-to-end encryptie',
          'Geen centrale server',
          'Sync tussen apparaten',
        ],
      },
      multiProfile: {
        title: 'Meerdere profielen',
        description:
          'Maak aparte profielen voor persoonlijk, zakelijk of gezinsfinanciën. Houd alles georganiseerd maar gescheiden.',
        highlights: ['Aparte werkruimtes', 'Vlot wisselen', 'Gescheiden data'],
      },
      realtime: {
        title: 'Realtime updates',
        description:
          'Zie je financiële overzicht direct veranderen wanneer je transacties toevoegt of bewerkt.',
        highlights: [
          'Directe dashboard updates',
          'Live grafieken',
          'Automatische herberekening',
        ],
      },
      ai: {
        title: 'Slimme categorisatie regels',
        description:
          'Maak aangepaste regels om je transacties automatisch te categoriseren. Stel patronen in voor handelaren, bedragen en beschrijvingen om je financiën moeiteloos georganiseerd te houden.',
        highlights: [
          'Aangepaste categorisatie regels',
          'Patroon matching',
          'Automatische organisatie',
        ],
      },
      multiAccount: {
        title: 'Meerdere rekeningen',
        description:
          'Beheer al je bankrekeningen op één plek. Zie je totale vermogen en cashflow overzichtelijk.',
        highlights: [
          'Onbeperkt rekeningen',
          'Gecombineerd overzicht',
          'Per rekening filteren',
        ],
      },
      addressBook: {
        title: 'Adresboek',
        description:
          'Koppel transacties aan contacten. Zie hoeveel je uitgeeft aan specifieke winkels of personen.',
        highlights: [
          'Contact koppeling',
          'Uitgaven per contact',
          'Auto-suggesties',
        ],
      },
      security: {
        title: 'Veilig & betrouwbaar',
        description:
          'Geen externe verbindingen betekent geen risico op datalekken. Je data is zo veilig als je apparaat.',
        highlights: [
          'Offline beschikbaar',
          'Geen externe API calls',
          'Lokale database',
        ],
      },
      sync: {
        title: 'Export & backup',
        description:
          'Exporteer je data wanneer je wilt. Maak back-ups voor gemoedsrust.',
        highlights: ['JSON export', 'CSV export', 'Database backup'],
      },
      languages: {
        title: 'Nederlands & Engels',
        description:
          'Gebruik Fluxby in je voorkeurstaal. Volledig vertaald interface.',
        highlights: ['Nederlandse UI', 'Engelse UI', 'Makkelijk wisselen'],
      },
      openSource: {
        title: 'Open source',
        description:
          'Volledig open source en transparant. Bekijk de code, draag bij, of pas het aan.',
        highlights: [
          'GitHub repository',
          'Community driven',
          'Transparante code',
        ],
      },
      ctaTitle: 'Klaar om te beginnen?',
      ctaDescription:
        'Download Fluxby en neem vandaag nog controle over je financiën.',
      ctaButton: 'Beginnen',
    },
    downloads: {
      title: 'Download Fluxby',
      description:
        'Kies jouw platform en begin direct met het visualiseren van je financiën. Alles blijft 100% lokaal op je eigen apparaat.',
      mac: {
        name: 'macOS',
        description: 'Native ervaring voor Apple Silicon & Intel Macs.',
        aarchLabel: 'Apple Silicon',
        x64Label: 'Intel',
      },
      windows: {
        name: 'Windows',
        description: 'Eenvoudige installatie voor Windows 10 & 11.',
        label: 'Download',
      },
      linux: {
        name: 'Linux',
        description: 'Packages voor alle grote Linux distributies.',
        label: 'Download',
        appimageLabel: 'AppImage',
        debLabel: 'DEB',
        rpmLabel: 'RPM',
      },
      note: 'Je hoeft niets te installeren om Fluxby te gebruiken; het werkt volledig in je browser. Deze downloads zijn beschikbaar voor wie de voorkeur geeft aan een dedicated applicatie op hun systeem.',
    },
    pricingTitle: 'Prijzen',
    pricingPage: {
      intro:
        'Fluxby is en blijft volledig gratis. Geen verborgen kosten, geen premium versie, geen abonnement.',
      freeTitle: 'Gratis',
      freeSubtitle: 'Voor altijd',
      perMonth: 'maand',
      feature1: 'Onbeperkt transacties importeren',
      feature2: 'Alle analytics en grafieken',
      feature3: 'Budget tracking en doelen',
      feature4: 'Meerdere bankrekeningen',
      feature5: 'Adresboek functionaliteit',
      feature6: 'Export naar JSON/CSV',
      feature7: 'Donkere modus',
      feature8: 'Toekomstige updates',
      whyFreeTitle: 'Waarom gratis?',
      whyFreeText:
        'Fluxby is gebouwd met de overtuiging dat iedereen toegang zou moeten hebben tot goede financiële tools. Omdat alle data lokaal blijft en we geen servers draaien, hebben we geen lopende kosten. Dit maakt het mogelijk om Fluxby voor altijd gratis aan te bieden.',
      promiseTitle: 'Onze belofte',
      promiseText:
        'Er komt geen premium versie. Er komt geen abonnement. Er komen geen "pro" features achter een betaalmuur. Alles wat we bouwen blijft gratis beschikbaar voor iedereen.',
      coffeeTitle: 'Koop een koffie',
      coffeeDescription:
        'Waardeer je Fluxby? Een kopje koffie is altijd welkom!',
      contributeTitle: 'Help mee ontwikkelen',
      contributeDescription:
        'Draag bij aan de code of vraag nieuwe features aan op GitHub.',
    },
    updatesTitle: 'Updates',
    updatesPage: {
      intro:
        'Bekijk wat er nieuw is in Fluxby. Hier vind je alle updates en nieuwe features.',
      v180Date: '7 maart 2026',
      v180Title: 'Release 1.8.0',
      v180Description: '3 nieuwe features en 9 bugfixes.',
      v180F1Title: 'Complete code review with 19 fixes',
      v180F1Desc: 'We hebben iets nieuws voor je! Bekijk de release notes voor alle details.',
      v180F2Title: 'Geïmplementeerd bulk transactie deletion with undo ondersteuning toegevoegd voor',
      v180F2Desc: 'Nieuwe functionaliteit waar je iets aan hebt.',
      v180F3Title: 'Toegevoegd ios web app installation instructions',
      v180F3Desc: 'Nieuwe functionaliteit waar je iets aan hebt.',
      v180F4Title: 'Bugfixes',
      v180F4Desc: '9 bugs opgelost. Zie changelog voor details.',
      v171Date: '22 januari 2026',
      v171Title: 'Release 1.7.1',
      v171Description: '3 bugfixes.',
      v171F1Title:
        'Enable macos updater ondersteuning toegevoegd voor and opgelost build warnings',
      v171F1Desc: 'Een vervelend probleempje opgelost.',
      v171F2Title: 'Web app verbeteringen',
      v171F2Desc: '2 bugfixes. Bekijk de release op GitHub!',
      v170Date: '19 januari 2026',
      v170Title: 'Release 1.7.0',
      v170Description: '2 nieuwe features en 10 bugfixes.',
      v170F1Title:
        'Toegevoegd sticky y-axis to all charts and verbeterd formatting',
      v170F1Desc:
        'We hebben iets nieuws voor je! Bekijk de release notes voor alle details.',
      v170F2Title: 'Require 180-day span for 6 transacties',
      v170F2Desc: 'Dit maakt Fluxby nog beter.',
      v170F3Title: 'Bugfixes',
      v170F3Desc: '10 bugs opgelost. Zie changelog voor details.',
      v160Date: '17 januari 2026',
      v160Title: 'Release 1.6.0',
      v160Description: '6 nieuwe features en 24 bugfixes.',
      v160F1Title: 'analytics verbeteringen',
      v160F1Desc: '2 nieuwe features. Bekijk de release op GitHub!',
      v160F2Title: 'Nieuwe web app mogelijkheden',
      v160F2Desc: '3 nieuwe features. Bekijk de release op GitHub!',
      v160F3Title:
        'Geïmplementeerd smart amount clustering for multi-tier patterns',
      v160F3Desc: 'Nieuwe functionaliteit waar je iets aan hebt.',
      v160F4Title: 'Bugfixes',
      v160F4Desc: '24 bugs opgelost. Zie changelog voor details.',
      v151Date: '14 januari 2026',
      v151Title: 'Release 1.5.1',
      v151Description: '3 bugfixes.',
      v151F1Title: 'Betere web ervaring',
      v151F1Desc: '2 bugfixes. Bekijk de release op GitHub!',
      v151F2Title:
        'Switch to universal macos binary and verwijderd redundant artifacts',
      v151F2Desc: 'Kleine fix, groot verschil.',
      v150Date: '11 januari 2026',
      v150Title: 'Release 1.5.0',
      v150Description: '2 nieuwe features.',
      v150F1Title: 'sync verbeteringen',
      v150F1Desc: '2 nieuwe features. Bekijk de release op GitHub!',
      v142Date: '11 januari 2026',
      v142Title: 'Release 1.4.2',
      v142Description: '1 bugfix.',
      v142F1Title:
        'Verbeterd apparaat-to-apparaat synchronisatie gebruikerservaring and opgelost connection issues',
      v142F1Desc: 'Dit had niet moeten gebeuren, maar nu is het gefixed!',
      v141Date: '11 januari 2026',
      v141Title: 'Release 1.4.1',
      v141Description: '1 bugfix.',
      v141F1Title: 'Resolve build failure due to missing imports',
      v141F1Desc: 'Bugs gedood, app verbeterd.',
      v140Date: '11 januari 2026',
      v140Title: 'Release 1.4.0',
      v140Description: '29 nieuwe features en 32 bugfixes.',
      v140F1Title: 'Nieuwe web app mogelijkheden',
      v140F1Desc:
        '18 nieuwe mogelijkheden om te ontdekken. Bekijk de release notes!',
      v140F2Title:
        'Toegevoegd menu items and verbeterd apparaat-to-apparaat synchronisatie reliability',
      v140F2Desc:
        'We hebben iets nieuws voor je! Bekijk de release notes voor alle details.',
      v140F3Title: 'Toegevoegd in-app bijgewerkt mechanism via github releases',
      v140F3Desc: 'Dit maakt Fluxby nog beter.',
      v140F4Title: 'Nieuwe data mogelijkheden',
      v140F4Desc:
        '4 nieuwe mogelijkheden om te ontdekken. Bekijk de release notes!',
      v140F5Title: 'Toegevoegd recurring transactie seeding and demo data',
      v140F5Desc: 'Nieuwe functionaliteit waar je iets aan hebt.',
      v140F6Title: 'subscriptions verbeteringen',
      v140F6Desc: '2 nieuwe features. Bekijk de release op GitHub!',
      v140F7Title: 'Make spotlight zoeken keywords translatable',
      v140F7Desc: 'Nieuwe functionaliteit waar je iets aan hebt.',
      v140F8Title: 'Toegevoegd automatic migration prompt for version updates',
      v140F8Desc: 'Dit maakt Fluxby nog beter.',
      v140F9Title: 'Bugfixes',
      v140F9Desc: '32 bugs opgelost. Zie changelog voor details.',
      v131Date: '9 januari 2026',
      v131Title: 'Release 1.3.1',
      v131Description: '3 bugfixes.',
      v131F1Title: 'Release verbeteringen',
      v131F1Desc: '2 bugfixes. Bekijk de release op GitHub!',
      v131F2Title:
        'Herstel `uselanguage` importeren and toegevoegd `barchart3` icon',
      v131F2Desc: 'Bugs gedood, app verbeterd.',
      v130Date: '8 januari 2026',
      v130Title: 'Release 1.3.0',
      v130Description: '10 nieuwe features en 15 bugfixes.',
      v130F1Title: 'Web app uitbreidingen',
      v130F1Desc:
        '7 nieuwe mogelijkheden om te ontdekken. Bekijk de release notes!',
      v130F2Title:
        'Geïmplementeerd file-based migration system and centralized logger',
      v130F2Desc: 'Nieuwe functionaliteit waar je iets aan hebt.',
      v130F3Title:
        'Toegevoegd apparaat synchronisatie screenshot section with animation',
      v130F3Desc: 'Er is weer wat bijgekomen. Ontdek het zelf!',
      v130F4Title:
        'Finalize apparaat-to-apparaat synchronisatie implementation with documentation',
      v130F4Desc: 'Dit maakt Fluxby nog beter.',
      v130F5Title: 'Bugfixes',
      v130F5Desc: '15 bugs opgelost. Zie changelog voor details.',
      viewRelease: 'Bekijk release',
      v120Date: '6 januari 2026',
      v120Title: 'Release 1.2.0',
      v120Description: '7 nieuwe features en 15 bugfixes.',
      v120F1Title: 'Diverse verbeteringen',
      v120F1Desc: '4 nieuwe features. Zie changelog voor details.',
      v120F2Title: 'Landingspagina verbeteringen',
      v120F2Desc: '2 nieuwe features. Zie changelog voor details.',
      v120F3Title: 'Add sync database adapter for P2P synchronization',
      v120F3Desc: 'Nieuwe functionaliteit toegevoegd.',
      v120F4Title: 'Bugfixes',
      v120F4Desc: '15 bugs opgelost. Zie changelog voor details.',
      v110Date: '5 januari 2026',
      v110Title: 'Release 1.1.0',
      v110Description: '7 nieuwe features en 10 bugfixes.',
      v110F1Title: 'Remove Install Fluxby card from app settings',
      v110F1Desc: 'Nieuwe functionaliteit toegevoegd.',
      v110F2Title: 'Web app verbeteringen',
      v110F2Desc: '3 nieuwe features. Zie changelog voor details.',
      v110F3Title: 'Landingspagina verbeteringen',
      v110F3Desc: '3 nieuwe features. Zie changelog voor details.',
      v110F4Title: 'Bugfixes',
      v110F4Desc: '10 bugs opgelost. Zie changelog voor details.',
      v104Date: '4 januari 2026',
      v104Title: 'Release 1.0.4',
      v104Description: 'Nieuwe verbeteringen en bugfixes.',
      v103Date: '4 januari 2026',
      v103Title: 'Release 1.0.3',
      v103Description: '1 bugfix.',
      v103F1Title: 'Sync versions to tauri files and fix duplicate releases',
      v103F1Desc: 'Bug opgelost.',
      v102Date: '4 januari 2026',
      v102Title: 'Release 1.0.2',
      v102Description: '5 bugfixes.',
      v102F1Title: 'Bugfixes',
      v102F1Desc: '5 bugs opgelost. Zie changelog voor details.',
      v100Date: '03 januari 2026',
      v100Title: 'Eerste release',
      v100Description:
        'De eerste officiële versie van Fluxby is live! Dit is alles wat erin zit:',
      f1Title: 'CSV Import',
      f1Desc:
        'Importeer je banktransacties eenvoudig via CSV-export van je bank. Op dit moment wordt ING ondersteund, met meer banken in de toekomst.',
      f2Title: 'Dashboard & Analytics',
      f2Desc:
        'Krijg direct inzicht in je financiën met een overzichtelijk dashboard. Bekijk je inkomsten, uitgaven en trends in mooie interactieve grafieken.',
      f3Title: 'Slimme categorisatie',
      f3Desc:
        'Transacties worden automatisch gecategoriseerd. Je kunt ook eigen categorieën maken met aangepaste kleuren en iconen.',
      f4Title: 'Budget tracking',
      f4Desc:
        'Stel maandelijkse budgetten in per categorie en houd je voortgang bij. Krijg visueel overzicht van hoeveel je nog kunt uitgeven.',
      f5Title: 'Meerdere rekeningen',
      f5Desc:
        'Beheer al je bankrekeningen op één plek. Betaalrekening, spaarrekening, creditcard - alles gecombineerd in één overzicht.',
      f6Title: 'Adresboek',
      f6Desc:
        'Koppel transacties aan contacten en zie hoeveel je uitgeeft bij specifieke winkels of personen. Automatische suggesties maken het makkelijk.',
      f7Title: '100% Privacy',
      f7Desc:
        'Al je data blijft lokaal op je apparaat. Geen cloud, geen accounts, geen tracking. Jouw financiële gegevens zijn alleen van jou.',
      f8Title: 'AI-gestuurde herkenning',
      f8Desc:
        'Lokale AI helpt bij het herkennen en categoriseren van transacties zonder je data te delen met externe diensten.',
      f9Title: 'Donkere modus',
      f9Desc:
        "Werk in de modus die bij je past. Schakel makkelijk tussen lichte en donkere thema's.",
      f10Title: 'Nederlands & Engels',
      f10Desc:
        'Volledig vertaalde interface in het Nederlands en Engels. Wissel wanneer je wilt.',
      f11Title: 'Export functionaliteit',
      f11Desc:
        'Exporteer je data naar JSON of CSV formaat. Maak back-ups wanneer je wilt voor gemoedsrust.',
      f12Title: 'Developer API',
      f12Desc:
        'Volledige REST API documentatie voor developers die willen integreren of uitbreiden. Swagger UI inbegrepen.',
      comingSoonTitle: 'Meer updates komen eraan',
      comingSoonText:
        'We werken continu aan nieuwe features en verbeteringen. Houd deze pagina in de gaten!',
    },
    aboutTitle: 'Over Fluxby',
    aboutPage: {
      heroStats: {
        developer: '1 developer',
        weeks: '2,5 weken',
        models: '4 LLM modellen',
        prompts: '~375 prompts',
        codeLines: '0 regels code',
        cost: '€30 totale kosten',
      },
      intro: {
        title: 'Het verhaal van Fluxby',
        content:
          'Dit is het enige door mensen geschreven stuk content in dit hele project, en zelfs dit is door AI geherformatteerd voordat het aan de pagina werd toegevoegd. Al het andere wat je ziet - prachtige visuele designs, inhoud, documentatie en letterlijk elke regel code - is tot stand gekomen door AI prompts. Dit is niet zomaar een app - het is een bewijs dat AI capabel genoeg is geworden om samen met een developer een volledige, professionele applicatie te bouwen zonder dat de developer zelf code hoeft te schrijven. Ik zat in mijn kerstvakantie en had geen zin om traditioneel code te schrijven, dus besloot ik dit experiment aan te gaan. Geen coderen van mij. Alleen prompts, feedback, en het kijken hoe AI ideeën in werkelijkheid omzet.',
      },
      background: {
        title: 'Waarom ik dit deed',
        content1:
          'Ik ben frontend developer en hou van coderen. Maar gedurende dit jaar is AI een cruciaal onderdeel geworden van mijn ontwikkelwerk en mijn interesse verschoof sterk naar het benutten ervan. Toen ik begin december 2025 toegang kreeg tot Claude Opus 4.5 was ik direct onder de indruk van de output - dit was fundamenteel anders dan alles wat ik tot nu toe had gebruikt. De kwaliteit van de gegenereerde code, de architecturale suggesties, en de manier waarop het complexe problemen begreep was echt indrukwekkend.',
        content2:
          "Tot nu toe werkte ik met degelijke modellen, maar we hadden 'instructies' en constraints nodig om ervoor te zorgen dat modellen op een behoorlijk niveau werkten. De simpele, saaie, vervelende taken kon ik overlaten maar de echt moeilijke, creatieve taken hadden meestal mijn volle aandacht nodig. Dit veranderde fundamenteel met Claude Opus voor mij. Plotseling kon ik complexe architecturale problemen beschrijven en ze in slechts enkele prompts opgelost krijgen. De kwaliteit sprong dramatisch omhoog.",
      },
      experiment: {
        title: 'Het grote experiment',
        content:
          "Tijdens mijn kerstvakantie besloot ik het model voor een echt uitgebreide test in te zetten. Het idee was briljant eenvoudig: ik wilde een kleine app bouwen die echt nuttig zou zijn voor mij en mijn vrouw, zonder zelf code te schrijven. Dus zou ik 'vibe coden' - de complete app ontwikkelen zonder me druk te maken over hoe de code eruit zag, maar wel intensief focussen op hoe de interface eruitzag en hoe alles aanvoelde voor de eindgebruiker. Geen zorgen over code quality, architectuur patterns, of best practices. Alleen focussen op: werkt het, ziet het er goed uit, voelt het goed aan?",
        goal: 'Het doel werd om een volledig professioneel ogende, goed werkende financiële app te maken die mijn vrouw en ik echt zouden gaan gebruiken in ons dagelijks leven - allemaal zonder dat ik zelf een enkele regel code hoefde te schrijven.',
      },
      features: {
        title: 'De geweldige functies',
        categorization: {
          title: 'Slimme categorisatie met regels',
          content:
            'Ik vroeg om een mooie categoriestructuur met subcategorieën voor persoonlijke financiën. Het antwoord was een elegant regel-gebaseerd systeem waar je trefwoorden kon toevoegen die automatisch transacties categoriseren. Zo simpel toch ingewikkeld in de implementatie. Nu kan je bijvoorbeeld zeggen: "elke keer dat ik ALBERT HEIJN in de transactie naam zie, categorieer het automatisch als groceries" en bam, het werkt voor altijd. Het LLM begreep dat dit een herhaalbave operatie moest zijn en bouwde alles zo in dat je dit makkelijk kon beheren.',
        },
        addressBook: {
          title: 'Slim adresboek met IBAN tracking',
          content:
            'Een adresboek die ontzettend slim is. Als het een IBAN aan een naam kon koppelen, werd het automatisch toegevoegd aan je contacten. Nog cooler: het merkte zelfs betaalproviders op in transactienamen (via Mollie, via Buckaroo, etc.) en stelde voor om slimme regels te introduceren die deze providers automatisch uit transactie namen zouden strippen. Dat soort intelligentie wilde ik juist zien - niet alleen code schrijven, maar ook begrijpen wat het probleem is en proactief een oplossing suggereren.',
        },
        sharedIban: {
          title: 'Gedeelde IBANs (de grappige edge case)',
          content:
            'Hier gebeurde iets grappigs en ingewikkelds tegelijk. Betaalproviders gebruiken namelijk een gedeelde IBAN waarbij ze zelf zorgen dat het geld bij de juiste merchant terechtkomt. Dus plotseling hadden we zowel Lidl als H&M voor dezelfde IBAN, wat verwarrend was. Het model begreep het probleem volledig en stelde een gedeelde IBAN interface voor waarbij je kon kiezen of je deze wilde samenvoegen als dezelfde merchant (als het eigenlijk dezelfde plek was met andere spelling) of juist splitsen als verschillende merchants (als het echt verschillende winkels waren die dezelfde provider gebruikten). Dit is precies het soort complexe UX probleem dat je graag door AI wilt zien ontdekt en opgelost.',
        },
        multiTenancy: {
          title: 'Multi-account tracking',
          content:
            'Meerdere rekeningen tracken in dezelfde app was essentieel. Je wilt je persoonlijke rekening kunnen tracken, een gedeelde huishoudbudget rekening, en misschien zelfs een zakelijke rekening - allemaal in Fluxby. Dit is wat multi-tenancy heet - ondersteuning voor meerdere gescheiden "werkruimten" in dezelfde applicatie. Met één plan werden alle views en endpoints bijgewerkt om altijd correct rekening te houden met welke profiel/account je ingelogd was. Het LLM moest begrijpen dat dit een fundamentele feature was die door het hele systeem heen moest werken.',
        },
      },
      challenges: {
        title: 'De echte uitdagingen',
        ui: {
          title: '😅 UI inconsistentie overal',
          content:
            'Een rode draad door dit hele project was de inconsistente UI die Claude zou toevoegen. Ik kreeg 3 verschillende soorten badges in dezelfde app, verschillende button implementaties, hover-effecten die niet op elkaar afgestemd waren. Soms zou een delete button rood zijn, soms oranje. Soms was een badge met icoon, soms tekst-only. Dit frustreerde me echt omdat ik veel met design systems werk en dit definitief niet door onze design rules zou kunnen. Achteraf had ik een specifiek design systeem in mijn prompt kunnen specificeren maar ik wilde juist de UI capabilities van het LLM testen. Dit kostte me wel ~100 prompts aan het einde om elke view correct, consistent en mooi te maken. Belangrijke les: AI kan coderen maar design systems volgen en consistent toepassen? Dat is veel moeilijker.',
        },
        addressBookBugs: {
          title: '🐛 Adresboek edge cases',
          content:
            'Dit was absoluut de moeilijkste feature. Ik bleef bugs tegenkomen en rare edge cases die ik niet verwachtte. Ik denk dat ik 50-70 prompts aan deze functie heb besteed, wat ongeveer 20% van alle prompts was. En eerlijk gezegd kan ik nog steeds niet garanderen dat het 100% bugvrij is. De combinatie van betaalproviders, gedeelde IBANs, merchant variaties, verschillende spellingen van dezelfde bedrijf... het was complex. Het LLM worstelde eraan, ik moest telkens weer de edge cases uitleggen, en fixes van de ene kant creëerden problemen aan de andere kant.',
        },
        darkMode: {
          title: '🌙 Dark mode overal implementeren',
          content:
            'Dark mode toevoegen aan alles tegelijk? Slecht idee. Dus deed ik het per sectie (frontend, landing page, docs, help center). Maar het LLM had er echt moeite mee de kleurwaarden correct aan te passen. Het bleef zeggen dat alles in orde was, dat dark mode volledig geïmplementeerd was, maar wanneer ik het toggle aanzette en uitzette zag ik geen verandering. De darkMode context was er, de classNames waren daar, maar ergens faalde de logica. Uiteindelijk moest ik dit volledig van scratch herdoen. Soms is het gewoon makkelijker om het zelf te doen... maar dat mocht niet van mezelf volgens de regels van dit experiment.',
        },
      },
      polish: {
        title: 'De mooie afwerking ✨',
        landing:
          'Toen de branding eindelijk was gemaakt (Fluxby! wat een geweldige naam), vroeg ik om een prachtige, moderne landingspagina. Een paar prompts later en we hadden een ongelooflijk mooi uitziende one-pager die de app echt goed laat zien. Met hero section, features, screenshots, testimonials, CTA buttons - alles wat je nodig hebt.',
        docs: 'Ik vroeg om Swagger/OpenAPI docs voor letterlijk alle 30+ endpoints en op basis daarvan professionele developer documentatie te maken zoals Stripe heeft. Compleet met interactieve voorbeelden, request/response voorbeelden, en zijde navigatie. Dit was complex omdat het LLM moest begrijpen wat goede dev docs zijn en consistent format moest blijven.',
        onboarding:
          'Een complete, immersieve onboarding ervaring waar elke feature rustig en duidelijk wordt uitgelegd aan nieuwe gebruikers, compleet met voortgang tracking zodat je altijd weet waar je bent in de tutorial. Dit moest intuïtief voelen en niet overwhelm zijn.',
        mascot:
          'Ik begon te brainstormen over een naam - Fluxby! Toen vroeg ik om een mascotte te maken met als doel: pluizig, benaderbaar en schattig. Iets wat finance minder serieus en intimiderend maakt. Toen liet ik het ademen, liet het je cursor volgen met zijn ogen, en voegde leuke animaties toe. Het voelt echt als een companion.',
      },
      costs: {
        title: 'De financiën van dit experiment 💰',
        content:
          'Ik bereikte al snel mijn premium request limiet in mijn GitHub Copilot abonnement. Dit kwam doordat Claude Opus een 3x multiplier heeft, elke Opus prompt telt als 3 requests in je limiet. Om dit experiment voort te zetten stond ik een budget van $25 toe voor extra premium credits en ontwikkelde ik een slimme strategie voor wanneer welk model te gebruiken. Dit was strategisch resource management in plaats van gewoon blindelings geld uitgeven. Uiteindelijk besteedde ik ongeveer $30 (abonnementskosten en extra request kosten) totaal aan LLM kosten voor het hele project, wat ongelooflijk goedkoop is voor een volledige applicatie.',
        strategy: {
          free: 'Kleine refactors of content wijzigingen → gratis modellen (Grok Code Fast 1, Raptor mini) want deze zijn goedkoop en goed genoeg voor kleine taken',
          gemini:
            'Grotere wijzigingen in bestaande code → Google Gemini 3 Pro want die biedt een goede balans tussen prijs en prestatie voor middelgrote taken',
          opus: 'Complexe architecturale wijzigingen of wanneer Gemini faalde → Claude Opus 4.5 omdat dit de beste en meest capable model is',
        },
      },
      improvements: {
        title: 'Wat nog beter kan (en gaat)',
        items: [
          'Toegankelijkheid (a11y) - heel veel verbeteringen mogelijk, niet alles is WCAG 2.1 AA compliant op dit moment',
          'UI consistentie verder doorvoeren - badges, buttons, en spacing kunnen nog uniformer worden',
          'Gedeelde database logica refactoren - er is veel duplication die we kunnen consolideren',
          'E2E tests toevoegen - echte testers hebben bugs gevonden die automated tests hadden moeten pakken',
          'Performance optimalisaties - sommige charts laden soms langzaam, vooral met veel data',
          'Meer edge case handling in categorization engine - meer testgevallen nodig',
        ],
      },
      conclusion: {
        title: 'Het einde (en het begin)',
        paragraphs: [
          'Dus hier zijn we, ongeveer 375 prompts en 2,5 weken later. Een professioneel ogende, goed werkende financiële applicatie met features die ik niet eens initieel had gepland, compleet gebouwd door AI op basis van mijn prompts, feedback en voortdurende iteraties. De onderliggende regel was dat ik geen code zelf zou schrijven of repareren - ik mocht dit experiment niet "vals spelen" door zelf in de code te duiken.',
          'Sterker nog, ik heb de codebase letterlijk helemaal niet bekeken. Ik gebruikte alleen de chat interface en accepteerde (of suggereerde aanpassingen op) elke wijziging die het model voorstelde. Dit was belangrijk omdat het me dwingt het model echt te gebruiken als een "AI developer" in plaats van als een hulptool.',
          'Dit experiment bewijst dat AI nu echt capabel is voor real-world applicaties. Niet voor alles - edge cases zijn nog steeds lastig, bugs in edge cases lijken vaker voor te komen dan ik had verwacht, en het volgen van design systems is moeilijker dan ik dacht. Maar voor het merendeel van het werk? Absoluut ja. Een single developer kan nu echt sneller productieklare applicaties bouwen door AI als partner in te zetten.',
          'De toekomst ziet er genuinely spannend uit. Als je me verteld had een jaar geleden dat ik in twee weken een volledige financiële app kon bouwen zonder zelf code te schrijven, zou ik je niet geloofd hebben. Toch is het gebeurd. De vraag is niet meer "kan AI software bouwen?" maar eerder "hoe bouwen we het meest effectief met AI?" en "welke problemen kunnen we nu oplossen die voordien te duur waren?"',
        ],
      },
      exploreMore: {
        title: 'Ontdek meer',
        app: {
          title: 'Probeer Fluxby nu',
          description:
            'Ervaar de magie zelf! Duik in de app en ontdek hoe AI-gestuurde financiën beheren aanvoelt.',
        },
        docs: {
          title: 'Developer documentatie',
          description:
            'Voor developers die willen bouwen met Fluxby. Volledige API documentatie, voorbeelden en integratiegidsen.',
        },
        help: {
          title: 'Helpcentrum',
          description:
            'Ontdek alle mogelijkheden! Gidsen, tips en alles wat je nodig hebt om het maximale uit Fluxby te halen.',
        },
        github: {
          title: 'Bijdragen op GitHub',
          description:
            'Help Fluxby nog beter te maken! Meld bugs, stel features voor of draag code bij aan het project.',
        },
      },
      personalMessage: {
        text: 'Ik hoop dat je net zoveel plezier hebt met Fluxby als ik had bij het bouwen ervan! Bekijk de demo — ik heb gezorgd dat er een volledig werkend demo profiel beschikbaar is om alles uit te proberen! 🚀',
        signature: 'Houke',
      },
    },
  },
  errors: {
    notFound: 'Pagina niet gevonden',
    notFoundDescription:
      'De pagina die je zoekt bestaat niet of is verplaatst.',
    goHome: 'Naar homepage',
    goBack: 'Ga terug',
  },
  // Screenshot animation translations
  animations: {
    dashboard: {
      total: 'totaal',
      categories: {
        supermarkt: 'Supermarkt',
        restaurant: 'Restaurant',
        brandstof: 'Brandstof',
        energie: 'Energie',
        streaming: 'Streaming',
        transport: 'Transport',
      },
    },
    transactions: {
      date: 'dec',
      income: 'Inkomen',
      categories: {
        supermarkt: 'Supermarkt',
        inkomen: 'Inkomen',
        brandstof: 'Brandstof',
        streaming: 'Streaming',
        restaurant: 'Restaurant',
        energie: 'Energie',
        transport: 'Transport',
        inrichting: 'Inrichting',
        drogisterij: 'Drogisterij',
      },
    },
    budgets: {
      leftThisMonth: 'over deze maand',
      spent: 'Uitgegeven',
      budget: 'Budget',
      remaining: 'over',
      overBudget: 'over budget!',
      categories: {
        boodschappen: 'Boodschappen',
        uiteten: 'Uit eten',
        brandstof: 'Brandstof',
        streaming: 'Streaming',
      },
    },
    categories: {
      groups: {
        wonen: 'Wonen & Huisvesting',
        huishouden: 'Huishouden & Boodschappen',
        vervoer: 'Vervoer & Transport',
        eten: 'Eten & Drinken',
      },
      subcategories: {
        huur: 'Huur & Hypotheek',
        energie: 'Energie & Water',
        inrichting: 'Inrichting & Tuin',
        supermarkt: 'Supermarkt',
        drogisterij: 'Drogisterij',
        huisdieren: 'Huisdieren',
        brandstof: 'Brandstof & Laden',
        ov: 'Openbaar Vervoer',
        parkeren: 'Parkeren & Taxi',
        restaurant: 'Restaurant',
        bezorging: 'Bezorging',
        koffie: 'Koffie & Snacks',
      },
    },
    analytics: {
      title: 'Uitgaven per categorie',
      month: 'december',
      total: 'Totaal uitgegeven',
      income: 'Inkomsten',
      expenses: 'Uitgaven',
    },
    subscriptions: {
      monthlyTotal: 'Maandelijks totaal',
      active: 'Actief',
      pending: 'In afwachting',
      frequencies: {
        weekly: 'Wekelijks',
        biweekly: 'Tweewekelijks',
        monthly: 'Maandelijks',
        quarterly: 'Per kwartaal',
        yearly: 'Jaarlijks',
      },
      nextPayment: 'Volgende',
      priceIncrease: 'Prijsstijging gedetecteerd',
      update: 'Bijwerken',
    },
    import: {
      dropzone: 'Sleep je CSV bestand hier',
      or: 'of',
      browse: 'blader',
      uploading: 'Uploaden...',
      processing: 'Verwerken...',
      detecting: 'Duplicaten worden gedetecteerd...',
      importing: 'Importeren',
      done: 'Import voltooid!',
      transactionsImported: 'transacties geïmporteerd',
      dragHint: 'Sleep je CSV bestand hierheen',
    },
    sync: {
      discovering: 'Apparaten zoeken...',
      connecting: 'Verbinden...',
      syncing: 'Data synchroniseren...',
      complete: 'Synchronisatie voltooid!',
      device1: 'Laptop',
      device2: 'Telefoon',
      transactions: 'transacties',
      categories: 'categorieën',
      p2pEncrypted: 'Peer-to-peer versleuteld',
    },
  },
};
