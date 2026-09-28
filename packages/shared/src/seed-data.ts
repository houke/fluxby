/**
 * Comprehensive category seed data based on AGENTS.md category structure
 * This provides bilingual categories (Dutch/English) with hierarchical subcategories and merchant matching rules
 */

import {
  DEMO_TRANSLATIONS,
  type DemoTranslations,
} from './demo-translations.js';

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
    color: '#1E40AF',
    description: {
      nl: 'De vaste lasten om een dak boven je hoofd te hebben en je huis in te richten.',
      en: 'Fixed costs for having a roof over your head and furnishing your home.',
    },
    subcategories: [
      {
        name: { nl: 'Huur & Hypotheek', en: 'Rent & Mortgage' },
        icon: '🔑',
        description: {
          nl: 'Bruto maandlasten voor je woning.',
          en: 'Monthly housing and mortgage payments.',
        },
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
        name: { nl: 'Energie & Water', en: 'Energy & Water' },
        icon: '⚡',
        description: {
          nl: 'Gas, elektriciteit en water.',
          en: 'Gas, electricity and water.',
        },
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
        name: { nl: 'Gemeente & Belasting', en: 'Municipal Taxes' },
        icon: '🗑️',
        description: {
          nl: 'Lokale belastingen en heffingen.',
          en: 'Local taxes and levies.',
        },
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
        name: { nl: 'Inrichting & Tuin', en: 'Furniture & Garden' },
        icon: '🪑',
        description: {
          nl: 'Meubels, klussen, decoratie en tuin.',
          en: 'Furniture, DIY, decor and garden.',
        },
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
        name: { nl: 'Woonverzekering', en: 'Home Insurance' },
        icon: '🔒',
        description: {
          nl: 'Opstal- en inboedelverzekering.',
          en: 'Buildings and contents insurance.',
        },
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
    color: '#34D399',
    description: {
      nl: 'De dagelijkse benodigdheden om het huishouden draaiende te houden.',
      en: 'Daily necessities to keep the household running.',
    },
    subcategories: [
      {
        name: { nl: 'Supermarkt', en: 'Supermarket' },
        icon: '🍎',
        description: {
          nl: 'Eten, drinken en dagelijkse boodschappen.',
          en: 'Food, drinks and everyday groceries.',
        },
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
          '\\bSpar\\b',
          'Ekoplaza',
          'HelloFresh',
          'Crisp',
          'supermarkt',
          'boodschappen',
        ],
      },
      {
        name: { nl: 'Drogisterij', en: 'Drugstore' },
        icon: '🧴',
        description: {
          nl: 'Persoonlijke verzorging, schoonmaak en medicijnen.',
          en: 'Personal care, cleaning and medicine.',
        },
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
        name: { nl: 'Speciaalzaken', en: 'Specialty Stores' },
        icon: '🥖',
        description: {
          nl: 'Bakker, slager, visboer en slijterij.',
          en: 'Bakery, butcher, fishmonger and wine shop.',
        },
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
        name: { nl: 'Huisdieren', en: 'Pets' },
        icon: '🐾',
        description: {
          nl: 'Voeding, speeltjes en zorg voor dieren.',
          en: 'Food, toys and care for animals.',
        },
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
    color: '#3B82F6',
    description: {
      nl: 'Alle kosten om van A naar B te komen.',
      en: 'All costs for getting from A to B.',
    },
    subcategories: [
      {
        name: { nl: 'Brandstof & Laden', en: 'Fuel & Charging' },
        icon: '⛽',
        description: {
          nl: 'Benzine, diesel en elektrisch laden.',
          en: 'Petrol, diesel and electric charging.',
        },
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
        name: { nl: 'Openbaar Vervoer', en: 'Public Transport' },
        icon: '🚆',
        description: {
          nl: 'Trein, tram, bus en metro.',
          en: 'Train, tram, bus and metro.',
        },
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
        name: { nl: 'Parkeren & Taxi', en: 'Parking & Taxi' },
        icon: '🅿️',
        description: {
          nl: 'Parkeerkosten en taxidiensten.',
          en: 'Parking fees and taxi services.',
        },
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
        name: { nl: 'Auto Kosten', en: 'Car Costs' },
        icon: '🛡️',
        description: {
          nl: 'Verzekering, wegenbelasting en lease.',
          en: 'Insurance, road tax and leasing.',
        },
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
        name: { nl: 'Onderhoud & Fiets', en: 'Maintenance & Cycling' },
        icon: '🚲',
        description: {
          nl: 'Garagekosten, wasstraat en fietsenmaker.',
          en: 'Garage costs, car washes and bicycle shops.',
        },
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
    color: '#0EA5E9',
    description: {
      nl: 'De doorlopende digitale contracten.',
      en: 'Ongoing digital subscriptions and contracts.',
    },
    subcategories: [
      {
        name: { nl: 'Mobiel & Internet', en: 'Mobile & Internet' },
        icon: '📞',
        description: {
          nl: 'Telefoonabonnementen en thuis internet/TV.',
          en: 'Phone plans and home internet or TV.',
        },
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
        name: { nl: 'Streaming & Media', en: 'Streaming & Media' },
        icon: '📺',
        description: {
          nl: 'Video, muziek en nieuws.',
          en: 'Video, music and news.',
        },
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
        name: { nl: 'Software & Cloud', en: 'Software & Cloud' },
        icon: '☁️',
        description: {
          nl: 'Apps, cloudopslag en VPN.',
          en: 'Apps, cloud storage and VPNs.',
        },
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
    color: '#F97316',
    description: {
      nl: 'De "leuke" uitgaven: Horeca en entertainment.',
      en: 'Dining and entertainment expenses.',
    },
    subcategories: [
      {
        name: { nl: 'Restaurants & Bars', en: 'Restaurants & Bars' },
        icon: '🥂',
        description: {
          nl: 'Uit eten, terrasje en cafébezoek.',
          en: 'Dining out, terraces and cafés.',
        },
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
        name: { nl: 'Eten Bestellen', en: 'Food Delivery' },
        icon: '🍕',
        description: { nl: 'Maaltijdbezorging.', en: 'Meal delivery.' },
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
        name: { nl: 'Uitjes & Cultuur', en: 'Outings & Culture' },
        icon: '🎟️',
        description: {
          nl: 'Bioscoop, musea, concerten en evenementen.',
          en: 'Cinema, museums, concerts and events.',
        },
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
    color: '#A855F7',
    description: {
      nl: "Niet-essentiële aankopen en hobby's.",
      en: 'Non-essential purchases and hobbies.',
    },
    subcategories: [
      {
        name: { nl: 'Kleding & Schoenen', en: 'Clothing & Shoes' },
        icon: '👕',
        description: {
          nl: 'Kledingwinkels en online mode.',
          en: 'Clothing stores and online fashion.',
        },
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
        name: { nl: 'Warenhuis', en: 'Department Stores' },
        icon: '🏬',
        description: {
          nl: 'Winkels met een gemengd assortiment.',
          en: 'Stores with a mixed product range.',
        },
        rules: ['HEMA', 'De Bijenkorf', 'Bol\\.com', 'Amazon', 'warenhuis'],
      },
      {
        name: { nl: 'Elektronica', en: 'Electronics' },
        icon: '📱',
        description: {
          nl: 'Gadgets, telefoons en apparatuur.',
          en: 'Gadgets, phones and devices.',
        },
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
        name: { nl: 'Loterij & Kansspel', en: 'Lottery & Gambling' },
        icon: '🎫',
        description: {
          nl: 'Loterijen en gokken.',
          en: 'Lotteries and gambling.',
        },
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
        name: { nl: 'Hobby & Cadeaus', en: 'Hobbies & Gifts' },
        icon: '🎁',
        description: {
          nl: 'Boeken, games, bloemen en speelgoed.',
          en: 'Books, games, flowers and toys.',
        },
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
    color: '#EF4444',
    description: {
      nl: 'Kosten voor lichaam en geest.',
      en: 'Costs for physical and mental health.',
    },
    subcategories: [
      {
        name: { nl: 'Zorgverzekering', en: 'Health Insurance' },
        icon: '🩺',
        description: {
          nl: 'Maandelijkse premie.',
          en: 'Monthly insurance premium.',
        },
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
        name: { nl: 'Zorgkosten', en: 'Healthcare Costs' },
        icon: '🩹',
        description: {
          nl: 'Eigen risico, tandarts, fysio en apotheek.',
          en: 'Deductibles, dentist, physiotherapy and pharmacy.',
        },
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
        name: { nl: 'Sport & Wellness', en: 'Sports & Wellness' },
        icon: '🏋️',
        description: {
          nl: 'Sportschool, vereniging en uiterlijke verzorging.',
          en: 'Gyms, clubs and personal care.',
        },
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
    color: '#06B6D4',
    description: {
      nl: 'Kosten gemaakt voor of tijdens reizen.',
      en: 'Costs incurred while travelling.',
    },
    subcategories: [
      {
        name: { nl: 'Tickets & Verblijf', en: 'Tickets & Accommodation' },
        icon: '✈️',
        description: {
          nl: 'Vluchten, hotels en boekingen.',
          en: 'Flights, hotels and bookings.',
        },
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
        name: { nl: 'Vakantie uitgaven', en: 'Holiday Expenses' },
        icon: '🌴',
        description: {
          nl: 'Transacties in het buitenland.',
          en: 'Transactions abroad.',
        },
        rules: ['Foreign Currency', 'buitenland', 'vakantie'],
      },
    ],
  },

  // 9. 💰 Financieel & Toekomst
  {
    name: { nl: 'Financieel & Toekomst', en: 'Financial & Future' },
    icon: '💰',
    color: '#10B981',
    description: {
      nl: 'Geldmanagement en bankzaken.',
      en: 'Money management and banking.',
    },
    subcategories: [
      {
        name: { nl: 'Sparen & Beleggen', en: 'Savings & Investments' },
        icon: '📈',
        description: {
          nl: 'Overboekingen naar eigen spaar/beleggingsrekeningen.',
          en: 'Transfers to your own savings and investment accounts.',
        },
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
        name: { nl: 'Bankkosten', en: 'Bank Fees' },
        icon: '🏦',
        description: {
          nl: 'Kosten voor betaalpakket of rood staan.',
          en: 'Account fees and overdraft costs.',
        },
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
        name: { nl: 'Leningen & Schulden', en: 'Loans & Debt' },
        icon: '💸',
        description: { nl: 'Aflossing van leningen.', en: 'Loan repayments.' },
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
        name: { nl: 'Goede Doelen', en: 'Charities' },
        icon: '🎗️',
        description: { nl: 'Donaties en giften.', en: 'Donations and gifts.' },
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
    color: '#8B5CF6',
    description: {
      nl: 'Studie en werkgerelateerde kosten.',
      en: 'Study and work-related expenses.',
    },
    subcategories: [
      {
        name: { nl: 'Studie', en: 'Education' },
        icon: '📚',
        description: {
          nl: 'Collegegeld en studiemateriaal.',
          en: 'Tuition and study materials.',
        },
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
        name: { nl: 'Kinderopvang', en: 'Childcare' },
        icon: '👶',
        description: {
          nl: 'Opvang voor de kinderen.',
          en: 'Care for children.',
        },
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
        name: { nl: 'Zakelijk', en: 'Business' },
        icon: '💼',
        description: {
          nl: 'Voorschotten en werkuitgaven.',
          en: 'Advances and work expenses.',
        },
        rules: ['Makro', 'Sligro', 'zakelijk', 'werk', 'kantoor'],
      },
    ],
  },

  // 11. 💵 Inkomsten
  {
    name: { nl: 'Inkomsten', en: 'Income' },
    icon: '💵',
    color: '#22C55E',
    description: {
      nl: 'Al je inkomsten en ontvangsten.',
      en: 'All your income and receipts.',
    },
    subcategories: [
      {
        name: { nl: 'Salaris', en: 'Salary' },
        icon: '💼',
        description: { nl: 'Loon uit dienstverband.', en: 'Employment wages.' },
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
        name: { nl: 'Teruggaven', en: 'Refunds' },
        icon: '🔄',
        description: {
          nl: 'Belastingteruggaven en terugbetalingen.',
          en: 'Tax refunds and reimbursements.',
        },
        rules: ['Belastingdienst', 'Teruggave', 'Teruggaaf', 'Restitutie'],
      },
      {
        name: { nl: 'Toeslagen', en: 'Allowances' },
        icon: '💶',
        description: {
          nl: 'Overheidstoeslagen en bijdragen.',
          en: 'Government allowances and benefits.',
        },
        rules: [
          'Belastingdienst Toeslagen',
          'Zorgtoeslag',
          'Huurtoeslag',
          'Kinderbijslag',
          'Kinderopvangtoeslag',
          'toeslag',
        ],
      },
      {
        name: { nl: 'Overig Inkomen', en: 'Other Income' },
        icon: '💰',
        description: {
          nl: 'Tikkies en marktplaats verkopen.',
          en: 'Payment requests and marketplace sales.',
        },
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
  categories: SeedCategory[] = SEED_CATEGORIES,
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

/**
 * Demo merchants data for generating realistic transactions
 */
function createDemoMerchants(copy: DemoTranslations) {
  return {
    supermarkets: [
      { name: 'Albert Heijn', iban: 'NL00DEMO0001000001' },
      { name: 'Jumbo', iban: 'NL00DEMO0001000002' },
      { name: 'Lidl', iban: 'NL00DEMO0001000003' },
      { name: 'Aldi', iban: 'NL00DEMO0001000004' },
      { name: 'Plus', iban: 'NL00DEMO0001000005' },
      { name: 'Dirk', iban: 'NL00DEMO0001000006' },
    ],
    restaurants: [
      { name: 'Thuisbezorgd.nl', iban: 'NL00DEMO0002000001' },
      { name: 'Dominos Pizza', iban: 'NL00DEMO0002000002' },
      { name: "McDonald's", iban: 'NL00DEMO0002000003' },
      { name: 'Starbucks', iban: 'NL00DEMO0002000004' },
      { name: 'Uber Eats', iban: 'NL00DEMO0002000005' },
    ],
    transport: [
      { name: 'Shell', iban: 'NL00DEMO0003000001' },
      { name: 'NS', iban: 'NL00DEMO0003000002' },
      { name: 'TotalEnergies', iban: 'NL00DEMO0003000003' },
      { name: 'Parkmobile', iban: 'NL00DEMO0003000004' },
    ],
    health: [
      { name: 'Kruidvat', iban: 'NL00DEMO0004000001' },
      { name: 'Etos', iban: 'NL00DEMO0004000002' },
      { name: 'Basic-Fit', iban: 'NL00DEMO0004000003' },
    ],
    shopping: [
      { name: 'Bol.com', iban: 'NL00DEMO0005000001' },
      { name: 'HEMA', iban: 'NL00DEMO0005000002' },
      { name: 'H&M', iban: 'NL00DEMO0005000003' },
      { name: 'IKEA', iban: 'NL00DEMO0005000004' },
      { name: 'Action', iban: 'NL00DEMO0005000005' },
      { name: 'MediaMarkt', iban: 'NL00DEMO0005000006' },
      { name: 'Amazon', iban: 'NL00DEMO0005000007' },
    ],
    leisure: [
      { name: 'Pathe', iban: 'NL00DEMO0006000001' },
      { name: 'Spotify', iban: 'NL00DEMO0006000002' },
      { name: 'Netflix', iban: 'NL00DEMO0006000003' },
      { name: 'Basic-Fit', iban: 'NL00DEMO0006000004' },
    ],
    utilities: [
      { name: 'Eneco', iban: 'NL00DEMO0007000001' },
      { name: 'Ziggo', iban: 'NL00DEMO0007000002' },
      { name: 'Vattenfall', iban: 'NL00DEMO0007000003' },
    ],
    housing: [
      { name: copy.housingAssociation, iban: 'NL00DEMO0008000001' },
      { name: copy.landlord, iban: 'NL00DEMO0008000002' },
    ],
    insurance: [
      { name: 'Zilveren Kruis', iban: 'NL00DEMO0009000001' },
      { name: 'Centraal Beheer', iban: 'NL00DEMO0009000002' },
    ],
    subscriptions: [
      { name: 'Netflix', iban: 'NL00DEMO0010000001' },
      { name: 'Spotify', iban: 'NL00DEMO0010000002' },
      { name: 'KPN', iban: 'NL00DEMO0010000003' },
    ],
  };
}

export const DEMO_MERCHANTS = createDemoMerchants(DEMO_TRANSLATIONS.nl);

/**
 * Payment processors for shared IBAN demo scenarios
 */
export const PAYMENT_PROCESSORS = [
  { name: 'iDEAL Payments', iban: 'NL00DEMO0099000001' },
  { name: 'Adyen', iban: 'NL00DEMO0099000002' },
  { name: 'Mollie', iban: 'NL00DEMO0099000003' },
  { name: 'Buckaroo', iban: 'NL00DEMO0099000004' },
  { name: 'Pay.nl', iban: 'NL00DEMO0099000005' },
];

/**
 * Multi-IBAN contacts for demo scenarios
 */
function createDemoContacts(copy: DemoTranslations) {
  return [
    {
      name: 'Albert Heijn',
      // Keep the primary supermarket demo IBAN, and add two more so the UI
      // can reliably demonstrate merged contacts (multiple IBANs per contact).
      ibans: ['NL00DEMO0001000001', 'NL00DEMO0001000011', 'NL00DEMO0001000021'],
      descriptions: copy.supermarketDescriptions,
    },
    {
      name: 'Jan de Vries',
      ibans: ['NL00DEMO0090000001', 'NL00DEMO0090000002', 'NL00DEMO0090000003'],
      descriptions: copy.personalDescriptions,
    },
    {
      name: copy.family,
      ibans: ['NL00DEMO0091000001', 'NL00DEMO0091000002'],
      descriptions: copy.familyDescriptions,
    },
  ];
}

export const MULTI_IBAN_CONTACTS = createDemoContacts(DEMO_TRANSLATIONS.nl);

/**
 * Income sources for demo transactions
 */
function createDemoIncomeSources(copy: DemoTranslations) {
  return [
    {
      name: copy.employer,
      iban: 'NL00DEMO0000000001',
      description: copy.salary,
    },
    {
      name: copy.taxAuthority,
      iban: 'NL00DEMO0000000002',
      description: copy.healthcareAllowance,
    },
  ];
}

export const INCOME_SOURCES = createDemoIncomeSources(DEMO_TRANSLATIONS.nl);

/**
 * Default payment provider rules for the demo
 */
export const DEFAULT_PAYMENT_PROVIDER_RULES = [
  { name: 'PayPal', patterns: 'paypal, paypal *, via paypal' },
  { name: 'Tikkie', patterns: 'tikkie, tikkie *' },
  { name: 'Bunq', patterns: 'bunq, bunq *' },
  { name: 'Adyen', patterns: 'adyen, via adyen, adyb' },
  { name: 'Mollie', patterns: 'mollie, via mollie' },
  { name: 'iDEAL', patterns: 'ideal, via ideal' },
  { name: 'Buckaroo', patterns: 'buckaroo, via buckaroo' },
  { name: 'Pay.nl', patterns: 'pay.nl, via pay.nl' },
  { name: 'Klarna', patterns: 'klarna, via klarna' },
  { name: 'Afterpay', patterns: 'afterpay, via afterpay' },
  // Mobile wallet payment providers
  { name: 'Google Pay', patterns: 'google pay, g.co/helppay, g.co/pay' },
  { name: 'Apple Pay', patterns: 'apple pay, *apple pay' },
];

/**
 * Default name cleanup rules for merchant names
 * These are patterns to remove from transaction descriptions
 */
export const DEFAULT_NAME_CLEANUP_RULES = [
  'by Buckaroo',
  'SumUp *',
  'BCK*',
  'CCV*',
  '/\\s*via\\s+[^,]+$/gi', // Removes " via Provider" at end of names
];

/**
 * Default budgets for demo data
 */
export const DEFAULT_DEMO_BUDGETS = [
  { categoryName: 'Supermarkt', amount: 400 },
  { categoryName: 'Restaurants & Bars', amount: 150 },
  { categoryName: 'Eten Bestellen', amount: 100 },
  { categoryName: 'Streaming & Media', amount: 50 },
  { categoryName: 'Sport & Wellness', amount: 40 },
];

/**
 * Proposed contact demo data
 * This IBAN should NOT be added to address book during seeding,
 * so it appears as a "Proposed Contact" in the UI
 */
function createProposedDemoContact(copy: DemoTranslations) {
  return {
    iban: 'NL00DEMO0095000001',
    name: copy.marketplaceSeller,
    description: copy.marketplacePurchase,
    amount: -45.0,
  };
}

export const PROPOSED_CONTACT_DEMO = createProposedDemoContact(
  DEMO_TRANSLATIONS.nl
);

/** Recent expenses without a category or an existing merchant rule, for Jev demos. */
function createUncategorizedDemoExpenses(copy: DemoTranslations) {
  return [
    {
      daysAgo: 5,
      name: 'Salon Nova',
      iban: 'NL00DEMO0096000001',
      description: copy.haircut,
      amount: -38,
    },
    {
      daysAgo: 35,
      name: 'Salon Nova',
      iban: 'NL00DEMO0096000001',
      description: copy.haircut,
      amount: -38,
    },
    {
      daysAgo: 65,
      name: 'Salon Nova',
      iban: 'NL00DEMO0096000001',
      description: copy.haircut,
      amount: -42,
    },
    {
      daysAgo: 9,
      name: 'Bistro Kora',
      iban: 'NL00DEMO0096000002',
      description: copy.dinnerMenu,
      amount: -54,
    },
    {
      daysAgo: 39,
      name: 'Bistro Kora',
      iban: 'NL00DEMO0096000002',
      description: copy.dinnerMenu,
      amount: -47,
    },
    {
      daysAgo: 69,
      name: 'Bistro Kora',
      iban: 'NL00DEMO0096000002',
      description: copy.dinnerMenu,
      amount: -51,
    },
  ] as const;
}

export const DEMO_UNCATEGORIZED_EXPENSES = createUncategorizedDemoExpenses(
  DEMO_TRANSLATIONS.nl
);

/**
 * Demo recurring patterns for subscriptions feature
 * These are seeded when creating demo data to show subscription management
 */
function createDemoRecurringPatterns(copy: DemoTranslations) {
  return [
    {
      merchantName: 'Netflix',
      patternType: 'monthly' as const,
      avgAmount: -12.99,
      lastAmount: -12.99,
      isConfirmed: true,
      isVariable: false,
      transactionCount: 18,
    },
    {
      merchantName: 'Spotify',
      patternType: 'monthly' as const,
      avgAmount: -9.99,
      lastAmount: -9.99,
      isConfirmed: true,
      isVariable: false,
      transactionCount: 18,
    },
    {
      merchantName: 'Disney+',
      patternType: 'monthly' as const,
      avgAmount: -8.99,
      lastAmount: -8.99,
      isConfirmed: false, // Pending confirmation
      isVariable: false,
      transactionCount: 12,
    },
    {
      merchantName: 'KPN',
      patternType: 'monthly' as const,
      avgAmount: -52.0,
      lastAmount: -52.0,
      isConfirmed: true,
      isVariable: false,
      transactionCount: 18,
    },
    {
      merchantName: 'Vattenfall',
      patternType: 'monthly' as const,
      avgAmount: -120.0,
      lastAmount: -125.0,
      isConfirmed: true,
      isVariable: true, // Energy bills vary
      transactionCount: 18,
    },
    {
      merchantName: 'Ziggo',
      patternType: 'monthly' as const,
      avgAmount: -55.0,
      lastAmount: -55.0,
      isConfirmed: true,
      isVariable: false,
      transactionCount: 18,
    },
    {
      merchantName: 'Woonstad Rotterdam',
      patternType: 'monthly' as const,
      avgAmount: -850.0,
      lastAmount: -850.0,
      isConfirmed: true,
      isVariable: false,
      transactionCount: 18,
    },
    {
      merchantName: 'Basic-Fit',
      patternType: 'monthly' as const,
      avgAmount: -29.99,
      lastAmount: -29.99,
      isConfirmed: false, // Pending confirmation
      isVariable: false,
      transactionCount: 6,
    },
    {
      merchantName: copy.employer,
      patternType: 'monthly' as const,
      avgAmount: 2800.0,
      lastAmount: 2850.0,
      isConfirmed: true,
      isVariable: true, // Salary varies slightly
      transactionCount: 18,
    },
  ];
}

export const DEMO_RECURRING_PATTERNS = createDemoRecurringPatterns(
  DEMO_TRANSLATIONS.nl
);

/** Resolve fresh demo templates in the language selected at creation time. */
export function getDemoSeedData(language: 'nl' | 'en') {
  const copy = DEMO_TRANSLATIONS[language];
  return {
    copy,
    merchants: createDemoMerchants(copy),
    multiIbanContacts: createDemoContacts(copy),
    incomeSources: createDemoIncomeSources(copy),
    proposedContact: createProposedDemoContact(copy),
    uncategorizedExpenses: createUncategorizedDemoExpenses(copy),
    recurringPatterns: createDemoRecurringPatterns(copy),
  };
}

/** Keep demo category references independent of translated display names. */
export function getSeedCategoryNameMap(
  language: 'nl' | 'en',
  categories: SeedCategory[] = SEED_CATEGORIES
): Record<string, string> {
  return Object.fromEntries(
    categories.flatMap((category) =>
      [category, ...category.subcategories].map((entry) => [
        getText(entry.name, 'nl'),
        getText(entry.name, language),
      ])
    )
  );
}
