/**
 * Comprehensive category seed data based on AGENTS.md category structure
 * This provides bilingual categories (Dutch/English) with hierarchical subcategories and merchant matching rules
 */

export interface BilingualText {
  nl: string;
  en: string;
}

export interface SeedSubcategory {
  name: string | BilingualText;
  icon: string;
  description: string | BilingualText;
  rules: string[]; // Regex patterns for auto-categorization
}

export interface SeedCategory {
  name: string | BilingualText;
  icon: string;
  color: string;
  description: string | BilingualText;
  subcategories: SeedSubcategory[];
}

// Helper function to get text for a specific language
export function getText(
  text: string | BilingualText,
  language: 'nl' | 'en'
): string {
  if (typeof text === 'string') return text;
  return text[language] || text.nl;
}

// Helper function to flatten categories for a specific language
export function getCategoriesForLanguage(
  categories: SeedCategory[],
  language: 'nl' | 'en'
): Array<{
  name: string;
  icon: string;
  color: string;
  description: string;
  subcategories: Array<{
    name: string;
    icon: string;
    description: string;
    rules: string[];
  }>;
}> {
  return categories.map((cat) => ({
    name: getText(cat.name, language),
    icon: cat.icon,
    color: cat.color,
    description: getText(cat.description, language),
    subcategories: cat.subcategories.map((sub) => ({
      name: getText(sub.name, language),
      icon: sub.icon,
      description: getText(sub.description, language),
      rules: sub.rules,
    })),
  }));
}

export const SEED_CATEGORIES: SeedCategory[] = [
  // 1. 🏠 Wonen & Huisvesting / Housing & Living
  {
    name: { nl: 'Wonen & Huisvesting', en: 'Housing & Living' },
    icon: '🏠',
    color: '#1E40AF', // Deep blue
    description: {
      nl: 'De vaste lasten om een dak boven je hoofd te hebben en je huis in te richten.',
      en: 'Fixed costs for having a roof over your head and furnishing your home.',
    },
    subcategories: [
      {
        name: 'Huur & Hypotheek',
        icon: '🔑',
        description: 'Bruto maandlasten voor je woning.',
        rules: [
          'Woonstad',
          'Vestia',
          'Portaal',
          'Eigen Haard',
          'ABN AMRO Hypotheken',
          'Rabobank',
          'Florius',
          'Obvion',
          'Aegon Hypotheken',
          'Nationale Nederlanden',
          'hypotheek',
          'huur',
          'woning',
        ],
      },
      {
        name: 'Energie & Water',
        icon: '⚡',
        description: 'Gas, elektriciteit en water.',
        rules: [
          'Vattenfall',
          'Eneco',
          'Essent',
          'Greenchoice',
          'Oxxio',
          'Budget Energie',
          'ANWB Energie',
          'NextEnergie',
          'Oasen',
          'Vitens',
          'Evides',
          'Waternet',
          'Brabant Water',
          'energie',
          'stroom',
          'gas',
          'water',
        ],
      },
      {
        name: 'Gemeente & Belasting',
        icon: '🗑️',
        description: 'Lokale belastingen en heffingen.',
        rules: [
          'Belastingdienst',
          'Gemeente',
          'GBLT',
          'Waternet',
          'Waterschap',
          'BsGW',
          'BghU',
          'SVHW',
          'Afvalstoffenheffing',
          'gemeentelijke',
          'heffing',
        ],
      },
      {
        name: 'Inrichting & Tuin',
        icon: '🪑',
        description: 'Meubels, klussen, decoratie en tuin.',
        rules: [
          'IKEA',
          'Action',
          'Xenos',
          'Blokker',
          'Leen Bakker',
          'Kwantum',
          'Intratuin',
          'Hornbach',
          'Praxis',
          'Gamma',
          'Karwei',
          'Casa',
          'Sostrene Grene',
          'Big Bazar',
          'Flying Tiger',
          'meubel',
          'tuin',
        ],
      },
      {
        name: 'Woonverzekering',
        icon: '🔒',
        description: 'Opstal- en inboedelverzekering.',
        rules: [
          'Interpolis',
          'Centraal Beheer',
          'Univé',
          'Nationale Nederlanden',
          'Allianz',
          'Aegon',
          'FBTO',
          'inboedel',
          'opstal',
          'woonverzekering',
        ],
      },
    ],
  },

  // 2. 🛒 Huishouden & Boodschappen
  {
    name: { nl: 'Huishouden & Boodschappen', en: 'Household & Groceries' },
    icon: '🛒',
    color: '#34D399', // Emerald
    description: {
      nl: 'De dagelijkse benodigdheden om het huishouden draaiende te houden.',
      en: 'Daily necessities to keep the household running.',
    },
    subcategories: [
      {
        name: 'Supermarkt',
        icon: '🍎',
        description: 'Eten, drinken en dagelijkse boodschappen.',
        rules: [
          'Albert Heijn',
          'Jumbo',
          'Lidl',
          'Aldi',
          'Plus',
          'Dirk',
          'Coop',
          'Vomar',
          'Hoogvliet',
          'Picnic',
          'Spar',
          'Ekoplaza',
          'HelloFresh',
          'Crisp',
          'supermarkt',
          'boodschappen',
        ],
      },
      {
        name: 'Drogisterij',
        icon: '🧴',
        description: 'Persoonlijke verzorging, schoonmaak en medicijnen.',
        rules: [
          'Kruidvat',
          'Etos',
          'Trekpleister',
          'Holland & Barrett',
          'Douglas',
          'ICI Paris',
          'The Body Shop',
          'Rituals',
          'drogist',
          'apotheek',
        ],
      },
      {
        name: 'Speciaalzaken',
        icon: '🥖',
        description: 'Bakker, slager, visboer en slijterij.',
        rules: [
          'Bakkerij',
          'Slagerij',
          'Keurslager',
          'Gall & Gall',
          'Mitra',
          'DirckIII',
          'Kaashuis',
          'bakker',
          'slager',
          'visboer',
          'slijterij',
        ],
      },
      {
        name: 'Huisdieren',
        icon: '🐾',
        description: 'Voeding, speeltjes en zorg voor dieren.',
        rules: [
          'Zooplus',
          'Welkoop',
          'Pets Place',
          'Jumper',
          'Dierenarts',
          'AniCura',
          'Brekz',
          'huisdier',
          'dier',
        ],
      },
    ],
  },

  // 3. 🚗 Vervoer & Transport
  {
    name: { nl: 'Vervoer & Transport', en: 'Transportation' },
    icon: '🚗',
    color: '#3B82F6', // Blue
    description: {
      nl: 'Alle kosten om van A naar B te komen.',
      en: 'All costs for getting from A to B.',
    },
    subcategories: [
      {
        name: 'Brandstof & Laden',
        icon: '⛽',
        description: 'Benzine, diesel en elektrisch laden.',
        rules: [
          'Shell',
          'Esso',
          'Total',
          'Texaco',
          'Tango',
          'TinQ',
          'Fastned',
          'Allego',
          'Vattenfall InCharge',
          'Shell Recharge',
          'benzine',
          'diesel',
          'tanken',
          'laden',
        ],
      },
      {
        name: 'Openbaar Vervoer',
        icon: '🚆',
        description: 'Trein, tram, bus en metro.',
        rules: [
          'NS Groep',
          'NS International',
          'Arriva',
          'Connexxion',
          'GVB',
          'RET',
          'HTM',
          'EBS',
          'Qbuzz',
          'Keolis',
          'OV-chipkaart',
          '9292',
          'openbaar vervoer',
          'trein',
          'bus',
          'tram',
          'metro',
        ],
      },
      {
        name: 'Parkeren & Taxi',
        icon: '🅿️',
        description: 'Parkeerkosten en taxidiensten.',
        rules: [
          'Yellowbrick',
          'Parkmobile',
          'Parkbee',
          'EasyPark',
          'Q-Park',
          'P\\+R',
          'Uber',
          'Bolt',
          'Taxi',
          'parkeren',
          'parkeer',
        ],
      },
      {
        name: 'Auto Kosten',
        icon: '🛡️',
        description: 'Verzekering, wegenbelasting en lease.',
        rules: [
          'ANWB',
          'Allianz Direct',
          'InShared',
          'Centraal Beheer',
          'Motorrijtuigenbelasting',
          'LeasePlan',
          'Justlease',
          'autoverzekering',
          'wegenbelasting',
          'lease',
        ],
      },
      {
        name: 'Onderhoud & Fiets',
        icon: '🚲',
        description: 'Garagekosten, wasstraat en fietsenmaker.',
        rules: [
          'KwikFit',
          'Euromaster',
          'Profile',
          'Garage',
          'Dealer',
          'BOVAG',
          'Swapfiets',
          'VanMoof',
          'Fietsenwinkel',
          'fiets',
          'wasstraat',
          'onderhoud auto',
        ],
      },
    ],
  },

  // 4. 📱 Telecom & Abonnementen
  {
    name: { nl: 'Telecom & Abonnementen', en: 'Telecom & Subscriptions' },
    icon: '📱',
    color: '#0EA5E9', // Sky blue
    description: 'De doorlopende digitale contracten.',
    subcategories: [
      {
        name: 'Mobiel & Internet',
        icon: '📞',
        description: 'Telefoonabonnementen en thuis internet/TV.',
        rules: [
          'KPN',
          'Ziggo',
          'Odido',
          'T-Mobile',
          'Vodafone',
          'Simpel',
          'Hollandsnieuwe',
          'Ben',
          'Youfone',
          'Delta',
          'Caiway',
          'telefoon',
          'internet',
          'provider',
        ],
      },
      {
        name: 'Streaming & Media',
        icon: '📺',
        description: 'Video, muziek en nieuws.',
        rules: [
          'Netflix',
          'Spotify',
          'Videoland',
          'Disney\\+',
          'Amazon Prime',
          'HBO Max',
          'Viaplay',
          'Apple Services',
          'NPO Plus',
          'Blendle',
          'DPG Media',
          'streaming',
          'abonnement',
        ],
      },
      {
        name: 'Software & Cloud',
        icon: '☁️',
        description: 'Apps, cloudopslag en VPN.',
        rules: [
          'Google Storage',
          'Apple iCloud',
          'Microsoft',
          'Dropbox',
          'Adobe',
          'NordVPN',
          'PlayStation Network',
          'Steam',
          'Xbox',
          'cloud',
          'software',
          'app',
        ],
      },
    ],
  },

  // 5. 🍽️ Eten, Drinken & Uitgaan
  {
    name: { nl: 'Eten, Drinken & Uitgaan', en: 'Food, Drinks & Going Out' },
    icon: '🍽️',
    color: '#F97316', // Orange
    description: 'De "leuke" uitgaven: Horeca en entertainment.',
    subcategories: [
      {
        name: 'Restaurants & Bars',
        icon: '🥂',
        description: 'Uit eten, terrasje en cafébezoek.',
        rules: [
          'Loetje',
          't Zusje',
          'Happy Italy',
          'Vapiano',
          'La Cubanita',
          "McDonald's",
          'Burger King',
          'KFC',
          'FEBO',
          'Starbucks',
          'Bagels & Beans',
          'Anne&Max',
          'restaurant',
          'cafe',
          'bar',
        ],
      },
      {
        name: 'Eten Bestellen',
        icon: '🍕',
        description: 'Maaltijdbezorging.',
        rules: [
          'bezorg',
          'Deliveroo',
          'delivery',
          "Domino's",
          'New York Pizza',
          'takeaway',
          'Thuisbezorgd',
          'Uber Eats',
        ],
      },
      {
        name: 'Uitjes & Cultuur',
        icon: '🎟️',
        description: 'Bioscoop, musea, concerten en evenementen.',
        rules: [
          'Pathe',
          'Vue',
          'Kinepolis',
          'Ticketmaster',
          'Eventim',
          'Museumkaart',
          'Efteling',
          'Walibi',
          'Artis',
          'Diergaarde Blijdorp',
          'Rijksmuseum',
          'bioscoop',
          'museum',
          'concert',
          'evenement',
          'theater',
        ],
      },
    ],
  },

  // 6. 🛍️ Shopping & Vrije Tijd
  {
    name: { nl: 'Shopping & Vrije Tijd', en: 'Shopping & Leisure' },
    icon: '🛍️',
    color: '#A855F7', // Purple
    description: "Niet-essentiële aankopen en hobby's.",
    subcategories: [
      {
        name: 'Kleding & Schoenen',
        icon: '👕',
        description: 'Kledingwinkels en online mode.',
        rules: [
          'Zalando',
          'H&M',
          'ZARA',
          'Wehkamp',
          'About You',
          'C&A',
          'Primark',
          'Zeeman',
          'Wibra',
          'Omoda',
          'Scapino',
          'Bristol',
          'Nike',
          'Adidas',
          'kleding',
          'schoenen',
          'mode',
        ],
      },
      {
        name: 'Warenhuis',
        icon: '🏬',
        description: 'Winkels met een gemengd assortiment.',
        rules: ['HEMA', 'De Bijenkorf', 'Bol\\.com', 'Amazon', 'warenhuis'],
      },
      {
        name: 'Elektronica',
        icon: '📱',
        description: 'Gadgets, telefoons en apparatuur.',
        rules: [
          'Coolblue',
          'MediaMarkt',
          'BCC',
          'Amac',
          'Apple Store',
          'Megekko',
          'CameraNU',
          'elektronica',
          'gadget',
        ],
      },
      {
        name: 'Loterij & Kansspel',
        icon: '🎫',
        description: 'Loterijen en gokken.',
        rules: [
          'Postcode Loterij',
          'Staatsloterij',
          'Vriendenloterij',
          'Lotto',
          'Toto',
          'Holland Casino',
          'BetCity',
          'Unibet',
          'loterij',
          'casino',
          'gokken',
        ],
      },
      {
        name: 'Hobby & Cadeaus',
        icon: '🎁',
        description: 'Boeken, games, bloemen en speelgoed.',
        rules: [
          'Bruna',
          'Ako',
          'Primera',
          'ReadShop',
          'Intertoys',
          'Top1Toys',
          'Fleurop',
          'Greetz',
          'Kaartje2Go',
          'Decathlon',
          'boek',
          'game',
          'cadeau',
          'speelgoed',
          'bloemen',
        ],
      },
    ],
  },

  // 7. 💊 Gezondheid & Zorg
  {
    name: { nl: 'Gezondheid & Zorg', en: 'Health & Care' },
    icon: '💊',
    color: '#EF4444', // Red
    description: 'Kosten voor lichaam en geest.',
    subcategories: [
      {
        name: 'Zorgverzekering',
        icon: '🩺',
        description: 'Maandelijkse premie.',
        rules: [
          'Zilveren Kruis',
          'VGZ',
          'CZ Zorgverzekering',
          'Menzis',
          'DSW',
          'Anderzorg',
          'Ditzo',
          'OHRA',
          'ONVZ',
          'zorgverzekering',
          'zorgpremie',
        ],
      },
      {
        name: 'Zorgkosten',
        icon: '🩹',
        description: 'Eigen risico, tandarts, fysio en apotheek.',
        rules: [
          'Apotheek',
          'BENU',
          'Tandarts',
          'Fysiotherapie',
          'Orthodontist',
          'Infomedics',
          'Anders Medical',
          'eigen risico',
          'huisarts',
          'ziekenhuis',
        ],
      },
      {
        name: 'Sport & Wellness',
        icon: '🏋️',
        description: 'Sportschool, vereniging en uiterlijke verzorging.',
        rules: [
          'Basic-Fit',
          'Fit For Free',
          'Big Gym',
          'Sportcity',
          'Kapper',
          'Hair',
          'Beauty',
          'Sauna',
          'Zwembad',
          'Voetbalvereniging',
          'Hockeyclub',
          'sport',
          'fitness',
          'gym',
        ],
      },
    ],
  },

  // 8. ✈️ Vakantie & Reizen
  {
    name: { nl: 'Vakantie & Reizen', en: 'Vacation & Travel' },
    icon: '✈️',
    color: '#06B6D4', // Cyan
    description: 'Kosten gemaakt voor of tijdens reizen.',
    subcategories: [
      {
        name: 'Tickets & Verblijf',
        icon: '✈️',
        description: 'Vluchten, hotels en boekingen.',
        rules: [
          'KLM',
          'Transavia',
          'EasyJet',
          'Ryanair',
          'TUI',
          'Corendon',
          'Sunweb',
          'Booking\\.com',
          'Airbnb',
          'Expedia',
          'Fletcher Hotels',
          'Van der Valk',
          'vlucht',
          'hotel',
          'reis',
        ],
      },
      {
        name: 'Vakantie uitgaven',
        icon: '🌴',
        description: 'Transacties in het buitenland.',
        rules: ['Foreign Currency', 'buitenland', 'vakantie'],
      },
    ],
  },

  // 9. 💰 Financieel & Toekomst
  {
    name: { nl: 'Financieel & Toekomst', en: 'Financial & Future' },
    icon: '💰',
    color: '#10B981', // Emerald
    description: 'Geldmanagement en bankzaken.',
    subcategories: [
      {
        name: 'Sparen & Beleggen',
        icon: '📈',
        description: 'Overboekingen naar eigen spaar/beleggingsrekeningen.',
        rules: [
          'DEGIRO',
          'Meesman',
          'Brand New Day',
          'Bux',
          'Peaks',
          'Coinbase',
          'Bitvavo',
          'Rabo Spaarrekening',
          'sparen',
          'beleggen',
          'investering',
        ],
      },
      {
        name: 'Bankkosten',
        icon: '🏦',
        description: 'Kosten voor betaalpakket of rood staan.',
        rules: [
          'Kosten Betaalpakket',
          'Rente',
          'Bankkosten',
          'Creditcard kosten',
          'ICS Cards',
          'bankkosten',
        ],
      },
      {
        name: 'Leningen & Schulden',
        icon: '💸',
        description: 'Aflossing van leningen.',
        rules: [
          'DUO',
          'Dienst Uitvoering Onderwijs',
          'Santander',
          'Qander',
          'Aflossing lening',
          'lening',
          'schuld',
          'aflossing',
        ],
      },
      {
        name: 'Goede Doelen',
        icon: '🎗️',
        description: 'Donaties en giften.',
        rules: [
          'KWF',
          'Rode Kruis',
          'Greenpeace',
          'WNF',
          'Artsen zonder Grenzen',
          'UNICEF',
          'Hartstichting',
          'donatie',
          'gift',
          'goed doel',
        ],
      },
      {
        name: { nl: 'Overboekingen', en: 'Internal transfers' },
        icon: '↔️',
        description: {
          nl: 'Overboekingen tussen eigen rekeningen.',
          en: 'Transfers between your own accounts.',
        },
        rules: [],
      },
    ],
  },

  // 10. 🎓 Onderwijs & Werk
  {
    name: { nl: 'Onderwijs & Werk', en: 'Education & Work' },
    icon: '🎓',
    color: '#8B5CF6', // Violet
    description: 'Studie en werkgerelateerde kosten.',
    subcategories: [
      {
        name: 'Studie',
        icon: '📚',
        description: 'Collegegeld en studiemateriaal.',
        rules: [
          'DUO Collegegeld',
          'Universiteit',
          'Hogeschool',
          'LOI',
          'NTI',
          'Studystore',
          'collegegeld',
          'studie',
          'opleiding',
        ],
      },
      {
        name: 'Kinderopvang',
        icon: '👶',
        description: 'Opvang voor de kinderen.',
        rules: [
          'Kinderopvang',
          'KDV',
          'BSO',
          'Gastouderbureau',
          'Partou',
          'Humankind',
          'opvang',
          'creche',
        ],
      },
      {
        name: 'Zakelijk',
        icon: '💼',
        description: 'Voorschotten en werkuitgaven.',
        rules: ['Makro', 'Sligro', 'zakelijk', 'werk', 'kantoor'],
      },
    ],
  },

  // 11. 💵 Inkomsten
  {
    name: { nl: 'Inkomsten', en: 'Income' },
    icon: '💵',
    color: '#22C55E', // Green
    description: 'Al je inkomsten en ontvangsten.',
    subcategories: [
      {
        name: 'Salaris',
        icon: '💼',
        description: 'Loon uit dienstverband.',
        rules: [
          'Salaris',
          'Loon',
          'Bezoldiging',
          'Uitkering',
          'UWV',
          'SVB',
          'werkgever',
        ],
      },
      {
        name: 'Teruggaven',
        icon: '💶',
        description: 'Toeslagen en belastingteruggave.',
        rules: [
          'Belastingdienst Toeslagen',
          'Teruggave',
          'Zorgtoeslag',
          'Huurtoeslag',
          'Kinderbijslag',
          'toeslag',
        ],
      },
      {
        name: 'Overig Inkomen',
        icon: '💰',
        description: 'Tikkies en marktplaats verkopen.',
        rules: [
          'Tikkie',
          'Betaalverzoek',
          'Marktplaats',
          'Vinted',
          'ontvangen',
          'verkoop',
        ],
      },
    ],
  },
];

/**
 * Flattens the category structure for database insertion
 * Returns parent categories and subcategories with their relationships
 */
export function flattenCategoriesForDB(
  categories: SeedCategory[],
  language: 'nl' | 'en' = 'nl'
): {
  parentCategories: Array<{
    name: string;
    icon: string;
    color: string;
    description: string;
  }>;
  subcategories: Array<{
    name: string;
    icon: string;
    color: string;
    description: string;
    parentName: string;
    rules: string[];
  }>;
} {
  const parentCategories: Array<{
    name: string;
    icon: string;
    color: string;
    description: string;
  }> = [];

  const subcategories: Array<{
    name: string;
    icon: string;
    color: string;
    description: string;
    parentName: string;
    rules: string[];
  }> = [];

  for (const cat of categories) {
    const parentName = getText(cat.name, language);
    parentCategories.push({
      name: parentName,
      icon: cat.icon,
      color: cat.color,
      description: getText(cat.description, language),
    });

    for (const sub of cat.subcategories) {
      subcategories.push({
        name: getText(sub.name, language),
        icon: sub.icon,
        color: cat.color, // Inherit color from parent
        description: getText(sub.description, language),
        parentName: parentName,
        rules: sub.rules,
      });
    }
  }

  return { parentCategories, subcategories };
}
