(() => {
  "use strict";

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const DAY_MS = 86400000;

  const state = {
    lang: localStorage.getItem("tyche-lang") || "es",
    theme: localStorage.getItem("tyche-theme") || "day",
    lastChart: null,
  };

  const I18N = {
    es: {
      brandSub: "Carta natal helenística generada matemáticamente",
      title: "Crea una carta natal helenística",
      subtitle: "Calcula el Ascendente, casas por signos enteros, secta, dignidades, lotes y configuraciones tradicionales de la astrología helenística más pura. Todo con absoluta privacidad, sin enviar ningún dato fuera de tu navegador.",
      birthDate: "Fecha",
      birthTime: "Hora exacta",
      birthPlace: "Lugar de nacimiento",
      gender: "Sexo/género opcional",
      notUsed: "No usado",
      female: "Femenino",
      male: "Masculino",
      other: "Otro / no binario",
      advancedOptions: "Opciones avanzadas",
      latitude: "Latitud",
      longitude: "Longitud",
      timeZone: "Zona horaria IANA",
      manualOffset: "Diferencia UTC de respaldo",
      calendar: "Calendario",
      gregorian: "Gregoriano",
      julian: "Juliano",
      zodiac: "Zodíaco",
      tropical: "Tropical",
      sidereal: "Sideral aproximado",
      houses: "Casas",
      wholeSign: "Casas por signos enteros",
      aspectMode: "Aspectos",
      bySign: "Por signo",
      signAndDegree: "Signo + grado",
      byDegree: "Por grado",
      orb: "Orbe",
      terms: "Términos / límites",
      egyptian: "Egipcios",
      techniqueMode: "Técnica",
      strict: "Helenística estricta",
      mixed: "Mixta con modernos",
      includeModern: "Incluir Urano, Neptuno y Plutón",
      lots: "Lotes",
      fortune: "Fortuna",
      spirit: "Espíritu",
      necessity: "Necesidad",
      courage: "Coraje",
      victory: "Victoria",
      calculate: "Calcular carta",
      resultEyebrow: "Resultado",
      planets: "Planetas",
      places: "Lugares",
      configurations: "Configuraciones",
      precisionNote: "Motor astronómico aproximado para uso educativo; revisa cartas críticas con efemérides profesionales.",
      missingDate: "Añade fecha y hora de nacimiento.",
      missingPlace: "Elige una ciudad sugerida o introduce latitud, longitud y zona horaria.",
      missingCoords: "Faltan coordenadas válidas.",
      invalidTimeZone: "Zona horaria no reconocida; usando la diferencia UTC manual.",
      invalidOffset: "La diferencia UTC manual debe tener formato +01:00 o -05:00.",
      chartFor: "Carta para {place}",
      dayChart: "Carta diurna",
      nightChart: "Carta nocturna",
      sect: "Secta",
      sectLight: "Luminaria de la secta",
      beneficSect: "Benéfico de la secta",
      maleficSect: "Maléfico de la secta",
      ascendant: "Ascendente",
      descendant: "Descendente",
      mc: "MC",
      ic: "IC",
      timezoneUsed: "Zona usada",
      julianDay: "Día juliano",
      ascLordTitle: "Regente del Ascendente",
      ascLordText: "{lord} rige {ascSign} y cae en {lordPosition}, casa {house}. Esta casa pone el timón de la carta sobre {topics}. Su angularidad es {angularity}.",
      dignifiedText: "Condición: {condition}.",
      noMajorDignity: "sin dignidad mayor",
      moonTitle: "Condición lunar",
      moonPhase: "Fase",
      moonAspects: "Aplicaciones",
      moonVoc: "Vacía de curso",
      notVoc: "No",
      yesVoc: "Sí, de forma aproximada",
      tablePlanet: "Planeta",
      tableLongitude: "Longitud",
      tableHouse: "Casa",
      tableCondition: "Condición",
      tableAngularity: "Angularidad",
      tablePhase: "Fase solar",
      tablePlace: "Lugar",
      tableSign: "Signo",
      tableRuler: "Regente",
      tablePlanets: "Planetas",
      tableTopics: "Temas",
      tableLot: "Lote",
      tableLord: "Regente del lote",
      tableLordHouse: "Casa del regente",
      tableAspect: "Configuración",
      tablePair: "Par",
      tableMode: "Modo",
      tableOrb: "Orbe",
      angular: "angular",
      succedent: "sucedente",
      cadent: "cadente",
      domicile: "domicilio",
      detriment: "detrimento",
      exaltation: "exaltación",
      fall: "caída",
      triplicityDay: "triplicidad diurna",
      triplicityNight: "triplicidad nocturna",
      triplicityCoop: "triplicidad cooperante",
      bound: "término de {planet}",
      decan: "decanato de {planet}",
      underBeams: "bajo los rayos",
      combust: "combusto",
      cazimi: "en el corazón (cazimi)",
      morning: "matutino/oriental",
      evening: "vespertino/occidental",
      hiddenMorning: "matutino bajo rayos",
      hiddenEvening: "vespertino bajo rayos",
      newMoon: "Luna nueva",
      crescent: "creciente",
      firstQuarter: "cuarto creciente",
      gibbous: "gibosa creciente",
      fullMoon: "Luna llena",
      disseminating: "diseminante",
      lastQuarter: "cuarto menguante",
      balsamic: "balsámica",
      signBased: "por signo",
      degreeBased: "por grado",
      bothModes: "signo + grado",
      copresence: "copresencia",
      sextile: "sextil",
      square: "cuadrado",
      trine: "trígono",
      opposition: "oposición",
      applying: "aplicando",
      separating: "separando",
      exact: "exacto",
      overcoming: "{planet} domina",
      noAspects: "No hay configuraciones que mostrar con los ajustes actuales.",
      noLots: "No hay lotes seleccionados.",
      topics1: "cuerpo, carácter, vitalidad y dirección de vida",
      topics2: "recursos, dinero, posesiones y medios de vida",
      topics3: "hermanos, parientes, mensajes, viajes y ritos",
      topics4: "hogar, raíces, padres, secretos y finales",
      topics5: "hijos, aumento, dones, placer y buena fortuna",
      topics6: "enfermedad, esfuerzo, subordinados, enemigos y problemas",
      topics7: "pareja, matrimonio, otros, pactos y confrontación",
      topics8: "muerte, miedo, inactividad y recursos de otros",
      topics9: "viajes, tierras extranjeras, religión, filosofía y astrología",
      topics10: "acción, oficio, reputación, rango y visibilidad",
      topics11: "amistades, alianzas, esperanzas, honores y adquisición",
      topics12: "enemigos, pérdida, encierro, sufrimiento y condiciones forzadas",
    },
    en: {
      brandSub: "Mathematically generated Hellenistic natal chart",
      title: "Create a Hellenistic natal chart",
      subtitle: "Calculate the Hour-Marker, whole sign houses, sect, dignities, lots, and traditional configurations without sending data outside the browser.",
      birthDate: "Date",
      birthTime: "Exact time",
      birthPlace: "Birthplace",
      gender: "Optional sex/gender",
      notUsed: "Not used",
      female: "Female",
      male: "Male",
      other: "Other / non-binary",
      advancedOptions: "Advanced options",
      latitude: "Latitude",
      longitude: "Longitude",
      timeZone: "IANA time zone",
      manualOffset: "Fallback UTC offset",
      calendar: "Calendar",
      gregorian: "Gregorian",
      julian: "Julian",
      zodiac: "Zodiac",
      tropical: "Tropical",
      sidereal: "Approximate sidereal",
      houses: "Houses",
      wholeSign: "Whole Sign Houses",
      aspectMode: "Aspects",
      bySign: "By sign",
      signAndDegree: "Sign + degree",
      byDegree: "By degree",
      orb: "Orb",
      terms: "Terms / bounds",
      egyptian: "Egyptian",
      techniqueMode: "Technique",
      strict: "Strict Hellenistic",
      mixed: "Mixed with moderns",
      includeModern: "Include Uranus, Neptune, and Pluto",
      lots: "Lots",
      fortune: "Fortune",
      spirit: "Spirit",
      necessity: "Necessity",
      courage: "Courage",
      victory: "Victory",
      calculate: "Calculate chart",
      resultEyebrow: "Result",
      planets: "Planets",
      places: "Places",
      configurations: "Configurations",
      precisionNote: "Approximate educational astronomy engine; verify critical charts with professional ephemerides.",
      missingDate: "Add birth date and time.",
      missingPlace: "Choose a suggested city or enter latitude, longitude, and time zone.",
      missingCoords: "Valid coordinates are missing.",
      invalidTimeZone: "Time zone not recognized; using the manual offset.",
      invalidOffset: "Manual offset must look like +01:00 or -05:00.",
      chartFor: "Chart for {place}",
      dayChart: "Day chart",
      nightChart: "Night chart",
      sect: "Sect",
      sectLight: "Sect light",
      beneficSect: "Benefic of sect",
      maleficSect: "Malefic of sect",
      ascendant: "Ascendant",
      descendant: "Descendant",
      mc: "MC",
      ic: "IC",
      timezoneUsed: "Zone used",
      julianDay: "Julian day",
      ascLordTitle: "Lord of the Hour-Marker",
      ascLordText: "{lord} rules {ascSign} and falls in {lordPosition}, house {house}. This house steers the chart toward {topics}. Its angularity is {angularity}.",
      dignifiedText: "Condition: {condition}.",
      noMajorDignity: "no major dignity",
      moonTitle: "Lunar condition",
      moonPhase: "Phase",
      moonAspects: "Applications",
      moonVoc: "Void of course",
      notVoc: "No",
      yesVoc: "Yes, approximately",
      tablePlanet: "Planet",
      tableLongitude: "Longitude",
      tableHouse: "House",
      tableCondition: "Condition",
      tableAngularity: "Angularity",
      tablePhase: "Solar phase",
      tablePlace: "Place",
      tableSign: "Sign",
      tableRuler: "Ruler",
      tablePlanets: "Planets",
      tableTopics: "Topics",
      tableLot: "Lot",
      tableLord: "Lot lord",
      tableLordHouse: "Lord house",
      tableAspect: "Configuration",
      tablePair: "Pair",
      tableMode: "Mode",
      tableOrb: "Orb",
      angular: "angular",
      succedent: "succedent",
      cadent: "cadent",
      domicile: "domicile",
      detriment: "detriment",
      exaltation: "exaltation",
      fall: "fall",
      triplicityDay: "day triplicity",
      triplicityNight: "night triplicity",
      triplicityCoop: "cooperating triplicity",
      bound: "{planet} bound",
      decan: "{planet} decan",
      underBeams: "under the beams",
      combust: "combust",
      cazimi: "in the heart (cazimi)",
      morning: "morning/oriental",
      evening: "evening/occidental",
      hiddenMorning: "morning under beams",
      hiddenEvening: "evening under beams",
      newMoon: "New Moon",
      crescent: "Crescent",
      firstQuarter: "First quarter",
      gibbous: "Waxing gibbous",
      fullMoon: "Full Moon",
      disseminating: "Disseminating",
      lastQuarter: "Last quarter",
      balsamic: "Balsamic",
      signBased: "by sign",
      degreeBased: "by degree",
      bothModes: "sign + degree",
      copresence: "copresence",
      sextile: "sextile",
      square: "square",
      trine: "trine",
      opposition: "opposition",
      applying: "applying",
      separating: "separating",
      exact: "exact",
      overcoming: "{planet} overcomes",
      noAspects: "No configurations to show with the current settings.",
      noLots: "No lots selected.",
      topics1: "body, character, vitality, and life direction",
      topics2: "resources, money, possessions, and livelihood",
      topics3: "siblings, relatives, messages, travel, and ritual",
      topics4: "home, roots, parents, secrets, and endings",
      topics5: "children, increase, gifts, pleasure, and good fortune",
      topics6: "illness, toil, subordinates, enemies, and difficulties",
      topics7: "partner, marriage, others, agreements, and confrontation",
      topics8: "death, fear, inactivity, and resources of others",
      topics9: "travel, foreign lands, religion, philosophy, and astrology",
      topics10: "action, craft, reputation, rank, and visibility",
      topics11: "friends, alliances, hopes, honors, and acquisition",
      topics12: "enemies, loss, confinement, suffering, and forced conditions",
    },
  };

  const SIGN_KEYS = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];

  const SIGNS = [
    ["Aries", "Aries", "♈︎", "mars", "masculine", "fire", "cardinal"],
    ["Tauro", "Taurus", "♉︎", "venus", "feminine", "earth", "fixed"],
    ["Géminis", "Gemini", "♊︎", "mercury", "masculine", "air", "mutable"],
    ["Cáncer", "Cancer", "♋︎", "moon", "feminine", "water", "cardinal"],
    ["Leo", "Leo", "♌︎", "sun", "masculine", "fire", "fixed"],
    ["Virgo", "Virgo", "♍︎", "mercury", "feminine", "earth", "mutable"],
    ["Libra", "Libra", "♎︎", "venus", "masculine", "air", "cardinal"],
    ["Escorpio", "Scorpio", "♏︎", "mars", "feminine", "water", "fixed"],
    ["Sagitario", "Sagittarius", "♐︎", "jupiter", "masculine", "fire", "mutable"],
    ["Capricornio", "Capricorn", "♑︎", "saturn", "feminine", "earth", "cardinal"],
    ["Acuario", "Aquarius", "♒︎", "saturn", "masculine", "air", "fixed"],
    ["Piscis", "Pisces", "♓︎", "jupiter", "feminine", "water", "mutable"],
  ].map((row, i) => ({
    key: SIGN_KEYS[i],
    es: row[0],
    en: row[1],
    symbol: row[2],
    ruler: row[3],
    gender: row[4],
    element: row[5],
    mode: row[6],
  }));

  const PLANETS = {
    sun: { es: "Sol", en: "Sun", symbol: "☉︎", visible: true },
    moon: { es: "Luna", en: "Moon", symbol: "☽︎", visible: true },
    mercury: { es: "Mercurio", en: "Mercury", symbol: "☿︎", visible: true },
    venus: { es: "Venus", en: "Venus", symbol: "♀︎", visible: true },
    mars: { es: "Marte", en: "Mars", symbol: "♂︎", visible: true },
    jupiter: { es: "Júpiter", en: "Jupiter", symbol: "♃︎", visible: true },
    saturn: { es: "Saturno", en: "Saturn", symbol: "♄︎", visible: true },
    uranus: { es: "Urano", en: "Uranus", symbol: "♅︎", visible: false },
    neptune: { es: "Neptuno", en: "Neptune", symbol: "♆︎", visible: false },
    pluto: { es: "Plutón", en: "Pluto", symbol: "♇︎", visible: false },
  };

  const VISIBLE_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];
  const MODERN_KEYS = ["uranus", "neptune", "pluto"];

  const EXALTATIONS = {
    sun: 0,
    moon: 1,
    mercury: 5,
    venus: 11,
    mars: 9,
    jupiter: 3,
    saturn: 6,
  };

  const TRIPLICITY = {
    fire: { day: "sun", night: "jupiter", coop: "saturn" },
    earth: { day: "venus", night: "moon", coop: "mars" },
    air: { day: "saturn", night: "mercury", coop: "jupiter" },
    water: { day: "venus", night: "mars", coop: "moon" },
  };

  const BOUNDS = {
    aries: [["jupiter", 6], ["venus", 14], ["mercury", 21], ["mars", 26], ["saturn", 30]],
    taurus: [["venus", 8], ["mercury", 15], ["jupiter", 22], ["saturn", 26], ["mars", 30]],
    gemini: [["mercury", 6], ["jupiter", 12], ["venus", 17], ["mars", 24], ["saturn", 30]],
    cancer: [["mars", 7], ["venus", 13], ["mercury", 19], ["jupiter", 26], ["saturn", 30]],
    leo: [["jupiter", 6], ["venus", 11], ["saturn", 18], ["mercury", 24], ["mars", 30]],
    virgo: [["mercury", 7], ["venus", 13], ["jupiter", 17], ["mars", 21], ["saturn", 30]],
    libra: [["saturn", 6], ["mercury", 14], ["jupiter", 21], ["venus", 28], ["mars", 30]],
    scorpio: [["mars", 7], ["venus", 11], ["mercury", 19], ["jupiter", 24], ["saturn", 30]],
    sagittarius: [["jupiter", 12], ["venus", 17], ["mercury", 21], ["saturn", 26], ["mars", 30]],
    capricorn: [["mercury", 7], ["jupiter", 14], ["venus", 22], ["saturn", 26], ["mars", 30]],
    aquarius: [["mercury", 7], ["venus", 13], ["jupiter", 20], ["mars", 25], ["saturn", 30]],
    pisces: [["venus", 12], ["jupiter", 16], ["mercury", 19], ["mars", 28], ["saturn", 30]],
  };

  const CHALDEAN_ORDER = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];
  const CITY_DB = [
    ["Madrid", "Spain", 40.4168, -3.7038, "Europe/Madrid"],
    ["Barcelona", "Spain", 41.3874, 2.1686, "Europe/Madrid"],
    ["Valencia", "Spain", 39.4699, -0.3763, "Europe/Madrid"],
    ["Seville", "Spain", 37.3891, -5.9845, "Europe/Madrid"],
    ["Sevilla", "Spain", 37.3891, -5.9845, "Europe/Madrid"],
    ["Zaragoza", "Spain", 41.6488, -0.8891, "Europe/Madrid"],
    ["Málaga", "Spain", 36.7213, -4.4214, "Europe/Madrid"],
    ["Murcia", "Spain", 37.9922, -1.1307, "Europe/Madrid"],
    ["Bilbao", "Spain", 43.263, -2.935, "Europe/Madrid"],
    ["A Coruña", "Spain", 43.3623, -8.4115, "Europe/Madrid"],
    ["Palma", "Spain", 39.5696, 2.6502, "Europe/Madrid"],
    ["Las Palmas", "Spain", 28.1235, -15.4363, "Atlantic/Canary"],
    ["Santa Cruz de Tenerife", "Spain", 28.4636, -16.2518, "Atlantic/Canary"],
    ["Lisbon", "Portugal", 38.7223, -9.1393, "Europe/Lisbon"],
    ["Paris", "France", 48.8566, 2.3522, "Europe/Paris"],
    ["London", "United Kingdom", 51.5072, -0.1276, "Europe/London"],
    ["Dublin", "Ireland", 53.3498, -6.2603, "Europe/Dublin"],
    ["Rome", "Italy", 41.9028, 12.4964, "Europe/Rome"],
    ["Milan", "Italy", 45.4642, 9.19, "Europe/Rome"],
    ["Berlin", "Germany", 52.52, 13.405, "Europe/Berlin"],
    ["Amsterdam", "Netherlands", 52.3676, 4.9041, "Europe/Amsterdam"],
    ["Brussels", "Belgium", 50.8503, 4.3517, "Europe/Brussels"],
    ["Vienna", "Austria", 48.2082, 16.3738, "Europe/Vienna"],
    ["Athens", "Greece", 37.9838, 23.7275, "Europe/Athens"],
    ["Istanbul", "Turkey", 41.0082, 28.9784, "Europe/Istanbul"],
    ["Cairo", "Egypt", 30.0444, 31.2357, "Africa/Cairo"],
    ["Alexandria", "Egypt", 31.2001, 29.9187, "Africa/Cairo"],
    ["New York", "United States", 40.7128, -74.006, "America/New_York"],
    ["Los Angeles", "United States", 34.0522, -118.2437, "America/Los_Angeles"],
    ["Chicago", "United States", 41.8781, -87.6298, "America/Chicago"],
    ["Miami", "United States", 25.7617, -80.1918, "America/New_York"],
    ["Mexico City", "Mexico", 19.4326, -99.1332, "America/Mexico_City"],
    ["Buenos Aires", "Argentina", -34.6037, -58.3816, "America/Argentina/Buenos_Aires"],
    ["Santiago", "Chile", -33.4489, -70.6693, "America/Santiago"],
    ["Lima", "Peru", -12.0464, -77.0428, "America/Lima"],
    ["Bogotá", "Colombia", 4.711, -74.0721, "America/Bogota"],
    ["São Paulo", "Brazil", -23.5558, -46.6396, "America/Sao_Paulo"],
    ["Montevideo", "Uruguay", -34.9011, -56.1645, "America/Montevideo"],
    ["Tokyo", "Japan", 35.6762, 139.6503, "Asia/Tokyo"],
    ["Beijing", "China", 39.9042, 116.4074, "Asia/Shanghai"],
    ["Shanghai", "China", 31.2304, 121.4737, "Asia/Shanghai"],
    ["Hong Kong", "China", 22.3193, 114.1694, "Asia/Hong_Kong"],
    ["Seoul", "South Korea", 37.5665, 126.978, "Asia/Seoul"],
    ["New Delhi", "India", 28.6139, 77.209, "Asia/Kolkata"],
    ["Mumbai", "India", 19.076, 72.8777, "Asia/Kolkata"],
    ["Sydney", "Australia", -33.8688, 151.2093, "Australia/Sydney"],
    ["Melbourne", "Australia", -37.8136, 144.9631, "Australia/Melbourne"],
    ["Auckland", "New Zealand", -36.8509, 174.7645, "Pacific/Auckland"],
    ["Casablanca", "Morocco", 33.5731, -7.5898, "Africa/Casablanca"],
    ["Rabat", "Morocco", 34.0209, -6.8416, "Africa/Casablanca"],
  ].map(([city, country, lat, lon, tz]) => ({ city, country, lat, lon, tz }));

  const TIME_ZONES = [...new Set(CITY_DB.map((city) => city.tz))].sort();

  const COUNTRY_ES = {
    Argentina: "Argentina",
    Australia: "Australia",
    Austria: "Austria",
    Belgium: "Bélgica",
    Brazil: "Brasil",
    Chile: "Chile",
    China: "China",
    Colombia: "Colombia",
    Egypt: "Egipto",
    France: "Francia",
    Germany: "Alemania",
    Greece: "Grecia",
    India: "India",
    Ireland: "Irlanda",
    Italy: "Italia",
    Japan: "Japón",
    Mexico: "México",
    Morocco: "Marruecos",
    Netherlands: "Países Bajos",
    "New Zealand": "Nueva Zelanda",
    Peru: "Perú",
    Portugal: "Portugal",
    Spain: "España",
    "South Korea": "Corea del Sur",
    Turkey: "Turquía",
    "United Kingdom": "Reino Unido",
    "United States": "Estados Unidos",
    Uruguay: "Uruguay",
  };

  const CITY_ES = {
    Lisbon: "Lisboa",
    Paris: "París",
    London: "Londres",
    Dublin: "Dublín",
    Seville: "Sevilla",
    Rome: "Roma",
    Milan: "Milán",
    Berlin: "Berlín",
    Amsterdam: "Ámsterdam",
    Brussels: "Bruselas",
    Vienna: "Viena",
    Athens: "Atenas",
    Istanbul: "Estambul",
    Cairo: "El Cairo",
    Alexandria: "Alejandría",
    "New York": "Nueva York",
    "Los Angeles": "Los Ángeles",
    "Mexico City": "Ciudad de México",
    Tokyo: "Tokio",
    Beijing: "Pekín",
    Shanghai: "Shanghái",
    Seoul: "Seúl",
    "New Delhi": "Nueva Delhi",
    Mumbai: "Bombay",
    Sydney: "Sídney",
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function t(key, params = {}) {
    const table = I18N[state.lang] || I18N.es;
    const fallback = I18N.es[key] || key;
    return (table[key] || fallback).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function countryName(country, lang = state.lang) {
    return lang === "es" ? COUNTRY_ES[country] || country : country;
  }

  function cityName(city, lang = state.lang) {
    return lang === "es" ? CITY_ES[city.city] || city.city : city.city;
  }

  function formatCity(city, lang = state.lang) {
    return `${cityName(city, lang)}, ${countryName(city.country, lang)}`;
  }

  function planetName(key) {
    return PLANETS[key]?.[state.lang] || PLANETS[key]?.en || key;
  }

  function signName(index) {
    return SIGNS[((index % 12) + 12) % 12][state.lang];
  }

  function signOf(lon) {
    return Math.floor(norm360(lon) / 30);
  }

  function degreeInSign(lon) {
    return norm360(lon) % 30;
  }

  function norm360(value) {
    return ((value % 360) + 360) % 360;
  }

  function norm180(value) {
    const normalized = norm360(value);
    return normalized > 180 ? normalized - 360 : normalized;
  }

  function zodiacalDistance(from, to) {
    return norm360(to - from);
  }

  function angleDistance(a, b) {
    return Math.abs(norm180(a - b));
  }

  function sinD(deg) {
    return Math.sin(deg * DEG);
  }

  function cosD(deg) {
    return Math.cos(deg * DEG);
  }

  function tanD(deg) {
    return Math.tan(deg * DEG);
  }

  function asinD(value) {
    return Math.asin(Math.max(-1, Math.min(1, value))) * RAD;
  }

  function atan2D(y, x) {
    return Math.atan2(y, x) * RAD;
  }

  function formatDegree(lon) {
    const sign = SIGNS[signOf(lon)];
    const deg = degreeInSign(lon);
    const whole = Math.floor(deg);
    const minutes = Math.floor((deg - whole) * 60);
    return `${whole}°${String(minutes).padStart(2, "0")}′ ${sign.symbol} ${sign[state.lang]}`;
  }

  function formatShortDegree(lon) {
    const sign = SIGNS[signOf(lon)];
    const deg = degreeInSign(lon);
    return `${Math.floor(deg)}° ${sign.symbol}`;
  }

  function round(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function metric(label, value) {
    return `<div class="metric"><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></div>`;
  }

  function badges(items) {
    if (!items.length) return "";
    return `<div class="badge-row">${items.map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("")}</div>`;
  }

  function makeTable(headers, rows) {
    return `
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr></thead>
          <tbody>${rows
            .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
            .join("")}</tbody>
        </table>
      </div>
    `;
  }

  function placeQuality(house) {
    if ([1, 4, 7, 10].includes(house)) return "angular";
    if ([2, 5, 8, 11].includes(house)) return "succedent";
    return "cadent";
  }

  function houseFromSign(signIndex, ascSign) {
    return ((signIndex - ascSign + 12) % 12) + 1;
  }

  function houseTopics(house) {
    return t(`topics${house}`);
  }

  function findCity(value) {
    const normalized = normalizeText(value);
    return CITY_DB.find((item) => {
      const matches = [
        cityName(item, "en"),
        cityName(item, "es"),
        formatCity(item, "en"),
        formatCity(item, "es"),
      ].map(normalizeText);
      return matches.includes(normalized);
    });
  }

  function parseDate(value) {
    const match = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  }

  function parseTime(value) {
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (!match) return null;
    return { h: Number(match[1]), min: Number(match[2]) };
  }

  function parseOffset(value) {
    const match = /^([+-])(\d{2}):(\d{2})$/.exec(String(value || "").trim());
    if (!match) return null;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3]);
    if (hours > 14 || minutes > 59) return null;
    return sign * (hours * 60 + minutes);
  }

  function formatOffset(minutes) {
    const sign = minutes < 0 ? "-" : "+";
    const absolute = Math.abs(minutes);
    const h = Math.floor(absolute / 60);
    const m = absolute % 60;
    return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function calendarToJd(y, m, day, calendar) {
    let year = y;
    let month = m;
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const a = Math.floor(year / 100);
    const b = calendar === "gregorian" ? 2 - a + Math.floor(a / 4) : 0;
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  }

  function getTimeZoneOffsetMinutes(timeZone, timestampMs) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(timestampMs))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round((asUtc - timestampMs) / 60000);
  }

  function zonedTimeToUtc(y, m, d, h, min, timeZone) {
    let utc = Date.UTC(y, m - 1, d, h, min, 0);
    for (let i = 0; i < 4; i += 1) {
      const offset = getTimeZoneOffsetMinutes(timeZone, utc);
      utc = Date.UTC(y, m - 1, d, h, min, 0) - offset * 60000;
    }
    const offset = getTimeZoneOffsetMinutes(timeZone, utc);
    return { utcMs: utc, offset };
  }

  function jdFromForm(input) {
    const date = parseDate(input.date);
    const time = parseTime(input.time);
    if (!date || !time) throw new Error(t("missingDate"));

    const manualOffset = parseOffset(input.manualOffset);
    if (manualOffset === null) throw new Error(t("invalidOffset"));

    if (input.calendar === "julian") {
      const day = date.d + (time.h + time.min / 60 - manualOffset / 60) / 24;
      return {
        jd: calendarToJd(date.y, date.m, day, "julian"),
        offset: manualOffset,
        zoneLabel: `UTC${formatOffset(manualOffset)}`,
      };
    }

    if (input.timeZone) {
      try {
        const zoned = zonedTimeToUtc(date.y, date.m, date.d, time.h, time.min, input.timeZone);
        return {
          jd: zoned.utcMs / DAY_MS + 2440587.5,
          offset: zoned.offset,
          zoneLabel: `${input.timeZone} (UTC${formatOffset(zoned.offset)})`,
        };
      } catch (error) {
        $("#formStatus").textContent = t("invalidTimeZone");
      }
    }

    const utcMs = Date.UTC(date.y, date.m - 1, date.d, time.h, time.min, 0) - manualOffset * 60000;
    return {
      jd: utcMs / DAY_MS + 2440587.5,
      offset: manualOffset,
      zoneLabel: `UTC${formatOffset(manualOffset)}`,
    };
  }

  function meanObliquity(jd) {
    const tCent = (jd - 2451545.0) / 36525;
    return 23.439291111 - 0.013004167 * tCent - 0.0000001639 * tCent * tCent + 0.0000005036 * tCent * tCent * tCent;
  }

  function sunLongitude(jd) {
    const tCent = (jd - 2451545.0) / 36525;
    const l0 = norm360(280.46646 + 36000.76983 * tCent + 0.0003032 * tCent * tCent);
    const m = norm360(357.52911 + 35999.05029 * tCent - 0.0001537 * tCent * tCent);
    const c =
      (1.914602 - 0.004817 * tCent - 0.000014 * tCent * tCent) * sinD(m) +
      (0.019993 - 0.000101 * tCent) * sinD(2 * m) +
      0.000289 * sinD(3 * m);
    const trueLong = l0 + c;
    const omega = 125.04 - 1934.136 * tCent;
    return norm360(trueLong - 0.00569 - 0.00478 * sinD(omega));
  }

  function kepler(M, e) {
    let E = M * DEG;
    for (let i = 0; i < 8; i += 1) {
      E -= (E - e * Math.sin(E) - M * DEG) / (1 - e * Math.cos(E));
    }
    return E;
  }

  function elements(key, d) {
    const data = {
      mercury: [48.3313 + 3.24587e-5 * d, 7.0047 + 5.0e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d],
      venus: [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d, 0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d],
      earth: [0, 0, 282.9404 + 4.70935e-5 * d, 1.0, 0.016709 - 1.151e-9 * d, 356.047 + 0.9856002585 * d],
      mars: [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d],
      jupiter: [100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.895 + 0.0830853001 * d],
      saturn: [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.967 + 0.0334442282 * d],
      uranus: [74.0005 + 1.3978e-5 * d, 0.7733 + 1.9e-8 * d, 96.6612 + 3.0565e-5 * d, 19.18171 - 1.55e-8 * d, 0.047318 + 7.45e-9 * d, 142.5905 + 0.011725806 * d],
      neptune: [131.7806 + 3.0173e-5 * d, 1.77 - 2.55e-7 * d, 272.8461 - 6.027e-6 * d, 30.05826 + 3.313e-8 * d, 0.008606 + 2.15e-9 * d, 260.2471 + 0.005995147 * d],
      pluto: [110.3035, 17.1418, 113.7633, 39.4817, 0.2488, 14.53 + 0.0039757 * d],
    };
    return data[key];
  }

  function heliocentricCoords(key, d) {
    const [N, i, w, a, e, Mraw] = elements(key, d);
    const M = norm360(Mraw);
    const E = kepler(M, e);
    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = atan2D(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);
    const lon = v + w;
    const xh = r * (cosD(N) * cosD(lon) - sinD(N) * sinD(lon) * cosD(i));
    const yh = r * (sinD(N) * cosD(lon) + cosD(N) * sinD(lon) * cosD(i));
    const zh = r * (sinD(lon) * sinD(i));
    return {
      x: xh,
      y: yh,
      z: zh,
      lon: norm360(atan2D(yh, xh)),
      lat: atan2D(zh, Math.sqrt(xh * xh + yh * yh)),
    };
  }

  function moonPosition(jd) {
    const d = jd - 2451543.5;
    const N = norm360(125.1228 - 0.0529538083 * d);
    const i = 5.1454;
    const w = norm360(318.0634 + 0.1643573223 * d);
    const a = 60.2666;
    const e = 0.0549;
    const M = norm360(115.3654 + 13.0649929509 * d);
    const E = kepler(M, e);
    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = atan2D(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);
    let xh = r * (cosD(N) * cosD(v + w) - sinD(N) * sinD(v + w) * cosD(i));
    let yh = r * (sinD(N) * cosD(v + w) + cosD(N) * sinD(v + w) * cosD(i));
    let zh = r * (sinD(v + w) * sinD(i));
    let lon = norm360(atan2D(yh, xh));
    let lat = atan2D(zh, Math.sqrt(xh * xh + yh * yh));

    const sunM = norm360(356.047 + 0.9856002585 * d);
    const sunLon = sunLongitude(jd);
    const D = norm360(lon - sunLon);
    const F = norm360(lon - N);
    lon +=
      -1.274 * sinD(M - 2 * D) +
      0.658 * sinD(2 * D) -
      0.186 * sinD(sunM) -
      0.059 * sinD(2 * M - 2 * D) -
      0.057 * sinD(M - 2 * D + sunM) +
      0.053 * sinD(M + 2 * D) +
      0.046 * sinD(2 * D - sunM) +
      0.041 * sinD(M - sunM) -
      0.035 * sinD(D) -
      0.031 * sinD(M + sunM) -
      0.015 * sinD(2 * F - 2 * D) +
      0.011 * sinD(M - 4 * D);
    lat +=
      -0.173 * sinD(F - 2 * D) -
      0.055 * sinD(M - F - 2 * D) -
      0.046 * sinD(M + F - 2 * D) +
      0.033 * sinD(F + 2 * D) +
      0.017 * sinD(2 * M + F);

    xh = Math.cos(lon * DEG) * Math.cos(lat * DEG);
    yh = Math.sin(lon * DEG) * Math.cos(lat * DEG);
    zh = Math.sin(lat * DEG);
    return { lon: norm360(lon), lat, x: xh, y: yh, z: zh };
  }

  function tropicalPositions(jd, includeModern) {
    const d = jd - 2451543.5;
    const earth = heliocentricCoords("earth", d);
    const result = {
      sun: { lon: sunLongitude(jd), lat: 0 },
      moon: moonPosition(jd),
    };

    const keys = ["mercury", "venus", "mars", "jupiter", "saturn"];
    if (includeModern) keys.push(...MODERN_KEYS);
    keys.forEach((key) => {
      const planet = heliocentricCoords(key, d);
      const x = planet.x - earth.x;
      const y = planet.y - earth.y;
      const z = planet.z - earth.z;
      result[key] = {
        lon: norm360(atan2D(y, x)),
        lat: atan2D(z, Math.sqrt(x * x + y * y)),
      };
    });
    return result;
  }

  function ayanamsa(jd) {
    const years = (jd - 2451545.0) / 365.2422;
    return 23.85675 + (50.290966 * years) / 3600;
  }

  function applyZodiac(lon, jd, zodiac) {
    if (zodiac !== "sidereal") return norm360(lon);
    return norm360(lon - ayanamsa(jd));
  }

  function calculateAngles(jd, lat, lon, zodiac) {
    const d = jd - 2451545.0;
    const tCent = d / 36525;
    const gmst = norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * tCent * tCent - (tCent * tCent * tCent) / 38710000);
    const lst = norm360(gmst + lon);
    const eps = meanObliquity(jd);
    const mcTropical = norm360(atan2D(sinD(lst) / cosD(eps), cosD(lst)));
    const ascTropical = norm360(atan2D(-cosD(lst), sinD(lst) * cosD(eps) + tanD(lat) * sinD(eps)));
    return {
      lst,
      eps,
      ascRaw: ascTropical,
      mcRaw: mcTropical,
      asc: applyZodiac(ascTropical, jd, zodiac),
      mc: applyZodiac(mcTropical, jd, zodiac),
      desc: applyZodiac(ascTropical + 180, jd, zodiac),
      ic: applyZodiac(mcTropical + 180, jd, zodiac),
    };
  }

  function altitudeFromLon(lon, lat, lst, eps) {
    const ra = norm360(atan2D(sinD(lon) * cosD(eps), cosD(lon)));
    const dec = asinD(sinD(lon) * sinD(eps));
    const H = norm180(lst - ra);
    return asinD(sinD(lat) * sinD(dec) + cosD(lat) * cosD(dec) * cosD(H));
  }

  function planetSpeed(jd, key, includeModern, zodiac) {
    const now = tropicalPositions(jd, includeModern)[key];
    const next = tropicalPositions(jd + 1, includeModern)[key];
    return norm180(applyZodiac(next.lon, jd + 1, zodiac) - applyZodiac(now.lon, jd, zodiac));
  }

  function dignityFor(planet, lon, isDay) {
    if (!VISIBLE_KEYS.includes(planet)) return [];
    const sIndex = signOf(lon);
    const sign = SIGNS[sIndex];
    const labels = [];

    if (sign.ruler === planet) labels.push(t("domicile"));
    if (SIGNS[(sIndex + 6) % 12].ruler === planet) labels.push(t("detriment"));
    if (EXALTATIONS[planet] === sIndex) labels.push(t("exaltation"));
    if (EXALTATIONS[planet] !== undefined && (EXALTATIONS[planet] + 6) % 12 === sIndex) labels.push(t("fall"));

    const trip = TRIPLICITY[sign.element];
    if (trip.day === planet) labels.push(t("triplicityDay"));
    if (trip.night === planet) labels.push(t("triplicityNight"));
    if (trip.coop === planet) labels.push(t("triplicityCoop"));

    const boundLord = boundLordFor(lon);
    labels.push(t("bound", { planet: planetName(boundLord) }));
    labels.push(t("decan", { planet: planetName(decanLordFor(lon)) }));

    return labels;
  }

  function majorDignities(planet, lon) {
    if (!VISIBLE_KEYS.includes(planet)) return [];
    const sIndex = signOf(lon);
    const sign = SIGNS[sIndex];
    const labels = [];
    if (sign.ruler === planet) labels.push(t("domicile"));
    if (SIGNS[(sIndex + 6) % 12].ruler === planet) labels.push(t("detriment"));
    if (EXALTATIONS[planet] === sIndex) labels.push(t("exaltation"));
    if (EXALTATIONS[planet] !== undefined && (EXALTATIONS[planet] + 6) % 12 === sIndex) labels.push(t("fall"));
    return labels;
  }

  function boundLordFor(lon) {
    const sign = SIGNS[signOf(lon)];
    const degree = degreeInSign(lon);
    return BOUNDS[sign.key].find((entry) => degree < entry[1])?.[0] || "saturn";
  }

  function decanLordFor(lon) {
    const sign = signOf(lon);
    const decan = Math.min(2, Math.floor(degreeInSign(lon) / 10));
    return CHALDEAN_ORDER[(2 + sign * 3 + decan) % CHALDEAN_ORDER.length];
  }

  function solarPhaseFor(planet, positions) {
    if (planet === "sun" || planet === "moon" || !VISIBLE_KEYS.includes(planet)) return "";
    const sun = positions.sun.lon;
    const lon = positions[planet].lon;
    const distance = angleDistance(lon, sun);
    const fromSun = zodiacalDistance(sun, lon);
    const side = fromSun > 180 ? "morning" : "evening";
    if (distance <= 1) return t("cazimi");
    if (distance <= 8) return `${t("combust")}, ${t(side === "morning" ? "hiddenMorning" : "hiddenEvening")}`;
    if (distance <= 15) return `${t("underBeams")}, ${t(side === "morning" ? "hiddenMorning" : "hiddenEvening")}`;
    return t(side);
  }

  function lunarPhaseName(elongation) {
    const e = norm360(elongation);
    if (e < 22.5 || e >= 337.5) return t("newMoon");
    if (e < 67.5) return t("crescent");
    if (e < 112.5) return t("firstQuarter");
    if (e < 157.5) return t("gibbous");
    if (e < 202.5) return t("fullMoon");
    if (e < 247.5) return t("disseminating");
    if (e < 292.5) return t("lastQuarter");
    return t("balsamic");
  }

  function signAspectType(aSign, bSign) {
    const distance = (bSign - aSign + 12) % 12;
    const map = { 0: "copresence", 2: "sextile", 3: "square", 4: "trine", 6: "opposition", 8: "trine", 9: "square", 10: "sextile" };
    return map[distance] || null;
  }

  function degreeAspect(a, b, orb) {
    const distance = angleDistance(a, b);
    const aspects = [
      ["copresence", 0],
      ["sextile", 60],
      ["square", 90],
      ["trine", 120],
      ["opposition", 180],
    ];
    let best = null;
    aspects.forEach(([type, exact]) => {
      const delta = Math.abs(distance - exact);
      if (delta <= orb && (!best || delta < best.delta)) best = { type, delta };
    });
    return best;
  }

  function overcomingLabel(aKey, bKey, aLon, bLon) {
    const distance = (signOf(bLon) - signOf(aLon) + 12) % 12;
    if ([2, 3, 4].includes(distance)) return t("overcoming", { planet: planetName(aKey) });
    if ([8, 9, 10].includes(distance)) return t("overcoming", { planet: planetName(bKey) });
    return "";
  }

  function lotLongitude(key, chart) {
    const asc = chart.angles.asc;
    const p = chart.positions;
    const day = chart.isDay;
    const formula = {
      fortune: day ? asc + p.moon.lon - p.sun.lon : asc + p.sun.lon - p.moon.lon,
      spirit: day ? asc + p.sun.lon - p.moon.lon : asc + p.moon.lon - p.sun.lon,
    };
    formula.eros = day ? asc + formula.spirit - formula.fortune : asc + formula.fortune - formula.spirit;
    formula.necessity = day ? asc + formula.fortune - formula.spirit : asc + formula.spirit - formula.fortune;
    formula.courage = day ? asc + formula.fortune - p.mars.lon : asc + p.mars.lon - formula.fortune;
    formula.victory = day ? asc + p.jupiter.lon - formula.spirit : asc + formula.spirit - p.jupiter.lon;
    formula.nemesis = day ? asc + formula.fortune - p.saturn.lon : asc + p.saturn.lon - formula.fortune;
    return norm360(formula[key]);
  }

  function lotName(key) {
    const names = {
      fortune: t("fortune"),
      spirit: t("spirit"),
      eros: "Eros",
      necessity: t("necessity"),
      courage: t("courage"),
      victory: t("victory"),
      nemesis: "Némesis",
    };
    return names[key] || key;
  }

  function computeMoonCondition(chart) {
    const elongation = zodiacalDistance(chart.positions.sun.lon, chart.positions.moon.lon);
    const apps = [];
    const moonSpeed = Math.abs(chart.positions.moon.speed);
    VISIBLE_KEYS.filter((key) => key !== "moon" && key !== "sun").forEach((key) => {
      const aspect = degreeAspect(chart.positions.moon.lon, chart.positions[key].lon, 8);
      if (!aspect) return;
      const nextMoon = norm360(chart.positions.moon.lon + chart.positions.moon.speed);
      const nextPlanet = norm360(chart.positions[key].lon + chart.positions[key].speed);
      const nowDelta = Math.abs(angleDistance(chart.positions.moon.lon, chart.positions[key].lon) - { copresence: 0, sextile: 60, square: 90, trine: 120, opposition: 180 }[aspect.type]);
      const nextDelta = Math.abs(angleDistance(nextMoon, nextPlanet) - { copresence: 0, sextile: 60, square: 90, trine: 120, opposition: 180 }[aspect.type]);
      const motion = nextDelta < nowDelta && moonSpeed > Math.abs(chart.positions[key].speed) ? t("applying") : t("separating");
      apps.push(`${PLANETS[key].symbol} ${planetName(key)} ${t(aspect.type)} (${motion})`);
    });
    return {
      phase: lunarPhaseName(elongation),
      elongation,
      applications: apps,
      voidOfCourse: apps.every((item) => item.includes(t("separating"))),
    };
  }

  function readInput() {
    const placeValue = $("#birthPlace").value.trim();
    const city = findCity(placeValue);
    const latField = $("#latitude").value;
    const lonField = $("#longitude").value;
    const latitude = latField !== "" ? Number(latField) : city?.lat;
    const longitude = lonField !== "" ? Number(lonField) : city?.lon;
    const timeZone = $("#timeZone").value.trim() || city?.tz || "";
    const includeModern = $("#includeModern").checked || $("#techniqueMode").value === "mixed";
    const selectedLots = $$('input[name="lots"]:checked').map((item) => item.value);

    return {
      date: $("#birthDate").value,
      time: $("#birthTime").value,
      place: city ? formatCity(city) : placeValue,
      city,
      latitude,
      longitude,
      timeZone,
      manualOffset: $("#manualOffset").value.trim(),
      calendar: $("#calendar").value,
      zodiac: $("#zodiac").value,
      aspectMode: $("#aspectMode").value,
      orb: Number($("#orb").value || 3),
      includeModern,
      selectedLots,
    };
  }

  function computeChart(input) {
    if (!input.place && (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude))) throw new Error(t("missingPlace"));
    if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) throw new Error(t("missingCoords"));
    if (input.latitude < -66 || input.latitude > 66) {
      $("#formStatus").textContent = state.lang === "es"
        ? "Las latitudes extremas pueden producir ángulos inestables en este motor aproximado."
        : "Extreme latitudes can produce unstable angles in this approximate engine.";
    }

    const time = jdFromForm(input);
    const rawPositions = tropicalPositions(time.jd, input.includeModern);
    const nextPositions = tropicalPositions(time.jd + 1, input.includeModern);
    const positions = {};
    Object.keys(rawPositions).forEach((key) => {
      positions[key] = {
        lon: applyZodiac(rawPositions[key].lon, time.jd, input.zodiac),
        lat: rawPositions[key].lat,
        speed: norm180(applyZodiac(nextPositions[key].lon, time.jd + 1, input.zodiac) - applyZodiac(rawPositions[key].lon, time.jd, input.zodiac)),
      };
    });

    const angles = calculateAngles(time.jd, input.latitude, input.longitude, input.zodiac);
    const sunAlt = altitudeFromLon(rawPositions.sun.lon, input.latitude, angles.lst, angles.eps);
    const isDay = sunAlt >= 0;
    const ascSign = signOf(angles.asc);
    const mcHouse = houseFromSign(signOf(angles.mc), ascSign);
    const icHouse = houseFromSign(signOf(angles.ic), ascSign);
    const planetKeys = input.includeModern ? [...VISIBLE_KEYS, ...MODERN_KEYS] : [...VISIBLE_KEYS];

    planetKeys.forEach((key) => {
      positions[key].house = houseFromSign(signOf(positions[key].lon), ascSign);
      positions[key].angularity = placeQuality(positions[key].house);
      positions[key].dignities = dignityFor(key, positions[key].lon, isDay);
      positions[key].majorDignities = majorDignities(key, positions[key].lon);
      positions[key].phase = solarPhaseFor(key, positions);
    });

    const lots = input.selectedLots.map((key) => {
      const lon = lotLongitude(key, { positions, angles, isDay });
      const sign = signOf(lon);
      const lord = SIGNS[sign].ruler;
      return {
        key,
        lon,
        house: houseFromSign(sign, ascSign),
        lord,
        lordHouse: positions[lord]?.house,
      };
    });

    const chart = {
      input,
      jd: time.jd,
      zoneLabel: time.zoneLabel,
      offset: time.offset,
      positions,
      planetKeys,
      angles,
      ascSign,
      isDay,
      sunAltitude: sunAlt,
      sectLight: isDay ? "sun" : "moon",
      beneficOfSect: isDay ? "jupiter" : "venus",
      maleficOfSect: isDay ? "saturn" : "mars",
      mcHouse,
      icHouse,
      lots,
    };
    chart.moon = computeMoonCondition(chart);
    return chart;
  }

  function renderChart(chart) {
    state.lastChart = chart;
    $("#results").hidden = false;
    $("#chartTitle").textContent = t("chartFor", { place: chart.input.place || `${round(chart.input.latitude)}, ${round(chart.input.longitude)}` });
    $("#chartWheel").innerHTML = renderWheel(chart);
    renderCoreSummary(chart);
    renderAscLord(chart);
    renderMoon(chart);
    renderPlanetTable(chart);
    renderHouseTable(chart);
    renderLotTable(chart);
    renderAspectTable(chart);
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCoreSummary(chart) {
    const html = `
      <h3>${escapeHtml(t("sect"))}</h3>
      <div class="metric-grid">
        ${metric(t("sect"), chart.isDay ? t("dayChart") : t("nightChart"))}
        ${metric(t("sectLight"), `${PLANETS[chart.sectLight].symbol} ${planetName(chart.sectLight)}`)}
        ${metric(t("beneficSect"), `${PLANETS[chart.beneficOfSect].symbol} ${planetName(chart.beneficOfSect)}`)}
        ${metric(t("maleficSect"), `${PLANETS[chart.maleficOfSect].symbol} ${planetName(chart.maleficOfSect)}`)}
        ${metric(t("ascendant"), formatDegree(chart.angles.asc))}
        ${metric(t("mc"), `${formatDegree(chart.angles.mc)} · ${t("tableHouse")} ${chart.mcHouse}`)}
        ${metric(t("ic"), `${formatDegree(chart.angles.ic)} · ${t("tableHouse")} ${chart.icHouse}`)}
        ${metric(t("timezoneUsed"), chart.zoneLabel)}
      </div>
    `;
    $("#coreSummary").innerHTML = html;
  }

  function renderAscLord(chart) {
    const ascSign = SIGNS[chart.ascSign];
    const lord = ascSign.ruler;
    const p = chart.positions[lord];
    const condition = p.majorDignities.length ? p.majorDignities.join(", ") : t("noMajorDignity");
    $("#ascLordPanel").innerHTML = `
      <h3>${escapeHtml(t("ascLordTitle"))}</h3>
      <p class="text-note">${escapeHtml(t("ascLordText", {
        lord: `${PLANETS[lord].symbol} ${planetName(lord)}`,
        ascSign: `${ascSign.symbol} ${ascSign[state.lang]}`,
        lordPosition: formatDegree(p.lon),
        house: p.house,
        topics: houseTopics(p.house),
        angularity: t(p.angularity),
      }))}</p>
      <p class="text-note">${escapeHtml(t("dignifiedText", { condition }))}</p>
      ${badges(p.dignities)}
    `;
  }

  function renderMoon(chart) {
    const apps = chart.moon.applications.length ? chart.moon.applications.join(" · ") : (state.lang === "es" ? "Sin aplicaciones mayores cercanas" : "No close major applications");
    $("#moonPanel").innerHTML = `
      <h3>${escapeHtml(t("moonTitle"))}</h3>
      <div class="metric-grid">
        ${metric(t("moonPhase"), `${chart.moon.phase} · ${round(chart.moon.elongation, 1)}°`)}
        ${metric(t("moonVoc"), chart.moon.voidOfCourse ? t("yesVoc") : t("notVoc"))}
      </div>
      <p class="text-note"><strong>${escapeHtml(t("moonAspects"))}:</strong> ${escapeHtml(apps)}</p>
    `;
  }

  function renderPlanetTable(chart) {
    const headers = [t("tablePlanet"), t("tableLongitude"), t("tableHouse"), t("tableCondition"), t("tableAngularity"), t("tablePhase")];
    const rows = chart.planetKeys.map((key) => {
      const p = chart.positions[key];
      const condition = p.dignities?.length ? p.dignities.join(", ") : "—";
      return [
        `<span class="glyph">${PLANETS[key].symbol}</span> ${escapeHtml(planetName(key))}`,
        escapeHtml(formatDegree(p.lon)),
        escapeHtml(String(p.house)),
        escapeHtml(condition),
        escapeHtml(t(p.angularity)),
        escapeHtml(p.phase || "—"),
      ];
    });
    $("#tab-planets").innerHTML = makeTable(headers, rows);
  }

  function renderHouseTable(chart) {
    const headers = [t("tablePlace"), t("tableSign"), t("tableRuler"), t("tablePlanets"), t("tableTopics")];
    const rows = Array.from({ length: 12 }, (_, i) => {
      const house = i + 1;
      const sIndex = (chart.ascSign + i) % 12;
      const sign = SIGNS[sIndex];
      const planets = chart.planetKeys
        .filter((key) => signOf(chart.positions[key].lon) === sIndex)
        .map((key) => `${PLANETS[key].symbol} ${planetName(key)}`)
        .join(", ") || "—";
      return [
        escapeHtml(`${house} · ${t(placeQuality(house))}`),
        escapeHtml(`${sign.symbol} ${sign[state.lang]}`),
        escapeHtml(`${PLANETS[sign.ruler].symbol} ${planetName(sign.ruler)}`),
        escapeHtml(planets),
        escapeHtml(houseTopics(house)),
      ];
    });
    $("#tab-houses").innerHTML = makeTable(headers, rows);
  }

  function renderLotTable(chart) {
    if (!chart.lots.length) {
      $("#tab-lots").innerHTML = `<p class="text-note">${escapeHtml(t("noLots"))}</p>`;
      return;
    }
    const headers = [t("tableLot"), t("tableLongitude"), t("tableHouse"), t("tableLord"), t("tableLordHouse")];
    const rows = chart.lots.map((lot) => [
      escapeHtml(lotName(lot.key)),
      escapeHtml(formatDegree(lot.lon)),
      escapeHtml(String(lot.house)),
      escapeHtml(`${PLANETS[lot.lord].symbol} ${planetName(lot.lord)}`),
      escapeHtml(String(lot.lordHouse || "—")),
    ]);
    $("#tab-lots").innerHTML = makeTable(headers, rows);
  }

  function renderAspectTable(chart) {
    const rows = [];
    const keys = chart.planetKeys.filter((key) => VISIBLE_KEYS.includes(key) || chart.input.includeModern);
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const a = keys[i];
        const b = keys[j];
        const signType = signAspectType(signOf(chart.positions[a].lon), signOf(chart.positions[b].lon));
        const degree = degreeAspect(chart.positions[a].lon, chart.positions[b].lon, chart.input.orb);
        const showSign = chart.input.aspectMode === "sign" || chart.input.aspectMode === "both";
        const showDegree = chart.input.aspectMode === "degree" || chart.input.aspectMode === "both";
        if (showSign && signType) {
          rows.push([
            escapeHtml(`${PLANETS[a].symbol} ${planetName(a)} / ${PLANETS[b].symbol} ${planetName(b)}`),
            escapeHtml(t(signType)),
            escapeHtml(t("signBased")),
            escapeHtml(overcomingLabel(a, b, chart.positions[a].lon, chart.positions[b].lon) || "—"),
          ]);
        }
        if (showDegree && degree) {
          rows.push([
            escapeHtml(`${PLANETS[a].symbol} ${planetName(a)} / ${PLANETS[b].symbol} ${planetName(b)}`),
            escapeHtml(t(degree.type)),
            escapeHtml(t("degreeBased")),
            escapeHtml(`${round(degree.delta, 2)}°`),
          ]);
        }
      }
    }
    if (!rows.length) {
      $("#tab-aspects").innerHTML = `<p class="text-note">${escapeHtml(t("noAspects"))}</p>`;
      return;
    }
    $("#tab-aspects").innerHTML = makeTable([t("tablePair"), t("tableAspect"), t("tableMode"), t("tableOrb")], rows);
  }

  function polar(cx, cy, r, lon, asc) {
    const angle = (180 + norm180(lon - asc)) * DEG;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function renderWheel(chart) {
    const cx = 180;
    const cy = 180;
    const outer = 158;
    const signR = 144;
    const planetR = 110;
    const aspectR = 82;
    const lines = [];
    const labels = [];
    const aspects = [];

    for (let i = 0; i < 12; i += 1) {
      const signIndex = (chart.ascSign + i) % 12;
      const boundary = signIndex * 30;
      const [x1, y1] = polar(cx, cy, 42, boundary, chart.angles.asc);
      const [x2, y2] = polar(cx, cy, outer, boundary, chart.angles.asc);
      lines.push(`<line class="wheel-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`);
      const [sx, sy] = polar(cx, cy, signR, boundary + 15, chart.angles.asc);
      labels.push(`<text class="wheel-sign" x="${sx}" y="${sy}" text-anchor="middle" dominant-baseline="central">${SIGNS[signIndex].symbol}</text>`);
      const [hx, hy] = polar(cx, cy, 56, boundary + 15, chart.angles.asc);
      labels.push(`<text class="wheel-label" x="${hx}" y="${hy}" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`);
    }

    [
      ["ASC", chart.angles.asc],
      ["DSC", chart.angles.desc],
      ["MC", chart.angles.mc],
      ["IC", chart.angles.ic],
    ].forEach(([label, lon]) => {
      const [x1, y1] = polar(cx, cy, 36, lon, chart.angles.asc);
      const [x2, y2] = polar(cx, cy, outer + 4, lon, chart.angles.asc);
      const [tx, ty] = polar(cx, cy, outer + 13, lon, chart.angles.asc);
      lines.push(`<line class="wheel-angle" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`);
      labels.push(`<text class="wheel-label" x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central">${label}</text>`);
    });

    const visible = chart.planetKeys.filter((key) => VISIBLE_KEYS.includes(key));
    for (let i = 0; i < visible.length; i += 1) {
      for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i];
        const b = visible[j];
        if (!signAspectType(signOf(chart.positions[a].lon), signOf(chart.positions[b].lon))) continue;
        const [x1, y1] = polar(cx, cy, aspectR, chart.positions[a].lon, chart.angles.asc);
        const [x2, y2] = polar(cx, cy, aspectR, chart.positions[b].lon, chart.angles.asc);
        aspects.push(`<line class="wheel-aspect" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`);
      }
    }

    chart.planetKeys.forEach((key, index) => {
      const radius = planetR - (index % 3) * 9;
      const [x, y] = polar(cx, cy, radius, chart.positions[key].lon, chart.angles.asc);
      labels.push(`<text class="wheel-planet" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${PLANETS[key].symbol}</text>`);
    });

    return `
      <svg viewBox="0 0 360 360" role="img" aria-label="Hellenistic chart wheel">
        <circle cx="${cx}" cy="${cy}" r="${outer}" fill="none" stroke="currentColor" opacity="0.16" stroke-width="1.4"></circle>
        <circle cx="${cx}" cy="${cy}" r="126" fill="none" stroke="currentColor" opacity="0.12"></circle>
        <circle cx="${cx}" cy="${cy}" r="92" fill="none" stroke="currentColor" opacity="0.14"></circle>
        <circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="currentColor" opacity="0.2"></circle>
        ${lines.join("")}
        ${aspects.join("")}
        ${labels.join("")}
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" class="wheel-sign">Tyche</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="wheel-label">${state.lang === "es" ? (chart.isDay ? "DÍA" : "NOCHE") : (chart.isDay ? "DAY" : "NIGHT")}</text>
      </svg>
    `;
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    document.title = state.lang === "es" ? "Tyche · Carta helenística" : "Tyche · Hellenistic Chart";
    $("meta[name='description']")?.setAttribute(
      "content",
      state.lang === "es"
        ? "Tyche crea cartas natales helenísticas tradicionales en el navegador."
        : "Tyche creates traditional Hellenistic natal charts in the browser."
    );
    $$("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $(".toolbar").setAttribute("aria-label", state.lang === "es" ? "Preferencias" : "Preferences");
    $("#chartWheel").setAttribute("aria-label", state.lang === "es" ? "Rueda de carta natal" : "Natal chart wheel");
    $(".tabs").setAttribute("aria-label", state.lang === "es" ? "Detalles de la carta" : "Chart details");
    $("#languageToggle span").textContent = state.lang.toUpperCase();
    $("#languageToggle").setAttribute("aria-label", state.lang === "es" ? "Cambiar idioma" : "Change language");
    $("#languageToggle").title = state.lang === "es" ? "Cambiar idioma" : "Change language";
    $("#themeToggle").setAttribute("aria-label", state.lang === "es" ? "Cambiar tema" : "Change theme");
    $("#themeToggle").title = state.lang === "es" ? "Cambiar tema" : "Change theme";
    $("#birthPlace").placeholder = state.lang === "es" ? "Madrid, España" : "Madrid, Spain";
    populateLists();
    const city = findCity($("#birthPlace").value);
    if (city) $("#birthPlace").value = formatCity(city);
    if (state.lastChart?.input?.city) state.lastChart.input.place = formatCity(state.lastChart.input.city);
    if (state.lastChart) renderChart(state.lastChart);
  }

  function applyTheme() {
    document.body.classList.toggle("night", state.theme === "night");
    $("#themeToggle span").textContent = state.theme === "night" ? "☉" : "☾";
  }

  function populateLists() {
    const cities = [...new Set(CITY_DB.map((item) => formatCity(item)))];
    $("#cityList").innerHTML = cities.map((city) => `<option value="${escapeHtml(city)}"></option>`).join("");
    $("#timezoneList").innerHTML = TIME_ZONES.map((zone) => `<option value="${escapeHtml(zone)}"></option>`).join("");
  }

  function updatePlaceFields() {
    const city = findCity($("#birthPlace").value);
    if (!city) return;
    $("#birthPlace").value = formatCity(city);
    if (!$("#latitude").value) $("#latitude").value = city.lat;
    if (!$("#longitude").value) $("#longitude").value = city.lon;
    if (!$("#timeZone").value) $("#timeZone").value = city.tz;
    try {
      const date = parseDate($("#birthDate").value);
      const time = parseTime($("#birthTime").value);
      if (date && time) {
        const zoned = zonedTimeToUtc(date.y, date.m, date.d, time.h, time.min, city.tz);
        $("#manualOffset").value = formatOffset(zoned.offset);
      }
    } catch {
      $("#manualOffset").value = "+00:00";
    }
  }

  function bindTabs() {
    $$(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".tab").forEach((tab) => {
          tab.classList.toggle("is-active", tab === button);
          tab.setAttribute("aria-selected", String(tab === button));
        });
        $$(".tab-panel").forEach((panel) => {
          panel.hidden = panel.id !== `tab-${button.dataset.tab}`;
        });
      });
    });
  }

  function bindEvents() {
    $("#languageToggle").addEventListener("click", () => {
      state.lang = state.lang === "es" ? "en" : "es";
      localStorage.setItem("tyche-lang", state.lang);
      applyI18n();
    });
    $("#themeToggle").addEventListener("click", () => {
      state.theme = state.theme === "night" ? "day" : "night";
      localStorage.setItem("tyche-theme", state.theme);
      applyTheme();
    });
    $("#birthPlace").addEventListener("change", updatePlaceFields);
    $("#birthPlace").addEventListener("blur", updatePlaceFields);
    $("#birthDate").addEventListener("change", updatePlaceFields);
    $("#birthTime").addEventListener("change", updatePlaceFields);
    $("#chart-form").addEventListener("submit", (event) => {
      event.preventDefault();
      $("#formStatus").textContent = "";
      try {
        updatePlaceFields();
        const chart = computeChart(readInput());
        renderChart(chart);
      } catch (error) {
        $("#formStatus").textContent = error.message || String(error);
      }
    });
  }

  function init() {
    populateLists();
    applyTheme();
    applyI18n();
    bindTabs();
    bindEvents();
  }

  init();
})();
