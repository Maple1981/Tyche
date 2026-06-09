(() => {
  "use strict";

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const DAY_MS = 86400000;
  const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
  const PLACE_SEARCH_DELAY = 260;
  const PLACE_RESULT_LIMIT = 8;

  const state = {
    lang: localStorage.getItem("tyche-lang") || "es",
    theme: localStorage.getItem("tyche-theme") || "day",
    lastChart: null,
    activeCityKey: "",
    selectedCity: null,
    selectedPersonName: "",
    selectedZoneSource: "",
    placeSuggestions: [],
    placeSearchTimer: 0,
    placeSearchController: null,
    activePlaceIndex: -1,
    modalReturnFocus: null,
    glossaryReturnFocus: null,
    ephemerisEngine: "fallback",
  };

  const I18N = {
    es: {
      brandSub: "Carta natal helenística generada matemáticamente",
      title: "Crea una carta natal helenística",
      subtitle: "Calcula el Ascendente, las casas de signos enteros (Whole Sign Houses), la secta, la condición esencial, los lotes y otros elementos de la tradición astrológica helenística. La carta se procesa localmente en tu navegador. La búsqueda de lugares consulta coordenadas externas y las imágenes del archivo histórico se cargan desde Wikimedia Commons.",
      subtitleHtml: 'Calcula el <button type="button" data-glossary="ascendant">Ascendente</button>, las <button type="button" data-glossary="wholeSign">casas de signos enteros (Whole Sign Houses)</button>, la <button type="button" data-glossary="sect">secta</button>, la <button type="button" data-glossary="essentialCondition">condición esencial</button>, los <button type="button" data-glossary="lots">lotes</button> y otros elementos de la tradición astrológica helenística. La carta se procesa localmente en tu navegador. La búsqueda de lugares consulta coordenadas externas y las imágenes del archivo histórico se cargan desde Wikimedia Commons.',
      birthDate: "Fecha de nacimiento",
      birthTime: "Hora de nacimiento",
      birthPlace: "Lugar de nacimiento",
      gender: "Sexo",
      notUsed: "No usado",
      female: "Femenino",
      male: "Masculino",
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
      techniqueMode: "Enfoque",
      strict: "Tradicional helenística",
      mixed: "Tradicional + planetas modernos",
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
      places: "Lugares/Casas",
      configurations: "Configuraciones",
      precisionNote: "Cálculo astronómico local: Astronomy Engine. Precisión aproximada ±1′. Para rectificaciones, cartas críticas o investigación profesional, conviene contrastar con efemérides especializadas.",
      missingDate: "Añade fecha y hora de nacimiento.",
      missingPlace: "Elige una ciudad sugerida o introduce latitud, longitud y zona horaria.",
      missingCoords: "Faltan coordenadas válidas.",
      placeSearchShort: "Escribe al menos 2 letras.",
      placeSearchLoading: "Buscando lugares...",
      placeSearchEmpty: "Sin resultados. Puedes introducir coordenadas manualmente.",
      placeSearchError: "No se pudo consultar la búsqueda. Usando ciudades guardadas si coinciden.",
      clearPlace: "Borrar lugar",
      glossaryOpen: "Abrir explicación: {term}",
      peopleEyebrow: "Archivo",
      peopleTitle: "Personajes históricos",
      peopleIntro: "Elige una carta de ejemplo con fecha, hora, lugar y sexo ya preparados.",
      peopleButton: "Personajes históricos",
      close: "Cerrar",
      useExample: "Usar esta carta",
      openWikipedia: "Abrir en Wikipedia",
      dataDate: "Fecha",
      dataPlace: "Lugar",
      dataSex: "Sexo",
      dataSource: "Fuente",
      dataRodden: "Rodden",
      dataTimeSource: "Hora",
      dataSourceGeneral: "Wikipedia / Astro-Databank",
      dataRoddenPending: "Rating individual pendiente de auditoría",
      dataTimeSourcePrepared: "Hora exacta usada por Tyche; revisar fuente individual antes de investigación crítica",
      footerWarning: "Motor astronómico pensado para uso educativo. La información proporcionada es solo orientativa.",
    footerPrivacy: "La carta se calcula localmente en tu navegador. No guardamos tus cartas ni usamos cookies. Solo se conserva en este dispositivo la preferencia de idioma y tema. La búsqueda de lugares consulta Open-Meteo para obtener coordenadas. Las imágenes del archivo histórico se cargan desde Wikimedia Commons. El posicionamiento de planetas utiliza una librería local.",
      footerAuthors: "Autores: Maple81 y Hélène de Troie, 2026.",
      githubLink: "Ver repositorio GitHub",
    footerAttributions: 'Atribuciones generales: imágenes de <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Wikimedia Commons</a>; datos de personajes históricos de <a href="https://www.wikipedia.org/" target="_blank" rel="noreferrer">Wikipedia</a> y <a href="https://www.astro.com/astro-databank/" target="_blank" rel="noreferrer">Astro-Databank</a>; búsqueda de localización mediante <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">Open-Meteo Geocoding API</a>; efemérides locales mediante <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine</a> MIT, precisión aprox. ±1′, en ejecución local, sin enviar datos a terceros.',
      invalidTimeZone: "Zona horaria no reconocida; usando la diferencia UTC manual.",
      invalidOffset: "La diferencia UTC manual debe tener formato +01:00 o -05:00.",
      chartFor: "Carta para {place}",
      chartForPerson: "Carta para {name}",
      anonymousChart: "Carta anónima",
      chartMeta: "Fecha: {date} · Hora: {time} · Lugar de nacimiento: {place} · Sexo: {sex}",
      dayChart: "Carta diurna",
      nightChart: "Carta nocturna",
      sect: "Secta",
      chartType: "Tipo de carta",
      sectLight: "Luminaria de la secta",
      beneficSect: "Benéfico de la secta",
      maleficSect: "Maléfico de la secta",
      maleficContrarySect: "Maléfico contrario a la secta",
      ascendant: "Ascendente",
      descendant: "Descendente",
      mc: "MC",
      ic: "IC",
      timezoneUsed: "Zona usada",
      julianDay: "Día juliano",
      technicalTitle: "Datos técnicos",
      interpretationTitle: "Lectura natal",
      interpretationLeadTitle: "En una frase",
      interpretationSummary: "Lo más importante",
      interpretationReading: "Interpretación",
      interpretationEvidence: "Ver base técnica",
      interpretationWhy: "Primero aparece una lectura en lenguaje llano. La base técnica queda disponible debajo.",
      interpretationTimingNote: "Sobre predicción",
      interpretationTimingText: "Esta lectura no predice fechas. Describe temas de fondo de la carta natal. Para saber cuándo se activan, hay que usar técnicas de tiempo como profecciones anuales, liberación zodiacal o tránsitos relevantes.",
      dominantTopicTitle: "Focos principales",
      mainFocusTitle: "Zonas más activadas",
      hierarchyTitle: "Base de lectura",
      lifeDirectionTitle: "Hacia dónde tira la carta",
      publicProjectionTitle: "Proyección pública",
      limitsTitle: "Límites",
      limitsEducational: "Uso educativo: la lectura no sustituye efemérides profesionales ni una investigación de rectificación.",
      limitsPrecision: "Precisión planetaria aproximada ±1′; Ascendente, MC y casas dependen mucho de hora, coordenadas y zona usada.",
      limitsPrivacy: "La carta se calcula localmente; la búsqueda de lugar y las imágenes históricas sí consultan servicios externos.",
      resourcesTitle: "Donde la carta facilita",
      tensionsTitle: "Donde la carta exige más",
      visibilityTitle: "Visibilidad y ocultación",
      configurationsTitle: "Relaciones entre planetas",
      moonJudgmentTitle: "Condición lunar",
      foundationsTitle: "Base de estabilidad",
      prominenceLabel: "Prominencia",
      easeLabel: "Facilidad",
      tensionLabel: "Tensión",
      supportLabel: "Apoyo",
      qualityTitle: "Indicadores de lectura",
      signalsLabel: "Señales",
      highLevel: "alta",
      mediumLevel: "media",
      lowLevel: "baja",
      strongLevel: "fuerte",
      moderateLevel: "moderado",
      secondaryLevel: "secundario",
      evidenceAscLordHouse: "El regente del Ascendente cae en casa {house}: {topics}.",
      evidenceAscLordAngularity: "Su angularidad es {angularity}, por lo que esta señal tiene {weight}.",
      evidenceAscLordCondition: "Su condición esencial indica: {condition}.",
      evidenceSect: "La carta es {sect}; {sectLight} es la luminaria de la secta, {benefic} actúa como benéfico de la secta y {malefic} como maléfico contrario a la secta.",
      evidenceMcHouse: "El MC cae por signos enteros en casa {house}, reforzando {topics}.",
      evidenceAngularPlanets: "Planetas visibles angulares: {planets}.",
      evidenceLots: "Fortuna cae en casa {fortuneHouse} y Espíritu en casa {spiritHouse}.",
      evidenceNoLot: "No se han seleccionado Fortuna y Espíritu a la vez; la lectura de lotes queda limitada.",
      evidenceFocuses: "Focos principales por acumulación de señales: {focuses}.",
      testimonyStrong: "peso alto",
      testimonyMedium: "peso medio",
      testimonyLow: "peso indirecto",
      localDateTime: "Fecha local",
      utcDateTime: "UTC usado",
      coordinates: "Coordenadas",
      ephemerisEngine: "Efemérides",
      astronomyEngine: "Astronomy Engine local",
      fallbackEngine: "Motor aproximado de respaldo",
      ascLordTitle: "Regente del Ascendente",
      ascLordText: "{lord} rige {ascSign} y cae en {lordPosition}, casa {house}. Esta casa pone el timón de la carta sobre {topics}. Su angularidad es {angularity}.",
      dignifiedText: "Condición esencial: {condition}.",
      mcWholeSignNote: "En casas de signos enteros, las casas se cuentan desde el signo Ascendente. El MC y el IC no abren las casas 10 y 4: son puntos astronómicos sensibles. Tyche muestra también en qué casa caen.",
      noMajorDignity: "sin dignidad mayor",
      dignityMajor: "Dignidad mayor",
      dignityMinor: "Dignidades menores",
      weaknesses: "Debilidades",
      none: "ninguna",
      moonTitle: "Condición lunar",
      moonPhase: "Fase sinódica",
      moonElongation: "Elongación Sol→Luna",
      moonLastSeparation: "Último contacto",
      moonNextApplication: "Próximo contacto",
      moonNoSeparation: "Ninguna en los últimos 30°",
      moonNoApplication: "Ninguna en los próximos 30°",
      moonBeforeNew: "{degrees} antes de Luna nueva",
      moonAfterNew: "{degrees} después de Luna nueva",
      moonAspects: "Aplicaciones y separaciones",
      moonVoc: "Vacía de curso",
      moonVoc30: "Vacía de curso, definición helenística",
      moonVocSign: "Vacía de curso, hasta salir del signo",
      moonNoApplyingWithinOrb: "Sin aplicación cercana, 12°",
      notVoc: "No según la definición helenística de 30°",
      yesVoc: "Sí según la definición helenística de 30°",
      notVocSign: "No, perfecciona antes de salir del signo",
      yesVocSign: "Sí, no perfecciona antes de salir del signo",
      yes: "Sí",
      no: "No",
      tablePlanet: "Planeta",
      tableLongitude: "Longitud",
      tableHouse: "Casa",
      tableCondition: "Condición esencial",
      tableAngularity: "Angularidad",
      tablePhase: "Fase solar",
      tablePlace: "Lugar/Casa",
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
      triplicityActive: "activa por secta",
      triplicityOutOfSect: "fuera de secta",
      triplicityCooperatingRole: "cooperante",
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
      balsamic: "menguante final/balsámica",
      conjunction: "conjunción",
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
      overcoming: "{planet} domina por derecha",
      noAspects: "No hay configuraciones que mostrar con los ajustes actuales.",
      noLots: "No hay lotes seleccionados.",
      lotFormulaNote: "Sistema de fórmulas: Fortuna y Espíritu se invierten por secta; Eros y Necesidad usan la tradición basada en Fortuna y Espíritu; Coraje, Victoria y Némesis usan fórmulas planetarias herméticas.",
      manualOffsetSource: "diferencia UTC manual",
      historicalOffsetSource: "datos históricos del personaje",
      lmtOffsetSource: "LMT por longitud del lugar",
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
      subtitle: "Calculate the Ascendant / Hour-Marker, Whole Sign Houses, sect, essential condition, lots, and other elements of the Hellenistic astrological tradition. The chart is processed locally in your browser. Place search requests external coordinates, and historical archive images load from Wikimedia Commons.",
      subtitleHtml: 'Calculate the <button type="button" data-glossary="ascendant">Ascendant / Hour-Marker</button>, <button type="button" data-glossary="wholeSign">Whole Sign Houses</button>, <button type="button" data-glossary="sect">sect</button>, <button type="button" data-glossary="essentialCondition">essential condition</button>, <button type="button" data-glossary="lots">lots</button>, and other elements of the Hellenistic astrological tradition. The chart is processed locally in your browser. Place search requests external coordinates, and historical archive images load from Wikimedia Commons.',
      birthDate: "Date",
      birthTime: "Exact time",
      birthPlace: "Birthplace",
      gender: "Sex",
      notUsed: "Not used",
      female: "Female",
      male: "Male",
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
      techniqueMode: "Approach",
      strict: "Traditional Hellenistic",
      mixed: "Traditional + modern planets",
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
      places: "Places/Houses",
      configurations: "Configurations",
      precisionNote: "Local astronomical calculation: Astronomy Engine. Approximate accuracy ±1′. For rectification, critical charts, or professional research, compare with specialized ephemerides.",
      missingDate: "Add birth date and time.",
      missingPlace: "Choose a suggested city or enter latitude, longitude, and time zone.",
      missingCoords: "Valid coordinates are missing.",
      placeSearchShort: "Type at least 2 letters.",
      placeSearchLoading: "Searching places...",
      placeSearchEmpty: "No results. You can enter coordinates manually.",
      placeSearchError: "Could not query search. Using saved cities when they match.",
      clearPlace: "Clear place",
      glossaryOpen: "Open explanation: {term}",
      peopleEyebrow: "Archive",
      peopleTitle: "Historical figures",
      peopleIntro: "Choose an example chart with date, time, place, and sex already prepared.",
      peopleButton: "Historical figures",
      close: "Close",
      useExample: "Use this chart",
      openWikipedia: "Open in Wikipedia",
      dataDate: "Date",
      dataPlace: "Place",
      dataSex: "Sex",
      dataSource: "Source",
      dataRodden: "Rodden",
      dataTimeSource: "Time",
      dataSourceGeneral: "Wikipedia / Astro-Databank",
      dataRoddenPending: "Individual rating pending audit",
      dataTimeSourcePrepared: "Exact time used by Tyche; review the individual source before critical research",
      footerWarning: "Astronomical engine intended for educational use. The information provided may not be reliable.",
    footerPrivacy: "The chart is calculated locally in your browser. We do not store your charts or use cookies. Only language and theme preferences are kept on this device. Place search consults Open-Meteo to obtain coordinates. Historical archive images load from Wikimedia Commons. Planet positions use a local library.",
      footerAuthors: "Authors: Maple81 and Hélène de Troie, 2026.",
      githubLink: "View GitHub repository",
    footerAttributions: 'General attributions: images from <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Wikimedia Commons</a>; historical figure data from <a href="https://www.wikipedia.org/" target="_blank" rel="noreferrer">Wikipedia</a> and <a href="https://www.astro.com/astro-databank/" target="_blank" rel="noreferrer">Astro-Databank</a>; place search by <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">Open-Meteo Geocoding API</a>; local ephemerides by <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine</a> MIT, approx. ±1′ accuracy, running locally, without sending data to third parties.',
      invalidTimeZone: "Time zone not recognized; using the manual offset.",
      invalidOffset: "Manual offset must look like +01:00 or -05:00.",
      chartFor: "Chart for {place}",
      chartForPerson: "Chart for {name}",
      anonymousChart: "Anonymous chart",
      chartMeta: "Date: {date} · Time: {time} · Birthplace: {place} · Sex: {sex}",
      dayChart: "Day chart",
      nightChart: "Night chart",
      sect: "Sect",
      chartType: "Chart type",
      sectLight: "Sect light",
      beneficSect: "Benefic of sect",
      maleficSect: "Malefic of sect",
      maleficContrarySect: "Malefic contrary to sect",
      ascendant: "Ascendant",
      descendant: "Descendant",
      mc: "MC",
      ic: "IC",
      timezoneUsed: "Zone used",
      julianDay: "Julian day",
      technicalTitle: "Technical data",
      interpretationTitle: "Natal reading",
      interpretationLeadTitle: "In one sentence",
      interpretationSummary: "Most important",
      interpretationReading: "Interpretation",
      interpretationEvidence: "View technical basis",
      interpretationWhy: "First comes a plain-language reading. The technical basis stays available below.",
      interpretationTimingNote: "About prediction",
      interpretationTimingText: "This reading does not predict dates. It describes background themes in the natal chart. To know when they activate, use timing techniques such as annual profections, zodiacal releasing, or relevant transits.",
      dominantTopicTitle: "Main focuses",
      mainFocusTitle: "Most activated zones",
      hierarchyTitle: "Reading basis",
      lifeDirectionTitle: "Where the chart pulls",
      publicProjectionTitle: "Public projection",
      limitsTitle: "Limits",
      limitsEducational: "Educational use: the reading does not replace professional ephemerides or rectification research.",
      limitsPrecision: "Approximate planetary accuracy ±1′; Ascendant, MC, and houses depend strongly on time, coordinates, and zone used.",
      limitsPrivacy: "The chart is calculated locally; place search and historical images do contact external services.",
      resourcesTitle: "Where the chart facilitates",
      tensionsTitle: "Where the chart asks more",
      visibilityTitle: "Visibility and concealment",
      configurationsTitle: "Relations between planets",
      moonJudgmentTitle: "Lunar condition",
      foundationsTitle: "Stability base",
      prominenceLabel: "Prominence",
      easeLabel: "Ease",
      tensionLabel: "Tension",
      supportLabel: "Support",
      qualityTitle: "Reading indicators",
      signalsLabel: "Signals",
      highLevel: "high",
      mediumLevel: "medium",
      lowLevel: "low",
      strongLevel: "strong",
      moderateLevel: "moderate",
      secondaryLevel: "secondary",
      evidenceAscLordHouse: "The Ascendant / Hour-Marker lord falls in house {house}: {topics}.",
      evidenceAscLordAngularity: "Its angularity is {angularity}, so this signal carries {weight}.",
      evidenceAscLordCondition: "Its essential condition indicates: {condition}.",
      evidenceSect: "The chart is {sect}; {sectLight} is the sect light, {benefic} acts as the benefic of sect, and {malefic} as the malefic contrary to sect.",
      evidenceMcHouse: "The MC falls by whole signs in house {house}, reinforcing {topics}.",
      evidenceAngularPlanets: "Angular visible planets: {planets}.",
      evidenceLots: "Fortune falls in house {fortuneHouse}, and Spirit in house {spiritHouse}.",
      evidenceNoLot: "Fortune and Spirit are not both selected; the lot testimony is limited.",
      evidenceFocuses: "Main focuses by accumulated signals: {focuses}.",
      testimonyStrong: "strong weight",
      testimonyMedium: "medium weight",
      testimonyLow: "indirect weight",
      localDateTime: "Local date",
      utcDateTime: "UTC used",
      coordinates: "Coordinates",
      ephemerisEngine: "Ephemerides",
      astronomyEngine: "Local Astronomy Engine",
      fallbackEngine: "Approximate fallback engine",
      ascLordTitle: "Ascendant / Hour-Marker Lord",
      ascLordText: "{lord} rules {ascSign} and falls in {lordPosition}, house {house}. This house steers the chart toward {topics}. Its angularity is {angularity}.",
      dignifiedText: "Essential condition: {condition}.",
      mcWholeSignNote: "In Whole Sign Houses, houses are counted from the Ascendant sign. The MC and IC do not open houses 10 and 4: they are sensitive astronomical points. Tyche also shows which house they fall in.",
      noMajorDignity: "no major dignity",
      dignityMajor: "Major dignity",
      dignityMinor: "Minor dignities",
      weaknesses: "Weaknesses",
      none: "none",
      moonTitle: "Lunar condition",
      moonPhase: "Synodic phase",
      moonElongation: "Sun→Moon elongation",
      moonLastSeparation: "Last contact",
      moonNextApplication: "Next contact",
      moonNoSeparation: "None in the last 30°",
      moonNoApplication: "None in the next 30°",
      moonBeforeNew: "{degrees} before New Moon",
      moonAfterNew: "{degrees} after New Moon",
      moonAspects: "Applications and separations",
      moonVoc: "Void of course",
      moonVoc30: "Void of course, Hellenistic definition",
      moonVocSign: "Void of course, until sign exit",
      moonNoApplyingWithinOrb: "No close application, 12°",
      notVoc: "No under the Hellenistic 30° definition",
      yesVoc: "Yes under the Hellenistic 30° definition",
      notVocSign: "No, perfects before leaving the sign",
      yesVocSign: "Yes, does not perfect before leaving the sign",
      yes: "Yes",
      no: "No",
      tablePlanet: "Planet",
      tableLongitude: "Longitude",
      tableHouse: "House",
      tableCondition: "Essential condition",
      tableAngularity: "Angularity",
      tablePhase: "Solar phase",
      tablePlace: "Place/House",
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
      triplicityActive: "active by sect",
      triplicityOutOfSect: "out of sect",
      triplicityCooperatingRole: "cooperating",
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
      balsamic: "Final waning / balsamic",
      conjunction: "conjunction",
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
      overcoming: "{planet} overcomes by superior aspect",
      noAspects: "No configurations to show with the current settings.",
      noLots: "No lots selected.",
      lotFormulaNote: "Formula system: Fortune and Spirit reverse by sect; Eros and Necessity use the Fortune/Spirit-based tradition; Courage, Victory, and Nemesis use hermetic planetary formulas.",
      manualOffsetSource: "manual UTC offset",
      historicalOffsetSource: "historical figure data",
      lmtOffsetSource: "LMT by birthplace longitude",
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

  const GLOSSARY = {
    es: {
      birthDate: {
        title: "Fecha de nacimiento",
        body: [
          "<p>Fecha civil usada para convertir el nacimiento a tiempo astronómico. En cartas modernas se usa el calendario gregoriano por defecto.</p>",
          "<p>Para fechas antiguas conviene distinguir explícitamente entre calendario <strong>juliano</strong> y <strong>gregoriano</strong>, porque una conversión silenciosa cambia la carta.</p>",
        ],
      },
      birthTime: {
        title: "Hora de nacimiento",
        body: [
          "<p>Hora civil local del nacimiento. Es imprescindible para calcular Ascendente, casas, MC/IC y secta con precisión.</p>",
          "<p>Un error de pocos minutos puede desplazar el Ascendente y cambiar el regente central de la carta.</p>",
        ],
      },
      birthPlace: {
        title: "Lugar de nacimiento",
        body: [
          "<p>Ciudad o coordenadas usadas para obtener latitud, longitud y zona horaria. El lugar determina el horizonte local.</p>",
          "<p>Sin horizonte local no se puede calcular correctamente el Ascendente ni juzgar si el Sol está sobre o bajo el horizonte.</p>",
        ],
      },
      sex: {
        title: "Sexo",
        body: [
          "<p>Dato opcional reservado para técnicas tradicionales que puedan distinguir sexo biológico. La carta base de Tyche no lo usa para calcular posiciones, casas o secta.</p>",
        ],
      },
      latitude: {
        title: "Latitud",
        body: [
          "<p>Coordenada norte-sur del nacimiento. Interviene en el cálculo del horizonte, el Ascendente y la altura solar.</p>",
          "<p>En latitudes extremas, la geometría del horizonte vuelve los ángulos especialmente sensibles. Revisa cartas críticas con cuidado.</p>",
        ],
      },
      longitude: {
        title: "Longitud",
        body: [
          "<p>Coordenada este-oeste del nacimiento. Ajusta el tiempo sidéreo local y, con ello, la orientación exacta de los ángulos.</p>",
        ],
      },
      timezone: {
        title: "Zona horaria IANA",
        body: [
          "<p>Nombre técnico de zona horaria con reglas históricas, por ejemplo <strong>Europe/Madrid</strong>. Permite convertir la hora local a UTC.</p>",
          "<p>La precisión histórica depende de los datos disponibles en el navegador.</p>",
        ],
      },
      utcOffset: {
        title: "Diferencia UTC",
        body: [
          "<p>Desfase manual respecto a UTC usado como respaldo cuando no hay zona IANA fiable.</p>",
          "<p>Debe interpretarse como dato técnico de conversión, no como garantía histórica universal.</p>",
        ],
      },
      calendar: {
        title: "Calendario",
        body: [
          "<p>Sistema usado para leer la fecha introducida. Tyche usa gregoriano por defecto.</p>",
          "<p>En nacimientos antiguos o en países que adoptaron tarde el calendario gregoriano, el calendario debe indicarse de forma explícita.</p>",
        ],
      },
      zodiac: {
        title: "Zodíaco",
        body: [
          "<p>Marco de 12 signos de 30° donde se colocan planetas y puntos. La práctica helenística de esta app usa el zodíaco tropical por defecto.</p>",
        ],
      },
      tropical: {
        title: "Zodíaco tropical",
        body: [
          "<p>Divide la eclíptica desde el equinoccio vernal. Aries comienza en 0° tropical.</p>",
          "<p>Es el marco predeterminado de Tyche para la lectura helenística estricta.</p>",
        ],
      },
      sidereal: {
        title: "Zodíaco sideral",
        body: [
          "<p>Marco zodiacal referido a estrellas fijas mediante un ayanamsha. En Tyche aparece solo como opción aproximada y no como base estricta.</p>",
          "<p>La conversión usa una precesión simple; no equivale necesariamente a Lahiri, Fagan/Bradley u otros ayanamshas.</p>",
        ],
      },
      wholeSign: {
        title: "Casas por signos enteros",
        body: [
          "<p>El signo que asciende completo se convierte en casa 1; el signo siguiente completo en casa 2, y así sucesivamente.</p>",
          "<p>En este sistema el MC y el IC son puntos astronómicos que pueden caer fuera de las casas 10 y 4.</p>",
        ],
      },
      house: {
        title: "Casa / lugar",
        body: [
          "<p>Los lugares asignan temas de vida y fuerza de acción. No equivalen a los signos: Aries no es por sí mismo la casa 1, Tauro no es por sí mismo la casa 2.</p>",
        ],
      },
      place: {
        title: "Lugar",
        body: [
          "<p>Nombre tradicional de las casas en astrología helenística. Cada lugar combina temas concretos con una condición de fuerza: angular, sucedente o cadente.</p>",
        ],
      },
      aspects: {
        title: "Aspectos / configuraciones",
        body: [
          "<p>Relaciones geométricas entre signos o grados. En modo helenístico estricto se privilegia la configuración por signo.</p>",
          "<p>Copresencia, sextil, cuadrado, trígono y oposición son las relaciones principales; los signos sin estas relaciones están en aversión.</p>",
        ],
      },
      aspectMode: {
        title: "Modo de aspecto",
        body: [
          "<p>Define si Tyche muestra relaciones por signo, por grado con orbe, o ambas. Una configuración por signo puede existir aunque el aspecto no perfeccione por grado.</p>",
        ],
      },
      orb: {
        title: "Orbe",
        body: [
          "<p>Margen de tolerancia en grados para considerar un aspecto por grado. No afecta a las configuraciones estrictamente por signo.</p>",
        ],
      },
      bounds: {
        title: "Términos / límites",
        body: [
          "<p>Subdivisiones desiguales de cada signo gobernadas por planetas. Tyche usa términos egipcios.</p>",
          "<p>El planeta que gobierna el término matiza la condición esencial del planeta o punto que cae allí.</p>",
        ],
      },
      technique: {
        title: "Técnica",
        body: [
          "<p>El modo estricto usa siete planetas visibles, regencias tradicionales, casas por signos enteros y zodíaco tropical por defecto.</p>",
          "<p>El modo mixto permite añadir elementos modernos sin convertirlos en la base de la lectura helenística.</p>",
        ],
      },
      modernPlanets: {
        title: "Planetas modernos",
        body: [
          "<p>Urano, Neptuno y Plutón no forman parte del conjunto clásico visible. Tyche puede mostrarlos como capa opcional, no como fundamento de la carta estricta.</p>",
        ],
      },
      lots: {
        title: "Lotes",
        body: [
          "<p>Puntos calculados proyectando distancias zodiacales desde el Ascendente. Funcionan como significadores matemáticos de temas concretos.</p>",
          "<p>Fortuna y Espíritu son los lotes principales; sus fórmulas se invierten según la secta.</p>",
        ],
      },
      lotFortune: {
        title: "Lote de Fortuna",
        body: [
          "<p>Relaciona Ascendente, Sol y Luna para significar cuerpo, circunstancias, fortuna material y lo que acontece con menor intervención deliberada.</p>",
        ],
      },
      lotSpirit: {
        title: "Lote del Espíritu",
        body: [
          "<p>Contraparte de Fortuna. Se asocia con intención, acción elegida, mente práctica, reputación y dirección voluntaria.</p>",
        ],
      },
      lotEros: {
        title: "Lote de Eros",
        body: [
          "<p>Lote derivado de Fortuna y Espíritu. Se usa para deseos, vínculos, atracción y aquello hacia lo que el alma se inclina.</p>",
        ],
      },
      lotNecessity: {
        title: "Lote de Necesidad",
        body: [
          "<p>Lote derivado de Fortuna y Espíritu. Describe compulsión, restricciones, obligaciones y condiciones que se imponen al nativo.</p>",
        ],
      },
      lotCourage: {
        title: "Lote de Coraje",
        body: [
          "<p>Lote hermético vinculado a Marte. Señala iniciativa, riesgo, conflicto, herramientas, resistencia y capacidad de enfrentar tensión.</p>",
        ],
      },
      lotVictory: {
        title: "Lote de Victoria",
        body: [
          "<p>Lote hermético vinculado a Júpiter. Se asocia con éxito, ayuda, honores, liberación y resultados favorables.</p>",
        ],
      },
      lotNemesis: {
        title: "Lote de Némesis",
        body: [
          "<p>Lote hermético vinculado a Saturno. Señala freno, juicio, pérdida, consecuencia y condiciones difíciles de eludir.</p>",
        ],
      },
      planets: {
        title: "Planetas",
        body: [
          "<p>La base clásica usa siete cuerpos visibles: Sol, Luna, Mercurio, Venus, Marte, Júpiter y Saturno.</p>",
          "<p>Los planetas significan actores, potencias y cualidades; los signos describen cómo actúan y los lugares dónde se manifiestan.</p>",
        ],
      },
      planet: {
        title: "Planeta",
        body: [
          "<p>Cuerpo errante o luminaria usada como significador. Sol y Luna son luminarias; Venus y Júpiter son benéficos; Marte y Saturno son maléficos; Mercurio es común o variable.</p>",
        ],
      },
      longitude: {
        title: "Longitud zodiacal",
        body: [
          "<p>Posición medida sobre la eclíptica dentro del zodíaco. Tyche la muestra como grado, minuto y signo.</p>",
        ],
      },
      sign: {
        title: "Signo",
        body: [
          "<p>División zodiacal de 30°. El signo aporta modalidad de actuación y determina domicilio, exaltación, triplicidad, términos y decanato.</p>",
        ],
      },
      ruler: {
        title: "Regente",
        body: [
          "<p>Planeta que gobierna un signo por domicilio. Tyche usa solo regentes tradicionales: Marte, Venus, Mercurio, Luna, Sol, Júpiter y Saturno.</p>",
        ],
      },
      topics: {
        title: "Temas",
        body: [
          "<p>Áreas de vida asociadas a cada lugar. Sirven para orientar la interpretación sin mezclar automáticamente signos y casas.</p>",
        ],
      },
      sect: {
        title: "Secta",
        body: [
          "<p>Condición diurna o nocturna de la carta. Se calcula por la posición del Sol respecto al horizonte local.</p>",
          "<p>Si el Sol está sobre el horizonte, la carta es diurna; si está bajo el horizonte, nocturna. Esto reorganiza la fuerza relativa de luminarias, benéficos y maléficos.</p>",
        ],
      },
      sectLight: {
        title: "Luminaria de la secta",
        body: [
          "<p>Luminaria que lidera la carta según la secta: Sol en cartas diurnas, Luna en cartas nocturnas.</p>",
          "<p>Sus regentes de triplicidad se usan tradicionalmente para juzgar soporte general y estabilidad.</p>",
        ],
      },
      beneficSect: {
        title: "Benéfico de la secta",
        body: [
          "<p>El benéfico más acorde con la condición diurna/nocturna: Júpiter de día, Venus de noche.</p>",
          "<p>Tiende a expresar ayuda y crecimiento de forma más congruente con la carta.</p>",
        ],
      },
      maleficSect: {
        title: "Maléfico de la secta",
        body: [
          "<p>El maléfico más acorde con la secta: Saturno de día, Marte de noche.</p>",
          "<p>Su condición suele considerarse más moderada que la del maléfico contrario a la secta.</p>",
        ],
      },
      maleficContrarySect: {
        title: "Maléfico contrario a la secta",
        body: [
          "<p>Maléfico menos acorde con la condición diurna/nocturna: Marte en carta diurna, Saturno en carta nocturna.</p>",
          "<p>Tradicionalmente suele requerir más atención interpretativa porque tiende a expresar dificultad de forma menos moderada.</p>",
        ],
      },
      ascendant: {
        title: "Ascendente",
        body: [
          "<p>Grado del zodíaco que asciende por el horizonte oriental en el momento y lugar del nacimiento.</p>",
          "<p>En casas por signos enteros, su signo completo se convierte en casa 1. Su regente es una pieza central para juzgar vida, cuerpo, dirección y temas dominantes.</p>",
        ],
      },
      descendant: {
        title: "Descendente",
        body: [
          "<p>Punto opuesto al Ascendente, situado en el horizonte occidental. Enmarca temas de otros, pareja, pactos y confrontación.</p>",
        ],
      },
      mc: {
        title: "MC",
        body: [
          "<p>Medio Cielo: punto superior donde la eclíptica cruza el meridiano local. Señala acción, reputación, oficio, rango y visibilidad.</p>",
          "<p>En casas por signos enteros puede caer en una casa distinta de la 10, llevando allí temas de acción pública.</p>",
        ],
      },
      ic: {
        title: "IC",
        body: [
          "<p>Fondo del Cielo: punto opuesto al MC. Señala raíces, hogar, fundamento, padres, asuntos ocultos y finales.</p>",
          "<p>En casas por signos enteros puede caer en una casa distinta de la 4.</p>",
        ],
      },
      timezoneUsed: {
        title: "Zona usada",
        body: [
          "<p>Regla de conversión aplicada para pasar de hora local a UTC: zona IANA, diferencia manual, datos históricos del ejemplo o LMT por longitud.</p>",
          "<p>Es un dato crítico porque los ángulos dependen directamente del tiempo universal obtenido.</p>",
        ],
      },
      ascLord: {
        title: "Regente del Ascendente",
        body: [
          "<p>Planeta que rige el signo ascendente por domicilio. Es el señor del Ascendente y uno de los indicadores principales de vida, cuerpo, carácter y dirección.</p>",
          "<p>La casa donde cae muestra qué temas toman el timón de la carta; su condición esencial y angularidad describen con qué recursos actúa.</p>",
        ],
      },
      essentialCondition: {
        title: "Condición esencial",
        body: [
          "<p>Estado zodiacal de un planeta según dignidades y debilidades: domicilio, exaltación, triplicidad, término, decanato, detrimento y caída.</p>",
          "<p>Describe si el planeta actúa con recursos propios, apoyo parcial, matices subordinados o dificultad esencial.</p>",
        ],
      },
      noMajorDignity: {
        title: "Sin dignidad mayor",
        body: [
          "<p>Indica que el planeta no está en domicilio, exaltación ni triplicidad propia. Puede seguir teniendo término o decanato, que son dignidades menores.</p>",
        ],
      },
      domicile: {
        title: "Domicilio",
        body: [
          "<p>Signo propio de un planeta. En domicilio, el planeta actúa con autoridad y recursos acordes a su naturaleza.</p>",
        ],
      },
      exaltation: {
        title: "Exaltación",
        body: [
          "<p>Dignidad mayor en la que un planeta recibe honor o elevación. No es lo mismo que domicilio: puede actuar con prominencia, pero en casa ajena.</p>",
        ],
      },
      triplicity: {
        title: "Triplicidad",
        body: [
          "<p>Regencia por elemento, con un regente diurno, uno nocturno y uno cooperante. Depende de la secta de la carta.</p>",
          "<p>El regente activo por secta pesa más como recurso; el regente fuera de secta conserva testimonio, pero con menos prioridad; el cooperante modifica y acompaña a ambos.</p>",
        ],
      },
      bound: {
        title: "Término",
        body: [
          "<p>También llamado límite. Es una subdivisión irregular del signo gobernada por un planeta.</p>",
          "<p>Cuando un cuerpo cae en el término de un planeta, ese planeta aporta una administración fina de la posición.</p>",
        ],
      },
      decan: {
        title: "Decanato",
        body: [
          "<p>División de cada signo en tres segmentos de 10°. Tyche usa el orden caldeo repetido.</p>",
          "<p>Es una dignidad menor, también llamada faz, que colorea la expresión local del planeta.</p>",
        ],
      },
      detriment: {
        title: "Detrimento",
        body: [
          "<p>Signo opuesto al domicilio de un planeta. Es una debilidad esencial: el planeta actúa lejos de sus condiciones propias.</p>",
        ],
      },
      fall: {
        title: "Caída",
        body: [
          "<p>Signo opuesto a la exaltación. Es una debilidad esencial asociada con menor honor, apoyo o elevación.</p>",
        ],
      },
      angularity: {
        title: "Angularidad",
        body: [
          "<p>Fuerza por lugar. Las casas 1, 4, 7 y 10 son angulares; 2, 5, 8 y 11 sucedentes; 3, 6, 9 y 12 cadentes.</p>",
          "<p>Los lugares angulares actúan con más presencia; los cadentes tienden a ser menos capaces de manifestarse directamente.</p>",
        ],
      },
      angular: {
        title: "Angular",
        body: [
          "<p>Casa 1, 4, 7 o 10. Indica presencia, capacidad de acción y visibilidad fuerte en la carta.</p>",
        ],
      },
      succedent: {
        title: "Sucedente",
        body: [
          "<p>Casa 2, 5, 8 u 11. Indica condición intermedia: sostiene, acumula o desarrolla lo iniciado por los ángulos.</p>",
        ],
      },
      cadent: {
        title: "Cadente",
        body: [
          "<p>Casa 3, 6, 9 o 12. Indica menor capacidad de acción directa o una posición más retirada del eje principal.</p>",
        ],
      },
      solarPhase: {
        title: "Fase solar",
        body: [
          "<p>Relación de un planeta no luminario con el Sol. Puede ser matutino/oriental, vespertino/occidental, bajo los rayos, combusto o en el corazón.</p>",
          "<p>La cercanía al Sol puede ocultar, debilitar o excepcionalmente concentrar la expresión del planeta.</p>",
        ],
      },
      morning: {
        title: "Matutino / oriental",
        body: [
          "<p>Planeta que aparece antes del Sol en orden zodiacal y se asocia con manifestación matutina. En Mercurio lo inclina hacia cualidad diurna.</p>",
        ],
      },
      evening: {
        title: "Vespertino / occidental",
        body: [
          "<p>Planeta que aparece después del Sol en orden zodiacal y se asocia con manifestación vespertina. En Mercurio lo inclina hacia cualidad nocturna.</p>",
        ],
      },
      underBeams: {
        title: "Bajo los rayos",
        body: [
          "<p>Planeta situado dentro de unos 15° del Sol. Su visibilidad queda disminuida por la luz solar.</p>",
        ],
      },
      combust: {
        title: "Combusto",
        body: [
          "<p>Planeta dentro de unos 8° del Sol. Es una condición más severa de ocultamiento y debilitamiento solar.</p>",
        ],
      },
      cazimi: {
        title: "En el corazón (cazimi)",
        body: [
          "<p>Planeta dentro de aproximadamente 1° del Sol. En lugar de simple ocultamiento, se interpreta como una unión muy concentrada con la autoridad solar.</p>",
          "<p>Tyche usa el umbral amplio de 1°. Algunas tradiciones usan un margen más estrecho, como unos 17′.</p>",
        ],
      },
      lunarCondition: {
        title: "Condición lunar",
        body: [
          "<p>Resume fase de la Luna, distancia angular respecto al Sol, aplicaciones/separaciones y posible vacío de curso.</p>",
          "<p>La Luna describe cuerpo, cambio, ritmo vital, acontecimientos cercanos y transmisión de luz entre planetas.</p>",
        ],
      },
      moonPhase: {
        title: "Fase lunar",
        body: [
          "<p>Nombre de la fase según la elongación zodiacal entre Sol y Luna. Tyche muestra también el ángulo en grados.</p>",
          "<p>El ciclo va de Luna nueva a llena y vuelve por las fases menguantes hasta la balsámica.</p>",
        ],
      },
      moonVoc: {
        title: "Vacía de curso",
        body: [
          "<p>Tyche usa como juicio principal la definición helenística amplia: la Luna está vacía si no perfecciona una conjunción, sextil, cuadrado, trígono u oposición en los próximos 30° de movimiento lunar.</p>",
          "<p>También se muestra si la Luna perfecciona o no antes de abandonar el signo. El indicador de ausencia de aplicación dentro de 12° se mantiene aparte para no confundir una lectura por orbe con la definición de 30°.</p>",
        ],
      },
      applications: {
        title: "Aplicaciones",
        body: [
          "<p>Relaciones hacia las que la Luna se está acercando. Una separación indica que el contacto ya pasó.</p>",
          "<p>Aplicación y separación ayudan a juzgar transmisión de actividad entre planetas.</p>",
        ],
      },
      configurations: {
        title: "Configuraciones",
        body: [
          "<p>Relaciones de visión entre signos o planetas: copresencia, sextil, cuadrado, trígono y oposición.</p>",
          "<p>La configuración por signo es central en la lectura helenística; la perfección por grado añade precisión.</p>",
        ],
      },
      copresence: {
        title: "Copresencia",
        body: [
          "<p>Dos planetas en el mismo signo. Comparten lugar y se afectan por convivencia zodiacal, aunque no estén unidos por grado exacto.</p>",
        ],
      },
      conjunction: {
        title: "Conjunción",
        body: [
          "<p>Perfección corporal por grado entre dos planetas. En la condición lunar se usa para indicar que la Luna aplica o se separa de un planeta en el mismo signo.</p>",
        ],
      },
      sextile: {
        title: "Sextil",
        body: [
          "<p>Relación entre signos separados por dos signos, equivalente a 60° por grado. Es una configuración de cooperación moderada.</p>",
        ],
      },
      square: {
        title: "Cuadrado",
        body: [
          "<p>Relación entre signos separados por tres signos, equivalente a 90° por grado. Suele indicar tensión, acción y conflicto de cualidades.</p>",
        ],
      },
      trine: {
        title: "Trígono",
        body: [
          "<p>Relación entre signos separados por cuatro signos, equivalente a 120° por grado. Indica afinidad elemental y flujo más estable.</p>",
        ],
      },
      opposition: {
        title: "Oposición",
        body: [
          "<p>Relación entre signos opuestos, equivalente a 180° por grado. Enfrenta dos polos de una misma línea zodiacal.</p>",
        ],
      },
      applying: {
        title: "Aplicando",
        body: [
          "<p>Un planeta se acerca a perfeccionar una relación con otro. Suele describir una actividad en desarrollo.</p>",
        ],
      },
      separating: {
        title: "Separando",
        body: [
          "<p>Un planeta se aleja de una relación ya perfeccionada. Señala contacto pasado o efecto que empieza a retirarse.</p>",
        ],
      },
      overcoming: {
        title: "Dominio / superación",
        body: [
          "<p>En configuraciones diestras, especialmente el cuadrado superior, un planeta puede dominar a otro desde una posición zodiacal más fuerte.</p>",
          "<p>Tyche distingue la dirección del testimonio: no pesa igual que el benéfico o maléfico domine al significador, que el significador conserve la posición superior frente a ese contacto.</p>",
        ],
      },
      aspectPair: {
        title: "Par",
        body: [
          "<p>Los dos planetas o puntos implicados en una configuración.</p>",
        ],
      },
      mode: {
        title: "Modo",
        body: [
          "<p>Indica si la configuración se está mostrando por signo, por grado, o por ambos criterios.</p>",
        ],
      },
      lotLord: {
        title: "Regente del lote",
        body: [
          "<p>Planeta que rige por domicilio el signo donde cae el lote. Ayuda a valorar cómo se administran los temas del lote.</p>",
        ],
      },
      lotLordHouse: {
        title: "Casa del regente",
        body: [
          "<p>Lugar donde cae el regente del lote. Señala hacia qué temas se canaliza la materia simbolizada por el lote.</p>",
        ],
      },
      ephemeris: {
        title: "Efemérides",
        body: [
          "<p>Tablas o motor matemático para calcular posiciones celestes. Tyche usa Astronomy Engine localmente y conserva un motor aproximado solo como respaldo.</p>",
        ],
      },
    },
    en: {
      birthDate: {
        title: "Birth date",
        body: [
          "<p>Civil date used to convert the birth record into astronomical time. Modern charts use the Gregorian calendar by default.</p>",
          "<p>For older births, Julian and Gregorian dates must be distinguished explicitly because silent conversion changes the chart.</p>",
        ],
      },
      birthTime: {
        title: "Birth time",
        body: [
          "<p>Local civil clock time of birth. It is required for the Ascendant, houses, MC/IC, and sect.</p>",
          "<p>A shift of only a few minutes can move the Ascendant enough to change the chart's central ruler.</p>",
        ],
      },
      birthPlace: {
        title: "Birthplace",
        body: [
          "<p>City or coordinates used to obtain latitude, longitude, and time zone. The place defines the local horizon.</p>",
          "<p>Without the local horizon, the Ascendant and the Sun's above/below-horizon sect condition cannot be calculated correctly.</p>",
        ],
      },
      sex: {
        title: "Sex",
        body: [
          "<p>Optional datum reserved for traditional techniques that may distinguish biological sex. Tyche's base chart does not use it for positions, houses, or sect.</p>",
        ],
      },
      latitude: {
        title: "Latitude",
        body: [
          "<p>North-south birth coordinate. It affects the horizon, Ascendant, and solar altitude.</p>",
          "<p>At extreme latitudes, horizon geometry makes angles especially sensitive. Review critical charts with care.</p>",
        ],
      },
      longitude: {
        title: "Longitude",
        body: [
          "<p>East-west birth coordinate. It adjusts local sidereal time and the exact orientation of the angles.</p>",
        ],
      },
      timezone: {
        title: "IANA time zone",
        body: [
          "<p>Technical time-zone name with historical rules, such as <strong>Europe/Madrid</strong>. It converts local time to UTC.</p>",
          "<p>Historical accuracy depends on the data available in the browser.</p>",
        ],
      },
      utcOffset: {
        title: "UTC offset",
        body: [
          "<p>Manual offset from UTC used as fallback when no reliable IANA zone is available.</p>",
          "<p>It is a technical conversion datum, not a universal guarantee of historical civil time.</p>",
        ],
      },
      calendar: {
        title: "Calendar",
        body: [
          "<p>System used to read the entered date. Tyche defaults to Gregorian.</p>",
          "<p>Ancient or early-modern births may require an explicit Julian/Gregorian choice.</p>",
        ],
      },
      zodiac: {
        title: "Zodiac",
        body: [
          "<p>Framework of twelve 30° signs where planets and points are placed. Tyche defaults to the tropical zodiac for strict Hellenistic work.</p>",
        ],
      },
      tropical: {
        title: "Tropical zodiac",
        body: [
          "<p>Divides the ecliptic from the vernal equinox. Aries begins at 0° tropical.</p>",
          "<p>It is Tyche's default frame for strict Hellenistic reading.</p>",
        ],
      },
      sidereal: {
        title: "Sidereal zodiac",
        body: [
          "<p>Zodiacal frame referenced to fixed stars through an ayanamsha. In Tyche it is only an approximate advanced option.</p>",
          "<p>The conversion uses simple precession; it is not necessarily equivalent to Lahiri, Fagan/Bradley, or other ayanamshas.</p>",
        ],
      },
      wholeSign: {
        title: "Whole Sign Houses",
        body: [
          "<p>The whole rising sign becomes house 1; the next whole sign becomes house 2, and so on.</p>",
          "<p>In this system the MC and IC are astronomical points and may fall outside houses 10 and 4.</p>",
        ],
      },
      house: {
        title: "House / place",
        body: [
          "<p>Places assign life topics and strength of action. They are not equivalent to signs: Aries is not automatically house 1, Taurus is not automatically house 2.</p>",
        ],
      },
      place: {
        title: "Place",
        body: [
          "<p>Traditional name for houses in Hellenistic astrology. Each place combines topics with a condition of strength: angular, succedent, or cadent.</p>",
        ],
      },
      aspects: {
        title: "Aspects / configurations",
        body: [
          "<p>Geometrical relationships by sign or by degree. Strict Hellenistic mode privileges sign-based configuration.</p>",
          "<p>Copresence, sextile, square, trine, and opposition are the main relationships; signs without them are in aversion.</p>",
        ],
      },
      aspectMode: {
        title: "Aspect mode",
        body: [
          "<p>Defines whether Tyche shows sign-based relationships, degree-based relationships with orb, or both.</p>",
        ],
      },
      orb: {
        title: "Orb",
        body: [
          "<p>Degree tolerance for a degree-based aspect. It does not affect strictly sign-based configurations.</p>",
        ],
      },
      bounds: {
        title: "Terms / bounds",
        body: [
          "<p>Unequal subdivisions of each sign governed by planets. Tyche uses Egyptian bounds.</p>",
          "<p>The bound lord gives a fine-grained administration of the planet or point placed there.</p>",
        ],
      },
      technique: {
        title: "Technique",
        body: [
          "<p>Strict mode uses the seven visible planets, traditional rulerships, Whole Sign Houses, and the tropical zodiac by default.</p>",
          "<p>Mixed mode can add modern elements without making them the foundation of the Hellenistic reading.</p>",
        ],
      },
      modernPlanets: {
        title: "Modern planets",
        body: [
          "<p>Uranus, Neptune, and Pluto are not part of the visible classical set. Tyche can show them only as an optional layer.</p>",
        ],
      },
      lots: {
        title: "Lots",
        body: [
          "<p>Calculated points projected from zodiacal distances starting at the Ascendant. They are mathematical significators for specific topics.</p>",
          "<p>Fortune and Spirit are the principal lots, and their formulas reverse by sect.</p>",
        ],
      },
      lotFortune: {
        title: "Lot of Fortune",
        body: [
          "<p>Relates Ascendant, Sun, and Moon to signify body, circumstances, material fortune, and what happens with less deliberate control.</p>",
        ],
      },
      lotSpirit: {
        title: "Lot of Spirit",
        body: [
          "<p>Counterpart to Fortune. It is associated with intention, chosen action, practical mind, reputation, and voluntary direction.</p>",
        ],
      },
      lotEros: {
        title: "Lot of Eros",
        body: [
          "<p>Lot derived from Fortune and Spirit. It concerns desire, bonds, attraction, and what the soul inclines toward.</p>",
        ],
      },
      lotNecessity: {
        title: "Lot of Necessity",
        body: [
          "<p>Lot derived from Fortune and Spirit. It describes compulsion, restrictions, obligations, and imposed conditions.</p>",
        ],
      },
      lotCourage: {
        title: "Lot of Courage",
        body: [
          "<p>Hermetic lot linked with Mars. It points to initiative, risk, conflict, tools, resistance, and capacity under strain.</p>",
        ],
      },
      lotVictory: {
        title: "Lot of Victory",
        body: [
          "<p>Hermetic lot linked with Jupiter. It is associated with success, help, honors, release, and favorable outcomes.</p>",
        ],
      },
      lotNemesis: {
        title: "Lot of Nemesis",
        body: [
          "<p>Hermetic lot linked with Saturn. It points to restraint, judgment, loss, consequence, and difficult conditions.</p>",
        ],
      },
      planets: {
        title: "Planets",
        body: [
          "<p>The classical base uses seven visible bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn.</p>",
          "<p>Planets signify actors, powers, and qualities; signs show how they act; places show where they manifest.</p>",
        ],
      },
      planet: {
        title: "Planet",
        body: [
          "<p>Wandering body or luminary used as a significator. Sun and Moon are luminaries; Venus and Jupiter are benefics; Mars and Saturn are malefics; Mercury is common or variable.</p>",
        ],
      },
      longitude: {
        title: "Zodiacal longitude",
        body: [
          "<p>Position measured along the ecliptic within the zodiac. Tyche displays it as degree, minute, and sign.</p>",
        ],
      },
      sign: {
        title: "Sign",
        body: [
          "<p>A 30° zodiacal division. The sign describes mode of action and determines domicile, exaltation, triplicity, bounds, and decan.</p>",
        ],
      },
      ruler: {
        title: "Ruler",
        body: [
          "<p>The planet that governs a sign by domicile. Tyche uses traditional rulers only: Mars, Venus, Mercury, Moon, Sun, Jupiter, and Saturn.</p>",
        ],
      },
      topics: {
        title: "Topics",
        body: [
          "<p>Life areas associated with each place. They orient interpretation without automatically merging signs and houses.</p>",
        ],
      },
      sect: {
        title: "Sect",
        body: [
          "<p>The day/night condition of the chart, calculated from the Sun's position relative to the local horizon.</p>",
          "<p>Sun above the horizon gives a day chart; Sun below gives a night chart. This reorganizes the relative condition of luminaries, benefics, and malefics.</p>",
        ],
      },
      sectLight: {
        title: "Sect light",
        body: [
          "<p>The luminary leading the chart by sect: Sun by day, Moon by night.</p>",
          "<p>Its triplicity rulers are traditionally used to judge broad support and stability.</p>",
        ],
      },
      beneficSect: {
        title: "Benefic of sect",
        body: [
          "<p>The benefic most aligned with the chart's day/night condition: Jupiter by day, Venus by night.</p>",
          "<p>It tends to express help and growth more congruently with the chart.</p>",
        ],
      },
      maleficSect: {
        title: "Malefic of sect",
        body: [
          "<p>The malefic most aligned with the sect: Saturn by day, Mars by night.</p>",
          "<p>Its condition is usually considered more moderated than that of the contrary-to-sect malefic.</p>",
        ],
      },
      maleficContrarySect: {
        title: "Malefic contrary to sect",
        body: [
          "<p>The malefic less aligned with the day/night condition: Mars in a day chart, Saturn in a night chart.</p>",
          "<p>Traditionally it deserves closer interpretive attention because it tends to express difficulty less moderately.</p>",
        ],
      },
      ascendant: {
        title: "Hour-Marker / Ascendant",
        body: [
          "<p>The zodiacal degree rising over the eastern horizon at the birth moment and place.</p>",
          "<p>In Whole Sign Houses, its entire sign becomes house 1. Its ruler is central for judging life, body, direction, and dominant topics.</p>",
        ],
      },
      descendant: {
        title: "Descendant",
        body: [
          "<p>The point opposite the Ascendant on the western horizon. It frames others, partners, agreements, and confrontation.</p>",
        ],
      },
      mc: {
        title: "MC",
        body: [
          "<p>Midheaven: the upper point where the ecliptic crosses the local meridian. It signifies action, reputation, craft, rank, and visibility.</p>",
          "<p>In Whole Sign Houses it can fall outside house 10, importing public-action topics into another place.</p>",
        ],
      },
      ic: {
        title: "IC",
        body: [
          "<p>Imum Coeli: the point opposite the MC. It signifies roots, home, foundations, parents, hidden matters, and endings.</p>",
          "<p>In Whole Sign Houses it can fall outside house 4.</p>",
        ],
      },
      timezoneUsed: {
        title: "Zone used",
        body: [
          "<p>The conversion rule used to turn local time into UTC: IANA zone, manual offset, historical example data, or LMT by longitude.</p>",
          "<p>This is critical because the angles depend directly on the resulting universal time.</p>",
        ],
      },
      ascLord: {
        title: "Ascendant / Hour-Marker Lord",
        body: [
          "<p>The domicile ruler of the rising sign. It is one of the main indicators of life, body, character, and direction.</p>",
          "<p>The house it occupies shows which topics steer the chart; its essential condition and angularity describe the resources it has.</p>",
        ],
      },
      essentialCondition: {
        title: "Essential condition",
        body: [
          "<p>A planet's zodiacal state by dignities and weaknesses: domicile, exaltation, triplicity, bound, decan, detriment, and fall.</p>",
          "<p>It describes whether the planet acts with its own resources, partial support, subordinate nuance, or essential difficulty.</p>",
        ],
      },
      noMajorDignity: {
        title: "No major dignity",
        body: [
          "<p>The planet is not in its own domicile, exaltation, or triplicity. It may still have a bound or decan, which are minor dignities.</p>",
        ],
      },
      domicile: {
        title: "Domicile",
        body: [
          "<p>A planet's own sign. In domicile, a planet acts with authority and resources suited to its nature.</p>",
        ],
      },
      exaltation: {
        title: "Exaltation",
        body: [
          "<p>Major dignity where a planet receives honor or elevation. It is not the same as domicile: it can act prominently while in another planet's house.</p>",
        ],
      },
      triplicity: {
        title: "Triplicity",
        body: [
          "<p>Elemental rulership with a day ruler, night ruler, and cooperating ruler. It depends on the chart's sect.</p>",
          "<p>The ruler active by sect carries more weight as a resource; the out-of-sect ruler still testifies, but with lower priority; the cooperating ruler modifies and assists both.</p>",
        ],
      },
      bound: {
        title: "Bound",
        body: [
          "<p>Also called term. It is an unequal subdivision of a sign governed by a planet.</p>",
          "<p>When a body falls in a planet's bound, that planet provides fine-grained administration of the position.</p>",
        ],
      },
      decan: {
        title: "Decan",
        body: [
          "<p>One of three 10° divisions of a sign. Tyche uses the repeating Chaldean order.</p>",
          "<p>It is a minor dignity, also called face, that colors the local expression of a planet.</p>",
        ],
      },
      detriment: {
        title: "Detriment",
        body: [
          "<p>The sign opposite a planet's domicile. It is an essential weakness: the planet acts away from its own conditions.</p>",
        ],
      },
      fall: {
        title: "Fall",
        body: [
          "<p>The sign opposite exaltation. It is an essential weakness associated with reduced honor, support, or elevation.</p>",
        ],
      },
      angularity: {
        title: "Angularity",
        body: [
          "<p>Strength by place. Houses 1, 4, 7, and 10 are angular; 2, 5, 8, and 11 succedent; 3, 6, 9, and 12 cadent.</p>",
          "<p>Angular places act with stronger presence; cadent places tend to manifest less directly.</p>",
        ],
      },
      angular: {
        title: "Angular",
        body: [
          "<p>House 1, 4, 7, or 10. Indicates presence, action, and strong visibility in the chart.</p>",
        ],
      },
      succedent: {
        title: "Succedent",
        body: [
          "<p>House 2, 5, 8, or 11. Indicates intermediate strength: sustaining, accumulating, or developing what the angles initiate.</p>",
        ],
      },
      cadent: {
        title: "Cadent",
        body: [
          "<p>House 3, 6, 9, or 12. Indicates less direct capacity for action or a more withdrawn position.</p>",
        ],
      },
      solarPhase: {
        title: "Solar phase",
        body: [
          "<p>A non-luminary planet's relationship to the Sun. It may be morning/oriental, evening/occidental, under the beams, combust, or in the heart.</p>",
          "<p>Closeness to the Sun can hide, weaken, or exceptionally concentrate a planet's expression.</p>",
        ],
      },
      morning: {
        title: "Morning / oriental",
        body: [
          "<p>A planet appearing before the Sun in zodiacal order and associated with morning manifestation. For Mercury it inclines toward day quality.</p>",
        ],
      },
      evening: {
        title: "Evening / occidental",
        body: [
          "<p>A planet appearing after the Sun in zodiacal order and associated with evening manifestation. For Mercury it inclines toward night quality.</p>",
        ],
      },
      underBeams: {
        title: "Under the beams",
        body: [
          "<p>A planet within about 15° of the Sun. Its visibility is diminished by solar light.</p>",
        ],
      },
      combust: {
        title: "Combust",
        body: [
          "<p>A planet within about 8° of the Sun. It is a stronger condition of solar concealment and weakening.</p>",
        ],
      },
      cazimi: {
        title: "In the heart (cazimi)",
        body: [
          "<p>A planet within about 1° of the Sun. Instead of simple concealment, it is interpreted as concentrated union with solar authority.</p>",
          "<p>Tyche uses the broad 1° threshold. Some traditions use a narrower margin, such as about 17′.</p>",
        ],
      },
      lunarCondition: {
        title: "Lunar condition",
        body: [
          "<p>Summary of lunar phase, angular distance from the Sun, applications/separations, and possible void-of-course condition.</p>",
          "<p>The Moon describes body, change, vital rhythm, near events, and transmission of light among planets.</p>",
        ],
      },
      moonPhase: {
        title: "Lunar phase",
        body: [
          "<p>The phase name based on zodiacal elongation from Sun to Moon. Tyche also shows the angle in degrees.</p>",
          "<p>The cycle runs from New Moon to Full Moon and back through waning phases to Balsamic.</p>",
        ],
      },
      moonVoc: {
        title: "Void of course",
        body: [
          "<p>Tyche uses the broader Hellenistic definition as the main judgment: the Moon is void if it perfects no conjunction, sextile, square, trine, or opposition in the next 30° of lunar motion.</p>",
          "<p>Tyche also shows whether the Moon perfects before leaving its sign. The separate no-application-within-12° indicator remains apart so an orb-based reading is not confused with the 30° definition.</p>",
        ],
      },
      applications: {
        title: "Applications",
        body: [
          "<p>Relationships the Moon is moving toward. A separation means the contact has already passed.</p>",
          "<p>Application and separation help judge the transmission of activity between planets.</p>",
        ],
      },
      configurations: {
        title: "Configurations",
        body: [
          "<p>Relations of visibility between signs or planets: copresence, sextile, square, trine, and opposition.</p>",
          "<p>Sign-based configuration is central in Hellenistic reading; degree perfection adds precision.</p>",
        ],
      },
      copresence: {
        title: "Copresence",
        body: [
          "<p>Two planets in the same sign. They share a place and affect each other by zodiacal cohabitation, even without exact degree union.</p>",
        ],
      },
      conjunction: {
        title: "Conjunction",
        body: [
          "<p>Bodily perfection by degree between two planets. In lunar condition it shows the Moon applying to or separating from a planet in the same sign.</p>",
        ],
      },
      sextile: {
        title: "Sextile",
        body: [
          "<p>Relationship between signs two signs apart, equivalent to 60° by degree. It is a moderate cooperative configuration.</p>",
        ],
      },
      square: {
        title: "Square",
        body: [
          "<p>Relationship between signs three signs apart, equivalent to 90° by degree. It often indicates tension, action, and conflict of qualities.</p>",
        ],
      },
      trine: {
        title: "Trine",
        body: [
          "<p>Relationship between signs four signs apart, equivalent to 120° by degree. It indicates elemental affinity and steadier flow.</p>",
        ],
      },
      opposition: {
        title: "Opposition",
        body: [
          "<p>Relationship between opposite signs, equivalent to 180° by degree. It faces two poles of the same zodiacal line.</p>",
        ],
      },
      applying: {
        title: "Applying",
        body: [
          "<p>A planet is moving toward perfecting a relationship with another. It usually describes activity in development.</p>",
        ],
      },
      separating: {
        title: "Separating",
        body: [
          "<p>A planet is moving away from a perfected relationship. It points to past contact or an effect beginning to withdraw.</p>",
        ],
      },
      overcoming: {
        title: "Overcoming",
        body: [
          "<p>In right-sided configurations, especially the superior square, one planet may overcome another from a stronger zodiacal position.</p>",
          "<p>Tyche distinguishes the direction of the testimony: it is not the same for the benefic or malefic to dominate the significator as for the significator to retain the superior position against that contact.</p>",
        ],
      },
      aspectPair: {
        title: "Pair",
        body: [
          "<p>The two planets or points involved in a configuration.</p>",
        ],
      },
      mode: {
        title: "Mode",
        body: [
          "<p>Shows whether the configuration is being displayed by sign, by degree, or by both criteria.</p>",
        ],
      },
      lotLord: {
        title: "Lot lord",
        body: [
          "<p>The domicile ruler of the sign containing the lot. It helps judge how the lot's topic is administered.</p>",
        ],
      },
      lotLordHouse: {
        title: "Lord house",
        body: [
          "<p>The place occupied by the lot lord. It shows where the lot's matter is channeled.</p>",
        ],
      },
      ephemeris: {
        title: "Ephemerides",
        body: [
          "<p>Tables or mathematical engine for celestial positions. Tyche uses Astronomy Engine locally and keeps the older approximate engine only as fallback.</p>",
        ],
      },
    },
  };

  const HISTORICAL_PEOPLE = [
    {
      id: "ada-lovelace",
      name: "Ada Lovelace",
      sex: "female",
      date: "1815-12-10",
      time: "13:00",
      calendar: "gregorian",
      manualOffset: "-00:01",
      place: {
        city: "London",
        country: "United Kingdom",
        admin1: "England",
        lat: 51.5,
        lon: -0.1667,
        tz: "",
        names: { es: "Londres", en: "London" },
        countryNames: { es: "Reino Unido", en: "United Kingdom" },
        admin1Names: { es: "Inglaterra", en: "England" },
      },
      birthLabel: { es: "10 diciembre 1815, 13:00", en: "10 December 1815, 13:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ada_Lovelace_Chalon_portrait.jpg?width=360",
      imageAlt: { es: "Retrato de Ada Lovelace", en: "Portrait of Ada Lovelace" },
    },
    {
      id: "alan-turing",
      name: "Alan Turing",
      sex: "male",
      date: "1912-06-23",
      time: "02:15",
      calendar: "gregorian",
      manualOffset: "+00:00",
      place: {
        city: "London",
        country: "United Kingdom",
        admin1: "England",
        lat: 51.5,
        lon: -0.1667,
        tz: "",
        names: { es: "Londres", en: "London" },
        countryNames: { es: "Reino Unido", en: "United Kingdom" },
        admin1Names: { es: "Inglaterra", en: "England" },
      },
      birthLabel: { es: "23 junio 1912, 02:15", en: "23 June 1912, 02:15" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Alan_Turing_%281951%29.jpg?width=360",
      imageAlt: { es: "Fotografía de Alan Turing", en: "Photograph of Alan Turing" },
    },
    {
      id: "albert-einstein",
      name: "Albert Einstein",
      sex: "male",
      date: "1879-03-14",
      time: "11:30",
      calendar: "gregorian",
      manualOffset: "+00:40",
      place: {
        city: "Ulm",
        country: "Germany",
        admin1: "Baden-Wurttemberg",
        lat: 48.4,
        lon: 10,
        tz: "",
        countryNames: { es: "Alemania", en: "Germany" },
      },
      birthLabel: { es: "14 marzo 1879, 11:30", en: "14 March 1879, 11:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Einstein_Head.jpg?width=360",
      imageAlt: { es: "Fotografía de Albert Einstein", en: "Photograph of Albert Einstein" },
    },
    {
      id: "amelia-earhart",
      name: "Amelia Earhart",
      sex: "female",
      date: "1897-07-24",
      time: "23:30",
      calendar: "gregorian",
      manualOffset: "-06:00",
      place: {
        city: "Atchison",
        country: "United States",
        admin1: "Kansas",
        lat: 39.5667,
        lon: -95.1167,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "24 julio 1897, 23:30", en: "24 July 1897, 23:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Amelia_Earhart_1935.jpg?width=360",
      imageAlt: { es: "Fotografía de Amelia Earhart", en: "Photograph of Amelia Earhart" },
    },
    {
      id: "al-gore",
      name: "Al Gore",
      wikipedia: "https://en.wikipedia.org/wiki/Al_Gore",
      sex: "male",
      date: "1948-03-31",
      time: "12:53",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "Washington",
        country: "United States",
        admin1: "District of Columbia",
        lat: 38.8833,
        lon: -77.0167,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
        admin1Names: { es: "Distrito de Columbia", en: "District of Columbia" },
      },
      birthLabel: { es: "31 marzo 1948, 12:53", en: "31 March 1948, 12:53" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Al_Gore%2C_Vice_President_of_the_United_States%2C_official_portrait_1994.jpg/330px-Al_Gore%2C_Vice_President_of_the_United_States%2C_official_portrait_1994.jpg",
      imageAlt: { es: "Fotografía de Al Gore", en: "Photograph of Al Gore" },
    },
    {
      id: "amanda-knox",
      name: "Amanda Knox",
      wikipedia: "https://en.wikipedia.org/wiki/Amanda_Knox",
      sex: "female",
      date: "1987-07-09",
      time: "02:47",
      calendar: "gregorian",
      manualOffset: "-07:00",
      place: {
        city: "Seattle",
        country: "United States",
        admin1: "Washington",
        lat: 47.6062,
        lon: -122.3321,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "9 julio 1987, 02:47", en: "9 July 1987, 02:47" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Amanda_Knox_OFTV.jpg/330px-Amanda_Knox_OFTV.jpg",
      imageAlt: { es: "Fotografía de Amanda Knox", en: "Photograph of Amanda Knox" },
    },
    {
      id: "arnold-schwarzenegger",
      name: "Arnold Schwarzenegger",
      wikipedia: "https://en.wikipedia.org/wiki/Arnold_Schwarzenegger",
      sex: "male",
      date: "1947-07-30",
      time: "04:10",
      calendar: "gregorian",
      manualOffset: "+02:00",
      place: {
        city: "Graz",
        country: "Austria",
        admin1: "Styria",
        lat: 47.0707,
        lon: 15.4395,
        tz: "",
        countryNames: { es: "Austria", en: "Austria" },
        admin1Names: { es: "Estiria", en: "Styria" },
      },
      birthLabel: { es: "30 julio 1947, 04:10", en: "30 July 1947, 04:10" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Arnold_Schwarzenegger_2025_%28cropped%29.jpg/330px-Arnold_Schwarzenegger_2025_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Arnold Schwarzenegger", en: "Photograph of Arnold Schwarzenegger" },
    },
    {
      id: "barack-obama",
      name: "Barack Obama",
      wikipedia: "https://en.wikipedia.org/wiki/Barack_Obama",
      sex: "male",
      date: "1961-08-04",
      time: "19:24",
      calendar: "gregorian",
      manualOffset: "-10:00",
      place: {
        city: "Honolulu",
        country: "United States",
        admin1: "Hawaii",
        lat: 21.3069,
        lon: -157.8583,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
        admin1Names: { es: "Hawái", en: "Hawaii" },
      },
      birthLabel: { es: "4 agosto 1961, 19:24", en: "4 August 1961, 19:24" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/330px-President_Barack_Obama.jpg",
      imageAlt: { es: "Fotografía de Barack Obama", en: "Photograph of Barack Obama" },
    },
    {
      id: "bill-clinton",
      name: "Bill Clinton",
      wikipedia: "https://en.wikipedia.org/wiki/Bill_Clinton",
      sex: "male",
      date: "1946-08-19",
      time: "08:51",
      calendar: "gregorian",
      manualOffset: "-06:00",
      place: {
        city: "Hope",
        country: "United States",
        admin1: "Arkansas",
        lat: 33.6671,
        lon: -93.5916,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "19 agosto 1946, 08:51", en: "19 August 1946, 08:51" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Bill_Clinton_%28cropped_4%29.jpg/330px-Bill_Clinton_%28cropped_4%29.jpg",
      imageAlt: { es: "Fotografía de Bill Clinton", en: "Photograph of Bill Clinton" },
    },
    {
      id: "carl-sagan",
      name: "Carl Sagan",
      sex: "male",
      date: "1934-11-09",
      time: "17:05",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "New York",
        country: "United States",
        admin1: "New York",
        lat: 40.7167,
        lon: -74,
        tz: "",
        names: { es: "Nueva York", en: "New York" },
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "9 noviembre 1934, 17:05", en: "9 November 1934, 17:05" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Astronomer_Carl_Sagan_in_1987.jpg?width=360",
      imageAlt: { es: "Fotografía de Carl Sagan", en: "Photograph of Carl Sagan" },
    },
    {
      id: "elvis-presley",
      name: "Elvis Presley",
      sex: "male",
      date: "1935-01-08",
      time: "04:35",
      calendar: "gregorian",
      manualOffset: "-06:00",
      place: {
        city: "Tupelo",
        country: "United States",
        admin1: "Mississippi",
        lat: 34.25,
        lon: -88.7,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "8 enero 1935, 04:35", en: "8 January 1935, 04:35" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Elvis_Presley_in_1958.jpg?width=360",
      imageAlt: { es: "Fotografía de Elvis Presley", en: "Photograph of Elvis Presley" },
    },
    {
      id: "ernest-hemingway",
      name: "Ernest Hemingway",
      sex: "male",
      date: "1899-07-21",
      time: "08:00",
      calendar: "gregorian",
      manualOffset: "-06:00",
      place: {
        city: "Oak Park",
        country: "United States",
        admin1: "Illinois",
        lat: 41.8833,
        lon: -87.7833,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "21 julio 1899, 08:00", en: "21 July 1899, 08:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ernest_Hemingway_Aboard_the_Pilar_1950_-_NARA_-_192662.jpg?width=360",
      imageAlt: { es: "Fotografía de Ernest Hemingway", en: "Photograph of Ernest Hemingway" },
    },
    {
      id: "frank-lloyd-wright",
      name: "Frank Lloyd Wright",
      sex: "male",
      date: "1867-06-08",
      time: "17:00",
      calendar: "gregorian",
      manualOffset: "-06:02",
      place: {
        city: "Richland Center",
        country: "United States",
        admin1: "Wisconsin",
        lat: 43.3333,
        lon: -90.3833,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "8 junio 1867, 17:00", en: "8 June 1867, 17:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Frank_Lloyd_Wright_portrait.jpg?width=360",
      imageAlt: { es: "Fotografía de Frank Lloyd Wright", en: "Photograph of Frank Lloyd Wright" },
    },
    {
      id: "pablo-picasso",
      name: "Pablo Picasso",
      sex: "male",
      date: "1881-10-25",
      time: "23:15",
      calendar: "gregorian",
      manualOffset: "-00:14",
      place: {
        city: "Málaga",
        country: "Spain",
        admin1: "Andalucía",
        lat: 36.7167,
        lon: -4.4167,
        tz: "",
        countryNames: { es: "España", en: "Spain" },
      },
      birthLabel: { es: "25 octubre 1881, 23:15", en: "25 October 1881, 23:15" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_de_Picasso,_1908.jpg?width=360",
      imageAlt: { es: "Retrato joven de Pablo Picasso", en: "Young portrait of Pablo Picasso" },
    },
    {
      id: "frida-kahlo",
      name: "Frida Kahlo",
      sex: "female",
      date: "1907-07-06",
      time: "08:30",
      calendar: "gregorian",
      manualOffset: "-06:37",
      place: {
        city: "Coyoacán",
        country: "Mexico",
        admin1: "Ciudad de México",
        lat: 19.3333,
        lon: -99.15,
        tz: "",
        countryNames: { es: "México", en: "Mexico" },
      },
      birthLabel: { es: "6 julio 1907, 08:30", en: "6 July 1907, 08:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Frida_Kahlo,_by_Guillermo_Kahlo.jpg?width=360",
      imageAlt: { es: "Fotografía de Frida Kahlo", en: "Photograph of Frida Kahlo" },
    },
    {
      id: "gabriel-garcia-marquez",
      name: "Gabriel García Márquez",
      sex: "male",
      date: "1927-03-06",
      time: "09:00",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "Aracataca",
        country: "Colombia",
        admin1: "Magdalena",
        lat: 10.6,
        lon: -74.2,
        tz: "",
      },
      birthLabel: { es: "6 marzo 1927, 09:00", en: "6 March 1927, 09:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Gabriel_Garcia_Marquez.jpg?width=360",
      imageAlt: { es: "Fotografía de Gabriel García Márquez", en: "Photograph of Gabriel García Márquez" },
    },
    {
      id: "george-lucas",
      name: "George Lucas",
      wikipedia: "https://en.wikipedia.org/wiki/George_Lucas",
      sex: "male",
      date: "1944-05-14",
      time: "05:42",
      calendar: "gregorian",
      manualOffset: "-07:00",
      place: {
        city: "Modesto",
        country: "United States",
        admin1: "California",
        lat: 37.6391,
        lon: -120.9969,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "14 mayo 1944, 05:42", en: "14 May 1944, 05:42" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/George_Lucas_by_Gage_Skidmore.jpg/330px-George_Lucas_by_Gage_Skidmore.jpg",
      imageAlt: { es: "Fotografía de George Lucas", en: "Photograph of George Lucas" },
    },
    {
      id: "george-w-bush",
      name: "George W. Bush",
      wikipedia: "https://en.wikipedia.org/wiki/George_W._Bush",
      sex: "male",
      date: "1946-07-06",
      time: "07:26",
      calendar: "gregorian",
      manualOffset: "-04:00",
      place: {
        city: "New Haven",
        country: "United States",
        admin1: "Connecticut",
        lat: 41.3083,
        lon: -72.9279,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "6 julio 1946, 07:26", en: "6 July 1946, 07:26" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/George-W-Bush_%28cropped_2%29.jpeg/330px-George-W-Bush_%28cropped_2%29.jpeg",
      imageAlt: { es: "Fotografía de George W. Bush", en: "Photograph of George W. Bush" },
    },
    {
      id: "hans-christian-andersen",
      name: "Hans Christian Andersen",
      wikipedia: "https://en.wikipedia.org/wiki/Hans_Christian_Andersen",
      sex: "male",
      date: "1805-04-02",
      time: "01:00",
      calendar: "gregorian",
      manualOffset: "+00:42",
      place: {
        city: "Odense",
        country: "Denmark",
        admin1: "Funen",
        lat: 55.4038,
        lon: 10.4024,
        tz: "",
        countryNames: { es: "Dinamarca", en: "Denmark" },
        admin1Names: { es: "Fionia", en: "Funen" },
      },
      birthLabel: { es: "2 abril 1805, 01:00", en: "2 April 1805, 01:00" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/HCA_by_Thora_Hallager_1869_crop.jpg/250px-HCA_by_Thora_Hallager_1869_crop.jpg",
      imageAlt: { es: "Retrato de Hans Christian Andersen", en: "Portrait of Hans Christian Andersen" },
    },
    {
      id: "henri-matisse",
      name: "Henri Matisse",
      sex: "male",
      date: "1869-12-31",
      time: "20:00",
      calendar: "gregorian",
      manualOffset: "+00:14",
      place: {
        city: "Le Cateau-Cambrésis",
        country: "France",
        admin1: "Hauts-de-France",
        lat: 50.1,
        lon: 3.55,
        tz: "",
        countryNames: { es: "Francia", en: "France" },
      },
      birthLabel: { es: "31 diciembre 1869, 20:00", en: "31 December 1869, 20:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_Henri_Matisse_1933_May_20.jpg?width=360",
      imageAlt: { es: "Fotografía de Henri Matisse", en: "Photograph of Henri Matisse" },
    },
    {
      id: "herman-melville",
      name: "Herman Melville",
      sex: "male",
      date: "1819-08-01",
      time: "23:30",
      calendar: "gregorian",
      manualOffset: "-04:56",
      place: {
        city: "New York",
        country: "United States",
        admin1: "New York",
        lat: 40.7167,
        lon: -74,
        tz: "",
        names: { es: "Nueva York", en: "New York" },
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "1 agosto 1819, 23:30", en: "1 August 1819, 23:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Herman_Melville_by_Joseph_O_Eaton.jpg?width=360",
      imageAlt: { es: "Retrato de Herman Melville", en: "Portrait of Herman Melville" },
    },
    {
      id: "igor-stravinsky",
      name: "Igor Stravinsky",
      sex: "male",
      date: "1882-06-05",
      time: "12:00",
      calendar: "julian",
      manualOffset: "+02:30",
      place: {
        city: "Oranienbaum",
        country: "Russia",
        admin1: "Saint Petersburg",
        lat: 59.9167,
        lon: 29.7667,
        tz: "",
        names: { es: "Oranienbaum", en: "Oranienbaum" },
        countryNames: { es: "Rusia", en: "Russia" },
      },
      birthLabel: { es: "5 junio 1882 juliano / 17 junio greg., 12:00", en: "5 June 1882 Julian / 17 June Gregorian, 12:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Igor_Stravinsky_LOC_32392u.jpg?width=360",
      imageAlt: { es: "Fotografía de Igor Stravinsky", en: "Photograph of Igor Stravinsky" },
    },
    {
      id: "jorge-luis-borges",
      name: "Jorge Luis Borges",
      sex: "male",
      date: "1899-08-24",
      time: "03:30",
      calendar: "gregorian",
      manualOffset: "-04:17",
      place: {
        city: "Buenos Aires",
        country: "Argentina",
        admin1: "Ciudad Autónoma de Buenos Aires",
        lat: -34.6,
        lon: -58.45,
        tz: "",
      },
      birthLabel: { es: "24 agosto 1899, 03:30", en: "24 August 1899, 03:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Jorge_Luis_Borges_1951,_by_Grete_Stern_(full).jpg?width=360",
      imageAlt: { es: "Fotografía de Jorge Luis Borges", en: "Photograph of Jorge Luis Borges" },
    },
    {
      id: "julio-cortazar",
      name: "Julio Cortázar",
      sex: "male",
      date: "1914-08-26",
      time: "11:50",
      calendar: "gregorian",
      manualOffset: "+00:00",
      place: {
        city: "Ixelles",
        country: "Belgium",
        admin1: "Brussels",
        lat: 50.8333,
        lon: 4.3667,
        tz: "",
        countryNames: { es: "Bélgica", en: "Belgium" },
        admin1Names: { es: "Bruselas", en: "Brussels" },
      },
      birthLabel: { es: "26 agosto 1914, 11:50", en: "26 August 1914, 11:50" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Julio_cortazar_joven_retrato.jpg?width=360",
      imageAlt: { es: "Retrato joven de Julio Cortázar", en: "Young portrait of Julio Cortázar" },
    },
    {
      id: "jonathan-brandis",
      name: "Jonathan Brandis",
      wikipedia: "https://en.wikipedia.org/wiki/Jonathan_Brandis",
      sex: "male",
      date: "1976-04-13",
      time: "20:00",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "Danbury",
        country: "United States",
        admin1: "Connecticut",
        lat: 41.3948,
        lon: -73.454,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "13 abril 1976, 20:00", en: "13 April 1976, 20:00" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Jonathan_Brandis_Wiki.jpg/250px-Jonathan_Brandis_Wiki.jpg",
      imageAlt: { es: "Fotografía de Jonathan Brandis", en: "Photograph of Jonathan Brandis" },
    },
    {
      id: "kurt-cobain",
      name: "Kurt Cobain",
      wikipedia: "https://en.wikipedia.org/wiki/Kurt_Cobain",
      sex: "male",
      date: "1967-02-20",
      time: "19:38",
      calendar: "gregorian",
      manualOffset: "-08:00",
      place: {
        city: "Aberdeen",
        country: "United States",
        admin1: "Washington",
        lat: 46.9754,
        lon: -123.8157,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "20 febrero 1967, 19:38", en: "20 February 1967, 19:38" },
      image: "https://upload.wikimedia.org/wikipedia/commons/3/37/Nirvana_around_1992_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Kurt Cobain", en: "Photograph of Kurt Cobain" },
    },
    {
      id: "le-corbusier",
      name: "Le Corbusier",
      sex: "male",
      date: "1887-10-06",
      time: "21:00",
      calendar: "gregorian",
      manualOffset: "+00:30",
      place: {
        city: "La Chaux-de-Fonds",
        country: "Switzerland",
        admin1: "Neuchâtel",
        lat: 47.1,
        lon: 6.8333,
        tz: "",
        countryNames: { es: "Suiza", en: "Switzerland" },
      },
      birthLabel: { es: "6 octubre 1887, 21:00", en: "6 October 1887, 21:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Le_Corbusier_en_1964.jpg?width=360",
      imageAlt: { es: "Fotografía de Le Corbusier", en: "Photograph of Le Corbusier" },
    },
    {
      id: "lisa-marie-presley",
      name: "Lisa Marie Presley",
      wikipedia: "https://en.wikipedia.org/wiki/Lisa_Marie_Presley",
      sex: "female",
      date: "1968-02-01",
      time: "17:01",
      calendar: "gregorian",
      manualOffset: "-06:00",
      place: {
        city: "Memphis",
        country: "United States",
        admin1: "Tennessee",
        lat: 35.1495,
        lon: -90.049,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "1 febrero 1968, 17:01", en: "1 February 1968, 17:01" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Lisa_Marie_Presley_at_car_race_%28cropped%29.jpg/250px-Lisa_Marie_Presley_at_car_race_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Lisa Marie Presley", en: "Photograph of Lisa Marie Presley" },
    },
    {
      id: "m-c-escher",
      name: "M. C. Escher",
      sex: "male",
      date: "1898-06-17",
      time: "07:15",
      calendar: "gregorian",
      manualOffset: "+00:20",
      place: {
        city: "Leeuwarden",
        country: "Netherlands",
        admin1: "Friesland",
        lat: 53.2,
        lon: 5.8,
        tz: "",
        countryNames: { es: "Países Bajos", en: "Netherlands" },
      },
      birthLabel: { es: "17 junio 1898, 07:15", en: "17 June 1898, 07:15" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Maurits_Cornelis_Escher.jpg?width=360",
      imageAlt: { es: "Fotografía de M. C. Escher", en: "Photograph of M. C. Escher" },
    },
    {
      id: "marilyn-monroe",
      name: "Marilyn Monroe",
      sex: "female",
      date: "1926-06-01",
      time: "09:30",
      calendar: "gregorian",
      manualOffset: "-08:00",
      place: {
        city: "Los Angeles",
        country: "United States",
        admin1: "California",
        lat: 34.05,
        lon: -118.25,
        tz: "",
        names: { es: "Los Ángeles", en: "Los Angeles" },
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "1 junio 1926, 09:30", en: "1 June 1926, 09:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Marilyn_Monroe_1953.jpg?width=360",
      imageAlt: { es: "Fotografía de Marilyn Monroe", en: "Photograph of Marilyn Monroe" },
    },
    {
      id: "michael-j-fox",
      name: "Michael J. Fox",
      wikipedia: "https://en.wikipedia.org/wiki/Michael_J._Fox",
      sex: "male",
      date: "1961-06-09",
      time: "00:15",
      calendar: "gregorian",
      manualOffset: "-07:00",
      place: {
        city: "Edmonton",
        country: "Canada",
        admin1: "Alberta",
        lat: 53.5461,
        lon: -113.4938,
        tz: "",
        countryNames: { es: "Canadá", en: "Canada" },
      },
      birthLabel: { es: "9 junio 1961, 00:15", en: "9 June 1961, 00:15" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Michael_J._Fox_1985_%28cropped%29.jpg/250px-Michael_J._Fox_1985_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Michael J. Fox", en: "Photograph of Michael J. Fox" },
    },
    {
      id: "patrick-swayze",
      name: "Patrick Swayze",
      wikipedia: "https://en.wikipedia.org/wiki/Patrick_Swayze",
      sex: "male",
      date: "1952-08-18",
      time: "08:10",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "Houston",
        country: "United States",
        admin1: "Texas",
        lat: 29.7604,
        lon: -95.3698,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "18 agosto 1952, 08:10", en: "18 August 1952, 08:10" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Patrick_Swayze_-_1990_Grammy_Awards_%28cropped%29.jpg/330px-Patrick_Swayze_-_1990_Grammy_Awards_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Patrick Swayze", en: "Photograph of Patrick Swayze" },
    },
    {
      id: "robert-downey-jr",
      name: "Robert Downey Jr.",
      wikipedia: "https://en.wikipedia.org/wiki/Robert_Downey_Jr.",
      sex: "male",
      date: "1965-04-04",
      time: "13:10",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "Manhattan",
        country: "United States",
        admin1: "New York",
        lat: 40.7831,
        lon: -73.9712,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
        admin1Names: { es: "Nueva York", en: "New York" },
      },
      birthLabel: { es: "4 abril 1965, 13:10", en: "4 April 1965, 13:10" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg/330px-RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Robert Downey Jr.", en: "Photograph of Robert Downey Jr." },
    },
    {
      id: "salvador-dali",
      name: "Salvador Dalí",
      sex: "male",
      date: "1904-05-11",
      time: "08:45",
      calendar: "gregorian",
      manualOffset: "+00:00",
      place: {
        city: "Figueres",
        country: "Spain",
        admin1: "Cataluña",
        lat: 42.2667,
        lon: 2.9667,
        tz: "",
        countryNames: { es: "España", en: "Spain" },
      },
      birthLabel: { es: "11 mayo 1904, 08:45", en: "11 May 1904, 08:45" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Salvador_Dali_NYWTS.jpg?width=360",
      imageAlt: { es: "Fotografía de Salvador Dalí", en: "Photograph of Salvador Dalí" },
    },
    {
      id: "simone-de-beauvoir",
      name: "Simone de Beauvoir",
      sex: "female",
      date: "1908-01-09",
      time: "04:30",
      calendar: "gregorian",
      manualOffset: "+00:09",
      place: {
        city: "Paris",
        country: "France",
        admin1: "Île-de-France",
        lat: 48.8506,
        lon: 2.3333,
        tz: "",
        names: { es: "París", en: "Paris" },
        countryNames: { es: "Francia", en: "France" },
      },
      birthLabel: { es: "9 enero 1908, 04:30", en: "9 January 1908, 04:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Simone_de_Beauvoir.jpg?width=360",
      imageAlt: { es: "Fotografía de Simone de Beauvoir", en: "Photograph of Simone de Beauvoir" },
    },
    {
      id: "rene-magritte",
      name: "René Magritte",
      sex: "male",
      date: "1898-11-21",
      time: "07:30",
      calendar: "gregorian",
      manualOffset: "+00:00",
      place: {
        city: "Lessines",
        country: "Belgium",
        admin1: "Hainaut",
        lat: 50.7167,
        lon: 3.8333,
        tz: "",
        countryNames: { es: "Bélgica", en: "Belgium" },
      },
      birthLabel: { es: "21 noviembre 1898, 07:30", en: "21 November 1898, 07:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/René_Magritte_in_1961.jpg?width=360",
      imageAlt: { es: "Fotografía de René Magritte", en: "Photograph of René Magritte" },
    },
    {
      id: "sigmund-freud",
      name: "Sigmund Freud",
      sex: "male",
      date: "1856-05-06",
      time: "18:30",
      calendar: "gregorian",
      manualOffset: "+00:58",
      place: {
        city: "Freiberg/Mähren",
        country: "Czech Republic",
        admin1: "Moravian-Silesian Region",
        lat: 49.65,
        lon: 18.1667,
        tz: "",
        countryNames: { es: "República Checa", en: "Czech Republic" },
        admin1Names: { es: "Moravia-Silesia", en: "Moravian-Silesian Region" },
      },
      birthLabel: { es: "6 mayo 1856, 18:30", en: "6 May 1856, 18:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Sigmund_Freud_by_Max_Halberstadt_1909_cph.3c33801.jpg?width=360",
      imageAlt: { es: "Fotografía de Sigmund Freud", en: "Photograph of Sigmund Freud" },
    },
    {
      id: "steve-wozniak",
      name: "Steve Wozniak",
      wikipedia: "https://en.wikipedia.org/wiki/Steve_Wozniak",
      sex: "male",
      date: "1950-08-11",
      time: "09:45",
      calendar: "gregorian",
      manualOffset: "-07:00",
      place: {
        city: "San Jose",
        country: "United States",
        admin1: "California",
        lat: 37.3382,
        lon: -121.8863,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
      },
      birthLabel: { es: "11 agosto 1950, 09:45", en: "11 August 1950, 09:45" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Steve_Wozniak_by_Gage_Skidmore_3_%28cropped%29.jpg/330px-Steve_Wozniak_by_Gage_Skidmore_3_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Steve Wozniak", en: "Photograph of Steve Wozniak" },
    },
    {
      id: "vanessa-williams",
      name: "Vanessa Williams",
      wikipedia: "https://en.wikipedia.org/wiki/Vanessa_Williams",
      sex: "female",
      date: "1963-03-18",
      time: "11:28",
      calendar: "gregorian",
      manualOffset: "-05:00",
      place: {
        city: "Millwood",
        country: "United States",
        admin1: "New York",
        lat: 41.2012,
        lon: -73.7976,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
        admin1Names: { es: "Nueva York", en: "New York" },
      },
      birthLabel: { es: "18 marzo 1963, 11:28", en: "18 March 1963, 11:28" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Vanessa_Williams_April_2019.png/330px-Vanessa_Williams_April_2019.png",
      imageAlt: { es: "Fotografía de Vanessa Williams", en: "Photograph of Vanessa Williams" },
    },
    {
      id: "whitney-houston",
      name: "Whitney Houston",
      wikipedia: "https://en.wikipedia.org/wiki/Whitney_Houston",
      sex: "female",
      date: "1963-08-09",
      time: "20:55",
      calendar: "gregorian",
      manualOffset: "-04:00",
      place: {
        city: "Newark",
        country: "United States",
        admin1: "New Jersey",
        lat: 40.7357,
        lon: -74.1724,
        tz: "",
        countryNames: { es: "Estados Unidos", en: "United States" },
        admin1Names: { es: "Nueva Jersey", en: "New Jersey" },
      },
      birthLabel: { es: "9 agosto 1963, 20:55", en: "9 August 1963, 20:55" },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Whitney_Houston_by_Richard_Avedon_color_%28cropped%29.jpg/330px-Whitney_Houston_by_Richard_Avedon_color_%28cropped%29.jpg",
      imageAlt: { es: "Fotografía de Whitney Houston", en: "Photograph of Whitney Houston" },
    },
    {
      id: "victoria",
      name: "Victoria del Reino Unido",
      wikipedia: {
        es: "https://es.wikipedia.org/wiki/Victoria_del_Reino_Unido",
        en: "https://en.wikipedia.org/wiki/Queen_Victoria",
      },
      sex: "female",
      date: "1819-05-24",
      time: "04:15",
      calendar: "gregorian",
      manualOffset: "-00:10",
      place: {
        city: "London",
        country: "United Kingdom",
        admin1: "England",
        lat: 51.5,
        lon: -0.1667,
        tz: "",
        names: { es: "Londres", en: "London" },
        countryNames: { es: "Reino Unido", en: "United Kingdom" },
        admin1Names: { es: "Inglaterra", en: "England" },
      },
      birthLabel: { es: "24 mayo 1819, 04:15", en: "24 May 1819, 04:15" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Queen_Victoria_by_Bassano.jpg?width=360",
      imageAlt: { es: "Fotografía de Victoria del Reino Unido", en: "Photograph of Queen Victoria" },
    },
    {
      id: "vincent-van-gogh",
      name: "Vincent van Gogh",
      sex: "male",
      date: "1853-03-30",
      time: "11:00",
      calendar: "gregorian",
      manualOffset: "+00:19",
      place: {
        city: "Zundert",
        country: "Netherlands",
        admin1: "North Brabant",
        lat: 51.4667,
        lon: 4.6667,
        tz: "",
        countryNames: { es: "Países Bajos", en: "Netherlands" },
        admin1Names: { es: "Brabante Septentrional", en: "North Brabant" },
      },
      birthLabel: { es: "30 marzo 1853, 11:00", en: "30 March 1853, 11:00" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Self-portrait_-_Vincent_van_Gogh.jpg?width=360",
      imageAlt: { es: "Autorretrato de Vincent van Gogh", en: "Self-portrait of Vincent van Gogh" },
    },
    {
      id: "winston-churchill",
      name: "Winston Churchill",
      sex: "male",
      date: "1874-11-30",
      time: "01:30",
      calendar: "gregorian",
      manualOffset: "+00:00",
      place: {
        city: "Woodstock",
        country: "United Kingdom",
        admin1: "England",
        lat: 51.8667,
        lon: -1.35,
        tz: "",
        countryNames: { es: "Reino Unido", en: "United Kingdom" },
        admin1Names: { es: "Inglaterra", en: "England" },
      },
      birthLabel: { es: "30 noviembre 1874, 01:30", en: "30 November 1874, 01:30" },
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Sir_Winston_Churchill_-_19086236948_%28cropped2%29.jpg?width=360",
      imageAlt: { es: "Fotografía de Winston Churchill", en: "Photograph of Winston Churchill" },
    },
  ];

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

  function personWikipediaUrl(person) {
    if (typeof person.wikipedia === "string") return person.wikipedia;
    if (person.wikipedia) return person.wikipedia[state.lang] || person.wikipedia.en || person.wikipedia.es;
    const slug = encodeURIComponent(person.name.replace(/\s+/g, "_"));
    const host = state.lang === "es" ? "es.wikipedia.org" : "en.wikipedia.org";
    return `https://${host}/wiki/${slug}`;
  }

  function capitalizeText(value) {
    const chars = Array.from(String(value ?? ""));
    const index = chars.findIndex((char) => char.toLowerCase() !== char.toUpperCase());
    if (index === -1) return chars.join("");
    chars[index] = chars[index].toLocaleUpperCase(state.lang === "es" ? "es-ES" : "en");
    return chars.join("");
  }

  function capitalizeList(items) {
    return items.map(capitalizeText).join(", ");
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function glossaryEntry(key) {
    return GLOSSARY[state.lang]?.[key] || GLOSSARY.es[key] || null;
  }

  function glossaryTerm(label, key, extraClass = "") {
    const entry = glossaryEntry(key);
    if (!entry) return escapeHtml(label);
    const classes = ["glossary-trigger", extraClass].filter(Boolean).join(" ");
    return `<button type="button" class="${classes}" data-glossary="${escapeHtml(key)}" aria-haspopup="dialog" aria-label="${escapeHtml(t("glossaryOpen", { term: label }))}">${escapeHtml(label)}</button>`;
  }

  function glossaryMaybe(label, key = "", extraClass = "") {
    const resolvedKey = key || glossaryKeyForText(label);
    return resolvedKey ? glossaryTerm(label, resolvedKey, extraClass) : escapeHtml(label);
  }

  function glossaryKeyForText(value) {
    const normalized = normalizeText(value);
    if (!normalized || normalized === "—" || normalized === "-") return "";
    const matchers = [
      ["noMajorDignity", ["sin dignidad mayor", "no major dignity"]],
      ["domicile", ["domicilio", "domicile"]],
      ["detriment", ["detrimento", "detriment"]],
      ["exaltation", ["exaltacion", "exaltation"]],
      ["fall", ["caida", "fall"]],
      ["triplicity", ["triplicidad", "triplicity"]],
      ["bound", ["termino", "bound"]],
      ["decan", ["decanato", "decan"]],
      ["underBeams", ["bajo los rayos", "under the beams", "under beams", "bajo rayos"]],
      ["combust", ["combusto", "combust"]],
      ["cazimi", ["cazimi", "en el corazon", "in the heart"]],
      ["morning", ["matutino", "oriental", "morning"]],
      ["evening", ["vespertino", "occidental", "evening"]],
      ["moonPhase", ["luna nueva", "creciente", "gibosa", "luna llena", "diseminante", "menguante", "balsamica", "new moon", "crescent", "quarter", "gibbous", "full moon", "disseminating", "balsamic"]],
      ["conjunction", ["conjuncion", "conjunction"]],
      ["angular", ["angular"]],
      ["succedent", ["sucedente", "succedent"]],
      ["cadent", ["cadente", "cadent"]],
      ["copresence", ["copresencia", "copresence"]],
      ["sextile", ["sextil", "sextile"]],
      ["square", ["cuadrado", "square"]],
      ["trine", ["trigono", "trine"]],
      ["opposition", ["oposicion", "opposition"]],
      ["applying", ["aplicando", "applying"]],
      ["separating", ["separando", "separating"]],
      ["aspects", ["por signo", "by sign", "por grado", "by degree", "signo + grado", "sign + degree"]],
      ["overcoming", ["domina", "overcomes"]],
    ];
    return matchers.find(([, needles]) => needles.some((needle) => normalized.includes(needle)))?.[0] || "";
  }

  function triplicityRoleForDignityLabel(item, chart) {
    if (!chart || glossaryKeyForText(item) !== "triplicity") return "";
    const normalized = normalizeText(item);
    if (normalized.includes(normalizeText(t("triplicityDay")))) {
      return chart.isDay ? "triplicityActive" : "triplicityOutOfSect";
    }
    if (normalized.includes(normalizeText(t("triplicityNight")))) {
      return chart.isDay ? "triplicityOutOfSect" : "triplicityActive";
    }
    if (normalized.includes(normalizeText(t("triplicityCoop")))) {
      return "triplicityCooperatingRole";
    }
    return "";
  }

  function dignityDisplayLabel(item, chart = null) {
    const role = triplicityRoleForDignityLabel(item, chart);
    const label = capitalizeText(item);
    return role ? `${label} (${t(role)})` : label;
  }

  function glossaryList(items, chart = null) {
    return items.map((item) => glossaryMaybe(dignityDisplayLabel(item, chart), glossaryKeyForText(item), "capitalize-first")).join(", ");
  }

  function dignityGroups(items) {
    const groups = { major: [], minor: [], weakness: [] };
    items.forEach((item) => {
      const key = glossaryKeyForText(item);
      if (["domicile", "exaltation", "triplicity"].includes(key)) groups.major.push(item);
      else if (["bound", "decan"].includes(key)) groups.minor.push(item);
      else if (["detriment", "fall"].includes(key)) groups.weakness.push(item);
    });
    return groups;
  }

  function dignityGroupText(items, chart = null) {
    return items.length ? glossaryList(items, chart) : glossaryMaybe(capitalizeText(t("none")), "", "capitalize-first");
  }

  function glossaryParts(value) {
    const text = String(value || "");
    if (!text || text === "—") return escapeHtml(text || "—");
    return text.split(/(,\s*)/).map((part) => {
      if (/^,\s*$/.test(part)) return escapeHtml(part);
      return glossaryMaybe(capitalizeText(part), glossaryKeyForText(part), "capitalize-first");
    }).join("");
  }

  function tableHead(label, key) {
    return glossaryTerm(label, key, "glossary-head");
  }

  function lotGlossaryKey(key) {
    return {
      fortune: "lotFortune",
      spirit: "lotSpirit",
      eros: "lotEros",
      necessity: "lotNecessity",
      courage: "lotCourage",
      victory: "lotVictory",
      nemesis: "lotNemesis",
    }[key] || "lots";
  }

  function decorateGlossaryTriggers(root = document) {
    $$("[data-glossary]", root).forEach((node) => {
      const key = node.dataset.glossary;
      if (!glossaryEntry(key)) return;
      node.classList.add("glossary-trigger");
      node.setAttribute("aria-haspopup", "dialog");
      node.setAttribute("aria-label", t("glossaryOpen", { term: node.textContent.trim() || key }));
      if (node.tagName !== "BUTTON" && node.tagName !== "A") {
        node.setAttribute("role", "button");
        node.tabIndex = 0;
      }
    });
    $("#glossaryClose")?.setAttribute("aria-label", t("close"));
    if ($("#glossaryClose")) $("#glossaryClose").title = t("close");
  }

  function openGlossary(key, trigger) {
    const entry = glossaryEntry(key);
    if (!entry) return;
    const popover = $("#glossaryPopover");
    $("#glossaryTitle").textContent = entry.title;
    $("#glossaryBody").innerHTML = entry.body.join("");
    popover.hidden = false;
    state.glossaryReturnFocus = trigger || null;
    window.requestAnimationFrame(() => positionGlossary(trigger));
  }

  function closeGlossary({ restoreFocus = false } = {}) {
    const popover = $("#glossaryPopover");
    if (!popover || popover.hidden) return;
    popover.hidden = true;
    popover.removeAttribute("style");
    if (restoreFocus && state.glossaryReturnFocus) state.glossaryReturnFocus.focus();
    state.glossaryReturnFocus = null;
  }

  function positionGlossary(trigger) {
    const popover = $("#glossaryPopover");
    if (!popover || popover.hidden || !trigger) return;
    popover.removeAttribute("style");
    if (window.matchMedia("(max-width: 680px)").matches) return;
    const margin = 14;
    const triggerBox = trigger.getBoundingClientRect();
    const popoverBox = popover.getBoundingClientRect();
    const left = Math.min(
      Math.max(margin, triggerBox.left),
      Math.max(margin, window.innerWidth - popoverBox.width - margin)
    );
    const below = triggerBox.bottom + 8;
    const above = triggerBox.top - popoverBox.height - 8;
    const top = below + popoverBox.height + margin <= window.innerHeight
      ? below
      : Math.max(margin, above);
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  function countryName(country, lang = state.lang) {
    return lang === "es" ? COUNTRY_ES[country] || country : country;
  }

  function cityName(city, lang = state.lang) {
    if (city.names?.[lang]) return city.names[lang];
    return lang === "es" ? CITY_ES[city.city] || city.city : city.city;
  }

  function formatCity(city, lang = state.lang) {
    const name = cityName(city, lang);
    const country = city.countryNames?.[lang] || countryName(city.country, lang);
    const admin = city.admin1Names?.[lang] || city.admin1 || "";
    const parts = [name];
    if (admin && normalizeText(admin) !== normalizeText(name) && normalizeText(admin) !== normalizeText(country)) {
      parts.push(admin);
    }
    if (country) parts.push(country);
    return parts.join(", ");
  }

  function cityKey(city) {
    if (!city) return "";
    return city.id ? `${city.source || "place"}:${city.id}` : `${city.city}|${city.country}|${city.tz}`;
  }

  function citySearchValues(city) {
    return [
      cityName(city, "en"),
      cityName(city, "es"),
      formatCity(city, "en"),
      formatCity(city, "es"),
      city.admin1,
      city.country,
      city.countryCode,
      ...(city.names ? Object.values(city.names) : []),
      ...(city.countryNames ? Object.values(city.countryNames) : []),
      ...(city.admin1Names ? Object.values(city.admin1Names) : []),
    ].filter(Boolean);
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

  function formatDecimal(value, digits = 1) {
    const text = Number(value).toFixed(digits);
    return state.lang === "es" ? text.replace(".", ",") : text;
  }

  function formatAngle(value) {
    const totalMinutes = Math.round(Math.abs(value) * 60);
    const degrees = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${degrees}°${String(minutes).padStart(2, "0")}′`;
  }

  function metric(label, value, valueClass = "", labelGlossary = "", valueGlossary = "") {
    const classAttr = valueClass ? ` class="${valueClass}"` : "";
    const labelHtml = labelGlossary ? glossaryTerm(label, labelGlossary) : escapeHtml(label);
    const valueHtml = valueGlossary ? glossaryTerm(value, valueGlossary, valueClass) : escapeHtml(value);
    return `<div class="metric"><b>${labelHtml}</b><span${classAttr}>${valueHtml}</span></div>`;
  }

  function badges(items) {
    if (!items.length) return "";
    return `<div class="badge-row">${items.map((item) => `<span class="badge">${glossaryMaybe(capitalizeText(item), glossaryKeyForText(item), "capitalize-first")}</span>`).join("")}</div>`;
  }

  function makeTable(headers, rows) {
    return `
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map((head) => `<th>${head}</th>`).join("")}</tr></thead>
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
    const pool = [state.selectedCity, ...state.placeSuggestions, ...CITY_DB].filter(Boolean);
    return pool.find((item) => {
      const matches = citySearchValues(item).map(normalizeText);
      return matches.includes(normalized);
    });
  }

  function localCitySuggestions(query, limit = PLACE_RESULT_LIMIT) {
    const normalized = normalizeText(query);
    if (normalized.length < 2) return [];
    return CITY_DB.filter((item) => citySearchValues(item).some((value) => normalizeText(value).includes(normalized))).slice(0, limit);
  }

  function normalizeRemoteCity(item) {
    return {
      id: item.id ? String(item.id) : `${item.name}|${item.latitude}|${item.longitude}`,
      source: "open-meteo",
      city: item.name || "",
      country: item.country || item.country_code || "",
      countryCode: item.country_code || "",
      admin1: item.admin1 || "",
      lat: Number(item.latitude),
      lon: Number(item.longitude),
      tz: item.timezone || "",
      population: item.population || 0,
      names: { [state.lang]: item.name || "" },
      countryNames: { [state.lang]: item.country || "" },
      admin1Names: { [state.lang]: item.admin1 || "" },
    };
  }

  function setPlaceExpanded(expanded) {
    $("#birthPlace").setAttribute("aria-expanded", String(expanded));
    $("#placeSuggestions").hidden = !expanded;
    if (!expanded) {
      $("#birthPlace").removeAttribute("aria-activedescendant");
      state.activePlaceIndex = -1;
    }
  }

  function updateClearPlaceButton() {
    $("#clearPlace").hidden = !$("#birthPlace").value.trim();
  }

  function hidePlaceSuggestions() {
    $("#placeSuggestions").innerHTML = "";
    state.placeSuggestions = [];
    setPlaceExpanded(false);
  }

  function renderPlaceSuggestions(items, message = "") {
    const panel = $("#placeSuggestions");
    state.placeSuggestions = items;
    state.activePlaceIndex = -1;
    $("#birthPlace").removeAttribute("aria-activedescendant");

    if (!items.length && !message) {
      hidePlaceSuggestions();
      return;
    }

    const rows = items.map((item, index) => {
      const admin = item.admin1Names?.[state.lang] || item.admin1 || "";
      const country = item.countryNames?.[state.lang] || countryName(item.country);
      const meta = [admin, country, item.tz].filter(Boolean).join(" · ");
      return `
        <button class="place-suggestion" id="place-option-${index}" type="button" role="option" aria-selected="false" data-place-index="${index}">
          <strong>${escapeHtml(formatCity(item))}</strong>
          <span>${escapeHtml(meta || `${round(item.lat, 4)}, ${round(item.lon, 4)}`)}</span>
        </button>
      `;
    });
    panel.innerHTML = `${message ? `<p class="place-message">${escapeHtml(message)}</p>` : ""}${rows.join("")}`;
    setPlaceExpanded(true);
  }

  async function fetchPlaceSuggestions(query) {
    state.placeSearchController?.abort();
    const controller = new AbortController();
    state.placeSearchController = controller;
    renderPlaceSuggestions([], t("placeSearchLoading"));

    const url = new URL(GEOCODING_ENDPOINT);
    url.searchParams.set("name", query);
    url.searchParams.set("count", String(PLACE_RESULT_LIMIT));
    url.searchParams.set("language", state.lang);
    url.searchParams.set("format", "json");

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const remote = (data.results || [])
        .map(normalizeRemoteCity)
        .filter((item) => item.city && Number.isFinite(item.lat) && Number.isFinite(item.lon));
      const local = localCitySuggestions(query, 3);
      const seen = new Set();
      const combined = [...remote, ...local].filter((item) => {
        const key = cityKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, PLACE_RESULT_LIMIT);
      renderPlaceSuggestions(combined, combined.length ? "" : t("placeSearchEmpty"));
    } catch (error) {
      if (error.name === "AbortError") return;
      const local = localCitySuggestions(query);
      renderPlaceSuggestions(local, local.length ? t("placeSearchError") : t("placeSearchEmpty"));
    } finally {
      if (state.placeSearchController === controller) state.placeSearchController = null;
    }
  }

  function queuePlaceSearch() {
    const query = $("#birthPlace").value.trim();
    updateClearPlaceButton();
    window.clearTimeout(state.placeSearchTimer);
    state.placeSearchController?.abort();

    if (query.length < 2) {
      renderPlaceSuggestions([], query ? t("placeSearchShort") : "");
      return;
    }

    state.placeSearchTimer = window.setTimeout(() => fetchPlaceSuggestions(query), PLACE_SEARCH_DELAY);
  }

  function updateActivePlace() {
    $$(".place-suggestion").forEach((button, index) => {
      const active = index === state.activePlaceIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      if (active) {
        $("#birthPlace").setAttribute("aria-activedescendant", button.id);
        button.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function moveActivePlace(delta) {
    if (!state.placeSuggestions.length) return;
    state.activePlaceIndex = (state.activePlaceIndex + delta + state.placeSuggestions.length) % state.placeSuggestions.length;
    updateActivePlace();
  }

  function updateOffsetForCity(city) {
    if (!city?.tz) return;
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

  function applyCityToFields(city, force = true) {
    state.selectedCity = city;
    state.activeCityKey = cityKey(city);
    $("#birthPlace").value = formatCity(city);
    if (force || !$("#latitude").value) $("#latitude").value = round(city.lat, 4);
    if (force || !$("#longitude").value) $("#longitude").value = round(city.lon, 4);
    if (city.tz && (force || !$("#timeZone").value)) $("#timeZone").value = city.tz;
    updateClearPlaceButton();
    updateOffsetForCity(city);
  }

  function selectPlaceSuggestion(index) {
    const city = state.placeSuggestions[index];
    if (!city) return;
    clearHistoricalSelection();
    applyCityToFields(city, true);
    hidePlaceSuggestions();
    $("#birthPlace").blur();
  }

  function clearHistoricalSelection() {
    state.selectedPersonName = "";
    state.selectedZoneSource = "";
  }

  function localizedValue(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[state.lang] || value.es || value.en || "";
  }

  function historicalDataSourceText(person) {
    return localizedValue(person.dataSource) || t("dataSourceGeneral");
  }

  function historicalQualityRows(person) {
    const roddenText = person.roddenRating || t("dataRoddenPending");
    const timeText = localizedValue(person.timeSource) || t("dataTimeSourcePrepared");
    const rows = [
      `<dt>${escapeHtml(t("dataSource"))}</dt>`,
      `<dd>${escapeHtml(historicalDataSourceText(person))}</dd>`,
      `<dt>${escapeHtml(t("dataRodden"))}</dt>`,
      `<dd>${escapeHtml(roddenText)}</dd>`,
      `<dt>${escapeHtml(t("dataTimeSource"))}</dt>`,
      `<dd>${escapeHtml(timeText)}</dd>`,
    ];
    return rows.join("");
  }

  function renderHistoricalPeople() {
    const people = [...HISTORICAL_PEOPLE].sort((a, b) => a.name.localeCompare(b.name, state.lang === "es" ? "es" : "en"));
    $("#peopleGrid").innerHTML = people.map((person) => `
      <article class="person-card">
        <img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.imageAlt[state.lang] || person.imageAlt.es)}" loading="lazy">
        <div>
          <h3>
            <span>${escapeHtml(person.name)}</span>
            <a class="person-wiki" href="${escapeHtml(personWikipediaUrl(person))}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(`${t("openWikipedia")}: ${person.name}`)}" title="${escapeHtml(t("openWikipedia"))}">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M14 5h5v5"></path>
                <path d="M13 11l6-6"></path>
                <path d="M10 7H6.75A1.75 1.75 0 0 0 5 8.75v8.5C5 18.22 5.78 19 6.75 19h8.5c.97 0 1.75-.78 1.75-1.75V14"></path>
              </svg>
            </a>
          </h3>
          <dl>
            <dt>${escapeHtml(t("dataDate"))}</dt>
            <dd>${escapeHtml(person.birthLabel[state.lang] || person.birthLabel.es)}</dd>
            <dt>${escapeHtml(t("dataPlace"))}</dt>
            <dd>${escapeHtml(formatCity(person.place))}</dd>
            <dt>${escapeHtml(t("dataSex"))}</dt>
            <dd>${escapeHtml(t(person.sex))}</dd>
            ${historicalQualityRows(person)}
          </dl>
          <button type="button" data-person-id="${escapeHtml(person.id)}">${escapeHtml(t("useExample"))}</button>
        </div>
      </article>
    `).join("");
  }

  function openPeopleModal() {
    state.modalReturnFocus = document.activeElement;
    renderHistoricalPeople();
    $("#peopleModal").hidden = false;
    document.body.classList.add("modal-open");
    $("#peopleClose").focus();
  }

  function closePeopleModal() {
    $("#peopleModal").hidden = true;
    document.body.classList.remove("modal-open");
    state.modalReturnFocus?.focus?.();
  }

  function loadHistoricalPerson(id) {
    const person = HISTORICAL_PEOPLE.find((item) => item.id === id);
    if (!person) return;
    state.selectedCity = person.place;
    state.selectedPersonName = person.name;
    state.selectedZoneSource = t("historicalOffsetSource");
    state.activeCityKey = cityKey(person.place);
    $("#birthDate").value = person.date;
    $("#birthTime").value = person.time;
    $("#gender").value = person.sex;
    $("#calendar").value = person.calendar || "gregorian";
    $("#birthPlace").value = formatCity(person.place);
    $("#latitude").value = round(person.place.lat, 4);
    $("#longitude").value = round(person.place.lon, 4);
    $("#timeZone").value = person.place.tz || "";
    $("#manualOffset").value = person.manualOffset;
    updateClearPlaceButton();
    hidePlaceSuggestions();
    closePeopleModal();
    calculateCurrentChart();
  }

  function formatDateLabel(value) {
    const date = parseDate(value);
    if (!date) return value || "—";
    return new Intl.DateTimeFormat(state.lang === "es" ? "es-ES" : "en", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(date.y, date.m - 1, date.d)));
  }

  function chartMetaText(input) {
    const place = input.place || `${round(input.latitude)}, ${round(input.longitude)}`;
    return t("chartMeta", {
      date: formatDateLabel(input.date),
      time: input.time || "—",
      place,
      sex: input.gender ? t(input.gender) : t("notUsed"),
    });
  }

  function formatUtcDateTime(jd) {
    return new Intl.DateTimeFormat(state.lang === "es" ? "es-ES" : "en", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(astronomyTimeFromJd(jd));
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
    const manualZoneLabel = `UTC${formatOffset(manualOffset)} · ${input.zoneSource || t("manualOffsetSource")}`;

    if (input.calendar === "julian") {
      const day = date.d + (time.h + time.min / 60 - manualOffset / 60) / 24;
      return {
        jd: calendarToJd(date.y, date.m, day, "julian"),
        offset: manualOffset,
        zoneLabel: manualZoneLabel,
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
      zoneLabel: manualZoneLabel,
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

  function astronomyBodyName(key) {
    return {
      mercury: "Mercury",
      venus: "Venus",
      mars: "Mars",
      jupiter: "Jupiter",
      saturn: "Saturn",
      uranus: "Uranus",
      neptune: "Neptune",
      pluto: "Pluto",
    }[key];
  }

  function astronomyTimeFromJd(jd) {
    return new Date((jd - 2440587.5) * DAY_MS);
  }

  function astronomyTropicalPositions(jd, includeModern) {
    const engine = typeof Astronomy !== "undefined" ? Astronomy : null;
    if (!engine) return null;
    const time = engine.MakeTime(astronomyTimeFromJd(jd));
    const result = {
      sun: { lon: norm360(engine.SunPosition(time).elon), lat: 0 },
      moon: (() => {
        const moon = engine.EclipticGeoMoon(time);
        return { lon: norm360(moon.lon), lat: moon.lat };
      })(),
    };
    const keys = ["mercury", "venus", "mars", "jupiter", "saturn"];
    if (includeModern) keys.push(...MODERN_KEYS);
    keys.forEach((key) => {
      const bodyName = astronomyBodyName(key);
      const body = engine.Body?.[bodyName];
      if (!body) return;
      const ecliptic = engine.Ecliptic(engine.GeoVector(body, time, true));
      result[key] = {
        lon: norm360(ecliptic.elon),
        lat: ecliptic.elat,
      };
    });
    return result;
  }

  function approximateTropicalPositions(jd, includeModern) {
    const d = jd - 2451543.5;
    const sunVector = heliocentricCoords("earth", d);
    const result = {
      sun: { lon: sunLongitude(jd), lat: 0 },
      moon: moonPosition(jd),
    };

    const keys = ["mercury", "venus", "mars", "jupiter", "saturn"];
    if (includeModern) keys.push(...MODERN_KEYS);
    keys.forEach((key) => {
      const planet = heliocentricCoords(key, d);
      const x = planet.x + sunVector.x;
      const y = planet.y + sunVector.y;
      const z = planet.z + sunVector.z;
      result[key] = {
        lon: norm360(atan2D(y, x)),
        lat: atan2D(z, Math.sqrt(x * x + y * y)),
      };
    });
    return result;
  }

  function tropicalPositions(jd, includeModern) {
    try {
      const astronomy = astronomyTropicalPositions(jd, includeModern);
      if (astronomy) {
        state.ephemerisEngine = "astronomy";
        return astronomy;
      }
    } catch (error) {
      // Fall through to the compact fallback below.
    }
    state.ephemerisEngine = "fallback";
    return approximateTropicalPositions(jd, includeModern);
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
    const descTropical = norm360(atan2D(-cosD(lst), sinD(lst) * cosD(eps) + tanD(lat) * sinD(eps)));
    const ascTropical = norm360(descTropical + 180);
    return {
      lst,
      eps,
      ascRaw: ascTropical,
      mcRaw: mcTropical,
      asc: applyZodiac(ascTropical, jd, zodiac),
      mc: applyZodiac(mcTropical, jd, zodiac),
      desc: applyZodiac(descTropical, jd, zodiac),
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

  const LUNAR_ASPECTS = [
    ["conjunction", 0],
    ["sextile", 60],
    ["square", 90],
    ["trine", 120],
    ["opposition", 180],
  ];

  function lunarAspectCandidates(moon, planet, direction = 1, maxMoonTravel = 30) {
    const initialDelta = norm360(planet.lon - moon.lon);
    const relativeSpeed = planet.speed - moon.speed;
    if (Math.abs(relativeSpeed) < 0.0001 || Math.abs(moon.speed) < 0.0001) return [];
    const candidates = [];
    LUNAR_ASPECTS.forEach(([type, exact]) => {
      const targets = exact === 0 || exact === 180 ? [exact] : [exact, 360 - exact];
      targets.forEach((target) => {
        for (let cycle = -1; cycle <= 1; cycle += 1) {
          const numerator = target - initialDelta + 360 * cycle;
          const days = numerator / relativeSpeed;
          if (direction > 0 ? days <= 0.000001 : days >= -0.000001) continue;
          const moonTravel = Math.abs(moon.speed * days);
          if (moonTravel <= maxMoonTravel + 0.0001) {
            candidates.push({ type, days, moonTravel });
          }
        }
      });
    });
    return candidates;
  }

  function lunarContactLabel(contact, motionKey = "") {
    if (!contact) return "";
    const parts = [
      `${PLANETS[contact.planet].symbol} ${planetName(contact.planet)}`,
      t(contact.type),
    ];
    if (motionKey) parts.push(t(motionKey));
    if (Number.isFinite(contact.moonTravel)) parts.push(formatAngle(contact.moonTravel));
    return parts.join(" · ");
  }

  function superiorPlanet(aKey, bKey, aLon, bLon) {
    const distance = (signOf(bLon) - signOf(aLon) + 12) % 12;
    if ([2, 3, 4].includes(distance)) return aKey;
    if ([8, 9, 10].includes(distance)) return bKey;
    return "";
  }

  function overcomingLabel(aKey, bKey, aLon, bLon) {
    const superior = superiorPlanet(aKey, bKey, aLon, bLon);
    if (superior) return t("overcoming", { planet: planetName(superior) });
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
    const moon = chart.positions.moon;
    const moonSignRemaining = 30 - degreeInSign(moon.lon);
    const contacts = [];
    let lastSeparation = null;
    let nextApplication = null;
    let nextApplicationBySign = null;
    let hasApplyingWithinOrb = false;
    VISIBLE_KEYS.filter((key) => key !== "moon" && key !== "sun").forEach((key) => {
      const planet = chart.positions[key];
      const nextCandidates = lunarAspectCandidates(moon, planet, 1, 30)
        .map((candidate) => ({ ...candidate, planet: key }));
      const previousCandidates = lunarAspectCandidates(moon, planet, -1, 30)
        .map((candidate) => ({ ...candidate, planet: key }));
      nextCandidates.forEach((candidate) => {
        if (!nextApplication || candidate.days < nextApplication.days) nextApplication = candidate;
        if (candidate.moonTravel <= moonSignRemaining + 0.0001
          && (!nextApplicationBySign || candidate.days < nextApplicationBySign.days)) {
          nextApplicationBySign = candidate;
        }
      });
      previousCandidates.forEach((candidate) => {
        if (!lastSeparation || candidate.days > lastSeparation.days) lastSeparation = candidate;
      });

      const near = degreeAspect(moon.lon, planet.lon, 12);
      if (near) {
        const nextMoon = norm360(moon.lon + moon.speed);
        const nextPlanet = norm360(planet.lon + planet.speed);
        const exact = { copresence: 0, sextile: 60, square: 90, trine: 120, opposition: 180 }[near.type];
        const nowDelta = Math.abs(angleDistance(moon.lon, planet.lon) - exact);
        const nextDelta = Math.abs(angleDistance(nextMoon, nextPlanet) - exact);
        const motion = nextDelta < nowDelta ? "applying" : "separating";
        if (motion === "applying") hasApplyingWithinOrb = true;
        contacts.push({
          planet: key,
          type: near.type === "copresence" ? "conjunction" : near.type,
          motion,
          delta: near.delta,
        });
      }
    });
    return {
      phase: lunarPhaseName(elongation),
      elongation,
      contacts,
      lastSeparation,
      nextApplication,
      nextApplicationBySign,
      voidOfCourse: !nextApplication,
      voidOfCourseBySign: !nextApplicationBySign,
      moonSignRemaining,
      hasApplyingWithinOrb,
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
      personName: state.selectedPersonName,
      gender: $("#gender").value,
      city,
      latitude,
      longitude,
      timeZone,
      manualOffset: $("#manualOffset").value.trim(),
      zoneSource: state.selectedZoneSource,
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
        ? "Las latitudes extremas vuelven muy sensibles los ángulos al horizonte. Revisa cartas críticas con especial cuidado."
        : "Extreme latitudes make horizon angles highly sensitive. Review critical charts with special care.";
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
      ephemerisEngine: state.ephemerisEngine,
      positions,
      planetKeys,
      angles,
      ascSign,
      isDay,
      sunAltitude: sunAlt,
      sectLight: isDay ? "sun" : "moon",
      beneficOfSect: isDay ? "jupiter" : "venus",
      maleficOfSect: isDay ? "saturn" : "mars",
      maleficContrarySect: isDay ? "mars" : "saturn",
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
    $("#chartTitle").textContent = chart.input.personName
      ? t("chartForPerson", { name: chart.input.personName })
      : t("anonymousChart");
    $("#chartMeta").textContent = chartMetaText(chart.input);
    $("#chartWheel").innerHTML = renderWheel(chart);
    renderCoreSummary(chart);
    renderAscLord(chart);
    renderMoon(chart);
    renderTechnicalPanel(chart);
    renderInterpretation(chart);
    renderPlanetTable(chart);
    renderHouseTable(chart);
    renderLotTable(chart);
    renderAspectTable(chart);
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function calculateCurrentChart() {
    $("#formStatus").textContent = "";
    updatePlaceFields();
    hidePlaceSuggestions();
    const chart = computeChart(readInput());
    renderChart(chart);
  }

  function renderCoreSummary(chart) {
    const mcNote = state.lang === "es"
      ? `<strong>Nota sobre ${glossaryTerm(t("mc"), "mc")}/${glossaryTerm(t("ic"), "ic")}:</strong> en ${glossaryTerm("casas de signos enteros", "wholeSign")}, las casas se cuentan desde el signo Ascendente. El ${glossaryTerm(t("mc"), "mc")} y el ${glossaryTerm(t("ic"), "ic")} no abren las casas 10 y 4: son puntos astronómicos sensibles. Por eso Tyche muestra también en qué casa caen.`
      : `<strong>Note on ${glossaryTerm(t("mc"), "mc")}/${glossaryTerm(t("ic"), "ic")}:</strong> in ${glossaryTerm("Whole Sign Houses", "wholeSign")}, houses are counted from the Ascendant sign. The ${glossaryTerm(t("mc"), "mc")} and ${glossaryTerm(t("ic"), "ic")} do not open houses 10 and 4: they are sensitive astronomical points. This is why Tyche also shows which house they fall in.`;
    const precisionNote = state.lang === "es"
      ? `${glossaryTerm("Cálculo astronómico", "ephemeris")} local: Astronomy Engine. Precisión aproximada ±1′. Para rectificaciones, cartas críticas o investigación profesional, conviene contrastar con efemérides especializadas.`
      : `Local ${glossaryTerm("astronomical calculation", "ephemeris")}: Astronomy Engine. Approximate accuracy ±1′. For rectification, critical charts, or professional research, compare with specialized ephemerides.`;
    const limits = [t("limitsEducational"), t("limitsPrecision"), t("limitsPrivacy")];
    const html = `
      <h3>${glossaryTerm(t("sect"), "sect")}</h3>
      <div class="metric-grid">
        ${metric(t("chartType"), chart.isDay ? t("dayChart") : t("nightChart"), "", "sect")}
        ${metric(t("sectLight"), `${PLANETS[chart.sectLight].symbol} ${planetName(chart.sectLight)}`, "", "sectLight")}
        ${metric(t("beneficSect"), `${PLANETS[chart.beneficOfSect].symbol} ${planetName(chart.beneficOfSect)}`, "", "beneficSect")}
        ${metric(t("maleficSect"), `${PLANETS[chart.maleficOfSect].symbol} ${planetName(chart.maleficOfSect)}`, "", "maleficSect")}
        ${metric(t("maleficContrarySect"), `${PLANETS[chart.maleficContrarySect].symbol} ${planetName(chart.maleficContrarySect)}`, "", "maleficContrarySect")}
        ${metric(t("ascendant"), formatDegree(chart.angles.asc), "", "ascendant")}
        ${metric(t("descendant"), formatDegree(chart.angles.desc), "", "descendant")}
        ${metric(t("mc"), `${formatDegree(chart.angles.mc)} · ${t("tableHouse")} ${chart.mcHouse}`, "", "mc")}
        ${metric(t("ic"), `${formatDegree(chart.angles.ic)} · ${t("tableHouse")} ${chart.icHouse}`, "", "ic")}
        ${metric(t("timezoneUsed"), chart.zoneLabel, "", "timezoneUsed")}
      </div>
      <p class="text-note">${mcNote}</p>
      <p class="text-note">${precisionNote}</p>
      <section class="limits-panel" aria-label="${escapeHtml(t("limitsTitle"))}">
        <h4>${escapeHtml(t("limitsTitle"))}</h4>
        <ul>
          ${limits.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `;
    $("#coreSummary").innerHTML = html;
  }

  function renderAscLord(chart) {
    const ascSign = SIGNS[chart.ascSign];
    const lord = ascSign.ruler;
    const p = chart.positions[lord];
    const groups = dignityGroups(p.dignities);
    $("#ascLordPanel").innerHTML = `
      <h3>${glossaryTerm(t("ascLordTitle"), "ascLord")}</h3>
      <p class="text-note">${escapeHtml(t("ascLordText", {
        lord: `${PLANETS[lord].symbol} ${planetName(lord)}`,
        ascSign: `${ascSign.symbol} ${ascSign[state.lang]}`,
        lordPosition: formatDegree(p.lon),
        house: p.house,
        topics: houseTopics(p.house),
        angularity: t(p.angularity),
      }))}</p>
      <div class="condition-list">
        <p><strong>${glossaryTerm(t("dignityMajor"), "essentialCondition")}:</strong> ${dignityGroupText(groups.major, chart)}.</p>
        <p><strong>${glossaryTerm(t("dignityMinor"), "essentialCondition")}:</strong> ${dignityGroupText(groups.minor, chart)}.</p>
        <p><strong>${glossaryTerm(t("weaknesses"), "essentialCondition")}:</strong> ${dignityGroupText(groups.weakness, chart)}.</p>
      </div>
    `;
  }

  function renderMoon(chart) {
    const phaseDistance = chart.moon.elongation > 180 ? 360 - chart.moon.elongation : chart.moon.elongation;
    const phaseContext = t(chart.moon.elongation > 180 ? "moonBeforeNew" : "moonAfterNew", {
      degrees: `${formatDecimal(phaseDistance, 1)}°`,
    });
    const lastSeparation = lunarContactLabel(chart.moon.lastSeparation, "separating") || t("moonNoSeparation");
    const nextApplication = lunarContactLabel(chart.moon.nextApplication, "applying") || t("moonNoApplication");
    $("#moonPanel").innerHTML = `
      <h3>${glossaryTerm(t("moonTitle"), "lunarCondition")}</h3>
      <div class="metric-grid">
        ${metric(t("moonPhase"), `${chart.moon.phase} · ${phaseContext}`, "capitalize-first", "moonPhase", "moonPhase")}
        ${metric(t("moonElongation"), `${formatDecimal(chart.moon.elongation, 1)}°`, "", "moonPhase")}
        ${metric(t("moonLastSeparation"), lastSeparation, "", "applications")}
        ${metric(t("moonNextApplication"), nextApplication, "", "applications")}
        ${metric(t("moonVoc30"), chart.moon.voidOfCourse ? t("yesVoc") : t("notVoc"), "", "moonVoc")}
        ${metric(t("moonVocSign"), chart.moon.voidOfCourseBySign ? t("yesVocSign") : t("notVocSign"), "", "moonVoc")}
        ${metric(t("moonNoApplyingWithinOrb"), chart.moon.hasApplyingWithinOrb ? t("no") : t("yes"), "", "moonVoc")}
      </div>
    `;
  }

  function renderTechnicalPanel(chart) {
    const engine = chart.ephemerisEngine === "astronomy" ? t("astronomyEngine") : t("fallbackEngine");
    $("#technicalPanel").innerHTML = `
      <details>
        <summary>${escapeHtml(t("technicalTitle"))}</summary>
        <div class="technical-grid">
          ${metric(t("localDateTime"), `${formatDateLabel(chart.input.date)} · ${chart.input.time || "—"}`)}
          ${metric(t("utcDateTime"), formatUtcDateTime(chart.jd))}
          ${metric(t("timezoneUsed"), chart.zoneLabel, "", "timezoneUsed")}
          ${metric(t("coordinates"), `${formatDecimal(chart.input.latitude, 4)}, ${formatDecimal(chart.input.longitude, 4)}`)}
          ${metric(t("calendar"), t(chart.input.calendar))}
          ${metric(t("zodiac"), t(chart.input.zodiac), "", "zodiac")}
          ${metric(t("houses"), t("wholeSign"), "", "wholeSign")}
          ${metric(t("ephemerisEngine"), engine, "", "ephemeris")}
        </div>
      </details>
    `;
  }

  function planetLabel(key) {
    return `${PLANETS[key]?.symbol || ""} ${planetName(key)}`.trim();
  }

  function signLabel(index) {
    const sign = SIGNS[((index % 12) + 12) % 12];
    return `${sign.symbol} ${sign[state.lang]}`;
  }

  function naturalList(items) {
    const list = items.filter(Boolean);
    if (!list.length) return capitalizeText(t("none"));
    if (list.length === 1) return list[0];
    const last = list[list.length - 1];
    const rest = list.slice(0, -1).join(", ");
    return state.lang === "es" ? `${rest} y ${last}` : `${rest} and ${last}`;
  }

  function plainDignityText(items, chart = null) {
    const groups = dignityGroups(items || []);
    const parts = [];
    const list = (values) => values.map((item) => dignityDisplayLabel(item, chart)).join(", ");
    if (groups.major.length) parts.push(`${t("dignityMajor")}: ${list(groups.major)}`);
    if (groups.minor.length) parts.push(`${t("dignityMinor")}: ${list(groups.minor)}`);
    if (groups.weakness.length) parts.push(`${t("weaknesses")}: ${list(groups.weakness)}`);
    return parts.length ? parts.join("; ") : capitalizeText(t("noMajorDignity"));
  }

  function angularityWeight(angularity) {
    if (angularity === "angular") return t("testimonyStrong");
    if (angularity === "succedent") return t("testimonyMedium");
    return t("testimonyLow");
  }

  function angularityReading(angularity) {
    const texts = {
      es: {
        angular: "con fuerza, visibilidad y capacidad de hacerse notar",
        succedent: "de manera sostenida, con efectos que se acumulan",
        cadent: "de manera más indirecta o menos visible",
      },
      en: {
        angular: "with strength, visibility, and the ability to stand out",
        succedent: "in a sustained way, with effects that accumulate",
        cadent: "in a more indirect or less visible way",
      },
    };
    return texts[state.lang]?.[angularity] || texts.es[angularity] || angularity;
  }

  function plainHouseTopics(house) {
    const topics = {
      es: {
        1: "cuerpo, carácter y dirección personal",
        2: "recursos, dinero y medios de vida",
        3: "aprendizaje, escritura, mensajes, hermanos y entorno cercano",
        4: "raíces, hogar, familia, mundo privado y finales",
        5: "creatividad, hijos, placer, regalos y alegría",
        6: "salud, trabajo duro, obligaciones, servicio y dificultades prácticas",
        7: "pareja, acuerdos, cooperación, rivales y otras personas",
        8: "crisis, pérdidas, deudas, miedo y recursos compartidos",
        9: "viajes, estudios superiores, religión, filosofía y búsqueda de sentido",
        10: "vida pública, oficio, reputación, reconocimiento y visibilidad",
        11: "amistades, alianzas, protectores, esperanzas y apoyo social",
        12: "aislamiento, cargas, pérdidas, encierros y situaciones difíciles de controlar",
      },
      en: {
        1: "body, character, and personal direction",
        2: "resources, money, and livelihood",
        3: "learning, writing, messages, siblings, and the nearby environment",
        4: "roots, home, family, private life, and endings",
        5: "creativity, children, pleasure, gifts, and joy",
        6: "health, hard work, obligations, service, and practical difficulties",
        7: "partners, agreements, cooperation, rivals, and other people",
        8: "crises, losses, debts, fear, and shared resources",
        9: "travel, higher learning, religion, philosophy, and the search for meaning",
        10: "public life, craft, reputation, recognition, and visibility",
        11: "friends, alliances, patrons, hopes, and social support",
        12: "isolation, burdens, losses, confinement, and situations hard to control",
      },
    };
    return topics[state.lang]?.[house] || houseTopics(house);
  }

  function signStyleReading(sign) {
    const style = {
      es: {
        aries: "más directa, rápida e iniciadora",
        taurus: "constante, concreta y orientada a sostener",
        gemini: "curiosa, móvil y comunicativa",
        cancer: "receptiva, corporal y protectora",
        leo: "visible, afirmativa y expresiva",
        virgo: "analítica, práctica y atenta al detalle",
        libra: "relacional, equilibradora y diplomática",
        scorpio: "intensa, reservada y resistente",
        sagittarius: "expansiva, exploradora y orientada al sentido",
        capricorn: "sobria, estratégica y disciplinada",
        aquarius: "intelectual, firme y orientada a estructuras compartidas",
        pisces: "imaginativa, sensible y permeable",
      },
      en: {
        aries: "more direct, fast, and initiating",
        taurus: "steady, concrete, and oriented toward sustaining",
        gemini: "curious, mobile, and communicative",
        cancer: "receptive, bodily, and protective",
        leo: "visible, affirmative, and expressive",
        virgo: "analytical, practical, and attentive to detail",
        libra: "relational, balancing, and diplomatic",
        scorpio: "intense, reserved, and resilient",
        sagittarius: "expansive, exploratory, and meaning-oriented",
        capricorn: "sober, strategic, and disciplined",
        aquarius: "intellectual, firm, and oriented toward shared structures",
        pisces: "imaginative, sensitive, and permeable",
      },
    };
    const styleText = style[state.lang]?.[sign.key] || sign[state.lang];
    return state.lang === "es"
      ? `${sign[state.lang]} da a este planeta una manera de actuar ${styleText}.`
      : `${sign[state.lang]} gives this planet a ${styleText} way of acting.`;
  }

  function planetPlainMeaning(key) {
    const meanings = {
      es: {
        sun: "identidad, autoridad, visibilidad y coherencia personal",
        moon: "cuerpo, ritmo, cambio, necesidades y vida cotidiana",
        mercury: "pensamiento, lenguaje, cálculo, escritura e intercambio",
        venus: "vínculo, placer, arte, deseo y conciliación",
        mars: "acción, conflicto, corte, impulso y defensa",
        jupiter: "crecimiento, protección, sentido, confianza y maestros",
        saturn: "límites, tiempo, carga, estructura, soledad y disciplina",
      },
      en: {
        sun: "identity, authority, visibility, and personal coherence",
        moon: "body, rhythm, change, needs, and daily life",
        mercury: "thinking, language, calculation, writing, and exchange",
        venus: "bonding, pleasure, art, desire, and reconciliation",
        mars: "action, conflict, impulse, defense, and decisive cuts",
        jupiter: "growth, protection, meaning, trust, and teachers",
        saturn: "limits, time, burden, structure, solitude, and discipline",
      },
    };
    return meanings[state.lang]?.[key] || planetName(key);
  }

  function essentialConditionReading(position, chart = null) {
    const groups = dignityGroups(position.dignities || []);
    const major = groups.major.map((item) => dignityDisplayLabel(item, chart));
    const minor = groups.minor.map((item) => dignityDisplayLabel(item, chart));
    const weakness = groups.weakness.map((item) => dignityDisplayLabel(item, chart));
    if (state.lang === "es") {
      if (major.length && weakness.length) {
        return `Tiene recursos propios (${major.join(", ")}), pero también una dificultad de fondo (${weakness.join(", ")}).`;
      }
      if (major.length) return `Tiene recursos propios (${major.join(", ")}), así que puede actuar con más coherencia.`;
      if (weakness.length) {
        const minorText = minor.length ? `, aunque recibe apoyo menor por ${minor.join(", ")}` : "";
        return `Trabaja con una dificultad de fondo (${weakness.join(", ")})${minorText}; no significa fracaso, sino más necesidad de ajuste.`;
      }
      return `No tiene una dignidad mayor clara; su importancia viene sobre todo de su lugar en la carta y de sus conexiones.`;
    }
    if (major.length && weakness.length) {
      return `It has resources of its own (${major.join(", ")}), but also a background difficulty (${weakness.join(", ")}).`;
    }
    if (major.length) return `It has resources of its own (${major.join(", ")}), so it can act with more coherence.`;
    if (weakness.length) {
      const minorText = minor.length ? `, though it receives minor support through ${minor.join(", ")}` : "";
      return `It works with a background difficulty (${weakness.join(", ")})${minorText}; this does not mean failure, but more need for adjustment.`;
    }
    return `It has no clear major dignity; its importance comes mostly from its place in the chart and from its connections.`;
  }

  function focusLabel(focus) {
    return state.lang === "es"
      ? `Casa ${focus.house}: ${plainHouseTopics(focus.house)}`
      : `House ${focus.house}: ${plainHouseTopics(focus.house)}`;
  }

  function focusTextList(focuses) {
    return focuses.map(focusLabel).join("; ");
  }

  function focusReasonsText(focus) {
    return [...new Set(focus.reasons)].join(", ");
  }

  function isConnectedWithFocus(position, focuses, ascLordPosition) {
    if (!position) return false;
    const mainHouses = focuses.map((focus) => focus.house);
    if (mainHouses.includes(position.house)) return true;
    if (position.angularity === "angular") return true;
    if (ascLordPosition && position.house === ascLordPosition.house) return true;
    if (ascLordPosition && signAspectType(signOf(position.lon), signOf(ascLordPosition.lon))) return true;
    return false;
  }

  function connectionReading(position, focuses, ascLordPosition, role) {
    const connected = isConnectedWithFocus(position, focuses, ascLordPosition);
    if (state.lang === "es") {
      if (role === "support") {
        return connected
          ? "Además se conecta con uno de los focos principales, así que su ayuda no queda como promesa secundaria."
          : "No parece ser el eje de la carta; conviene leerlo como recurso secundario, aunque real.";
      }
      return connected
        ? "Como toca uno de los focos principales, su exigencia pesa más en la lectura."
        : "Parece una tensión secundaria: conviene tenerla presente, pero no domina la estructura principal.";
    }
    if (role === "support") {
      return connected
        ? "It is also connected with one of the main focuses, so its help is not merely a secondary promise."
        : "It does not seem to be the chart's axis; read it as a secondary but real resource.";
    }
    return connected
      ? "Because it touches one of the main focuses, its demand weighs more heavily in the reading."
      : "It looks like a secondary tension: worth noting, but not dominant in the overall structure.";
  }

  function focusLeadReading(focuses) {
    const dominant = focuses[0];
    const house = dominant?.house || 1;
    const hasPublicFocus = focuses.some((focus) => focus.house === 10);
    if (state.lang === "es") {
      if (house === 4) {
        return `El motor de la carta nace en temas de raíz: ${plainHouseTopics(4)}. ${hasPublicFocus ? "Esto no impide visibilidad pública; más bien muestra desde dónde se alimenta la proyección exterior." : "Esto muestra desde dónde se alimenta la dirección vital."}`;
      }
      if (house === 2) {
        return `La carta pone énfasis en recursos: ${plainHouseTopics(2)}. No habla solo de dinero, sino de herramientas, valor y medios concretos para sostener la vida.`;
      }
      if (house === 6 || house === 8 || house === 12) {
        return `Una parte importante de la carta se concentra en temas exigentes de casa ${house}: ${plainHouseTopics(house)}. Esto no describe un destino cerrado, sino áreas donde la vida pide más elaboración y manejo consciente.`;
      }
      if (house === 7) {
        return `La carta se entiende muy bien desde la relación con otros: ${plainHouseTopics(7)}. No habla solo de pareja, sino también de interlocutores, audiencias, acuerdos y confrontación.`;
      }
      return `Esta carta se entiende sobre todo desde ${plainHouseTopics(house)}. Ese foco aparece reforzado por varias piezas, no por una sola posición.`;
    }
    if (house === 4) {
      return `The chart's engine starts in root matters: ${plainHouseTopics(4)}. ${hasPublicFocus ? "This does not prevent public visibility; it shows where outward projection is fed from." : "This shows where life direction is fed from."}`;
    }
    if (house === 2) {
      return `The chart emphasizes resources: ${plainHouseTopics(2)}. This is not only money, but tools, value, and concrete means for sustaining life.`;
    }
    if (house === 6 || house === 8 || house === 12) {
      return `A major part of the chart gathers around demanding house ${house} themes: ${plainHouseTopics(house)}. This is not a closed fate, but an area that asks for more elaboration and conscious handling.`;
    }
    if (house === 7) {
      return `The chart is strongly understood through relation with others: ${plainHouseTopics(7)}. This is not only partnership, but interlocutors, audiences, agreements, and confrontation.`;
    }
    return `This chart is best understood through ${plainHouseTopics(house)}. That focus is reinforced by several pieces, not by one isolated placement.`;
  }

  function essentialEaseLevel(position, planet = "", chart = null) {
    const strength = dignityStrength(planet, position, chart);
    if (strength.strong && !strength.weak) return "highLevel";
    if (strength.weak && !strength.strong) return "lowLevel";
    return "mediumLevel";
  }

  function triplicityRoleForPlanet(planet, position, chart) {
    if (!planet || !position || !chart) return "";
    const trip = TRIPLICITY[SIGNS[signOf(position.lon)].element];
    const active = chart.isDay ? trip.day : trip.night;
    const contrary = chart.isDay ? trip.night : trip.day;
    if (planet === active) return "active";
    if (planet === trip.coop) return "cooperating";
    if (planet === contrary) return "contrary";
    return "";
  }

  function dignityStrength(planet, position, chart) {
    const groups = dignityGroups(position.dignities || []);
    const role = triplicityRoleForPlanet(planet, position, chart);
    const strong = groups.major.some((item) => ["domicile", "exaltation"].includes(glossaryKeyForText(item))) || role === "active";
    const medium = role === "cooperating" || groups.minor.length > 0;
    return {
      strong,
      medium,
      weak: groups.weakness.length > 0,
      role,
      groups,
    };
  }

  function supportLevel(position, focuses, ascLordPosition, planet = "", chart = null) {
    const strength = dignityStrength(planet, position, chart);
    if (isConnectedWithFocus(position, focuses, ascLordPosition) && strength.strong) return "strongLevel";
    if (isConnectedWithFocus(position, focuses, ascLordPosition)) return "moderateLevel";
    return "secondaryLevel";
  }

  function tensionLevel(position, focuses, ascLordPosition, planet = "", chart = null) {
    const strength = dignityStrength(planet, position, chart);
    if (isConnectedWithFocus(position, focuses, ascLordPosition) && strength.weak) return "highLevel";
    if (isConnectedWithFocus(position, focuses, ascLordPosition)) return "mediumLevel";
    return "lowLevel";
  }

  function prominenceLevel(position) {
    if (position.angularity === "angular") return "highLevel";
    if (position.angularity === "succedent") return "mediumLevel";
    return "lowLevel";
  }

  function maleficMitigationReading(maleficPosition, beneficPosition, chart) {
    const maleficKey = chart.maleficContrarySect;
    const beneficKey = chart.beneficOfSect;
    const maleficStrength = dignityStrength(maleficKey, maleficPosition, chart);
    const beneficStrength = dignityStrength(beneficKey, beneficPosition, chart);
    const beneficAspect = signAspectType(signOf(maleficPosition.lon), signOf(beneficPosition.lon));
    const beneficContact = Boolean(beneficAspect);
    const degree = degreeAspect(maleficPosition.lon, beneficPosition.lon, Math.max(3, chart.input.orb || 3));
    const closeContact = degree && degree.delta <= 3;
    const beneficSolar = solarPhaseState(beneficKey, chart);
    const beneficObscured = ["combust", "underBeams"].includes(beneficSolar.category) && !beneficSolar.chariot;
    const friendlyAspect = ["copresence", "sextile", "trine"].includes(beneficAspect);
    const strongMitigation = beneficContact && !beneficObscured && (closeContact || friendlyAspect) && (beneficStrength.strong || beneficPosition.angularity === "angular");
    const mediumMitigation = (beneficContact && !beneficObscured) || maleficStrength.strong || (maleficStrength.medium && beneficContact);
    const weakMitigation = beneficContact || maleficStrength.medium;
    if (state.lang === "es") {
      if (strongMitigation) {
        return "La mitigación es fuerte: el benéfico de la secta puede intervenir de forma clara, por cercanía, aspecto favorable o fuerza propia.";
      }
      if (mediumMitigation) {
        return "La mitigación es media: hay apoyo real, pero no basta para borrar la presión; la lectura debe mantener ambas señales.";
      }
      if (weakMitigation) {
        return beneficObscured
          ? "La mitigación es débil o dudosa: hay contacto benéfico, pero el benéfico está oculto por el Sol sin protección clara."
          : "La mitigación es débil: aparece algún recurso, pero de forma indirecta o poco dominante.";
      }
      if (maleficStrength.weak) {
        return "Al no verse claramente compensada, esta tensión puede sentirse más cruda o menos integrada.";
      }
      return "No aparece una mitigación fuerte, pero tampoco una debilidad mayor clara; conviene leerla con sus aspectos y casa.";
    }
    if (strongMitigation) {
      return "Mitigation is strong: the benefic of sect can intervene clearly through closeness, a favorable aspect, or its own strength.";
    }
    if (mediumMitigation) {
      return "Mitigation is medium: real support is present, but it does not erase the pressure; keep both testimonies in the reading.";
    }
    if (weakMitigation) {
      return beneficObscured
        ? "Mitigation is weak or uncertain: benefic contact exists, but the benefic is hidden by the Sun without clear protection."
        : "Mitigation is weak: some resource appears, but indirectly or without dominance.";
    }
    if (maleficStrength.weak) {
      return "Without clear compensation, this tension can feel rawer or less integrated.";
    }
    return "No strong mitigation appears, but no clear major weakness appears either; read it through its aspects and house.";
  }

  function sectTriplicityRulers(chart) {
    const lightSign = SIGNS[signOf(chart.positions[chart.sectLight].lon)];
    const trip = TRIPLICITY[lightSign.element];
    return {
      sign: lightSign,
      primary: chart.isDay ? trip.day : trip.night,
      secondary: chart.isDay ? trip.night : trip.day,
      cooperating: trip.coop,
    };
  }

  function hasSolarChariot(planet, position) {
    if (!VISIBLE_KEYS.includes(planet) || planet === "sun" || planet === "moon") return false;
    const signIndex = signOf(position.lon);
    return SIGNS[signIndex].ruler === planet
      || EXALTATIONS[planet] === signIndex
      || boundLordFor(position.lon) === planet;
  }

  function solarPhaseState(planet, chart) {
    if (planet === "sun" || planet === "moon" || !VISIBLE_KEYS.includes(planet)) {
      return { category: "luminary", side: "", distance: null, chariot: false };
    }
    const position = chart.positions[planet];
    const distance = angleDistance(position.lon, chart.positions.sun.lon);
    const fromSun = zodiacalDistance(chart.positions.sun.lon, position.lon);
    const side = fromSun > 180 ? "morning" : "evening";
    let category = "visible";
    if (distance <= 1) category = "cazimi";
    else if (distance <= 8) category = "combust";
    else if (distance <= 15) category = "underBeams";
    return {
      category,
      side,
      distance,
      chariot: ["combust", "underBeams"].includes(category) && hasSolarChariot(planet, position),
    };
  }

  function solarPhasePlainText(planet, chart) {
    const stateInfo = solarPhaseState(planet, chart);
    if (stateInfo.category === "luminary") return "";
    const name = planetLabel(planet);
    const sideText = stateInfo.side === "morning"
      ? (state.lang === "es" ? "matutino/oriental" : "morning/oriental")
      : (state.lang === "es" ? "vespertino/occidental" : "evening/occidental");
    if (state.lang === "es") {
      if (stateInfo.category === "cazimi") {
        return `${name} está en el corazón del Sol: su significación se concentra y queda muy unida a visibilidad, autoridad o foco solar.`;
      }
      if (stateInfo.category === "combust") {
        return `${name} está combusto: actúa con más presión, menor independencia y más ocultación. ${stateInfo.chariot ? "La condición se mitiga porque el planeta conserva recursos propios por signo o término." : "Conviene leer sus temas como menos visibles o más difíciles de expresar directamente."}`;
      }
      if (stateInfo.category === "underBeams") {
        return `${name} está bajo los rayos: sus temas tienden a operar de forma menos visible, más interna o más privada. ${stateInfo.chariot ? "La ocultación queda mitigada por recursos propios del planeta." : "Esto reduce claridad pública, aunque no elimina su importancia."}`;
      }
      return `${name} es ${sideText}: tiende a manifestar sus temas de forma ${stateInfo.side === "morning" ? "más activa, temprana o exteriorizada" : "más receptiva, tardía o mediada por el contexto"}.`;
    }
    if (stateInfo.category === "cazimi") {
      return `${name} is in the heart of the Sun: its signification is concentrated and tightly bound to visibility, authority, or solar focus.`;
    }
    if (stateInfo.category === "combust") {
      return `${name} is combust: it acts under more pressure, with less independence and more concealment. ${stateInfo.chariot ? "This is mitigated because the planet keeps resources of its own by sign or bound." : "Read its topics as less visible or harder to express directly."}`;
    }
    if (stateInfo.category === "underBeams") {
      return `${name} is under the beams: its topics tend to operate less visibly, more internally, or more privately. ${stateInfo.chariot ? "The concealment is mitigated by the planet's own resources." : "This reduces public clarity, though it does not erase importance."}`;
    }
    return `${name} is ${sideText}: it tends to manifest its topics in a ${stateInfo.side === "morning" ? "more active, earlier, or outward" : "more receptive, later, or context-mediated"} way.`;
  }

  function keyPlanetList(chart) {
    const ascLord = SIGNS[chart.ascSign].ruler;
    const trip = sectTriplicityRulers(chart);
    const lots = ["fortune", "spirit"].map((key) => lotByKey(chart, key)?.lord).filter(Boolean);
    return [...new Set([ascLord, chart.beneficOfSect, chart.maleficContrarySect, trip.primary, trip.secondary, trip.cooperating, ...lots])]
      .filter((key) => VISIBLE_KEYS.includes(key));
  }

  function visibilityReading(chart) {
    const priority = keyPlanetList(chart)
      .map((key) => ({ key, stateInfo: solarPhaseState(key, chart) }))
      .filter((item) => item.stateInfo.category !== "luminary");
    const hidden = priority.filter((item) => ["cazimi", "combust", "underBeams"].includes(item.stateInfo.category));
    const selected = (hidden.length ? hidden : priority.slice(0, 2)).slice(0, 3);
    const sentences = selected.map((item) => solarPhasePlainText(item.key, chart)).filter(Boolean);
    if (sentences.length) return sentences.join(" ");
    return state.lang === "es"
      ? "Los planetas clave no están bajo una ocultación solar fuerte; sus temas pueden leerse principalmente por casa, condición esencial, secta y configuraciones."
      : "The key planets are not under strong solar concealment; read their topics mainly through house, essential condition, sect, and configurations.";
  }

  function relationIntensity(actor, target, chart, role, signType, degree, actorSuperior, targetSuperior) {
    const actorPos = chart.positions[actor];
    const actorStrength = dignityStrength(actor, actorPos, chart);
    const actorSolar = solarPhaseState(actor, chart);
    const actorObscured = ["combust", "underBeams"].includes(actorSolar.category) && !actorSolar.chariot;
    const acute = degree && degree.delta <= 3;
    const friendly = ["copresence", "sextile", "trine"].includes(signType);
    const harsh = ["copresence", "square", "opposition"].includes(signType);

    if (role === "support") {
      if (!actorObscured && (acute || actorSuperior || friendly) && (actorStrength.strong || actorPos.angularity === "angular")) return "strongLevel";
      if (!actorObscured && (friendly || acute || actorStrength.medium || actorPos.angularity === "succedent")) return "mediumLevel";
      return "lowLevel";
    }

    if ((acute || actorSuperior || harsh) && !targetSuperior && (actorStrength.strong || actorPos.angularity === "angular")) return "highLevel";
    if (actorSuperior || acute || harsh || actorStrength.medium) return "mediumLevel";
    return "lowLevel";
  }

  function planetRelationJudgment(target, actor, chart, role) {
    if (target === actor) return "";
    const targetPos = chart.positions[target];
    const actorPos = chart.positions[actor];
    const signType = signAspectType(signOf(targetPos.lon), signOf(actorPos.lon));
    if (!signType) return "";
    const degree = degreeAspect(targetPos.lon, actorPos.lon, Math.max(3, chart.input.orb || 3));
    const acute = degree && degree.delta <= 3;
    const superior = superiorPlanet(actor, target, actorPos.lon, targetPos.lon);
    const actorSuperior = superior === actor;
    const targetSuperior = superior === target;
    const relation = t(signType);
    const targetName = planetLabel(target);
    const actorName = planetLabel(actor);
    const intensity = relationIntensity(actor, target, chart, role, signType, degree, actorSuperior, targetSuperior);
    if (state.lang === "es") {
      if (role === "support") {
        const superiority = actorSuperior
          ? " El apoyo llega desde posición superior."
          : targetSuperior ? " El significador recibe apoyo sin perder posición superior." : "";
        return `${targetName} recibe testimonio de ${actorName} por ${relation}${acute ? " muy cerca de perfección" : " por signo"}; esto funciona como bonificación o apoyo de intensidad ${t(intensity)}.${superiority}`;
      }
      const superiority = actorSuperior
        ? ", y además lo domina por superioridad"
        : targetSuperior ? ", aunque el significador queda en posición superior frente a esa presión" : "";
      return `${targetName} recibe presión de ${actorName} por ${relation}${acute ? " muy cerca de perfección" : " por signo"}${superiority}; esto pesa como maltrato o exigencia de intensidad ${t(intensity)}.`;
    }
    if (role === "support") {
      const superiority = actorSuperior
        ? " The support comes from a superior position."
        : targetSuperior ? " The significator receives support while retaining the superior position." : "";
      return `${targetName} receives testimony from ${actorName} by ${relation}${acute ? " very close to perfection" : " by sign"}; this acts as ${t(intensity)} bonification or support.${superiority}`;
    }
    const superiority = actorSuperior
      ? ", and also overcomes it from the superior position"
      : targetSuperior ? ", though the significator holds the superior position against that pressure" : "";
    return `${targetName} receives pressure from ${actorName} by ${relation}${acute ? " very close to perfection" : " by sign"}${superiority}; this weighs as ${t(intensity)} maltreatment or demand.`;
  }

  function configurationsReading(chart, focuses, ascLordPosition) {
    const ascLord = SIGNS[chart.ascSign].ruler;
    const targets = [...new Set([ascLord, chart.sectLight, lotByKey(chart, "fortune")?.lord, lotByKey(chart, "spirit")?.lord])]
      .filter(Boolean);
    const judgments = [];
    targets.forEach((target) => {
      const support = planetRelationJudgment(target, chart.beneficOfSect, chart, "support");
      const pressure = planetRelationJudgment(target, chart.maleficContrarySect, chart, "tension");
      if (support) judgments.push(support);
      if (pressure) judgments.push(pressure);
    });
    if (judgments.length) return [...new Set(judgments)].slice(0, 4).join(" ");
    const angular = visibleAngularPlanets(chart).filter((key) => isConnectedWithFocus(chart.positions[key], focuses, ascLordPosition));
    if (angular.length) {
      return state.lang === "es"
        ? `No destacan bonificaciones o maltratos fuertes sobre los significadores principales. La lectura descansa más en angularidad y foco por casas, especialmente ${naturalList(angular.map(planetLabel))}.`
        : `No strong bonification or maltreatment stands out on the main significators. The reading rests more on angularity and house focus, especially ${naturalList(angular.map(planetLabel))}.`;
    }
    return state.lang === "es"
      ? "No aparece una relación planetaria dominante sobre los significadores principales; por eso el juicio se apoya más en regencias, casas, secta y condición esencial."
      : "No dominant planetary relation appears on the main significators; the judgment therefore leans more on rulerships, houses, sect, and essential condition.";
  }

  function triplicityFoundationReading(chart) {
    const trip = sectTriplicityRulers(chart);
    const entries = [
      [trip.primary, state.lang === "es" ? "activo por secta" : "active by sect"],
      [trip.secondary, state.lang === "es" ? "fuera de secta" : "out of sect"],
      [trip.cooperating, state.lang === "es" ? "cooperante" : "cooperating"],
    ];
    const houseWord = state.lang === "es" ? "casa" : "house";
    const parts = entries.map(([key, role]) => {
      const position = chart.positions[key];
      return `${planetLabel(key)} (${role}) ${state.lang === "es" ? "en" : "in"} ${houseWord} ${position.house}, ${t(position.angularity)}, ${plainDignityText(position.dignities, chart)}`;
    });
    if (state.lang === "es") {
      return `La luminaria de la secta está en ${trip.sign.es}; sus regentes de triplicidad dan el fondo de apoyo de la carta: ${parts.join("; ")}. No sustituyen al regente del Ascendente, pero muestran si la vida cuenta con una base amplia, desigual o tardía de sostén.`;
    }
    return `The sect light is in ${trip.sign.en}; its triplicity rulers give the chart's background support: ${parts.join("; ")}. They do not replace the Ascendant lord, but they show whether life has a broad, uneven, or delayed base of stability.`;
  }

  function lotConditionReading(lot, chart) {
    if (!lot) return "";
    const lotSign = signOf(lot.lon);
    const lordPosition = chart.positions[lot.lord];
    const benefics = ["jupiter", "venus"].filter((key) => signAspectType(lotSign, signOf(chart.positions[key].lon)));
    const malefics = ["mars", "saturn"].filter((key) => signAspectType(lotSign, signOf(chart.positions[key].lon)));
    const solar = solarPhaseState(lot.lord, chart);
    const solarConcern = ["combust", "underBeams"].includes(solar.category);
    const placeTone = [6, 8, 12].includes(lot.house)
      ? (state.lang === "es" ? "un lugar exigente" : "a demanding place")
      : chart.positions[lot.lord]?.angularity === "angular"
        ? (state.lang === "es" ? "una administración visible o activa" : "visible or active administration")
        : (state.lang === "es" ? "una administración más indirecta" : "more indirect administration");
    const support = benefics.length ? naturalList(benefics.map(planetLabel)) : (state.lang === "es" ? "ningún benéfico claro" : "no clear benefic");
    const pressure = malefics.length ? naturalList(malefics.map(planetLabel)) : (state.lang === "es" ? "ningún maléfico claro" : "no clear malefic");
    if (state.lang === "es") {
      return `${lotName(lot.key)} cae en casa ${lot.house}; su señor es ${planetLabel(lot.lord)} en casa ${lordPosition.house}, ${t(lordPosition.angularity)}, con ${plainDignityText(lordPosition.dignities, chart)}. Esto da ${placeTone}. Recibe testimonio de ${support} y presión de ${pressure}.${solarConcern ? ` El señor del lote está ${solar.category === "combust" ? "combusto" : "bajo los rayos"}, así que parte del tema puede operar de forma menos visible.` : ""}`;
    }
    return `${lotName(lot.key)} falls in house ${lot.house}; its lord is ${planetLabel(lot.lord)} in house ${lordPosition.house}, ${t(lordPosition.angularity)}, with ${plainDignityText(lordPosition.dignities, chart)}. This gives ${placeTone}. It receives testimony from ${support} and pressure from ${pressure}.${solarConcern ? ` The lot lord is ${solar.category === "combust" ? "combust" : "under the beams"}, so part of the topic may operate less visibly.` : ""}`;
  }

  function moonJudgmentReading(chart) {
    const next = chart.moon.nextApplication;
    const last = chart.moon.lastSeparation;
    const nextBySign = chart.moon.nextApplicationBySign;
    const nextText = next
      ? `${planetLabel(next.planet)} (${t(next.type)})`
      : (state.lang === "es" ? "ningún planeta en los próximos 30°" : "no planet in the next 30°");
    const lastText = last
      ? `${planetLabel(last.planet)} (${t(last.type)})`
      : (state.lang === "es" ? "ningún planeta en los últimos 30°" : "no planet in the last 30°");
    const bySignText = nextBySign
      ? `${planetLabel(nextBySign.planet)} (${t(nextBySign.type)})`
      : (state.lang === "es" ? "ningún planeta antes de salir del signo" : "no planet before sign exit");
    const nextRole = next?.planet === chart.beneficOfSect
      ? "support"
      : next?.planet === chart.maleficContrarySect ? "tension" : "neutral";
    if (state.lang === "es") {
      const roleText = nextRole === "support"
        ? "El próximo contacto va hacia el planeta que más facilita, lo que suaviza la transmisión lunar."
        : nextRole === "tension"
          ? "El próximo contacto va hacia el maléfico contrario a la secta, así que la Luna transmite más exigencia o presión."
          : "El próximo contacto no recae sobre el benéfico de la secta ni sobre el maléfico contrario, por lo que se lee por la naturaleza del planeta implicado.";
      const signVocText = chart.moon.voidOfCourseBySign
        ? "Antes de abandonar el signo tampoco perfecciona un contacto mayor."
        : `Antes de abandonar el signo todavía perfecciona con ${bySignText}.`;
      return `La Luna está en fase ${chart.moon.phase}. Viene de ${lastText} y se dirige a ${nextText}. ${chart.moon.voidOfCourse ? "Bajo la definición helenística amplia está vacía de curso: la acción inmediata se dispersa o queda menos encaminada." : roleText} ${signVocText} ${chart.moon.hasApplyingWithinOrb ? "Además hay aplicación cercana dentro de 12°, por lo que la señal lunar es más concreta." : "No hay aplicación cercana dentro de 12°, así que la señal lunar es más amplia que puntual."}`;
    }
    const roleText = nextRole === "support"
      ? "The next contact goes to the planet that most facilitates, softening the lunar transmission."
      : nextRole === "tension"
        ? "The next contact goes to the malefic contrary to sect, so the Moon transmits more demand or pressure."
        : "The next contact is neither to the benefic of sect nor to the malefic contrary to sect, so read it through the nature of the planet involved.";
    const signVocText = chart.moon.voidOfCourseBySign
      ? "Before leaving the sign it also perfects no major contact."
      : `Before leaving the sign it still perfects with ${bySignText}.`;
    return `The Moon is in ${chart.moon.phase} phase. It comes from ${lastText} and moves toward ${nextText}. ${chart.moon.voidOfCourse ? "Under the broad Hellenistic definition it is void of course: immediate action disperses or is less directed." : roleText} ${signVocText} ${chart.moon.hasApplyingWithinOrb ? "There is also a close application within 12°, making the lunar signal more concrete." : "There is no close application within 12°, so the lunar signal is broader rather than punctual."}`;
  }

  function visibleAngularPlanets(chart) {
    return VISIBLE_KEYS.filter((key) => chart.positions[key]?.angularity === "angular");
  }

  function lotByKey(chart, key) {
    return chart.lots.find((lot) => lot.key === key);
  }

  function scoreChartTopics(chart) {
    const houses = Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      score: 0,
      reasons: [],
    }));
    const add = (house, points, reason) => {
      if (!house) return;
      const target = houses[house - 1];
      target.score += points;
      target.reasons.push(reason);
    };
    const ascLord = SIGNS[chart.ascSign].ruler;
    const trip = sectTriplicityRulers(chart);
    add(chart.positions[ascLord]?.house, 5, `${t("ascLordTitle")}: ${planetLabel(ascLord)}`);
    add(chart.positions[chart.sectLight]?.house, 2, `${t("sectLight")}: ${planetLabel(chart.sectLight)}`);
    add(chart.mcHouse, 2, t("mc"));
    visibleAngularPlanets(chart).forEach((key) => add(chart.positions[key].house, 1.5, `${planetLabel(key)} ${t("angular")}`));
    add(lotByKey(chart, "fortune")?.house, 1.25, t("fortune"));
    add(lotByKey(chart, "spirit")?.house, 1.25, t("spirit"));
    add(chart.positions[trip.primary]?.house, 1.15, `${t("sectLight")} ${planetLabel(trip.primary)}`);
    add(chart.positions[trip.secondary]?.house, 0.85, `${t("sectLight")} ${planetLabel(trip.secondary)}`);
    add(chart.positions[trip.cooperating]?.house, 0.6, `${t("sectLight")} ${planetLabel(trip.cooperating)}`);
    ["fortune", "spirit"].forEach((key) => {
      const lot = lotByKey(chart, key);
      add(chart.positions[lot?.lord]?.house, 0.75, `${lot ? lotName(key) : key} ${t("tableRuler")}`);
    });
    return houses.sort((a, b) => b.score - a.score || a.house - b.house);
  }

  function publicProjectionReading(chart) {
    const tenthSignIndex = (chart.ascSign + 9) % 12;
    const tenthSign = SIGNS[tenthSignIndex];
    const tenthRuler = tenthSign.ruler;
    const tenthRulerPosition = chart.positions[tenthRuler];
    const planetsInTenth = VISIBLE_KEYS.filter((key) => chart.positions[key]?.house === 10);
    const tenthPlanetText = planetsInTenth.length
      ? naturalList(planetsInTenth.map(planetLabel))
      : (state.lang === "es" ? "ningún planeta visible" : "no visible planet");
    if (state.lang === "es") {
      return `La proyección pública se lee aparte de la dirección vital. El MC cae en casa ${chart.mcHouse}: ${plainHouseTopics(chart.mcHouse)}. La casa 10 está en ${signLabel(tenthSignIndex)} y su regente, ${planetLabel(tenthRuler)}, cae en casa ${tenthRulerPosition.house}: ${plainHouseTopics(tenthRulerPosition.house)}. En la casa 10 hay ${tenthPlanetText}; esto muestra qué actores se hacen más visibles en reputación, oficio, rango o acción pública.`;
    }
    return `Public projection is read separately from life direction. The MC falls in house ${chart.mcHouse}: ${plainHouseTopics(chart.mcHouse)}. The 10th house is in ${signLabel(tenthSignIndex)} and its ruler, ${planetLabel(tenthRuler)}, falls in house ${tenthRulerPosition.house}: ${plainHouseTopics(tenthRulerPosition.house)}. The 10th house contains ${tenthPlanetText}; this shows which actors become more visible in reputation, craft, rank, or public action.`;
  }

  function interpretChart(chart) {
    const ascSign = SIGNS[chart.ascSign];
    const ascLord = ascSign.ruler;
    const ascLordPosition = chart.positions[ascLord];
    const ascLordSign = SIGNS[signOf(ascLordPosition.lon)];
    const focuses = scoreChartTopics(chart).filter((focus) => focus.score > 0).slice(0, 3);
    const dominant = focuses[0] || { house: ascLordPosition.house, score: 0, reasons: [] };
    const sectLight = chart.sectLight;
    const benefic = chart.beneficOfSect;
    const malefic = chart.maleficContrarySect;
    const beneficPosition = chart.positions[benefic];
    const maleficPosition = chart.positions[malefic];
    const angularPlanets = visibleAngularPlanets(chart);
    const fortune = lotByKey(chart, "fortune");
    const spirit = lotByKey(chart, "spirit");
    const sectLabel = chart.isDay ? t("dayChart") : t("nightChart");
    const sectContext = sectLabel.toLocaleLowerCase(state.lang === "es" ? "es-ES" : "en");
    const sectDescription = state.lang === "es" ? `una ${sectContext}` : `a ${sectContext}`;
    const secondaryFocuses = focuses.slice(1);
    const visibility = visibilityReading(chart);
    const configurations = configurationsReading(chart, focuses, ascLordPosition);
    const moonJudgment = moonJudgmentReading(chart);
    const foundations = triplicityFoundationReading(chart);
    const publicProjection = publicProjectionReading(chart);
    const lotConditionTexts = [lotConditionReading(fortune, chart), lotConditionReading(spirit, chart)].filter(Boolean);

    const lead = focusLeadReading(focuses);
    const summary = state.lang === "es"
      ? `La carta pone mucho peso en la casa ${dominant.house}: ${plainHouseTopics(dominant.house)}. ${secondaryFocuses.length ? `También conviene mirar ${naturalList(secondaryFocuses.map((focus) => `casa ${focus.house}`))}, porque completan el dibujo general.` : ""} El hilo rector sigue siendo ${planetLabel(ascLord)}, regente del Ascendente, situado en casa ${ascLordPosition.house}; por eso la lectura parte de la dirección vital y no de una posición aislada.`
      : `The chart puts a great deal of weight on house ${dominant.house}: ${plainHouseTopics(dominant.house)}. ${secondaryFocuses.length ? `It is also worth reading ${naturalList(secondaryFocuses.map((focus) => `house ${focus.house}`))}, because they complete the general pattern.` : ""} The guiding thread remains ${planetLabel(ascLord)}, lord of the Ascendant / Hour-Marker, placed in house ${ascLordPosition.house}; this is why the reading begins from life direction rather than from an isolated placement.`;

    const lifeDirection = state.lang === "es"
      ? `El Ascendente está en ${signLabel(chart.ascSign)}, por lo que ${planetLabel(ascLord)} lleva la dirección general de la carta. ${planetLabel(ascLord)} habla de ${planetPlainMeaning(ascLord)}. Al caer en ${signLabel(signOf(ascLordPosition.lon))}, casa ${ascLordPosition.house}, esas capacidades se vinculan con ${plainHouseTopics(ascLordPosition.house)}. ${signStyleReading(ascLordSign)} Al estar en una casa ${t(ascLordPosition.angularity)}, este tema se muestra ${angularityReading(ascLordPosition.angularity)}. ${essentialConditionReading(ascLordPosition, chart)}`
      : `The Ascendant / Hour-Marker is in ${signLabel(chart.ascSign)}, so ${planetLabel(ascLord)} carries the chart's general direction. ${planetLabel(ascLord)} speaks of ${planetPlainMeaning(ascLord)}. Placed in ${signLabel(signOf(ascLordPosition.lon))}, house ${ascLordPosition.house}, those capacities connect with ${plainHouseTopics(ascLordPosition.house)}. ${signStyleReading(ascLordSign)} Being in a ${t(ascLordPosition.angularity)} house, this topic shows itself ${angularityReading(ascLordPosition.angularity)}. ${essentialConditionReading(ascLordPosition, chart)}`;

    const resources = state.lang === "es"
      ? `En esta ${sectContext}, ${planetLabel(benefic)} es el planeta que más facilita (técnicamente: benéfico de la secta). Está en casa ${beneficPosition.house}: ${plainHouseTopics(beneficPosition.house)}. Muestra dónde las cosas tienden a crecer, encontrar apoyo o abrir oportunidades. ${connectionReading(beneficPosition, focuses, ascLordPosition, "support")}`
      : `In this ${sectContext}, ${planetLabel(benefic)} is the planet that most facilitates the chart (technically: benefic of sect). It is in house ${beneficPosition.house}: ${plainHouseTopics(beneficPosition.house)}. It shows where things tend to grow, find support, or open opportunities. ${connectionReading(beneficPosition, focuses, ascLordPosition, "support")}`;

    const tensions = state.lang === "es"
      ? `${planetLabel(malefic)} es el planeta que más tensión puede introducir en esta carta (técnicamente: maléfico contrario a la secta). Está en casa ${maleficPosition.house}: ${plainHouseTopics(maleficPosition.house)}. No significa algo malo por sí mismo: señala dónde puede haber presión, conflicto, urgencia, desgaste o necesidad de manejar mejor la energía. ${connectionReading(maleficPosition, focuses, ascLordPosition, "tension")} ${maleficMitigationReading(maleficPosition, beneficPosition, chart)}`
      : `${planetLabel(malefic)} is the planet that can introduce the most tension in this chart (technically: malefic contrary to sect). It is in house ${maleficPosition.house}: ${plainHouseTopics(maleficPosition.house)}. This does not mean something bad by itself: it marks where there may be pressure, conflict, urgency, strain, or a need to handle energy more consciously. ${connectionReading(maleficPosition, focuses, ascLordPosition, "tension")} ${maleficMitigationReading(maleficPosition, beneficPosition, chart)}`;

    const lotReading = fortune && spirit
      ? (state.lang === "es"
        ? `Fortuna habla de lo que llega: cuerpo, circunstancias, entorno y sucesos que no dependen del todo de la voluntad. Espíritu habla de lo que la persona intenta dirigir: decisiones, intención, propósito y acción consciente. ${lotConditionTexts.join(" ")}`
        : `Fortune speaks of what arrives: body, circumstances, surroundings, and events that do not fully depend on the will. Spirit speaks of what the person tries to direct: decisions, intention, purpose, and conscious action. ${lotConditionTexts.join(" ")}`)
      : (state.lang === "es"
        ? `La lectura de lotes queda limitada porque Fortuna y Espíritu no están seleccionados a la vez.`
        : `The lot reading is limited because Fortune and Spirit are not both selected.`);

    const evidence = [
      t("evidenceFocuses", {
        focuses: focusTextList(focuses),
      }),
      t("evidenceAscLordHouse", {
        house: ascLordPosition.house,
        topics: houseTopics(ascLordPosition.house),
      }),
      t("evidenceAscLordAngularity", {
        angularity: t(ascLordPosition.angularity),
        weight: angularityWeight(ascLordPosition.angularity),
      }),
      t("evidenceAscLordCondition", {
        condition: plainDignityText(ascLordPosition.dignities, chart),
      }),
      t("evidenceSect", {
        sect: sectDescription,
        sectLight: planetLabel(sectLight),
        benefic: planetLabel(benefic),
        malefic: planetLabel(malefic),
      }),
      t("evidenceMcHouse", {
        house: chart.mcHouse,
        topics: houseTopics(chart.mcHouse),
      }),
      state.lang === "es"
        ? `Regente de casa 10: ${planetLabel(SIGNS[(chart.ascSign + 9) % 12].ruler)} en casa ${chart.positions[SIGNS[(chart.ascSign + 9) % 12].ruler].house}.`
        : `10th-house ruler: ${planetLabel(SIGNS[(chart.ascSign + 9) % 12].ruler)} in house ${chart.positions[SIGNS[(chart.ascSign + 9) % 12].ruler].house}.`,
      t("evidenceAngularPlanets", {
        planets: angularPlanets.length ? naturalList(angularPlanets.map(planetLabel)) : capitalizeText(t("none")),
      }),
      fortune && spirit
        ? t("evidenceLots", { fortuneHouse: fortune.house, spiritHouse: spirit.house })
        : t("evidenceNoLot"),
      state.lang === "es"
        ? `Fase solar aplicada a planetas clave: ${keyPlanetList(chart).map((key) => `${planetLabel(key)}: ${chart.positions[key].phase || "luminaria"}`).join("; ")}.`
        : `Solar phase applied to key planets: ${keyPlanetList(chart).map((key) => `${planetLabel(key)}: ${chart.positions[key].phase || "luminary"}`).join("; ")}.`,
      state.lang === "es"
        ? `Luna: fase ${chart.moon.phase}; próximo contacto ${chart.moon.nextApplication ? lunarContactLabel(chart.moon.nextApplication) : "ninguno en 30°"}; vacía de curso por 30°: ${chart.moon.voidOfCourse ? t("yes") : t("no")}; vacía antes de salir del signo: ${chart.moon.voidOfCourseBySign ? t("yes") : t("no")}.`
        : `Moon: ${chart.moon.phase} phase; next contact ${chart.moon.nextApplication ? lunarContactLabel(chart.moon.nextApplication) : "none within 30°"}; void of course by 30°: ${chart.moon.voidOfCourse ? t("yes") : t("no")}; void before sign exit: ${chart.moon.voidOfCourseBySign ? t("yes") : t("no")}.`,
      state.lang === "es"
        ? `Triplicidad de la luminaria de la secta: ${naturalList([sectTriplicityRulers(chart).primary, sectTriplicityRulers(chart).secondary, sectTriplicityRulers(chart).cooperating].map(planetLabel))}.`
        : `Sect-light triplicity rulers: ${naturalList([sectTriplicityRulers(chart).primary, sectTriplicityRulers(chart).secondary, sectTriplicityRulers(chart).cooperating].map(planetLabel))}.`,
    ];

    const angularPlanetsText = angularPlanets.length ? naturalList(angularPlanets.map(planetLabel)) : capitalizeText(t("none"));
    const hierarchy = [
      state.lang === "es"
        ? `${t("ascLordTitle")}: ${planetLabel(ascLord)} en casa ${ascLordPosition.house} -> dirección vital.`
        : `${t("ascLordTitle")}: ${planetLabel(ascLord)} in house ${ascLordPosition.house} -> life direction.`,
      state.lang === "es"
        ? `${t("mc")}: casa ${chart.mcHouse} -> proyección pública y acción visible.`
        : `${t("mc")}: house ${chart.mcHouse} -> public projection and visible action.`,
      state.lang === "es"
        ? `Regente de casa 10: ${planetLabel(SIGNS[(chart.ascSign + 9) % 12].ruler)} en casa ${chart.positions[SIGNS[(chart.ascSign + 9) % 12].ruler].house} -> administración de la reputación y el oficio.`
        : `10th-house ruler: ${planetLabel(SIGNS[(chart.ascSign + 9) % 12].ruler)} in house ${chart.positions[SIGNS[(chart.ascSign + 9) % 12].ruler].house} -> administration of reputation and craft.`,
      state.lang === "es"
        ? `Planetas visibles angulares: ${angularPlanetsText} -> lo que más se nota.`
        : `Angular visible planets: ${angularPlanetsText} -> what stands out most.`,
    ];
    if (fortune && spirit) {
      hierarchy.push(state.lang === "es"
        ? `${t("fortune")}/${t("spirit")}: casas ${fortune.house}/${spirit.house} -> circunstancias e intención.`
        : `${t("fortune")}/${t("spirit")}: houses ${fortune.house}/${spirit.house} -> circumstance and intention.`);
    }

    const qualities = [
      { label: t("prominenceLabel"), value: t(prominenceLevel(ascLordPosition)) },
      { label: t("easeLabel"), value: t(essentialEaseLevel(ascLordPosition, ascLord, chart)) },
      { label: t("tensionLabel"), value: t(tensionLevel(maleficPosition, focuses, ascLordPosition, malefic, chart)) },
      { label: t("supportLabel"), value: t(supportLevel(beneficPosition, focuses, ascLordPosition, benefic, chart)) },
    ];

    return {
      lead,
      summary,
      focuses,
      hierarchy,
      qualities,
      blocks: [
        { title: t("lifeDirectionTitle"), text: lifeDirection },
        { title: t("publicProjectionTitle"), text: publicProjection },
        { title: t("visibilityTitle"), text: visibility },
        { title: t("resourcesTitle"), text: resources },
        { title: t("tensionsTitle"), text: tensions },
        { title: t("configurationsTitle"), text: configurations },
        { title: t("moonJudgmentTitle"), text: moonJudgment },
        { title: t("foundationsTitle"), text: foundations },
        { title: t("lots"), text: lotReading },
      ],
      evidence,
    };
  }

  function renderInterpretation(chart) {
    const interpretation = interpretChart(chart);
    $("#interpretationPanel").innerHTML = `
      <div class="interpretation-heading">
        <h3>${escapeHtml(t("interpretationTitle"))}</h3>
        <p>${escapeHtml(t("interpretationWhy"))}</p>
      </div>
      <div class="interpretation-grid">
        <section class="interpretation-lead">
          <h4>${escapeHtml(t("interpretationLeadTitle"))}</h4>
          <p>${escapeHtml(interpretation.lead)}</p>
        </section>
        <section class="interpretation-summary">
          <h4>${escapeHtml(t("interpretationSummary"))}</h4>
          <p>${escapeHtml(interpretation.summary)}</p>
          <div class="quality-badges" aria-label="${escapeHtml(t("qualityTitle"))}">
            ${interpretation.qualities.map((item) => `
              <span><b>${escapeHtml(item.label)}</b>${escapeHtml(capitalizeText(item.value))}</span>
            `).join("")}
          </div>
          <p class="focus-list-title">${escapeHtml(t("mainFocusTitle"))}</p>
          <ul class="focus-list">
            ${interpretation.focuses.map((focus) => `
              <li>
                <strong>${escapeHtml(focusLabel(focus))}</strong>
                <span>${escapeHtml(t("signalsLabel"))}: ${escapeHtml(focusReasonsText(focus))}</span>
              </li>
            `).join("")}
          </ul>
        </section>
        <section class="interpretation-hierarchy">
          <h4>${escapeHtml(t("hierarchyTitle"))}</h4>
          <ol>
            ${interpretation.hierarchy.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </section>
        <section class="interpretation-reading">
          <h4>${escapeHtml(t("interpretationReading"))}</h4>
          <div class="interpretation-reading-grid">
            ${interpretation.blocks.map((block) => `
              <section class="interpretation-block">
                <h5>${escapeHtml(block.title)}</h5>
                <p>${escapeHtml(block.text)}</p>
              </section>
            `).join("")}
          </div>
        </section>
      </div>
      <details class="interpretation-evidence">
        <summary>${escapeHtml(t("interpretationEvidence"))}</summary>
        <ol>
          ${interpretation.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </details>
      <p class="text-note interpretation-timing"><strong>${escapeHtml(t("interpretationTimingNote"))}:</strong> ${escapeHtml(t("interpretationTimingText"))}</p>
    `;
  }

  function renderPlanetTable(chart) {
    const headers = [
      tableHead(t("tablePlanet"), "planet"),
      tableHead(t("tableLongitude"), "longitude"),
      tableHead(t("tableHouse"), "house"),
      tableHead(t("tableCondition"), "essentialCondition"),
      tableHead(t("tableAngularity"), "angularity"),
      tableHead(t("tablePhase"), "solarPhase"),
    ];
    const rows = chart.planetKeys.map((key) => {
      const p = chart.positions[key];
      const condition = p.dignities?.length ? glossaryList(p.dignities, chart) : "—";
      return [
        `<span class="glyph">${PLANETS[key].symbol}</span> ${escapeHtml(planetName(key))}`,
        escapeHtml(formatDegree(p.lon)),
        escapeHtml(String(p.house)),
        condition,
        glossaryMaybe(capitalizeText(t(p.angularity)), p.angularity, "capitalize-first"),
        glossaryParts(p.phase || "—"),
      ];
    });
    $("#tab-planets").innerHTML = makeTable(headers, rows);
  }

  function renderHouseTable(chart) {
    const headers = [
      tableHead(t("tablePlace"), "place"),
      tableHead(t("tableSign"), "sign"),
      tableHead(t("tableRuler"), "ruler"),
      tableHead(t("tablePlanets"), "planets"),
      tableHead(t("tableTopics"), "topics"),
    ];
    const rows = Array.from({ length: 12 }, (_, i) => {
      const house = i + 1;
      const sIndex = (chart.ascSign + i) % 12;
      const sign = SIGNS[sIndex];
      const planets = chart.planetKeys
        .filter((key) => signOf(chart.positions[key].lon) === sIndex)
        .map((key) => `${PLANETS[key].symbol} ${planetName(key)}`)
        .join(", ") || "—";
      return [
        escapeHtml(`${house} · ${capitalizeText(t(placeQuality(house)))}`),
        escapeHtml(`${sign.symbol} ${sign[state.lang]}`),
        escapeHtml(`${PLANETS[sign.ruler].symbol} ${planetName(sign.ruler)}`),
        escapeHtml(planets),
        escapeHtml(capitalizeText(houseTopics(house))),
      ];
    });
    $("#tab-houses").innerHTML = makeTable(headers, rows);
  }

  function renderLotTable(chart) {
    if (!chart.lots.length) {
      $("#tab-lots").innerHTML = `<p class="text-note">${escapeHtml(t("noLots"))}</p>`;
      return;
    }
    const headers = [
      tableHead(t("tableLot"), "lots"),
      tableHead(t("tableLongitude"), "longitude"),
      tableHead(t("tableHouse"), "house"),
      tableHead(t("tableLord"), "lotLord"),
      tableHead(t("tableLordHouse"), "lotLordHouse"),
    ];
    const rows = chart.lots.map((lot) => [
      glossaryTerm(capitalizeText(lotName(lot.key)), lotGlossaryKey(lot.key), "capitalize-first"),
      escapeHtml(formatDegree(lot.lon)),
      escapeHtml(String(lot.house)),
      escapeHtml(`${PLANETS[lot.lord].symbol} ${planetName(lot.lord)}`),
      escapeHtml(String(lot.lordHouse || "—")),
    ]);
    const lotNote = state.lang === "es"
      ? `Sistema de fórmulas: ${glossaryTerm(t("fortune"), "lotFortune")} y ${glossaryTerm(t("spirit"), "lotSpirit")} se invierten por ${glossaryTerm(t("sect"), "sect")}; ${glossaryTerm("Eros", "lotEros")} y ${glossaryTerm(t("necessity"), "lotNecessity")} usan la tradición basada en ${glossaryTerm(t("fortune"), "lotFortune")} y ${glossaryTerm(t("spirit"), "lotSpirit")}; ${glossaryTerm(t("courage"), "lotCourage")}, ${glossaryTerm(t("victory"), "lotVictory")} y ${glossaryTerm("Némesis", "lotNemesis")} usan fórmulas planetarias herméticas.`
      : `Formula system: ${glossaryTerm(t("fortune"), "lotFortune")} and ${glossaryTerm(t("spirit"), "lotSpirit")} reverse by ${glossaryTerm(t("sect"), "sect")}; ${glossaryTerm("Eros", "lotEros")} and ${glossaryTerm(t("necessity"), "lotNecessity")} use the ${glossaryTerm(t("fortune"), "lotFortune")}/${glossaryTerm(t("spirit"), "lotSpirit")}-based tradition; ${glossaryTerm(t("courage"), "lotCourage")}, ${glossaryTerm(t("victory"), "lotVictory")}, and ${glossaryTerm("Nemesis", "lotNemesis")} use hermetic planetary formulas.`;
    $("#tab-lots").innerHTML = `${makeTable(headers, rows)}<p class="text-note">${lotNote}</p>`;
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
          const dominance = overcomingLabel(a, b, chart.positions[a].lon, chart.positions[b].lon) || "—";
          rows.push([
            escapeHtml(`${PLANETS[a].symbol} ${planetName(a)} / ${PLANETS[b].symbol} ${planetName(b)}`),
            glossaryMaybe(capitalizeText(t(signType)), signType, "capitalize-first"),
            glossaryMaybe(capitalizeText(t("signBased")), "aspects", "capitalize-first"),
            glossaryMaybe(capitalizeText(dominance), glossaryKeyForText(dominance), "capitalize-first"),
          ]);
        }
        if (showDegree && degree) {
          rows.push([
            escapeHtml(`${PLANETS[a].symbol} ${planetName(a)} / ${PLANETS[b].symbol} ${planetName(b)}`),
            glossaryMaybe(capitalizeText(t(degree.type)), degree.type, "capitalize-first"),
            glossaryMaybe(capitalizeText(t("degreeBased")), "aspects", "capitalize-first"),
            escapeHtml(`${round(degree.delta, 2)}°`),
          ]);
        }
      }
    }
    if (!rows.length) {
      $("#tab-aspects").innerHTML = `<p class="text-note">${escapeHtml(t("noAspects"))}</p>`;
      return;
    }
    $("#tab-aspects").innerHTML = makeTable([
      tableHead(t("tablePair"), "aspectPair"),
      tableHead(t("tableAspect"), "configurations"),
      tableHead(t("tableMode"), "mode"),
      tableHead(t("tableOrb"), "orb"),
    ], rows);
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
    document.title = state.lang === "es" ? "Tyche · Carta natal helenística" : "Tyche · Hellenistic Natal Chart";
    $("meta[name='description']")?.setAttribute(
      "content",
      state.lang === "es"
        ? "Tyche calcula cartas natales helenísticas con Ascendente, casas de signos enteros, secta, condición esencial y lotes, procesadas localmente en el navegador."
        : "Tyche calculates Hellenistic natal charts with the Hour-Marker, Whole Sign Houses, sect, essential condition, and lots, processed locally in the browser."
    );
    $$("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $$("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    $(".toolbar").setAttribute("aria-label", state.lang === "es" ? "Preferencias" : "Preferences");
    $("#chartWheel").setAttribute("aria-label", state.lang === "es" ? "Rueda de carta natal" : "Natal chart wheel");
    $(".tabs").setAttribute("aria-label", state.lang === "es" ? "Detalles de la carta" : "Chart details");
    $("#languageToggle span").textContent = state.lang.toUpperCase();
    $("#languageToggle").setAttribute("aria-label", state.lang === "es" ? "Cambiar idioma" : "Change language");
    $("#languageToggle").title = state.lang === "es" ? "Cambiar idioma" : "Change language";
    $("#peopleToggle").setAttribute("aria-label", t("peopleButton"));
    $("#peopleToggle").title = t("peopleButton");
    $("#peopleClose").setAttribute("aria-label", t("close"));
    $("#peopleClose").title = t("close");
    $("#themeToggle").setAttribute("aria-label", state.lang === "es" ? "Cambiar tema" : "Change theme");
    $("#themeToggle").title = state.lang === "es" ? "Cambiar tema" : "Change theme";
    $("#birthPlace").placeholder = state.lang === "es" ? "Madrid, España" : "Madrid, Spain";
    $("#clearPlace").setAttribute("aria-label", t("clearPlace"));
    $("#clearPlace").title = t("clearPlace");
    populateLists();
    const city = findCity($("#birthPlace").value);
    if (city) {
      state.selectedCity = city;
      state.activeCityKey = cityKey(city);
      $("#birthPlace").value = formatCity(city);
    }
    updateClearPlaceButton();
    hidePlaceSuggestions();
    renderHistoricalPeople();
    if (state.lastChart?.input?.city) state.lastChart.input.place = formatCity(state.lastChart.input.city);
    if (state.lastChart) renderChart(state.lastChart);
    decorateGlossaryTriggers();
  }

  function applyTheme() {
    document.body.classList.toggle("night", state.theme === "night");
    $("#themeToggle span").textContent = state.theme === "night" ? "☉" : "☾";
  }

  function populateLists() {
    $("#timezoneList").innerHTML = TIME_ZONES.map((zone) => `<option value="${escapeHtml(zone)}"></option>`).join("");
  }

  function updatePlaceFields() {
    const city = findCity($("#birthPlace").value);
    if (!city) {
      state.selectedCity = null;
      state.activeCityKey = "";
      return;
    }
    const nextCityKey = cityKey(city);
    const cityChanged = state.activeCityKey !== nextCityKey;
    applyCityToFields(city, cityChanged);
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
    const birthPlace = $("#birthPlace");
    $("#languageToggle").addEventListener("click", () => {
      state.lang = state.lang === "es" ? "en" : "es";
      localStorage.setItem("tyche-lang", state.lang);
      applyI18n();
    });
    $("#peopleToggle").addEventListener("click", openPeopleModal);
    $("#peopleClose").addEventListener("click", closePeopleModal);
    $("#peopleModal").addEventListener("click", (event) => {
      if (event.target === $("#peopleModal")) closePeopleModal();
    });
    $("#peopleGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-person-id]");
      if (button) loadHistoricalPerson(button.dataset.personId);
    });
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-glossary]");
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        openGlossary(trigger.dataset.glossary, trigger);
        return;
      }
      if (!event.target.closest("#glossaryPopover")) closeGlossary();
    });
    document.addEventListener("keydown", (event) => {
      const trigger = event.target.closest("[data-glossary]");
      if (trigger && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openGlossary(trigger.dataset.glossary, trigger);
        return;
      }
      if (event.key === "Escape") {
        if (!$("#glossaryPopover").hidden) {
          closeGlossary({ restoreFocus: true });
          return;
        }
        if (!$("#peopleModal").hidden) closePeopleModal();
      }
    });
    $("#glossaryClose").addEventListener("click", () => closeGlossary({ restoreFocus: true }));
    window.addEventListener("resize", () => positionGlossary(state.glossaryReturnFocus));
    window.addEventListener("scroll", () => positionGlossary(state.glossaryReturnFocus), true);
    $("#themeToggle").addEventListener("click", () => {
      state.theme = state.theme === "night" ? "day" : "night";
      localStorage.setItem("tyche-theme", state.theme);
      applyTheme();
    });
    birthPlace.addEventListener("focus", () => {
      if (state.selectedCity && normalizeText(birthPlace.value) === normalizeText(formatCity(state.selectedCity))) {
        birthPlace.select();
      }
      queuePlaceSearch();
    });
    birthPlace.addEventListener("input", () => {
      clearHistoricalSelection();
      state.selectedCity = null;
      state.activeCityKey = "";
      queuePlaceSearch();
    });
    birthPlace.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if ($("#placeSuggestions").hidden) queuePlaceSearch();
        moveActivePlace(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActivePlace(-1);
      } else if (event.key === "Enter" && state.placeSuggestions.length) {
        event.preventDefault();
        selectPlaceSuggestion(state.activePlaceIndex >= 0 ? state.activePlaceIndex : 0);
      } else if (event.key === "Escape") {
        hidePlaceSuggestions();
      }
    });
    birthPlace.addEventListener("blur", () => {
      window.setTimeout(() => {
        updatePlaceFields();
        hidePlaceSuggestions();
      }, 120);
    });
    $("#clearPlace").addEventListener("click", () => {
      clearHistoricalSelection();
      state.selectedCity = null;
      state.activeCityKey = "";
      birthPlace.value = "";
      $("#latitude").value = "";
      $("#longitude").value = "";
      $("#timeZone").value = "";
      updateClearPlaceButton();
      hidePlaceSuggestions();
      birthPlace.focus();
    });
    $("#placeSuggestions").addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    $("#placeSuggestions").addEventListener("click", (event) => {
      const button = event.target.closest("[data-place-index]");
      if (button) selectPlaceSuggestion(Number(button.dataset.placeIndex));
    });
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".place-field")) hidePlaceSuggestions();
    });
    $("#birthDate").addEventListener("change", () => {
      clearHistoricalSelection();
      updatePlaceFields();
    });
    $("#birthTime").addEventListener("change", () => {
      clearHistoricalSelection();
      updatePlaceFields();
    });
    $("#gender").addEventListener("change", clearHistoricalSelection);
    $("#chart-form").addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        calculateCurrentChart();
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
