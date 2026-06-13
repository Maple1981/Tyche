(() => {
  "use strict";

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const DAY_MS = 86400000;
  const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
  const PLACE_SEARCH_DELAY = 260;
  const PLACE_RESULT_LIMIT = 8;
  const TYCHE_TEST_SCHEMA_VERSION = 2;
  const TYCHE_BUILD_HASH = (() => {
    try {
      const scriptVersion = document.currentScript?.src
        ? new URL(document.currentScript.src, window.location.href).searchParams.get("v")
        : "";
      return scriptVersion || window.TYCHE_BUILD_HASH || new URLSearchParams(window.location.search).get("v") || "dev";
    } catch {
      return window.TYCHE_BUILD_HASH || "dev";
    }
  })();
  const TIME_CONFIDENCE_VALUES = Object.freeze([
    "exact",
    "rounded-to-minute",
    "rounded-to-5-min",
    "rounded-to-15-min",
    "rounded-to-hour",
    "reported",
    "uncertain",
  ]);
  const ZONE_RELIABILITY_VALUES = Object.freeze(["iana", "manual", "lmt", "historical", "unknown"]);

  function initialPreferenceState(storage = localStorage) {
    return {
      lang: storage.getItem("tyche-lang") || "es",
      theme: storage.getItem("tyche-theme") || "day",
    };
  }

  const state = {
    ...initialPreferenceState(),
    lastChart: null,
    activeCityKey: "",
    selectedCity: null,
    selectedPersonName: "",
    selectedPersonAuditStatus: "",
    selectedPersonTimeConfidence: "",
    selectedPersonZoneReliability: "",
    selectedZoneSource: "",
    placeSuggestions: [],
    placeSearchTimer: 0,
    placeSearchController: null,
    activePlaceIndex: -1,
    modalReturnFocus: null,
    glossaryReturnFocus: null,
    personDataReturnFocus: null,
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
      aspectMode: "Tabla de configuraciones",
      aspectModeNote: "La lectura natal usa configuraciones por signo; el grado añade cercanía y perfección en tablas y evidencia.",
      orbNote: "El orbe afecta a contactos por grado, cercanía y aplicación cercana; no elimina las configuraciones por signo usadas en el juicio.",
      bySign: "Por signo",
      signAndDegree: "Signo + grado",
      byDegree: "Solo grado",
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
      traditionalPlanetsTitle: "Planetas visibles tradicionales",
      modernPlanetsTitle: "Planetas modernos como capa adicional",
      places: "Lugares/Casas",
      configurations: "Configuraciones",
      missingDate: "Añade fecha y hora de nacimiento.",
      invalidHistoricalYear: "Tyche aún no admite años BCE/a. C. en el formulario. Para evitar ambigüedades entre año histórico y año astronómico, usa solo años CE/d. C. por ahora.",
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
      peopleAuditedTitle: "Datos auditados",
      peoplePartialTitle: "Datos parcialmente auditados",
      peoplePendingTitle: "Pendientes de auditoría",
      close: "Cerrar",
      useExample: "Usar esta carta",
      openWikipedia: "Abrir en Wikipedia",
      dataDate: "Fecha",
      dataPlace: "Lugar",
      dataSex: "Sexo",
      personDataDetailsTitle: "Datos natales",
      personDataDetailsOpen: "Ver fuente de datos natales",
      dataSource: "Fuente",
      dataSourceDate: "Fecha en fuente",
      dataRodden: "Rodden",
      dataTimeSource: "Hora",
      dataSourceGeneral: "Fuente pendiente de auditoría individual",
      dataRoddenPending: "Rating individual pendiente de auditoría",
      dataAuditPendingBadge: "Datos natales no auditados individualmente",
      dataAuditPartialBadge: "Datos natales parcialmente auditados",
      dataTimeSourcePrepared: "Hora exacta usada por Tyche; revisar fuente individual antes de investigación crítica",
      footerWarning: "Motor astronómico pensado para uso educativo. La información proporcionada es solo orientativa.",
    footerPrivacy: "La carta se calcula localmente en tu navegador. No guardamos tus cartas ni usamos cookies. Solo se conserva en este dispositivo la preferencia de idioma y tema. La búsqueda de lugares consulta Open-Meteo para obtener coordenadas. Las imágenes del archivo histórico se cargan desde Wikimedia Commons. El posicionamiento de planetas utiliza una librería local.",
      footerAuthors: "Autores: Maple81 y Hélène de Troie, 2026.",
      githubLink: "Ver repositorio GitHub",
    footerAttributions: 'Atribuciones generales: algunas imágenes proceden de <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Wikimedia Commons</a>; algunas referencias biográficas o natales pueden proceder de <a href="https://www.wikipedia.org/" target="_blank" rel="noreferrer">Wikipedia</a> y <a href="https://www.astro.com/astro-databank/" target="_blank" rel="noreferrer">Astro-Databank</a>. La fuente individual y el rating se muestran cuando han sido auditados; si no, se marcan como pendientes de auditoría. Búsqueda de localización mediante <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">Open-Meteo Geocoding API</a>; efemérides locales mediante <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine</a> MIT, precisión aprox. ±1′, en ejecución local, sin enviar datos a terceros.',
      invalidTimeZone: "Zona horaria no reconocida; usando la diferencia UTC manual.",
      invalidOffset: "La diferencia UTC manual debe tener formato +01:00 o -05:00.",
      chartFor: "Carta para {place}",
      chartForPerson: "Carta para {name}",
      anonymousChart: "Carta anónima",
      chartMeta: "Fecha: {date} · Hora: {time} · Lugar de nacimiento: {place}",
      dayChart: "Carta diurna",
      nightChart: "Carta nocturna",
      sect: "Secta",
      anglesZoneTitle: "Ángulos y zona",
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
      technicalTitle: "Notas técnicas y límites",
      technicalAstronomyTitle: "Cálculo astronómico",
      technicalJudgmentTitle: "Criterios de juicio",
      technicalMcIcNote: "En casas de signos enteros, el MC y el IC no abren las casas 10 y 4: son puntos astronómicos sensibles, y Tyche muestra también en qué casa caen.",
      technicalLimitsCompact: "Efemérides locales mediante Astronomy Engine. La precisión planetaria aproximada es ±1′; Ascendente, MC, casas y lotes dependen de la hora, coordenadas y zona usada.",
      technicalUsePrivacyCompact: "Uso educativo. Para rectificaciones, cartas críticas o investigación profesional, contrasta los datos con efemérides y fuentes especializadas. La búsqueda de lugar y las imágenes históricas pueden consultar servicios externos.",
      interpretationTitle: "Lectura natal",
      interpretationLeadTitle: "En una frase",
      interpretationSummary: "Lo más importante",
      interpretationReading: "Interpretación",
      interpretationEvidence: "Ver base técnica",
      interpretationWhy: "Primero aparece una lectura en lenguaje llano. La base técnica queda disponible debajo.",
      conclusionLabel: "Conclusión",
      interpretationTimingNote: "Sobre predicción",
      interpretationTimingText: "Esta lectura no predice fechas. Describe temas de fondo de la carta natal. Para saber cuándo se activan, hay que usar técnicas de tiempo como profecciones anuales, liberación zodiacal o tránsitos relevantes.",
      dominantTopicTitle: "Focos principales",
      mainFocusTitle: "Zonas más activadas",
      hierarchyTitle: "Base de lectura",
      lifeDirectionTitle: "Dirección vital",
      publicProjectionTitle: "Proyección pública",
      limitsTitle: "Límites",
      limitsEducational: "Uso educativo: la lectura no sustituye efemérides profesionales ni una investigación de rectificación.",
      limitsPrecision: "Precisión planetaria aproximada ±1′; Ascendente, MC y casas dependen mucho de hora, coordenadas y zona usada.",
      limitsPrivacy: "La carta se calcula localmente; la búsqueda de lugar y las imágenes históricas sí consultan servicios externos.",
      resourcesTitle: "Apoyos y oportunidades",
      tensionsTitle: "Presiones a manejar",
      visibilityTitle: "Visibilidad de planetas clave",
      configurationsTitle: "Ayudas y presiones entre planetas",
      moonJudgmentTitle: "Ritmo lunar",
      foundationsTitle: "Base de sostén",
      prominenceLabel: "Prominencia",
      easeLabel: "Condición esencial",
      tensionLabel: "Tensión",
      supportLabel: "Apoyo",
      qualityTitle: "Indicadores de lectura",
      signalsLabel: "Señales",
      scoreBreakdownTitle: "Desglose de puntuación",
      scoreTotalLabel: "Total",
      scorePointsLabel: "puntos",
      scoreCategoryLifeAxis: "Eje vital",
      scoreCategorySect: "Luminaria de la secta",
      scoreCategoryPublic: "Proyección pública",
      scoreCategoryAngular: "Angularidad",
      scoreCategoryLots: "Lotes",
      scoreCategoryTriplicity: "Triplicidad",
      scoreFocusType: "Tipo de foco",
      focusTypeVital: "vital",
      focusTypePublic: "público",
      focusTypeCircumstantial: "circunstancial",
      focusTypeSupport: "de soporte",
      mainLotsAuditTitle: "Lotes principales usados en juicio",
      lotTableDisplayNote: "La tabla de lotes muestra solo los lotes seleccionados.",
      scoreBreakdownCaution: "Estos puntos no son una medida absoluta: solo ordenan testimonios tradicionales para explicar por qué Tyche prioriza ciertos Lugares/Casas.",
      evidenceFocusSection: "Focos y score",
      evidenceLotsSection: "Lotes principales",
      evidenceGeneralSection: "Condiciones y avisos",
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
      evidenceLotsAlwaysWeighted: "Fortuna y Espíritu se calculan siempre para el juicio; la tabla de lotes solo muestra los lotes seleccionados.",
      evidenceFocuses: "Focos principales por acumulación de señales: {focuses}.",
      testimonyStrong: "peso alto",
      testimonyMedium: "peso medio",
      testimonyLow: "peso indirecto",
      localDateTime: "Fecha local",
      utcDateTime: "UTC usado",
      coordinates: "Coordenadas",
      ephemerisEngine: "Efemérides",
      boundaryAudit: "Auditoría de frontera",
      noBoundaryNotices: "Sin avisos",
      aspectTableMode: "Tabla de configuraciones",
      judgmentFrame: "Marco del juicio",
      judgmentFrameSign: "Configuraciones por signo; el grado matiza cercanía/perfección",
      zodiacBaseWarning: "Sideral aproximado · fuera del modo base tropical",
      calendarJulianWarning: "Conversión juliana básica · verificar calendario, zona local y fuente temporal",
      mixedModeWarning: "Modo mixto: modernos solo como datos adicionales; no entran en el juicio helenístico base",
      julianInlineWarning: "Aviso: la conversión juliana es básica. Verifica calendario local, hora civil y fuente temporal antes de investigación crítica. Para fechas BCE, verifica la numeración del año: la astronomía usa año 0; la cronología histórica tradicional no.",
      siderealInlineWarning: "Aviso: el zodíaco sideral es aproximado y queda fuera del marco tropical base de Tyche.",
      mixedInlineWarning: "Aviso: los planetas modernos se muestran como capa adicional; el juicio helenístico base no los pondera.",
      modernStrictInlineWarning: "Aviso: estás en enfoque tradicional, pero mostrando modernos como capa no ponderada.",
      modernDisplayed: "Modernos mostrados",
      modernWeightedBase: "Modernos ponderados en juicio base",
      modernNotWeighted: "No; quedan fuera del juicio helenístico base",
      sectCalculation: "Cálculo de secta",
      sectCalculationValue: "Altitud solar geométrica {altitude}; sin refracción atmosférica",
      sectLiminalDay: "Carta diurna, liminal",
      sectLiminalNight: "Carta nocturna, liminal",
      sectLiminalNote: "Secta técnicamente {sect}; tratar como sensible por Sol cerca del horizonte.",
      sectSensitiveDay: "Carta diurna, sensible",
      sectSensitiveNight: "Carta nocturna, sensible",
      sectSensitiveNote: "Secta técnicamente {sect}; tratar las fórmulas y testimonios dependientes de secta como sensibles por contexto temporal.",
      sectDependencyCaution: "Testimonios con menor confianza: benéfico y maléfico de secta, maléfico contrario, Fortuna/Espíritu y triplicidad de la luminaria.",
      sectLowConfidenceJudgment: "Esta lectura usa la secta técnica calculada por Tyche, pero varios testimonios dependen de una frontera sensible. Contrasta especialmente benéfico/maléfico de secta, Fortuna/Espíritu y triplicidad si se rectifica la hora.",
      boundaryThreshold: "Umbral aplicado",
      boundaryThresholdSensitive: "{threshold} por contexto temporal sensible: {reasons}",
      boundaryThresholdNormal: "{threshold} estándar",
      boundaryTypeSect: "Secta cerca del horizonte",
      boundaryTypeAsc: "Ascendente cerca de cambio de signo",
      boundaryTypeMc: "MC cerca de cambio de signo",
      boundaryTypeIc: "IC cerca de cambio de signo",
      boundaryTypeLot: "{lot} cerca de cambio de signo/casa",
      boundaryTypePlanetBound: "{planet} cerca de cambio de término",
      boundaryChangeSect: "secta",
      boundaryChangeSectLight: "luminaria de la secta",
      boundaryChangeBeneficMaleficSect: "benéfico/maléfico de la secta",
      boundaryChangeContraryMalefic: "maléfico contrario",
      boundaryChangeFortuneSpirit: "fórmulas de Fortuna/Espíritu",
      boundaryChangeGeneralJudgment: "juicio general",
      boundaryChangeAscLord: "regente del Ascendente",
      boundaryChangeWholeSignHouses: "casas por signos enteros",
      boundaryChangeLots: "lotes",
      boundaryChangeMainFocuses: "focos principales",
      boundaryChangeMcHouse: "casa por signos enteros del MC",
      boundaryChangeIcHouse: "casa por signos enteros del IC",
      boundaryChangeChartProjection: "proyección/fundamento de la carta",
      boundaryChangeSecondaryFocuses: "focos secundarios",
      boundaryChangeLotHouse: "casa del lote",
      boundaryChangeLotLord: "señor del lote",
      boundaryChangeTopicReading: "lectura del tema",
      boundaryChangeDegreeAdministration: "administración del grado",
      boundaryChangeOwnMinorDignity: "dignidad menor propia si procede",
      boundaryChangeBoundReception: "recepción por término",
      boundaryActionVerifyRectification: "verificar hora, coordenadas, zona usada y posible rectificación",
      boundaryActionReviewTimeSource: "revisar hora, fuente o rectificación",
      boundaryActionVerifyZone: "verificar hora, coordenadas y zona usada",
      boundaryActionReviewTimeCoordinates: "revisar hora y coordenadas",
      boundaryActionReviewPlanetaryPrecision: "revisar minutos de hora y precisión planetaria",
      boundaryShiftText: "{angle} a {distance} del {side}; actual: {currentSign}, casa {currentHouse}; posible por pequeña variación: {possibleSign}, casa {possibleHouse}",
      boundarySidePrevious: "límite anterior",
      boundarySideNext: "límite siguiente",
      sensitiveJulian: "calendario juliano",
      sensitiveAuditPending: "datos natales pendientes de auditoría",
      sensitiveTimeConfidence: "hora natal no exacta o redondeada",
      sensitiveManualOffset: "diferencia UTC manual o histórica",
      sensitiveNoIana: "sin zona IANA clara",
      alternateSectLotsTitle: "Lotes alternativos si cambia la secta",
      alternateSectRolesTitle: "Roles alternativos si cambia la secta",
      lotUsedByTyche: "Usado por Tyche",
      lotIfSectReversed: "Si la secta se invierte",
      sectRolesUsedByTyche: "Roles usados por Tyche",
      sectRolesIfReversed: "Roles si se invierte la secta",
      dayFormulaLabel: "fórmula diurna",
      nightFormulaLabel: "fórmula nocturna",
      lotAuditPosition: "Posición",
      lotAuditLord: "Señor",
      lotAuditDirectAdministration: "Administración directa",
      lotAuditLordRole: "Rol del señor",
      lotAuditFormula: "Fórmula",
      lotAuditTestimonies: "Testimonios",
      lotAuditPressures: "Presiones",
      lotAuditDegree: "Grado",
      lotAuditLordCondition: "Condición del señor",
      lotAuditLordAngularity: "Angularidad del señor",
      lotAuditLordSolarPhase: "Fase solar zodiacal del señor",
      lotAuditBeneficTestimony: "Testimonio benéfico",
      lotAuditMaleficPressure: "Presión maléfica",
      lotAuditRawPressure: "Presión bruta",
      lotAuditRegulation: "Regulación",
      lotAuditReading: "Lectura",
      negotiatedSupport: "apoyo negociado",
      regulatedBeneficFriction: "testimonio benéfico con fricción regulada",
      regulatedPressure: "presión regulada",
      solarThresholds: "Umbrales solares",
      solarThresholdValues: "Bajo rayos 15° · combustión 8° · en el corazón 1°",
      moonVoidDefinitions: "Luna vacía",
      moonVoidDefinitionsValues: "30° helenística · salida de signo · sin aplicación cercana 12°",
      astronomyEngine: "Astronomy Engine local",
      fallbackEngine: "Motor aproximado de respaldo",
      ascLordTitle: "Regente del Ascendente",
      ascLordText: "{lord} rige {ascSign} y cae en {lordPosition}, casa {house}. Al regir el Ascendente, vincula la dirección vital del nativo con los temas de esta casa: {topics}. Su angularidad es {angularity}.",
      dignifiedText: "Condición esencial: {condition}.",
      mcWholeSignNote: "En casas de signos enteros, las casas se cuentan desde el signo Ascendente. El MC y el IC no abren las casas 10 y 4: son puntos astronómicos sensibles. Tyche muestra también en qué casa caen.",
      noMajorDignity: "sin dignidad mayor",
      dignityMajor: "Dignidad mayor",
      dignityTriplicity: "Soporte por triplicidad",
      dignityMinor: "Dignidad menor propia",
      dignityAdministration: "Administración del grado",
      weaknesses: "Debilidades",
      none: "ninguna",
      moonTitle: "Condición lunar",
      moonStatus: "Estado lunar",
      moonStatusActive: "Activa: perfecciona un contacto mayor antes de abandonar el signo.",
      moonStatusVoid30: "Vacía según la definición helenística de 30°: no perfecciona contacto mayor en ese tramo.",
      moonStatusVoidSign: "Sin perfección antes de salir del signo, aunque conserva la revisión helenística de 30°.",
      moonStatusNoClose: "Sin aplicación cercana dentro de 12°: la señal es más amplia que puntual.",
      moonPhase: "Fase sinódica",
      moonElongation: "Elongación Sol→Luna",
      moonLastSeparation: "Último contacto",
      moonNextApplication: "Próximo contacto",
      moonCalculationMethod: "Método de contacto lunar",
      lunarMethodIterative: "búsqueda iterativa",
      lunarMethodFallback: "estimación lineal",
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
      tablePhase: "Fase solar zodiacal",
      tablePlace: "Lugar/Casa",
      tableSign: "Signo",
      tableRuler: "Regente",
      tablePlanets: "Planetas",
      tableTopics: "Temas",
      tableLot: "Lote",
      tableLord: "Regente del lote",
      tableLordHouse: "Casa del regente",
      tableFormula: "Fórmula",
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
      boundLord: "señor del término: {planet}",
      decanLord: "señor del decanato: {planet}",
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
      fromSun: "del Sol",
      chariotBy: "en su carro por {condition}",
      chariotMitigationBy: "protección tipo carro por {condition}",
      noChariot: "sin carro",
      natalDataSource: "Fuente de datos natales",
      brennanReference: "Referencia interpretativa",
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
      aspectMode: "Configuration table",
      aspectModeNote: "The natal reading uses sign-based configurations; degree adds closeness and perfection in tables and evidence.",
      orbNote: "The orb affects degree contacts, closeness, and close application; it does not remove the sign-based configurations used in judgment.",
      bySign: "By sign",
      signAndDegree: "Sign + degree",
      byDegree: "Degree only",
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
      traditionalPlanetsTitle: "Traditional visible planets",
      modernPlanetsTitle: "Modern planets as an additional layer",
      places: "Places/Houses",
      configurations: "Configurations",
      missingDate: "Add birth date and time.",
      invalidHistoricalYear: "Tyche does not yet support BCE years in the form. To avoid ambiguity between historical and astronomical year numbering, use CE years only for now.",
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
      peopleAuditedTitle: "Audited data",
      peoplePartialTitle: "Partially audited data",
      peoplePendingTitle: "Pending audit",
      close: "Close",
      useExample: "Use this chart",
      openWikipedia: "Open in Wikipedia",
      dataDate: "Date",
      dataPlace: "Place",
      dataSex: "Sex",
      personDataDetailsTitle: "Natal data",
      personDataDetailsOpen: "View natal data source",
      dataSource: "Source",
      dataSourceDate: "Source date",
      dataRodden: "Rodden",
      dataTimeSource: "Time",
      dataSourceGeneral: "Individual source pending audit",
      dataRoddenPending: "Individual rating pending audit",
      dataAuditPendingBadge: "Natal data not individually audited",
      dataAuditPartialBadge: "Natal data partially audited",
      dataTimeSourcePrepared: "Exact time used by Tyche; review the individual source before critical research",
      footerWarning: "Astronomical engine intended for educational use. The information provided may not be reliable.",
    footerPrivacy: "The chart is calculated locally in your browser. We do not store your charts or use cookies. Only language and theme preferences are kept on this device. Place search consults Open-Meteo to obtain coordinates. Historical archive images load from Wikimedia Commons. Planet positions use a local library.",
      footerAuthors: "Authors: Maple81 and Hélène de Troie, 2026.",
      githubLink: "View GitHub repository",
    footerAttributions: 'General attributions: some images come from <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Wikimedia Commons</a>; some biographical or natal references may come from <a href="https://www.wikipedia.org/" target="_blank" rel="noreferrer">Wikipedia</a> and <a href="https://www.astro.com/astro-databank/" target="_blank" rel="noreferrer">Astro-Databank</a>. The individual source and rating are shown when audited; otherwise they are marked as pending audit. Place search by <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">Open-Meteo Geocoding API</a>; local ephemerides by <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine</a> MIT, approx. ±1′ accuracy, running locally, without sending data to third parties.',
      invalidTimeZone: "Time zone not recognized; using the manual offset.",
      invalidOffset: "Manual offset must look like +01:00 or -05:00.",
      chartFor: "Chart for {place}",
      chartForPerson: "Chart for {name}",
      anonymousChart: "Anonymous chart",
      chartMeta: "Date: {date} · Time: {time} · Birthplace: {place}",
      dayChart: "Day chart",
      nightChart: "Night chart",
      sect: "Sect",
      anglesZoneTitle: "Angles and zone",
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
      technicalTitle: "Technical notes and limits",
      technicalAstronomyTitle: "Astronomical calculation",
      technicalJudgmentTitle: "Judgment criteria",
      technicalMcIcNote: "In Whole Sign Houses, the MC and IC do not open houses 10 and 4: they are sensitive astronomical points, and Tyche also shows which house they fall in.",
      technicalLimitsCompact: "Local ephemerides through Astronomy Engine. Approximate planetary accuracy is ±1′; Ascendant, MC, houses, and lots depend on the time, coordinates, and time zone used.",
      technicalUsePrivacyCompact: "Educational use. For rectification, critical charts, or professional research, compare the data with specialized ephemerides and sources. Place search and historical images may contact external services.",
      interpretationTitle: "Natal reading",
      interpretationLeadTitle: "In one sentence",
      interpretationSummary: "Most important",
      interpretationReading: "Interpretation",
      interpretationEvidence: "View technical basis",
      interpretationWhy: "First comes a plain-language reading. The technical basis stays available below.",
      conclusionLabel: "Conclusion",
      interpretationTimingNote: "About prediction",
      interpretationTimingText: "This reading does not predict dates. It describes background themes in the natal chart. To know when they activate, use timing techniques such as annual profections, zodiacal releasing, or relevant transits.",
      dominantTopicTitle: "Main focuses",
      mainFocusTitle: "Most activated zones",
      hierarchyTitle: "Reading basis",
      lifeDirectionTitle: "Life Direction",
      publicProjectionTitle: "Public projection",
      limitsTitle: "Limits",
      limitsEducational: "Educational use: the reading does not replace professional ephemerides or rectification research.",
      limitsPrecision: "Approximate planetary accuracy ±1′; Ascendant, MC, and houses depend strongly on time, coordinates, and zone used.",
      limitsPrivacy: "The chart is calculated locally; place search and historical images do contact external services.",
      resourcesTitle: "Supports and openings",
      tensionsTitle: "Pressures to manage",
      visibilityTitle: "Visibility of key planets",
      configurationsTitle: "Planetary supports and pressures",
      moonJudgmentTitle: "Lunar flow",
      foundationsTitle: "Background support",
      prominenceLabel: "Prominence",
      easeLabel: "Essential condition",
      tensionLabel: "Tension",
      supportLabel: "Support",
      qualityTitle: "Reading indicators",
      signalsLabel: "Signals",
      scoreBreakdownTitle: "Score breakdown",
      scoreTotalLabel: "Total",
      scorePointsLabel: "points",
      scoreCategoryLifeAxis: "Life axis",
      scoreCategorySect: "Sect light",
      scoreCategoryPublic: "Public projection",
      scoreCategoryAngular: "Angularity",
      scoreCategoryLots: "Lots",
      scoreCategoryTriplicity: "Triplicity",
      scoreFocusType: "Focus type",
      focusTypeVital: "vital",
      focusTypePublic: "public",
      focusTypeCircumstantial: "circumstantial",
      focusTypeSupport: "supporting",
      mainLotsAuditTitle: "Principal lots used in judgment",
      lotTableDisplayNote: "The lot table displays only the selected lots.",
      scoreBreakdownCaution: "These points are not an absolute measure: they only organize traditional testimonies to explain why Tyche prioritizes certain Places/Houses.",
      evidenceFocusSection: "Focuses and score",
      evidenceLotsSection: "Principal lots",
      evidenceGeneralSection: "Conditions and notices",
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
      evidenceLotsAlwaysWeighted: "Fortune and Spirit are always calculated for judgment; the lot table only displays the selected lots.",
      evidenceFocuses: "Main focuses by accumulated signals: {focuses}.",
      testimonyStrong: "strong weight",
      testimonyMedium: "medium weight",
      testimonyLow: "indirect weight",
      localDateTime: "Local date",
      utcDateTime: "UTC used",
      coordinates: "Coordinates",
      ephemerisEngine: "Ephemerides",
      boundaryAudit: "Boundary audit",
      noBoundaryNotices: "No notices",
      aspectTableMode: "Configuration table",
      judgmentFrame: "Judgment frame",
      judgmentFrameSign: "Sign-based configurations; degree refines closeness/perfection",
      zodiacBaseWarning: "Approximate sidereal · outside the tropical base mode",
      calendarJulianWarning: "Basic Julian conversion · verify calendar, local zone, and time source",
      mixedModeWarning: "Mixed mode: modern planets are additional data only; they do not enter the base Hellenistic judgment",
      julianInlineWarning: "Notice: Julian conversion is basic. Verify local calendar, civil time, and time source before critical research. For BCE dates, verify year numbering: astronomy uses year 0; traditional historical chronology does not.",
      siderealInlineWarning: "Notice: the sidereal zodiac is approximate and outside Tyche's tropical base frame.",
      mixedInlineWarning: "Notice: modern planets are displayed as an additional layer; the base Hellenistic judgment does not weight them.",
      modernStrictInlineWarning: "Notice: you are in traditional mode, while showing modern planets as an unweighted layer.",
      modernDisplayed: "Modern planets shown",
      modernWeightedBase: "Modern planets weighted in base judgment",
      modernNotWeighted: "No; outside the base Hellenistic judgment",
      sectCalculation: "Sect calculation",
      sectCalculationValue: "Geometric solar altitude {altitude}; no atmospheric refraction",
      sectLiminalDay: "Day chart, liminal",
      sectLiminalNight: "Night chart, liminal",
      sectLiminalNote: "Technically {sect}; treat sect-dependent testimonies as sensitive because the Sun is near the horizon.",
      sectSensitiveDay: "Day chart, sensitive",
      sectSensitiveNight: "Night chart, sensitive",
      sectSensitiveNote: "Technically {sect}; treat sect-dependent formulas and testimonies as sensitive because the time context is uncertain.",
      sectDependencyCaution: "Lower-confidence testimonies: benefic and malefic of sect, malefic contrary to sect, Fortune/Spirit, and triplicity of the sect light.",
      sectLowConfidenceJudgment: "This reading uses the technical sect calculated by Tyche, but several testimonies depend on a sensitive boundary. Check the benefic/malefic of sect, Fortune/Spirit, and triplicity especially if the birth time is rectified.",
      boundaryThreshold: "Applied threshold",
      boundaryThresholdSensitive: "{threshold} for sensitive time context: {reasons}",
      boundaryThresholdNormal: "{threshold} standard",
      boundaryTypeSect: "Sect near horizon",
      boundaryTypeAsc: "Ascendant near sign change",
      boundaryTypeMc: "MC near sign change",
      boundaryTypeIc: "IC near sign change",
      boundaryTypeLot: "{lot} near sign/house change",
      boundaryTypePlanetBound: "{planet} near bound change",
      boundaryChangeSect: "sect",
      boundaryChangeSectLight: "sect light",
      boundaryChangeBeneficMaleficSect: "benefic/malefic of sect",
      boundaryChangeContraryMalefic: "contrary malefic",
      boundaryChangeFortuneSpirit: "Fortune/Spirit formulas",
      boundaryChangeGeneralJudgment: "general judgment",
      boundaryChangeAscLord: "Ascendant lord",
      boundaryChangeWholeSignHouses: "whole-sign houses",
      boundaryChangeLots: "lots",
      boundaryChangeMainFocuses: "main focuses",
      boundaryChangeMcHouse: "MC whole-sign house",
      boundaryChangeIcHouse: "IC whole-sign house",
      boundaryChangeChartProjection: "chart projection/foundation",
      boundaryChangeSecondaryFocuses: "secondary focuses",
      boundaryChangeLotHouse: "lot house",
      boundaryChangeLotLord: "lot lord",
      boundaryChangeTopicReading: "topic reading",
      boundaryChangeDegreeAdministration: "degree administration",
      boundaryChangeOwnMinorDignity: "own minor dignity if applicable",
      boundaryChangeBoundReception: "reception by bound",
      boundaryActionVerifyRectification: "verify time, coordinates, zone used, and possible rectification",
      boundaryActionReviewTimeSource: "review time, source, or rectification",
      boundaryActionVerifyZone: "verify time, coordinates, and zone used",
      boundaryActionReviewTimeCoordinates: "review time and coordinates",
      boundaryActionReviewPlanetaryPrecision: "review birth-time minutes and planetary precision",
      boundaryShiftText: "{angle} within {distance} of the {side}; current: {currentSign}, house {currentHouse}; possible with a small variation: {possibleSign}, house {possibleHouse}",
      boundarySidePrevious: "previous boundary",
      boundarySideNext: "next boundary",
      sensitiveJulian: "Julian calendar",
      sensitiveAuditPending: "pending natal-data audit",
      sensitiveTimeConfidence: "birth time not exact or rounded",
      sensitiveManualOffset: "manual or historical UTC offset",
      sensitiveNoIana: "no clear IANA zone",
      alternateSectLotsTitle: "Alternative lots if sect changes",
      alternateSectRolesTitle: "Alternative roles if sect changes",
      lotUsedByTyche: "Used by Tyche",
      lotIfSectReversed: "If sect reverses",
      sectRolesUsedByTyche: "Roles used by Tyche",
      sectRolesIfReversed: "Roles if sect reverses",
      dayFormulaLabel: "day formula",
      nightFormulaLabel: "night formula",
      lotAuditPosition: "Position",
      lotAuditLord: "Lord",
      lotAuditDirectAdministration: "Direct administration",
      lotAuditLordRole: "Lord role",
      lotAuditFormula: "Formula",
      lotAuditTestimonies: "Testimonies",
      lotAuditPressures: "Pressures",
      lotAuditDegree: "Degree",
      lotAuditLordCondition: "Lord condition",
      lotAuditLordAngularity: "Lord angularity",
      lotAuditLordSolarPhase: "Lord zodiacal solar phase",
      lotAuditBeneficTestimony: "Benefic testimony",
      lotAuditMaleficPressure: "Malefic pressure",
      lotAuditRawPressure: "Raw pressure",
      lotAuditRegulation: "Regulation",
      lotAuditReading: "Reading",
      negotiatedSupport: "negotiated support",
      regulatedBeneficFriction: "benefic testimony with regulated friction",
      regulatedPressure: "regulated pressure",
      solarThresholds: "Solar thresholds",
      solarThresholdValues: "Under beams 15° · combustion 8° · in the heart 1°",
      moonVoidDefinitions: "Void Moon",
      moonVoidDefinitionsValues: "Hellenistic 30° · sign exit · no close application within 12°",
      astronomyEngine: "Local Astronomy Engine",
      fallbackEngine: "Approximate fallback engine",
      ascLordTitle: "Ascendant / Hour-Marker Lord",
      ascLordText: "{lord} rules {ascSign} and falls in {lordPosition}, house {house}. As ruler of the Ascendant / Hour-Marker, it links the native's life direction with this house's topics: {topics}. Its angularity is {angularity}.",
      dignifiedText: "Essential condition: {condition}.",
      mcWholeSignNote: "In Whole Sign Houses, houses are counted from the Ascendant sign. The MC and IC do not open houses 10 and 4: they are sensitive astronomical points. Tyche also shows which house they fall in.",
      noMajorDignity: "no major dignity",
      dignityMajor: "Major dignity",
      dignityTriplicity: "Triplicity support",
      dignityMinor: "Own minor dignity",
      dignityAdministration: "Degree administration",
      weaknesses: "Weaknesses",
      none: "none",
      moonTitle: "Lunar condition",
      moonStatus: "Lunar status",
      moonStatusActive: "Active: it perfects a major contact before leaving the sign.",
      moonStatusVoid30: "Void by the Hellenistic 30° definition: it perfects no major contact in that span.",
      moonStatusVoidSign: "No perfection before leaving the sign, while the Hellenistic 30° check remains separate.",
      moonStatusNoClose: "No close application within 12°: the signal is broad rather than punctual.",
      moonPhase: "Synodic phase",
      moonElongation: "Sun→Moon elongation",
      moonLastSeparation: "Last contact",
      moonNextApplication: "Next contact",
      moonCalculationMethod: "Lunar contact method",
      lunarMethodIterative: "iterative search",
      lunarMethodFallback: "linear estimate",
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
      tablePhase: "Zodiacal solar phase",
      tablePlace: "Place/House",
      tableSign: "Sign",
      tableRuler: "Ruler",
      tablePlanets: "Planets",
      tableTopics: "Topics",
      tableLot: "Lot",
      tableLord: "Lot lord",
      tableLordHouse: "Lord house",
      tableFormula: "Formula",
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
      boundLord: "bound lord: {planet}",
      decanLord: "decan lord: {planet}",
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
      fromSun: "from the Sun",
      chariotBy: "chariot by {condition}",
      chariotMitigationBy: "chariot-like protection by {condition}",
      noChariot: "no chariot",
      natalDataSource: "Natal data source",
      brennanReference: "Interpretive reference",
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
          "<p>La opción juliana aplica una conversión básica. Para cartas antiguas o premodernas hay que verificar calendario local, zona, LMT y fuente temporal.</p>",
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
          "<p>Queda fuera del marco tropical usado por defecto para el juicio helenístico base de Tyche.</p>",
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
        title: "Tabla de configuraciones",
        body: [
          "<p>Define si las tablas muestran relaciones por signo, solo contactos por grado con orbe, o ambas. Una configuración por signo puede existir aunque el aspecto no perfeccione por grado.</p>",
          "<p>La lectura natal usa configuraciones por signo como marco tradicional; los aspectos por grado funcionan como capa de precisión y perfección.</p>",
        ],
      },
      orb: {
        title: "Orbe",
        body: [
          "<p>Margen de tolerancia en grados para considerar un aspecto por grado. No afecta a las configuraciones estrictamente por signo.</p>",
          "<p>El orbe afecta a contactos por grado, cercanía y aplicación cercana; no elimina las configuraciones por signo usadas en el juicio.</p>",
        ],
      },
      bounds: {
        title: "Términos / límites",
        body: [
          "<p>Subdivisiones desiguales de cada signo gobernadas por planetas. Tyche usa términos egipcios.</p>",
          "<p>El planeta que gobierna el término administra el grado. Solo se cuenta como dignidad menor propia cuando coincide con el planeta situado allí.</p>",
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
          "<p>Los planetas significan principios, potencias y cualidades; los signos describen cómo actúan y los lugares dónde se manifiestan.</p>",
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
          "<p>Tyche usa altitud solar geométrica. No aplica correcciones observacionales como refracción atmosférica.</p>",
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
          "<p>Regla de conversión aplicada para pasar de hora local a UTC. Puede ser una zona IANA con reglas históricas, una diferencia UTC manual, LMT por longitud o un valor preparado para un personaje histórico.</p>",
          "<p>Cuando la carta procede del archivo histórico, el valor mostrado se obtiene de los datos natales auditados del personaje y de la conversión temporal guardada para ese ejemplo.</p>",
          "<p>Es un dato crítico porque los ángulos dependen directamente del tiempo universal obtenido.</p>",
        ],
      },
      ascLord: {
        title: "Regente del Ascendente",
        body: [
          "<p>Planeta que rige el signo ascendente por domicilio. Es el señor del Ascendente y uno de los indicadores principales de vida, cuerpo, carácter y dirección.</p>",
          "<p>La casa donde cae muestra qué temas orientan la dirección principal de la carta; su condición esencial y angularidad describen con qué recursos actúa.</p>",
        ],
      },
      essentialCondition: {
        title: "Condición esencial",
        body: [
          "<p>Estado zodiacal de un planeta según dignidades y debilidades: domicilio, exaltación, triplicidad, término, decanato, detrimento y caída.</p>",
          "<p>Describe si el planeta actúa con recursos propios, apoyo parcial, administración ajena del grado o dificultad esencial.</p>",
        ],
      },
      dignityMajor: {
        title: "Dignidad mayor",
        body: [
          "<p>Recurso esencial fuerte por domicilio o exaltación. Indica que el planeta tiene autoridad, honor o coherencia zodiacal para actuar según su naturaleza.</p>",
          "<p>No incluye triplicidad, término ni decanato. Tyche reserva esta categoría para los testimonios mayores.</p>",
        ],
      },
      dignityTriplicity: {
        title: "Soporte por triplicidad",
        body: [
          "<p>Apoyo elemental que depende de la secta de la carta: hay un regente activo por secta, uno fuera de secta y uno cooperante.</p>",
          "<p>Es soporte real, pero no equivale a domicilio o exaltación; por eso Tyche lo muestra separado de la dignidad mayor.</p>",
        ],
      },
      dignityMinor: {
        title: "Dignidad menor propia",
        body: [
          "<p>Recurso menor cuando el planeta cae en su propio término o su propio decanato.</p>",
          "<p>Da capacidad local sobre ese grado, pero tiene menos peso que domicilio o exaltación.</p>",
        ],
      },
      dignityAdministration: {
        title: "Administración del grado",
        body: [
          "<p>Indica qué planeta gobierna el término o decanato donde cae el significador cuando ese regente no es el propio planeta.</p>",
          "<p>No es una dignidad propia automática ni una mitigación fuerte por sí sola: describe quién administra el grado y puede crear dependencia, canal o recepción si hay relación entre planetas.</p>",
        ],
      },
      weaknesses: {
        title: "Debilidades",
        body: [
          "<p>Dificultades esenciales por detrimento o caída. El planeta actúa en un signo que contradice o rebaja su modo natural de operar.</p>",
          "<p>No significa fracaso automático; señala que el planeta necesita más ajuste, apoyo o mediación para expresar sus asuntos.</p>",
        ],
      },
      noMajorDignity: {
        title: "Sin dignidad mayor",
        body: [
          "<p>Indica que el planeta no está en domicilio ni exaltación. Puede seguir teniendo soporte por triplicidad o dignidad menor propia; el señor del término/decanato ajeno se muestra como administración del grado.</p>",
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
          "<p>Cuando un cuerpo cae en su propio término, cuenta como dignidad menor propia. Si cae en término de otro planeta, Tyche lo muestra como administración del grado, no como recurso propio automático.</p>",
        ],
      },
      decan: {
        title: "Decanato",
        body: [
          "<p>División de cada signo en tres segmentos de 10°. Tyche usa el orden caldeo repetido.</p>",
          "<p>También llamado faz. Solo actúa como dignidad menor propia cuando el planeta ocupa su propio decanato; si el señor es otro, describe administración local del grado.</p>",
        ],
      },
      boundLord: {
        title: "Señor del término",
        body: [
          "<p>Planeta que gobierna el término o límite del grado ocupado.</p>",
          "<p>Si no coincide con el planeta situado allí, describe autoridad o administración ajena sobre esa posición, no una dignidad propia del planeta ocupado.</p>",
        ],
      },
      decanLord: {
        title: "Señor del decanato",
        body: [
          "<p>Planeta que gobierna el decanato o faz de 10° donde cae el cuerpo.</p>",
          "<p>Tyche lo separa de la dignidad menor propia para no convertir todo decanato en apoyo automático.</p>",
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
        title: "Fase solar zodiacal",
        body: [
          "<p>Relación de un planeta no luminario con el Sol. Puede ser matutino/oriental, vespertino/occidental, bajo los rayos, combusto o en el corazón.</p>",
          "<p>Tyche aplica umbrales zodiacales tradicionales; no calcula visibilidad heliacal observacional, que dependería también de latitud, brillo, horizonte y condiciones atmosféricas.</p>",
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
      moonStatus: {
        title: "Estado lunar",
        body: [
          "<p>Resumen operativo de la condición lunar: si la Luna perfecciona un contacto, queda vacía según la regla helenística de 30°, no perfecciona antes de salir del signo o no tiene aplicación cercana por orbe.</p>",
          "<p>La línea no sustituye los detalles inferiores; solo ordena la lectura para ver de un vistazo si la actividad lunar continúa o queda más abierta.</p>",
        ],
      },
      moonPhase: {
        title: "Fase lunar",
        body: [
          "<p>Nombre de la fase según la elongación zodiacal entre Sol y Luna. Tyche muestra también el ángulo en grados.</p>",
          "<p>El ciclo va de Luna nueva a llena y vuelve por las fases menguantes hasta la balsámica.</p>",
        ],
      },
      moonElongation: {
        title: "Elongación Sol→Luna",
        body: [
          "<p>Distancia zodiacal entre el Sol y la Luna, medida desde la posición solar hacia la lunar.</p>",
          "<p>Este ángulo sostiene el nombre de la fase lunar y ayuda a situar la Luna dentro del ciclo sinódico.</p>",
        ],
      },
      moonLastSeparation: {
        title: "Último contacto lunar",
        body: [
          "<p>Última configuración mayor que la Luna perfeccionó antes del momento de la carta.</p>",
          "<p>Sirve para ver de qué planeta viene la Luna y qué tipo de testimonio acaba de transmitir.</p>",
        ],
      },
      moonNextApplication: {
        title: "Próximo contacto lunar",
        body: [
          "<p>Siguiente configuración mayor que la Luna perfeccionará si avanza desde su posición actual.</p>",
          "<p>Indica hacia qué planeta se dirige la actividad lunar y ayuda a valorar continuidad, bloqueo o transmisión.</p>",
        ],
      },
      moonVoc: {
        title: "Vacía de curso",
        body: [
          "<p>Tyche usa como juicio principal la definición helenística amplia: la Luna está vacía si no perfecciona una conjunción, sextil, cuadrado, trígono u oposición en los próximos 30° de movimiento lunar.</p>",
          "<p>También se muestra si la Luna perfecciona o no antes de abandonar el signo. El indicador de ausencia de aplicación dentro de 12° se mantiene aparte para no confundir una lectura por orbe con la definición de 30°.</p>",
        ],
      },
      moonVoc30: {
        title: "Vacía de curso, definición helenística",
        body: [
          "<p>Indica si la Luna no perfecciona ninguna configuración mayor en los próximos 30° de su propio movimiento.</p>",
          "<p>Esta es la definición amplia que Tyche usa como indicador principal de vacío de curso en la capa helenística.</p>",
        ],
      },
      moonVocSign: {
        title: "Vacía de curso, hasta salir del signo",
        body: [
          "<p>Indica si la Luna perfecciona o no una configuración mayor antes de abandonar el signo donde se encuentra.</p>",
          "<p>Tyche lo muestra separado de la definición helenística de 30° para no mezclar dos criterios distintos.</p>",
        ],
      },
      moonNoApplyingWithinOrb: {
        title: "Sin aplicación cercana, 12°",
        body: [
          "<p>Indica si la Luna tiene alguna aplicación mayor dentro de un margen cercano de 12°.</p>",
          "<p>Es una lectura por cercanía u orbe; no sustituye a la definición helenística de vacío de curso por los próximos 30°.</p>",
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
          "<p>No es automáticamente apoyo ni daño: intensifica la convivencia, y su cualidad depende de la naturaleza de los planetas, secta, condición, recepción, cercanía corporal y ocultación solar.</p>",
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
      reception: {
        title: "Recepción",
        body: [
          "<p>Mitigación que aparece cuando dos planetas configurados se reciben por dignidad: domicilio, exaltación, triplicidad o término.</p>",
          "<p>Tyche usa recepción por dignidad en sentido amplio: fuerte por domicilio o exaltación; media por término o triplicidad activa; débil por triplicidad fuera de secta o cooperante. La recepción domiciliar sigue siendo la forma principal.</p>",
          "<p>Cuando ambos planetas tienen autoridad sobre la posición del otro, Tyche lo señala como recepción mutua. La reciprocidad crea canal en ambas direcciones, pero su fuerza depende de si ocurre por domicilio/exaltación, término o triplicidad.</p>",
          "<p>En un contacto difícil, la recepción da al planeta presionado o al planeta que presiona un canal formal para manejar la relación; no borra la tensión, pero puede moderarla.</p>",
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
          "<p>The Julian option applies a basic conversion. For ancient or premodern charts, verify local calendar, zone, LMT, and time source.</p>",
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
          "<p>It is outside the tropical frame used by default for Tyche's base Hellenistic judgment.</p>",
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
        title: "Configuration table",
        body: [
          "<p>Defines whether the tables show sign-based relationships, degree-only contacts with orb, or both.</p>",
          "<p>The natal reading uses sign-based configurations as the traditional frame; degree aspects act as a precision and perfection layer.</p>",
        ],
      },
      orb: {
        title: "Orb",
        body: [
          "<p>Degree tolerance for a degree-based aspect. It does not affect strictly sign-based configurations.</p>",
          "<p>The orb affects degree contacts, closeness, and close application; it does not remove the sign-based configurations used in judgment.</p>",
        ],
      },
      bounds: {
        title: "Terms / bounds",
        body: [
          "<p>Unequal subdivisions of each sign governed by planets. Tyche uses Egyptian bounds.</p>",
          "<p>The bound lord administers the degree. It counts as own minor dignity only when it is the same planet placed there.</p>",
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
          "<p>Planets signify principles, powers, and qualities; signs show how they act; places show where they manifest.</p>",
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
          "<p>Tyche uses geometric solar altitude. It does not apply observational corrections such as atmospheric refraction.</p>",
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
          "<p>The conversion rule used to turn local time into UTC. It may be an IANA zone with historical rules, a manual UTC offset, LMT by longitude, or a prepared value for a historical figure.</p>",
          "<p>When the chart comes from the historical archive, the displayed value is taken from the figure's audited natal data and from the stored time conversion for that example.</p>",
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
          "<p>It describes whether the planet acts with its own resources, partial support, another planet's degree administration, or essential difficulty.</p>",
        ],
      },
      dignityMajor: {
        title: "Major dignity",
        body: [
          "<p>Strong essential resource through domicile or exaltation. It shows that the planet has authority, honor, or zodiacal coherence for acting according to its nature.</p>",
          "<p>It does not include triplicity, bound, or decan. Tyche reserves this category for the major testimonies.</p>",
        ],
      },
      dignityTriplicity: {
        title: "Triplicity support",
        body: [
          "<p>Elemental support that depends on the chart's sect: one ruler is active by sect, one is out of sect, and one cooperates.</p>",
          "<p>It is real support, but not the same as domicile or exaltation; Tyche therefore shows it separately from major dignity.</p>",
        ],
      },
      dignityMinor: {
        title: "Own minor dignity",
        body: [
          "<p>Minor resource when a planet falls in its own bound or its own decan.</p>",
          "<p>It gives local capacity over that degree, but weighs less than domicile or exaltation.</p>",
        ],
      },
      dignityAdministration: {
        title: "Degree administration",
        body: [
          "<p>Shows which planet rules the bound or decan occupied by the significator when that ruler is not the significator itself.</p>",
          "<p>It is not automatic dignity of its own or strong mitigation by itself: it describes who administers the degree and can create dependency, channel, or reception if the planets relate.</p>",
        ],
      },
      weaknesses: {
        title: "Weaknesses",
        body: [
          "<p>Essential difficulties through detriment or fall. The planet acts in a sign that contradicts or lowers its natural mode of operation.</p>",
          "<p>This does not mean automatic failure; it shows that the planet needs more adjustment, support, or mediation to express its topics.</p>",
        ],
      },
      noMajorDignity: {
        title: "No major dignity",
        body: [
          "<p>The planet is not in domicile or exaltation. It may still have triplicity support or own minor dignity; another planet's bound/decan lordship is shown as degree administration.</p>",
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
          "<p>When a body falls in its own bound, it counts as an own minor dignity. If it falls in another planet's bound, Tyche shows degree administration, not automatic resources of its own.</p>",
        ],
      },
      decan: {
        title: "Decan",
        body: [
          "<p>One of three 10° divisions of a sign. Tyche uses the repeating Chaldean order.</p>",
          "<p>Also called face. It acts as an own minor dignity only when the planet occupies its own decan; if another planet rules the decan, it describes local degree administration.</p>",
        ],
      },
      boundLord: {
        title: "Bound lord",
        body: [
          "<p>The planet that governs the bound or term of the occupied degree.</p>",
          "<p>If it is not the planet placed there, it describes another planet's authority or administration over that position, not the occupied planet's own dignity.</p>",
        ],
      },
      decanLord: {
        title: "Decan lord",
        body: [
          "<p>The planet that governs the 10° decan or face occupied by the body.</p>",
          "<p>Tyche separates this from own minor dignity so that every decan is not treated as automatic support.</p>",
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
        title: "Zodiacal solar phase",
        body: [
          "<p>A non-luminary planet's relationship to the Sun. It may be morning/oriental, evening/occidental, under the beams, combust, or in the heart.</p>",
          "<p>Tyche applies traditional zodiacal thresholds; it does not calculate observational heliacal visibility, which would also depend on latitude, brightness, horizon, and atmospheric conditions.</p>",
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
      moonStatus: {
        title: "Lunar status",
        body: [
          "<p>Operational summary of the lunar condition: whether the Moon perfects a contact, is void by the Hellenistic 30° rule, does not perfect before leaving the sign, or has no close orb-based application.</p>",
          "<p>This line does not replace the details below; it gives a quick reading of whether lunar activity continues or remains more open-ended.</p>",
        ],
      },
      moonPhase: {
        title: "Lunar phase",
        body: [
          "<p>The phase name based on zodiacal elongation from Sun to Moon. Tyche also shows the angle in degrees.</p>",
          "<p>The cycle runs from New Moon to Full Moon and back through waning phases to Balsamic.</p>",
        ],
      },
      moonElongation: {
        title: "Sun→Moon elongation",
        body: [
          "<p>The zodiacal distance from the Sun to the Moon, measured forward from the solar position to the lunar position.</p>",
          "<p>This angle supports the lunar phase name and places the Moon within the synodic cycle.</p>",
        ],
      },
      moonLastSeparation: {
        title: "Last lunar contact",
        body: [
          "<p>The last major configuration the Moon perfected before the chart moment.</p>",
          "<p>It shows which planet the Moon is coming from and what testimony it has just transmitted.</p>",
        ],
      },
      moonNextApplication: {
        title: "Next lunar contact",
        body: [
          "<p>The next major configuration the Moon will perfect as it moves from its current position.</p>",
          "<p>It shows where lunar activity is heading and helps judge continuity, blockage, or transmission.</p>",
        ],
      },
      moonVoc: {
        title: "Void of course",
        body: [
          "<p>Tyche uses the broader Hellenistic definition as the main judgment: the Moon is void if it perfects no conjunction, sextile, square, trine, or opposition in the next 30° of lunar motion.</p>",
          "<p>Tyche also shows whether the Moon perfects before leaving its sign. The separate no-application-within-12° indicator remains apart so an orb-based reading is not confused with the 30° definition.</p>",
        ],
      },
      moonVoc30: {
        title: "Void of course, Hellenistic definition",
        body: [
          "<p>Shows whether the Moon perfects no major configuration in the next 30° of its own motion.</p>",
          "<p>This is the broader definition Tyche uses as the main void-of-course indicator in the Hellenistic layer.</p>",
        ],
      },
      moonVocSign: {
        title: "Void of course, until sign exit",
        body: [
          "<p>Shows whether the Moon perfects a major configuration before leaving its current sign.</p>",
          "<p>Tyche keeps it separate from the 30° Hellenistic definition so the two criteria are not blended.</p>",
        ],
      },
      moonNoApplyingWithinOrb: {
        title: "No close application, 12°",
        body: [
          "<p>Shows whether the Moon has a major application within a close 12° range.</p>",
          "<p>This is an orb-based proximity indicator; it does not replace the 30° Hellenistic void-of-course definition.</p>",
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
          "<p>It is not automatically helpful or harmful: it intensifies cohabitation, and its quality depends on the planets involved, sect, condition, reception, bodily closeness, and solar concealment.</p>",
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
      reception: {
        title: "Reception",
        body: [
          "<p>A mitigation that appears when two configured planets receive one another by dignity: domicile, exaltation, triplicity, or bound.</p>",
          "<p>Tyche uses reception by dignity in a broad sense: strong by domicile or exaltation; medium by bound or active triplicity; weak by out-of-sect or cooperating triplicity. Domicile reception remains the principal form.</p>",
          "<p>When both planets have authority over the other's position, Tyche marks it as mutual reception. Reciprocity creates a channel in both directions, but its force depends on whether it occurs by domicile/exaltation, bound, or triplicity.</p>",
          "<p>In a difficult contact, reception gives the pressured planet or the pressuring planet a formal channel for handling the relationship; it does not erase tension, but it can moderate it.</p>",
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
      time: "05:40",
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
      birthLabel: { es: "14 mayo 1944, 05:40", en: "14 May 1944, 05:40" },
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

  // Every current historical example must have one row here; static tests enforce full coverage.
  const HISTORICAL_AUDIT_ROWS = Object.freeze([
    { id: "ada-lovelace", rating: "B", source: "Bio/autobiography", url: "https://www.astro.com/astro-databank/Lovelace,_Ada", zoneReliability: "lmt" },
    { id: "alan-turing", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Turing,_Alan", zoneReliability: "historical" },
    { id: "albert-einstein", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Einstein,_Albert", zoneReliability: "lmt" },
    { id: "amelia-earhart", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Earhart,_Amelia", zoneReliability: "historical" },
    { id: "al-gore", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Gore,_Al", zoneReliability: "historical" },
    { id: "amanda-knox", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Knox,_Amanda", zoneReliability: "historical" },
    { id: "arnold-schwarzenegger", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Schwarzenegger,_Arnold", zoneReliability: "historical" },
    { id: "barack-obama", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Obama,_Barack", zoneReliability: "historical" },
    { id: "bill-clinton", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Clinton,_Bill", zoneReliability: "historical" },
    { id: "carl-sagan", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Sagan,_Carl", zoneReliability: "historical" },
    { id: "elvis-presley", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Presley,_Elvis", zoneReliability: "historical" },
    { id: "ernest-hemingway", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Hemingway,_Ernest", zoneReliability: "historical" },
    { id: "frank-lloyd-wright", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Wright,_Frank_Lloyd", zoneReliability: "lmt" },
    { id: "pablo-picasso", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Picasso,_Pablo", zoneReliability: "lmt" },
    { id: "frida-kahlo", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Kahlo,_Frida", zoneReliability: "lmt" },
    { id: "gabriel-garcia-marquez", rating: "B", source: "Bio/autobiography", url: "https://www.astro.com/astro-databank/Garc%C3%ADa_M%C3%A1rquez,_Gabriel", zoneReliability: "historical" },
    { id: "george-lucas", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Lucas,_George", zoneReliability: "historical" },
    { id: "george-w-bush", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Bush,_George_W.", zoneReliability: "historical" },
    { id: "hans-christian-andersen", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Andersen,_Hans_Christian", zoneReliability: "lmt" },
    { id: "henri-matisse", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Matisse,_Henri", zoneReliability: "lmt" },
    { id: "herman-melville", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Melville,_Herman", zoneReliability: "lmt" },
    { id: "igor-stravinsky", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Stravinsky,_Igor", zoneReliability: "historical", sourceDateLabel: { es: "17 junio 1882 gregoriano / 5 junio 1882 juliano", en: "17 June 1882 Gregorian / 5 June 1882 Julian" } },
    { id: "jorge-luis-borges", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Borges,_Jorge_Luis", zoneReliability: "historical" },
    { id: "julio-cortazar", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Cort%C3%A1zar,_Julio", zoneReliability: "historical" },
    { id: "jonathan-brandis", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Brandis,_Jonathan", zoneReliability: "historical" },
    { id: "kurt-cobain", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Cobain,_Kurt", zoneReliability: "historical" },
    { id: "le-corbusier", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Le_Corbusier", zoneReliability: "historical" },
    { id: "lisa-marie-presley", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Presley,_Lisa_Marie", zoneReliability: "historical" },
    { id: "m-c-escher", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Escher,_M._C.", zoneReliability: "historical" },
    { id: "marilyn-monroe", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Monroe,_Marilyn", zoneReliability: "historical" },
    { id: "michael-j-fox", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Fox,_Michael_J.", zoneReliability: "historical" },
    { id: "patrick-swayze", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Swayze,_Patrick", zoneReliability: "historical" },
    { id: "robert-downey-jr", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Downey,_Robert_Jr.", zoneReliability: "historical" },
    { id: "salvador-dali", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Dali,_Salvador", zoneReliability: "historical" },
    { id: "simone-de-beauvoir", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Beauvoir,_Simone_de", zoneReliability: "historical" },
    { id: "rene-magritte", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Magritte,_Ren%C3%A9", zoneReliability: "historical" },
    { id: "sigmund-freud", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Freud,_Sigmund", zoneReliability: "historical" },
    { id: "steve-wozniak", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Wozniak,_Steve", zoneReliability: "historical" },
    { id: "vanessa-williams", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Williams,_Vanessa", zoneReliability: "historical" },
    { id: "whitney-houston", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Houston,_Whitney", zoneReliability: "historical" },
    { id: "victoria", rating: "AA", source: "Quoted BC/BR", url: "https://www.astro.com/astro-databank/Victoria,_Queen_of_the_United_Kingdom", zoneReliability: "lmt" },
    { id: "vincent-van-gogh", rating: "AA", source: "BC/BR in hand", url: "https://www.astro.com/astro-databank/Van_Gogh,_Vincent", zoneReliability: "lmt" },
    { id: "winston-churchill", rating: "A", source: "From memory", url: "https://www.astro.com/astro-databank/Churchill,_Winston", zoneReliability: "historical" },
  ]);

  const HISTORICAL_AUDIT = Object.freeze(Object.fromEntries(HISTORICAL_AUDIT_ROWS.map((row) => {
    const sourceLabel = `Astro-Databank (${row.source}, Rodden ${row.rating})`;
    return [row.id, {
      auditStatus: "audited",
      timeConfidence: row.rating === "AA" ? "exact" : "reported",
      zoneReliability: row.zoneReliability,
      externalAuditDate: "2026-06-10",
      sourceDateLabel: row.sourceDateLabel || "",
      natalDataSource: {
        label: { es: sourceLabel, en: sourceLabel },
        url: row.url,
        type: "rated-database",
        roddenRating: row.rating,
        timeSource: {
          es: `Source Notes de Astro-Databank; ${row.source}, Rodden ${row.rating}.`,
          en: `Astro-Databank Source Notes; ${row.source}, Rodden ${row.rating}.`,
        },
      },
    }];
  })));

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

  function activeLocale() {
    return state.lang === "es" ? "es-ES" : "en";
  }

  function activeSortLocale() {
    return state.lang === "es" ? "es" : "en";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function wikipediaHost() {
    return state.lang === "es" ? "es.wikipedia.org" : "en.wikipedia.org";
  }

  function localizeWikipediaUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.endsWith(".wikipedia.org")) parsed.hostname = wikipediaHost();
      return parsed.toString();
    } catch {
      return url;
    }
  }

  function personWikipediaUrl(person) {
    if (typeof person.wikipedia === "string") return localizeWikipediaUrl(person.wikipedia);
    if (person.wikipedia) {
      const preferred = person.wikipedia[state.lang] || person.wikipedia.en || person.wikipedia.es;
      if (preferred) return localizeWikipediaUrl(preferred);
    }
    const slug = encodeURIComponent(person.name.replace(/\s+/g, "_"));
    return `https://${wikipediaHost()}/wiki/${slug}`;
  }

  function capitalizeText(value) {
    const chars = Array.from(String(value ?? ""));
    const index = chars.findIndex((char) => char.toLowerCase() !== char.toUpperCase());
    if (index === -1) return chars.join("");
    chars[index] = chars[index].toLocaleUpperCase(activeLocale());
    return chars.join("");
  }

  function capitalizeStructuredText(root = document) {
    const targets = root.querySelectorAll?.("dl dt, dl dd, ul li, ol li") || [];
    targets.forEach((node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
        acceptNode(textNode) {
          return Array.from(textNode.nodeValue || "").some((char) => char.toLowerCase() !== char.toUpperCase())
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      });
      const textNode = walker.nextNode();
      if (!textNode) return;
      textNode.nodeValue = capitalizeText(textNode.nodeValue);
    });
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

  const GLOSSARY_TEXT_MATCHERS = Object.freeze([
    ["noMajorDignity", ["sin dignidad mayor", "no major dignity"]],
    ["domicile", ["domicilio", "domicile"]],
    ["detriment", ["detrimento", "detriment"]],
    ["exaltation", ["exaltacion", "exaltation"]],
    ["fall", ["caida", "fall"]],
    ["triplicity", ["triplicidad", "triplicity"]],
    ["boundLord", ["senor del termino", "bound lord"]],
    ["decanLord", ["senor del decanato", "decan lord"]],
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
    ["reception", ["recepcion", "reception", "recibe"]],
  ]);

  function glossaryKeyForText(value) {
    const normalized = normalizeText(value);
    if (!normalized || normalized === "—" || normalized === "-") return "";
    return GLOSSARY_TEXT_MATCHERS.find(([, needles]) => needles.some((needle) => normalized.includes(needle)))?.[0] || "";
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
    return role ? `${label} —${t(role)}—` : label;
  }

  function glossaryList(items, chart = null) {
    return items.map((item) => glossaryMaybe(dignityDisplayLabel(item, chart), glossaryKeyForText(item), "capitalize-first")).join(", ");
  }

  function dignityGroups(items) {
    const groups = { major: [], triplicity: [], minor: [], administration: [], weakness: [] };
    items.forEach((item) => {
      const key = glossaryKeyForText(item);
      if (["domicile", "exaltation"].includes(key)) groups.major.push(item);
      else if (key === "triplicity") groups.triplicity.push(item);
      else if (["bound", "decan"].includes(key)) groups.minor.push(item);
      else if (["boundLord", "decanLord"].includes(key)) groups.administration.push(item);
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
    $("#personDataClose")?.setAttribute("aria-label", t("close"));
    if ($("#personDataClose")) $("#personDataClose").title = t("close");
  }

  function buildGlossaryPopoverModel(key) {
    const entry = glossaryEntry(key);
    if (!entry) return null;
    return {
      title: entry.title,
      bodyHtml: entry.body.join(""),
    };
  }

  function renderGlossaryPopover(model) {
    const popover = $("#glossaryPopover");
    $("#glossaryTitle").textContent = model.title;
    $("#glossaryBody").innerHTML = model.bodyHtml;
    capitalizeStructuredText($("#glossaryBody"));
    popover.hidden = false;
    return popover;
  }

  function setGlossaryReturnFocus(trigger) {
    state.glossaryReturnFocus = trigger || null;
  }

  function restoreGlossaryReturnFocus(restoreFocus) {
    if (restoreFocus && state.glossaryReturnFocus) state.glossaryReturnFocus.focus();
  }

  function clearGlossaryReturnFocus() {
    state.glossaryReturnFocus = null;
  }

  function glossaryPopoverPorts() {
    return {
      buildModel: buildGlossaryPopoverModel,
      renderPopover: renderGlossaryPopover,
      setReturnFocus: setGlossaryReturnFocus,
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      position: positionGlossary,
      readPopover: () => $("#glossaryPopover"),
      restoreReturnFocus: restoreGlossaryReturnFocus,
      clearReturnFocus: clearGlossaryReturnFocus,
    };
  }

  function openGlossary(key, trigger, ports = glossaryPopoverPorts()) {
    const model = ports.buildModel(key);
    if (!model) return;
    ports.renderPopover(model);
    ports.setReturnFocus(trigger);
    ports.requestFrame(() => ports.position(trigger));
  }

  function closeGlossary({ restoreFocus = false } = {}, ports = glossaryPopoverPorts()) {
    const popover = ports.readPopover();
    if (!popover || popover.hidden) return;
    popover.hidden = true;
    popover.removeAttribute("style");
    ports.restoreReturnFocus(restoreFocus);
    ports.clearReturnFocus();
  }

  function positionFloatingPopover(popover, trigger) {
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

  function positionGlossary(trigger) {
    positionFloatingPopover($("#glossaryPopover"), trigger);
  }

  function positionPersonData(trigger) {
    positionFloatingPopover($("#personDataPopover"), trigger);
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

  function formatSignedAngle(value) {
    return `${value >= 0 ? "+" : "-"}${formatAngle(value)}`;
  }

  function metric(label, value, valueClass = "", labelGlossary = "", valueGlossary = "") {
    const classAttr = valueClass ? ` class="${valueClass}"` : "";
    const labelHtml = labelGlossary ? glossaryTerm(label, labelGlossary) : escapeHtml(label);
    const valueHtml = valueGlossary ? glossaryTerm(value, valueGlossary, valueClass) : escapeHtml(value);
    return `<div class="metric"><b>${labelHtml}</b><span${classAttr}>${valueHtml}</span></div>`;
  }

  function sectSensitivityState(chart) {
    const distance = Math.abs(chart.sunAltitude);
    const threshold = sectBoundaryThresholdInfo(chart);
    if (distance <= 1) return "liminal";
    if (threshold.sensitive && distance <= threshold.threshold) return "sensitive";
    return "stable";
  }

  function chartSectLabel(chart) {
    const stateKey = sectSensitivityState(chart);
    if (stateKey === "liminal") return chart.isDay ? t("sectLiminalDay") : t("sectLiminalNight");
    if (stateKey === "sensitive") return chart.isDay ? t("sectSensitiveDay") : t("sectSensitiveNight");
    return chart.isDay ? t("dayChart") : t("nightChart");
  }

  function sectSensitivityNote(chart) {
    const stateKey = sectSensitivityState(chart);
    if (stateKey === "stable") return "";
    const sect = chart.isDay ? t("dayChart") : t("nightChart");
    const sectLower = sect.toLocaleLowerCase(activeLocale());
    return t(stateKey === "liminal" ? "sectLiminalNote" : "sectSensitiveNote", { sect: sectLower });
  }

  function sectDependencyCaution(chart) {
    return sectSensitivityState(chart) === "stable" ? "" : t("sectDependencyCaution");
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
      resetActivePlaceIndex();
    }
  }

  function resetActivePlaceIndex() {
    state.activePlaceIndex = -1;
  }

  function setPlaceSuggestionsState(items) {
    state.placeSuggestions = items;
    resetActivePlaceIndex();
  }

  function updateClearPlaceButton() {
    $("#clearPlace").hidden = !$("#birthPlace").value.trim();
  }

  function hidePlaceSuggestions() {
    $("#placeSuggestions").innerHTML = "";
    setPlaceSuggestionsState([]);
    setPlaceExpanded(false);
  }

  function buildPlaceSuggestionModel(items, message = "") {
    return {
      message,
      rows: items.map((item, index) => {
        const admin = item.admin1Names?.[state.lang] || item.admin1 || "";
        const country = item.countryNames?.[state.lang] || countryName(item.country);
        const meta = [admin, country, item.tz].filter(Boolean).join(" · ");
        return {
          index,
          label: formatCity(item),
          meta: meta || `${round(item.lat, 4)}, ${round(item.lon, 4)}`,
        };
      }),
    };
  }

  function renderPlaceSuggestionRow(row) {
    return `
      <button class="place-suggestion" id="place-option-${row.index}" type="button" role="option" aria-selected="false" data-place-index="${row.index}">
        <strong>${escapeHtml(row.label)}</strong>
        <span>${escapeHtml(row.meta)}</span>
      </button>
    `;
  }

  function renderPlaceSuggestionPanel(model) {
    return `${model.message ? `<p class="place-message">${escapeHtml(model.message)}</p>` : ""}${model.rows.map(renderPlaceSuggestionRow).join("")}`;
  }

  function renderPlaceSuggestions(items, message = "") {
    const panel = $("#placeSuggestions");
    setPlaceSuggestionsState(items);
    $("#birthPlace").removeAttribute("aria-activedescendant");
    const model = buildPlaceSuggestionModel(items, message);

    if (!model.rows.length && !model.message) {
      hidePlaceSuggestions();
      return;
    }

    panel.innerHTML = renderPlaceSuggestionPanel(model);
    setPlaceExpanded(true);
  }

  function buildGeocodingUrl(query) {
    const url = new URL(GEOCODING_ENDPOINT);
    url.searchParams.set("name", query);
    url.searchParams.set("count", String(PLACE_RESULT_LIMIT));
    url.searchParams.set("language", state.lang);
    url.searchParams.set("format", "json");
    return url;
  }

  function remoteCitySuggestionsFromResponse(data) {
    return (data.results || [])
      .map(normalizeRemoteCity)
      .filter((item) => item.city && Number.isFinite(item.lat) && Number.isFinite(item.lon));
  }

  function mergePlaceSuggestions(remote, local, limit = PLACE_RESULT_LIMIT) {
    const seen = new Set();
    return [...remote, ...local].filter((item) => {
      const key = cityKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function abortPlaceSearchController() {
    state.placeSearchController?.abort();
  }

  function setPlaceSearchController(controller) {
    state.placeSearchController = controller;
  }

  function clearPlaceSearchController(controller) {
    if (state.placeSearchController === controller) state.placeSearchController = null;
  }

  function clearPlaceSearchTimer() {
    window.clearTimeout(state.placeSearchTimer);
  }

  function schedulePlaceSearch(callback) {
    state.placeSearchTimer = window.setTimeout(callback, PLACE_SEARCH_DELAY);
  }

  function placeSearchPorts() {
    return {
      createController: () => new AbortController(),
      abortCurrent: abortPlaceSearchController,
      setController: setPlaceSearchController,
      clearController: clearPlaceSearchController,
      clearTimer: clearPlaceSearchTimer,
      scheduleSearch: schedulePlaceSearch,
      requestJson: fetchJson,
      renderSuggestions: renderPlaceSuggestions,
      localSuggestions: localCitySuggestions,
      buildUrl: buildGeocodingUrl,
      parseRemote: remoteCitySuggestionsFromResponse,
      mergeSuggestions: mergePlaceSuggestions,
      loadingText: () => t("placeSearchLoading"),
      emptyText: () => t("placeSearchEmpty"),
      errorText: () => t("placeSearchError"),
      shortText: () => t("placeSearchShort"),
    };
  }

  async function fetchPlaceSuggestions(query, ports = placeSearchPorts()) {
    ports.abortCurrent();
    const controller = ports.createController();
    ports.setController(controller);
    ports.renderSuggestions([], ports.loadingText());
    const url = ports.buildUrl(query);

    try {
      const data = await ports.requestJson(url, { signal: controller.signal });
      const remote = ports.parseRemote(data);
      const local = ports.localSuggestions(query, 3);
      const combined = ports.mergeSuggestions(remote, local);
      ports.renderSuggestions(combined, combined.length ? "" : ports.emptyText());
    } catch (error) {
      if (error.name === "AbortError") return;
      const local = ports.localSuggestions(query);
      ports.renderSuggestions(local, local.length ? ports.errorText() : ports.emptyText());
    } finally {
      ports.clearController(controller);
    }
  }

  function queuePlaceSearch(searchSuggestions = fetchPlaceSuggestions, ports = placeSearchPorts()) {
    const query = $("#birthPlace").value.trim();
    updateClearPlaceButton();
    ports.clearTimer();
    ports.abortCurrent();

    if (query.length < 2) {
      ports.renderSuggestions([], query ? ports.shortText() : "");
      return;
    }

    ports.scheduleSearch(() => searchSuggestions(query, ports));
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

  function currentDateTimeFields() {
    return {
      date: parseDate($("#birthDate").value),
      time: parseTime($("#birthTime").value),
    };
  }

  function cityOffsetFromDateTime(city, { date, time }) {
    if (!city?.tz || !date || !time) return null;
    try {
      const zoned = zonedTimeToUtc(date.y, date.m, date.d, time.h, time.min, city.tz);
      return formatOffset(zoned.offset);
    } catch {
      return "+00:00";
    }
  }

  function updateOffsetForCity(city) {
    const offset = cityOffsetFromDateTime(city, currentDateTimeFields());
    if (offset) $("#manualOffset").value = offset;
  }

  function currentPlaceFieldState() {
    return {
      latitude: $("#latitude").value,
      longitude: $("#longitude").value,
      timeZone: $("#timeZone").value,
    };
  }

  function buildCityFieldModel(city, fieldState, force = true) {
    return {
      birthPlace: formatCity(city),
      latitude: force || !fieldState.latitude ? round(city.lat, 4) : null,
      longitude: force || !fieldState.longitude ? round(city.lon, 4) : null,
      timeZone: city.tz && (force || !fieldState.timeZone) ? city.tz : null,
    };
  }

  function applyCityFieldModel(model) {
    $("#birthPlace").value = model.birthPlace;
    if (model.latitude !== null) $("#latitude").value = model.latitude;
    if (model.longitude !== null) $("#longitude").value = model.longitude;
    if (model.timeZone !== null) $("#timeZone").value = model.timeZone;
  }

  function setSelectedCityState(city) {
    state.selectedCity = city || null;
    state.activeCityKey = city ? cityKey(city) : "";
  }

  function applyCityToFields(city, force = true) {
    setSelectedCityState(city);
    applyCityFieldModel(buildCityFieldModel(city, currentPlaceFieldState(), force));
    updateClearPlaceButton();
    updateOffsetForCity(city);
  }

  function placeSuggestionSelectionPorts() {
    return {
      suggestionAt: (index) => state.placeSuggestions[index],
      clearHistorical: clearHistoricalSelection,
      applyCity: applyCityToFields,
      hideSuggestions: hidePlaceSuggestions,
      blurPlace: () => $("#birthPlace").blur(),
    };
  }

  function selectPlaceSuggestion(index, ports = placeSuggestionSelectionPorts()) {
    const city = ports.suggestionAt(index);
    if (!city) return;
    ports.clearHistorical();
    ports.applyCity(city, true);
    ports.hideSuggestions();
    ports.blurPlace();
  }

  function emptySelectedPersonMetadata() {
    return {
      name: "",
      auditStatus: "",
      timeConfidence: "",
      zoneReliability: "",
      zoneSource: "",
    };
  }

  function selectedPersonMetadataFromPerson(person) {
    return {
      name: person.name,
      auditStatus: personAuditStatus(person),
      timeConfidence: historicalTimeConfidence(person),
      zoneReliability: historicalZoneReliability(person),
      zoneSource: t("historicalOffsetSource"),
    };
  }

  function applySelectedPersonMetadata(metadata) {
    state.selectedPersonName = metadata.name;
    state.selectedPersonAuditStatus = metadata.auditStatus;
    state.selectedPersonTimeConfidence = metadata.timeConfidence;
    state.selectedPersonZoneReliability = metadata.zoneReliability;
    state.selectedZoneSource = metadata.zoneSource;
  }

  function clearHistoricalSelection() {
    applySelectedPersonMetadata(emptySelectedPersonMetadata());
  }

  function localizedValue(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[state.lang] || value.es || value.en || "";
  }

  function historicalAuditMetadata(person) {
    return HISTORICAL_AUDIT[person.id] || {};
  }

  function historicalNatalSource(person) {
    const audit = historicalAuditMetadata(person);
    const structured = person.natalDataSource || audit.natalDataSource || {};
    return {
      label: localizedValue(structured.label) || localizedValue(person.dataSource),
      url: structured.url || person.sourceUrl || "",
      type: structured.type || person.sourceType || "",
      rating: structured.roddenRating || person.roddenRating || "",
      timeSource: localizedValue(structured.timeSource) || localizedValue(person.timeSource),
    };
  }

  function historicalInterpretiveReferences(person) {
    const structured = Array.isArray(person.interpretiveReferences) ? person.interpretiveReferences : [];
    const legacy = localizedValue(person.brennanReference);
    return [
      ...structured.map((reference) => ({
        label: localizedValue(reference.label),
        type: reference.type || "",
        role: reference.role || "",
        technique: reference.technique || "",
        url: reference.url || "",
      })),
      ...(legacy ? [{
        label: legacy,
        type: "secondary-reference",
        role: "interpretive-example",
        technique: "",
        url: "",
      }] : []),
    ].filter((reference) => reference.label);
  }

  function historicalDataSourceText(person) {
    return historicalNatalSource(person).label || t("dataSourceGeneral");
  }

  function historicalDataSourceRow(person) {
    const natalSource = historicalNatalSource(person);
    return {
      label: t("natalDataSource"),
      text: natalSource.label || t("dataSourceGeneral"),
      url: natalSource.url || "",
    };
  }

  function buildHistoricalQualityDetailsModel(person) {
    const natalSource = historicalNatalSource(person);
    const audit = historicalAuditMetadata(person);
    const roddenText = natalSource.rating || t("dataRoddenPending");
    const timeText = natalSource.timeSource || t("dataTimeSourcePrepared");
    const sourceDate = localizedValue(audit.sourceDateLabel);
    const rows = [
      historicalDataSourceRow(person),
      { label: t("dataRodden"), text: roddenText },
      { label: t("dataTimeSource"), text: timeText },
    ];
    if (sourceDate) {
      rows.push({ label: t("dataSourceDate"), text: sourceDate });
    }
    const interpretiveReferences = historicalInterpretiveReferences(person);
    if (interpretiveReferences.length) {
      rows.push({ label: t("brennanReference"), text: interpretiveReferences.map((reference) => reference.label).join("; ") });
    }
    return { rows };
  }

  function renderHistoricalQualityValue(row) {
    if (row.url) return `<a href="${escapeHtml(row.url)}" target="_blank" rel="noreferrer">${escapeHtml(row.text || "")}</a>`;
    return escapeHtml(row.text || "");
  }

  function renderHistoricalQualityRow(row) {
    return `<dt>${escapeHtml(row.label)}</dt><dd>${renderHistoricalQualityValue(row)}</dd>`;
  }

  function renderHistoricalQualityDetails(model) {
    return `<dl class="person-data-details">${model.rows.map(renderHistoricalQualityRow).join("")}</dl>`;
  }

  function findHistoricalPerson(personId) {
    const person = HISTORICAL_PEOPLE.find((item) => item.id === personId);
    return person || null;
  }

  function buildPersonDataPopoverModel(personId) {
    const person = findHistoricalPerson(personId);
    if (!person) return null;
    return {
      title: `${t("personDataDetailsTitle")}: ${person.name}`,
      details: buildHistoricalQualityDetailsModel(person),
    };
  }

  function renderPersonDataPopover(model) {
    const popover = $("#personDataPopover");
    $("#personDataTitle").textContent = model.title;
    $("#personDataBody").innerHTML = renderHistoricalQualityDetails(model.details);
    capitalizeStructuredText($("#personDataBody"));
    popover.hidden = false;
    return popover;
  }

  function setPersonDataReturnFocus(trigger) {
    state.personDataReturnFocus = trigger || null;
  }

  function restorePersonDataReturnFocus(restoreFocus) {
    if (restoreFocus && state.personDataReturnFocus) state.personDataReturnFocus.focus();
  }

  function clearPersonDataReturnFocus() {
    state.personDataReturnFocus = null;
  }

  function personDataPopoverPorts() {
    return {
      buildModel: buildPersonDataPopoverModel,
      renderPopover: renderPersonDataPopover,
      setReturnFocus: setPersonDataReturnFocus,
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      position: positionPersonData,
      readPopover: () => $("#personDataPopover"),
      restoreReturnFocus: restorePersonDataReturnFocus,
      clearReturnFocus: clearPersonDataReturnFocus,
    };
  }

  function openPersonData(personId, trigger, ports = personDataPopoverPorts()) {
    const model = ports.buildModel(personId);
    if (!model) return;
    ports.renderPopover(model);
    ports.setReturnFocus(trigger);
    ports.requestFrame(() => ports.position(trigger));
  }

  function closePersonData({ restoreFocus = false } = {}, ports = personDataPopoverPorts()) {
    const popover = ports.readPopover();
    if (!popover || popover.hidden) return;
    popover.hidden = true;
    popover.removeAttribute("style");
    ports.restoreReturnFocus(restoreFocus);
    ports.clearReturnFocus();
  }

  function personAuditStatus(person) {
    const audit = historicalAuditMetadata(person);
    if (person.auditStatus || audit.auditStatus) return person.auditStatus || audit.auditStatus;
    return "pending";
  }

  function historicalTimeConfidence(person) {
    const audit = historicalAuditMetadata(person);
    if (TIME_CONFIDENCE_VALUES.includes(person.timeConfidence)) return person.timeConfidence;
    if (TIME_CONFIDENCE_VALUES.includes(audit.timeConfidence)) return audit.timeConfidence;
    return person.time ? "reported" : "uncertain";
  }

  function historicalZoneReliability(person) {
    const audit = historicalAuditMetadata(person);
    if (ZONE_RELIABILITY_VALUES.includes(person.zoneReliability)) return person.zoneReliability;
    if (ZONE_RELIABILITY_VALUES.includes(audit.zoneReliability)) return audit.zoneReliability;
    if (person.place?.tz) return "iana";
    if (person.manualOffset) return "historical";
    return "unknown";
  }

  function historicalAuditRecord(person) {
    const natalSource = historicalNatalSource(person);
    const interpretiveReferences = historicalInterpretiveReferences(person);
    const audit = historicalAuditMetadata(person);
    return {
      id: person.id,
      name: person.name,
      auditStatus: personAuditStatus(person),
      timeConfidence: historicalTimeConfidence(person),
      zoneReliability: historicalZoneReliability(person),
      calendar: person.calendar || "gregorian",
      hasIanaZone: Boolean(person.place?.tz),
      hasManualOffset: Boolean(person.manualOffset),
      hasIndividualSource: Boolean(natalSource.label || natalSource.url),
      hasNatalSource: Boolean(natalSource.label || natalSource.url),
      hasRating: Boolean(natalSource.rating),
      hasInterpretiveReference: interpretiveReferences.length > 0,
      interpretiveReferenceCount: interpretiveReferences.length,
      externalAuditDate: audit.externalAuditDate || "",
      sourceDateLabel: localizedValue(audit.sourceDateLabel),
    };
  }

  function historicalAuditRecords() {
    return HISTORICAL_PEOPLE.map(historicalAuditRecord);
  }

  function hasAuditedNatalData(person) {
    return personAuditStatus(person) === "audited";
  }

  function auditBadgeText(person) {
    const status = personAuditStatus(person);
    if (status === "audited") return "";
    return t(status === "partial" ? "dataAuditPartialBadge" : "dataAuditPendingBadge");
  }

  function renderAuditBadge(text) {
    if (!text) return "";
    return `<p class="person-audit-badge">${escapeHtml(text)}</p>`;
  }

  function buildHistoricalPersonCardModel(person) {
    return {
      id: person.id,
      name: person.name,
      image: person.image,
      imageAlt: person.imageAlt[state.lang] || person.imageAlt.es,
      wikipediaUrl: personWikipediaUrl(person),
      auditBadgeText: auditBadgeText(person),
      birthLabel: person.birthLabel[state.lang] || person.birthLabel.es,
      placeLabel: formatCity(person.place),
      sexLabel: t(person.sex),
    };
  }

  function renderHistoricalPersonHeader(card) {
    return `
      <h3>
        <span>${escapeHtml(card.name)}</span>
        <a class="person-wiki" href="${escapeHtml(card.wikipediaUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(`${t("openWikipedia")}: ${card.name}`)}" title="${escapeHtml(t("openWikipedia"))}">
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M14 5h5v5"></path>
            <path d="M13 11l6-6"></path>
            <path d="M10 7H6.75A1.75 1.75 0 0 0 5 8.75v8.5C5 18.22 5.78 19 6.75 19h8.5c.97 0 1.75-.78 1.75-1.75V14"></path>
          </svg>
        </a>
      </h3>
    `;
  }

  function renderHistoricalPersonDataList(card) {
    return `
      <dl>
        <dt><button class="person-data-trigger" type="button" data-person-source-id="${escapeHtml(card.id)}" aria-haspopup="dialog" aria-label="${escapeHtml(`${t("personDataDetailsOpen")}: ${card.name}`)}">${escapeHtml(t("dataDate"))}</button></dt>
        <dd>${escapeHtml(card.birthLabel)}</dd>
        <dt>${escapeHtml(t("dataPlace"))}</dt>
        <dd>${escapeHtml(card.placeLabel)}</dd>
        <dt>${escapeHtml(t("dataSex"))}</dt>
        <dd>${escapeHtml(card.sexLabel)}</dd>
      </dl>
    `;
  }

  function renderHistoricalPersonAction(card) {
    return `<button type="button" data-person-id="${escapeHtml(card.id)}">${escapeHtml(t("useExample"))}</button>`;
  }

  function renderHistoricalPersonCard(card) {
    return `
      <article class="person-card">
        <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.imageAlt)}" loading="lazy">
        <div>
          ${renderHistoricalPersonHeader(card)}
          ${renderAuditBadge(card.auditBadgeText)}
          ${renderHistoricalPersonDataList(card)}
          ${renderHistoricalPersonAction(card)}
        </div>
      </article>
    `;
  }

  function buildHistoricalPeopleModel() {
    const people = [...HISTORICAL_PEOPLE].sort((a, b) => a.name.localeCompare(b.name, activeSortLocale()));
    const groupSpecs = [
      { status: "audited", title: t("peopleAuditedTitle") },
      { status: "partial", title: t("peoplePartialTitle") },
      { status: "pending", title: t("peoplePendingTitle") },
    ];
    const groups = groupSpecs
      .map((group) => ({
        title: group.title,
        cards: people
          .filter((person) => personAuditStatus(person) === group.status)
          .map(buildHistoricalPersonCardModel),
      }))
      .filter((group) => group.cards.length);
    return { groups };
  }

  function renderHistoricalPeopleGroup(group) {
    return [
      `<h3 class="people-group-title">${escapeHtml(group.title)}</h3>`,
      ...group.cards.map(renderHistoricalPersonCard),
    ].join("");
  }

  function renderHistoricalPeople() {
    const model = buildHistoricalPeopleModel();
    $("#peopleGrid").innerHTML = model.groups.map(renderHistoricalPeopleGroup).join("");
    capitalizeStructuredText($("#peopleGrid"));
  }

  function setPeopleModalReturnFocus(element) {
    state.modalReturnFocus = element || null;
  }

  function restorePeopleModalReturnFocus() {
    state.modalReturnFocus?.focus?.();
  }

  function clearPeopleModalReturnFocus() {
    state.modalReturnFocus = null;
  }

  function peopleModalPorts() {
    return {
      readActiveElement: () => document.activeElement,
      setReturnFocus: setPeopleModalReturnFocus,
      renderPeople: renderHistoricalPeople,
      openModal: () => { $("#peopleModal").hidden = false; },
      closeModal: () => { $("#peopleModal").hidden = true; },
      addBodyClass: () => document.body.classList.add("modal-open"),
      removeBodyClass: () => document.body.classList.remove("modal-open"),
      focusCloseButton: () => $("#peopleClose").focus(),
      closePersonData,
      restoreReturnFocus: restorePeopleModalReturnFocus,
      clearReturnFocus: clearPeopleModalReturnFocus,
    };
  }

  function openPeopleModal(ports = peopleModalPorts()) {
    ports.setReturnFocus(ports.readActiveElement());
    ports.renderPeople();
    ports.openModal();
    ports.addBodyClass();
    ports.focusCloseButton();
  }

  function closePeopleModal(ports = peopleModalPorts()) {
    ports.closePersonData();
    ports.closeModal();
    ports.removeBodyClass();
    ports.restoreReturnFocus();
    ports.clearReturnFocus();
  }

  function applyHistoricalSelectionState(person) {
    setSelectedCityState(person.place);
    applySelectedPersonMetadata(selectedPersonMetadataFromPerson(person));
  }

  function buildHistoricalPersonFieldModel(person) {
    return {
      date: person.date,
      time: person.time,
      gender: person.sex,
      calendar: person.calendar || "gregorian",
      place: formatCity(person.place),
      latitude: round(person.place.lat, 4),
      longitude: round(person.place.lon, 4),
      timeZone: person.place.tz || "",
      manualOffset: person.manualOffset,
    };
  }

  function applyHistoricalPersonFields(model) {
    $("#birthDate").value = model.date;
    $("#birthTime").value = model.time;
    $("#gender").value = model.gender;
    $("#calendar").value = model.calendar;
    $("#birthPlace").value = model.place;
    $("#latitude").value = model.latitude;
    $("#longitude").value = model.longitude;
    $("#timeZone").value = model.timeZone;
    $("#manualOffset").value = model.manualOffset;
  }

  function historicalPersonLoadPorts() {
    return {
      findPerson: findHistoricalPerson,
      applySelectionState: applyHistoricalSelectionState,
      buildFieldModel: buildHistoricalPersonFieldModel,
      applyFields: applyHistoricalPersonFields,
      updateClearButton: updateClearPlaceButton,
      hideSuggestions: hidePlaceSuggestions,
      closeModal: closePeopleModal,
      calculateChart: calculateCurrentChart,
    };
  }

  function loadHistoricalPerson(id, ports = historicalPersonLoadPorts()) {
    const person = ports.findPerson(id);
    if (!person) return;
    ports.applySelectionState(person);
    ports.applyFields(ports.buildFieldModel(person));
    ports.updateClearButton();
    ports.hideSuggestions();
    ports.closeModal();
    ports.calculateChart();
  }

  function formatDateLabel(value) {
    const date = parseDate(value);
    if (!date) return value || "—";
    return new Intl.DateTimeFormat(activeLocale(), {
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
    return new Intl.DateTimeFormat(activeLocale(), {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(astronomyTimeFromJd(jd));
  }

  function parseDate(value, { allowBce = false } = {}) {
    const match = (allowBce ? /^(-?\d{1,6})-(\d{2})-(\d{2})$/ : /^(\d{1,6})-(\d{2})-(\d{2})$/).exec(value);
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

  function parseChartDateTime(input) {
    const date = parseDate(input.date);
    const time = parseTime(input.time);
    if (!date || !time) throw new Error(t("missingDate"));
    if (date.y <= 0) throw new Error(t("invalidHistoricalYear"));
    return { date, time };
  }

  function manualOffsetContext(input) {
    const manualOffset = parseOffset(input.manualOffset);
    if (manualOffset === null) throw new Error(t("invalidOffset"));
    return {
      offset: manualOffset,
      zoneLabel: `UTC${formatOffset(manualOffset)}`,
    };
  }

  function julianTimeResult(date, time, manualOffset) {
    const day = date.d + (time.h + time.min / 60 - manualOffset.offset / 60) / 24;
    return {
      jd: calendarToJd(date.y, date.m, day, "julian"),
      offset: manualOffset.offset,
      zoneLabel: manualOffset.zoneLabel,
    };
  }

  function ianaTimeResult(date, time, timeZone) {
    if (!timeZone) return null;
    try {
      const zoned = zonedTimeToUtc(date.y, date.m, date.d, time.h, time.min, timeZone);
      return {
        jd: zoned.utcMs / DAY_MS + 2440587.5,
        offset: zoned.offset,
        zoneLabel: `${timeZone} (UTC${formatOffset(zoned.offset)})`,
      };
    } catch (error) {
      return { failed: true, warningCode: "invalidTimeZone" };
    }
  }

  function manualTimeResult(date, time, manualOffset) {
    const utcMs = Date.UTC(date.y, date.m - 1, date.d, time.h, time.min, 0) - manualOffset.offset * 60000;
    return {
      jd: utcMs / DAY_MS + 2440587.5,
      offset: manualOffset.offset,
      zoneLabel: manualOffset.zoneLabel,
    };
  }

  function jdFromForm(input) {
    const { date, time } = parseChartDateTime(input);
    const manualOffset = manualOffsetContext(input);
    if (input.calendar === "julian") return julianTimeResult(date, time, manualOffset);
    const ianaResult = ianaTimeResult(date, time, input.timeZone);
    if (ianaResult?.failed) return { ...manualTimeResult(date, time, manualOffset), warningCode: ianaResult.warningCode };
    return ianaResult || manualTimeResult(date, time, manualOffset);
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
    const decanLord = decanLordFor(lon);
    labels.push(t(boundLord === planet ? "bound" : "boundLord", { planet: planetName(boundLord) }));
    labels.push(t(decanLord === planet ? "decan" : "decanLord", { planet: planetName(decanLord) }));

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

  const SIGN_ASPECT_BY_DISTANCE = Object.freeze({
    0: "copresence",
    2: "sextile",
    3: "square",
    4: "trine",
    6: "opposition",
    8: "trine",
    9: "square",
    10: "sextile",
  });

  const DEGREE_ASPECTS = Object.freeze([
    ["copresence", 0],
    ["sextile", 60],
    ["square", 90],
    ["trine", 120],
    ["opposition", 180],
  ]);

  function signAspectType(aSign, bSign) {
    const distance = (bSign - aSign + 12) % 12;
    return SIGN_ASPECT_BY_DISTANCE[distance] || null;
  }

  function degreeAspect(a, b, orb) {
    const distance = angleDistance(a, b);
    let best = null;
    DEGREE_ASPECTS.forEach(([type, exact]) => {
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

  function positionLonAt(jd, key, chart) {
    const raw = tropicalPositions(jd, chart.input.includeModern)[key];
    return applyZodiac(raw.lon, jd, chart.input.zodiac);
  }

  function moonTravelAt(jd, direction, chart) {
    const start = chart.positions.moon.lon;
    const current = positionLonAt(jd, "moon", chart);
    return direction > 0 ? zodiacalDistance(start, current) : zodiacalDistance(current, start);
  }

  function orientedAspectError(dayOffset, planetKey, target, chart) {
    const jd = chart.jd + dayOffset;
    const moonLon = positionLonAt(jd, "moon", chart);
    const planetLon = positionLonAt(jd, planetKey, chart);
    return norm180(zodiacalDistance(moonLon, planetLon) - target);
  }

  function refineLunarAspect(leftDay, rightDay, planetKey, target, chart) {
    let left = leftDay;
    let right = rightDay;
    let leftError = orientedAspectError(left, planetKey, target, chart);
    let rightError = orientedAspectError(right, planetKey, target, chart);
    if (Math.abs(leftError) < 0.00001) return left;
    if (Math.abs(rightError) < 0.00001) return right;
    if (leftError * rightError > 0) return null;
    for (let i = 0; i < 36; i += 1) {
      const mid = (left + right) / 2;
      const midError = orientedAspectError(mid, planetKey, target, chart);
      if (Math.abs(midError) < 0.00001) return mid;
      if (leftError * midError <= 0) {
        right = mid;
        rightError = midError;
      } else {
        left = mid;
        leftError = midError;
      }
    }
    return (left + right) / 2;
  }

  function lunarAspectCandidatesIterative(planetKey, direction = 1, maxMoonTravel = 30, chart) {
    if (!chart || !planetKey) return null;
    const moonSpeed = Math.max(1, Math.abs(chart.positions.moon.speed || 13));
    const maxDays = maxMoonTravel / moonSpeed + 0.5;
    const step = 0.04 * direction;
    const candidates = [];
    LUNAR_ASPECTS.forEach(([type, exact]) => {
      const targets = exact === 0 || exact === 180 ? [exact] : [exact, 360 - exact];
      targets.forEach((target) => {
        let previousDay = 0;
        let previousError = orientedAspectError(previousDay, planetKey, target, chart);
        const steps = Math.ceil(maxDays / Math.abs(step));
        for (let i = 1; i <= steps; i += 1) {
          const day = direction * Math.min(maxDays, i * Math.abs(step));
          const error = orientedAspectError(day, planetKey, target, chart);
          const wrapped = Math.abs(error - previousError) > 180;
          const crossed = !wrapped && previousError * error <= 0;
          if (crossed && Math.abs(day) > 0.0001) {
            const refined = refineLunarAspect(previousDay, day, planetKey, target, chart);
            if (refined !== null && (direction > 0 ? refined > 0.000001 : refined < -0.000001)) {
              const moonTravel = moonTravelAt(chart.jd + refined, direction, chart);
              if (moonTravel <= maxMoonTravel + 0.0001) {
                candidates.push({ type, days: refined, moonTravel, method: "iterative" });
              }
            }
          }
          previousDay = day;
          previousError = error;
        }
      });
    });
    const seen = new Set();
    return candidates
      .sort((a, b) => direction > 0 ? a.days - b.days : b.days - a.days)
      .filter((candidate) => {
        const key = `${candidate.type}:${Math.round(candidate.days * 10000)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function linearLunarAspectCandidates(moon, planet, direction = 1, maxMoonTravel = 30) {
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
            candidates.push({ type, days, moonTravel, method: "fallback" });
          }
        }
      });
    });
    return candidates.sort((a, b) => direction > 0 ? a.days - b.days : b.days - a.days);
  }

  function lunarAspectCandidates(moon, planet, direction = 1, maxMoonTravel = 30, chart = null, planetKey = "") {
    const iterative = lunarAspectCandidatesIterative(planetKey, direction, maxMoonTravel, chart);
    if (iterative?.length) return iterative;
    return linearLunarAspectCandidates(moon, planet, direction, maxMoonTravel);
  }

  function lunarContactLabel(contact, motionKey = "") {
    if (!contact) return "";
    const parts = [
      `${PLANETS[contact.planet].symbol} ${planetName(contact.planet)}`,
      t(contact.type),
    ];
    if (motionKey) parts.push(t(motionKey));
    if (Number.isFinite(contact.moonTravel)) parts.push(formatAngle(contact.moonTravel));
    if (contact.method) parts.push(t(contact.method === "iterative" ? "lunarMethodIterative" : "lunarMethodFallback"));
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

  function receptionKindLabel(kind) {
    if (kind === "domicile") return t("domicile");
    if (kind === "exaltation") return t("exaltation");
    if (kind === "triplicityActive") return t("triplicityActive");
    if (kind === "triplicityOutOfSect") return t("triplicityOutOfSect");
    if (kind === "triplicityCooperating") return t("triplicityCooperatingRole");
    if (kind === "bound") return state.lang === "es" ? "término" : "bound";
    return kind;
  }

  function receptionRank(kinds) {
    if (kinds.includes("domicile") || kinds.includes("exaltation")) return "strong";
    if (kinds.includes("triplicityActive") || kinds.includes("bound")) return "medium";
    if (kinds.length) return "weak";
    return "";
  }

  function receptionRankScore(rank) {
    return { strong: 3, medium: 2, weak: 1 }[rank] || 0;
  }

  function mutualReceptionRank(firstRank, secondRank) {
    const first = receptionRankScore(firstRank);
    const second = receptionRankScore(secondRank);
    if (!first || !second) return "";
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    if (low >= 2 && high >= 3) return "strong";
    if (high >= 2) return "medium";
    return "weak";
  }

  function receptionStrengthLabel(reception) {
    if (!reception?.hasReception) return "";
    const score = reception.effectiveScore ?? reception.strongest;
    if (score >= 3) {
      return state.lang === "es" ? "fuerte —domicilio/exaltación—" : "strong —domicile/exaltation—";
    }
    if (score >= 2) {
      return state.lang === "es" ? "media —término o triplicidad activa—" : "medium —bound or active triplicity—";
    }
    return state.lang === "es"
      ? "débil —triplicidad fuera de secta o cooperante—"
      : "weak —out-of-sect or cooperating triplicity—";
  }

  function receptionAuthority(receiver, guestLon, chart) {
    if (!VISIBLE_KEYS.includes(receiver)) return { receiver, kinds: [], labels: [], rank: "" };
    const signIndex = signOf(guestLon);
    const sign = SIGNS[signIndex];
    const trip = TRIPLICITY[sign.element];
    const kinds = [];
    if (sign.ruler === receiver) kinds.push("domicile");
    if (EXALTATIONS[receiver] === signIndex) kinds.push("exaltation");
    if (trip.day === receiver) kinds.push(chart.isDay ? "triplicityActive" : "triplicityOutOfSect");
    if (trip.night === receiver) kinds.push(chart.isDay ? "triplicityOutOfSect" : "triplicityActive");
    if (trip.coop === receiver) kinds.push("triplicityCooperating");
    if (boundLordFor(guestLon) === receiver) kinds.push("bound");
    return {
      receiver,
      kinds,
      labels: kinds.map(receptionKindLabel),
      rank: receptionRank(kinds),
    };
  }

  function receptionBetween(actor, target, chart) {
    const actorPos = chart.positions[actor];
    const targetPos = chart.positions[target];
    const targetReceivesActor = receptionAuthority(target, actorPos.lon, chart);
    const actorReceivesTarget = receptionAuthority(actor, targetPos.lon, chart);
    const strongest = Math.max(
      receptionRankScore(targetReceivesActor.rank),
      receptionRankScore(actorReceivesTarget.rank)
    );
    const isMutual = Boolean(targetReceivesActor.kinds.length && actorReceivesTarget.kinds.length);
    const mutualRank = isMutual ? mutualReceptionRank(targetReceivesActor.rank, actorReceivesTarget.rank) : "";
    const effectiveScore = isMutual ? receptionRankScore(mutualRank) : strongest;
    return {
      targetReceivesActor,
      actorReceivesTarget,
      strongest,
      effectiveScore,
      mutualRank,
      hasReception: strongest > 0,
      isMutual,
    };
  }

  function shiftLevel(level, direction) {
    const levels = ["lowLevel", "mediumLevel", "strongLevel"];
    const tensionLevels = ["lowLevel", "mediumLevel", "highLevel"];
    const list = level === "highLevel" ? tensionLevels : levels;
    const index = list.indexOf(level);
    if (index < 0) return level;
    return list[Math.max(0, Math.min(list.length - 1, index + direction))];
  }

  function receptionKinds(reception) {
    return [
      ...(reception?.targetReceivesActor?.kinds || []),
      ...(reception?.actorReceivesTarget?.kinds || []),
    ];
  }

  function receptionByBoundOnly(reception) {
    const kinds = receptionKinds(reception);
    return Boolean(kinds.length) && kinds.every((kind) => kind === "bound");
  }

  function adjustIntensityForReception(level, role, reception) {
    if (!reception?.hasReception) return level;
    const score = reception.effectiveScore ?? reception.strongest;
    if (role === "support") return score >= 2 ? shiftLevel(level, 1) : level;
    if (level === "highLevel" && receptionByBoundOnly(reception)) return level;
    return score >= 2 ? shiftLevel(level, -1) : level;
  }

  function receptionPhrase(target, actor, reception) {
    const parts = [];
    if (reception.targetReceivesActor.kinds.length) {
      parts.push(state.lang === "es"
        ? `${planetLabel(target)} recibe a ${planetLabel(actor)} por ${naturalList(reception.targetReceivesActor.labels)}`
        : `${planetLabel(target)} receives ${planetLabel(actor)} by ${naturalList(reception.targetReceivesActor.labels)}`);
    }
    if (reception.actorReceivesTarget.kinds.length) {
      parts.push(state.lang === "es"
        ? `${planetLabel(actor)} recibe a ${planetLabel(target)} por ${naturalList(reception.actorReceivesTarget.labels)}`
        : `${planetLabel(actor)} receives ${planetLabel(target)} by ${naturalList(reception.actorReceivesTarget.labels)}`);
    }
    return parts.join("; ");
  }

  function receptionChannelNoun(reception) {
    if (state.lang === "es") {
      return reception.isMutual ? "un canal recíproco" : "un canal formal";
    }
    return reception.isMutual ? "a reciprocal channel" : "a formal channel";
  }

  function receptionCautionText(reception) {
    const boundOnly = receptionByBoundOnly(reception);
    const weakMutual = reception.isMutual && (reception.effectiveScore ?? reception.strongest) <= 1;
    if (state.lang === "es") {
      if (boundOnly) return " Al depender solo del término, este canal no anula por sí solo una presión fuerte.";
      if (weakMutual) return " Es recíproco, pero débil: no basta por sí solo para neutralizar la presión.";
      return "";
    }
    if (boundOnly) return " Because it depends only on the bound, this channel does not cancel strong pressure by itself.";
    if (weakMutual) return " It is reciprocal but weak; by itself it is not enough to neutralize pressure.";
    return "";
  }

  function receptionNoteText(reception, role, strength, noun, caution) {
    if (state.lang === "es") {
      return role === "support"
        ? ` Hay ${noun} ${strength}, lo que hace la ayuda más utilizable.${caution}`
        : reception.isMutual
          ? ` Hay ${noun} ${strength}; la presión no queda anulada, pero toma forma y se vuelve más trabajable.${caution}`
          : ` Hay ${noun} ${strength}, así que la presión encuentra una vía de manejo, aunque no desaparece.${caution}`;
    }
    return role === "support"
      ? ` There is ${strength} ${noun}, making the help more usable.${caution}`
      : reception.isMutual
        ? ` There is ${strength} ${noun}; the pressure is not cancelled, but it gains form and becomes more workable.${caution}`
        : ` There is ${strength} ${noun}, so the pressure has a route for handling, though it does not disappear.${caution}`;
  }

  function receptionNote(target, actor, reception, role) {
    if (!reception?.hasReception) return "";
    const strength = receptionStrengthLabel(reception);
    return receptionNoteText(reception, role, strength, receptionChannelNoun(reception), receptionCautionText(reception));
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

  function judgmentLotKeys(selectedLots) {
    return [...new Set(["fortune", "spirit", ...(selectedLots || [])])];
  }

  function visibleLots(chart) {
    return chart.lots.filter((lot) => chart.input.selectedLots.includes(lot.key));
  }

  function lotFormulaText(key, isDay) {
    const asc = "Asc";
    const fortune = t("fortune");
    const spirit = t("spirit");
    const map = {
      fortune: isDay ? `${asc} + ${planetName("moon")} − ${planetName("sun")}` : `${asc} + ${planetName("sun")} − ${planetName("moon")}`,
      spirit: isDay ? `${asc} + ${planetName("sun")} − ${planetName("moon")}` : `${asc} + ${planetName("moon")} − ${planetName("sun")}`,
      eros: isDay ? `${asc} + ${spirit} − ${fortune}` : `${asc} + ${fortune} − ${spirit}`,
      necessity: isDay ? `${asc} + ${fortune} − ${spirit}` : `${asc} + ${spirit} − ${fortune}`,
      courage: isDay ? `${asc} + ${fortune} − ${planetName("mars")}` : `${asc} + ${planetName("mars")} − ${fortune}`,
      victory: isDay ? `${asc} + ${planetName("jupiter")} − ${spirit}` : `${asc} + ${spirit} − ${planetName("jupiter")}`,
      nemesis: isDay ? `${asc} + ${fortune} − ${planetName("saturn")}` : `${asc} + ${planetName("saturn")} − ${fortune}`,
    };
    return map[key] || "—";
  }

  function lotFormulaSectLabel(isDay) {
    return isDay ? t("dayFormulaLabel") : t("nightFormulaLabel");
  }

  function lotSnapshotForSect(key, chart, isDay) {
    const lon = lotLongitude(key, { positions: chart.positions, angles: chart.angles, isDay });
    const sign = signOf(lon);
    return {
      key,
      lon,
      house: houseFromSign(sign, chart.ascSign),
      formula: lotFormulaText(key, isDay),
      formulaLabel: lotFormulaSectLabel(isDay),
    };
  }

  function lotSnapshotText(snapshot) {
    return `${formatDegree(snapshot.lon)} · ${t("tableHouse")} ${snapshot.house} · ${snapshot.formulaLabel}: ${snapshot.formula}`;
  }

  function sectRoleSnapshot(isDay) {
    return {
      sectLight: isDay ? "sun" : "moon",
      beneficOfSect: isDay ? "jupiter" : "venus",
      maleficOfSect: isDay ? "saturn" : "mars",
      maleficContrarySect: isDay ? "mars" : "saturn",
    };
  }

  function sectRoleSnapshotText(snapshot) {
    return [
      `${t("sectLight")}: ${planetLabel(snapshot.sectLight)}`,
      `${t("beneficSect")}: ${planetLabel(snapshot.beneficOfSect)}`,
      `${t("maleficSect")}: ${planetLabel(snapshot.maleficOfSect)}`,
      `${t("maleficContrarySect")}: ${planetLabel(snapshot.maleficContrarySect)}`,
    ].join(" · ");
  }

  function buildAlternateSectLotsModel(chart) {
    if (sectSensitivityState(chart) === "stable") return null;
    const currentRoles = sectRoleSnapshot(chart.isDay);
    const alternateRoles = sectRoleSnapshot(!chart.isDay);
    const rows = ["fortune", "spirit"].map((key) => ({
      name: lotName(key),
      current: lotSnapshotText(lotSnapshotForSect(key, chart, chart.isDay)),
      alternate: lotSnapshotText(lotSnapshotForSect(key, chart, !chart.isDay)),
    }));
    return {
      title: t("alternateSectLotsTitle"),
      currentRolesText: sectRoleSnapshotText(currentRoles),
      alternateRolesText: sectRoleSnapshotText(alternateRoles),
      rows,
    };
  }

  function renderAlternateSectLotRow(row) {
    return `
      <li>
        <strong>${escapeHtml(row.name)}</strong>
        <span>${escapeHtml(t("lotUsedByTyche"))}: ${escapeHtml(row.current)}</span>
        <span>${escapeHtml(t("lotIfSectReversed"))}: ${escapeHtml(row.alternate)}</span>
      </li>
    `;
  }

  function renderAlternateSectLotsModel(model) {
    if (!model) return "";
    const rows = model.rows.map(renderAlternateSectLotRow).join("");
    return `
      <details class="alternate-sect-lots" data-test="alternate-sect-lots">
        <summary>${escapeHtml(model.title)}</summary>
        <div class="alternate-sect-roles" data-test="alternate-sect-roles">
          <p><b>${escapeHtml(t("sectRolesUsedByTyche"))}</b>: ${escapeHtml(model.currentRolesText)}</p>
          <p><b>${escapeHtml(t("sectRolesIfReversed"))}</b>: ${escapeHtml(model.alternateRolesText)}</p>
        </div>
        <ul>${rows}</ul>
      </details>
    `;
  }

  function renderAlternateSectLots(chart) {
    const model = buildAlternateSectLotsModel(chart);
    return renderAlternateSectLotsModel(model);
  }

  const LOT_NAME_KEYS = Object.freeze({
    fortune: "fortune",
    spirit: "spirit",
    necessity: "necessity",
    courage: "courage",
    victory: "victory",
  });

  const LOT_FIXED_NAMES = Object.freeze({
    eros: "Eros",
    nemesis: "Némesis",
  });

  function lotName(key) {
    if (LOT_NAME_KEYS[key]) return t(LOT_NAME_KEYS[key]);
    return LOT_FIXED_NAMES[key] || key;
  }

  function lunarContactPlanetKeys() {
    return VISIBLE_KEYS.filter((key) => key !== "moon" && key !== "sun");
  }

  function lunarCandidatesForPlanet(moon, planet, chart, key, direction) {
    return lunarAspectCandidates(moon, planet, direction, 30, chart, key)
      .map((candidate) => ({ ...candidate, planet: key }));
  }

  function closestFutureLunarCandidate(current, candidate) {
    return !current || candidate.days < current.days ? candidate : current;
  }

  function latestPastLunarCandidate(current, candidate) {
    return !current || candidate.days > current.days ? candidate : current;
  }

  const LUNAR_ORB_EXACT_ANGLE = Object.freeze({
    copresence: 0,
    sextile: 60,
    square: 90,
    trine: 120,
    opposition: 180,
  });

  function lunarOrbContact(moon, planet, key) {
    const near = degreeAspect(moon.lon, planet.lon, 12);
    if (!near) return null;
    const nextMoon = norm360(moon.lon + moon.speed);
    const nextPlanet = norm360(planet.lon + planet.speed);
    const exact = LUNAR_ORB_EXACT_ANGLE[near.type];
    const nowDelta = Math.abs(angleDistance(moon.lon, planet.lon) - exact);
    const nextDelta = Math.abs(angleDistance(nextMoon, nextPlanet) - exact);
    const motion = nextDelta < nowDelta ? "applying" : "separating";
    return {
      planet: key,
      type: near.type === "copresence" ? "conjunction" : near.type,
      motion,
      delta: near.delta,
    };
  }

  function scanLunarContacts(chart, moonSignRemaining) {
    const moon = chart.positions.moon;
    const contacts = [];
    let lastSeparation = null;
    let nextApplication = null;
    let nextApplicationBySign = null;
    let hasApplyingWithinOrb = false;
    lunarContactPlanetKeys().forEach((key) => {
      const planet = chart.positions[key];
      lunarCandidatesForPlanet(moon, planet, chart, key, 1).forEach((candidate) => {
        nextApplication = closestFutureLunarCandidate(nextApplication, candidate);
        if (candidate.moonTravel <= moonSignRemaining + 0.0001) {
          nextApplicationBySign = closestFutureLunarCandidate(nextApplicationBySign, candidate);
        }
      });
      lunarCandidatesForPlanet(moon, planet, chart, key, -1).forEach((candidate) => {
        lastSeparation = latestPastLunarCandidate(lastSeparation, candidate);
      });

      const contact = lunarOrbContact(moon, planet, key);
      if (!contact) return;
      if (contact.motion === "applying") hasApplyingWithinOrb = true;
      contacts.push(contact);
    });
    return {
      contacts,
      lastSeparation,
      nextApplication,
      nextApplicationBySign,
      hasApplyingWithinOrb,
    };
  }

  function computeMoonCondition(chart) {
    const elongation = zodiacalDistance(chart.positions.sun.lon, chart.positions.moon.lon);
    const moon = chart.positions.moon;
    const moonSignRemaining = 30 - degreeInSign(moon.lon);
    const contactScan = scanLunarContacts(chart, moonSignRemaining);
    return {
      phase: lunarPhaseName(elongation),
      elongation,
      contacts: contactScan.contacts,
      lastSeparation: contactScan.lastSeparation,
      nextApplication: contactScan.nextApplication,
      nextApplicationBySign: contactScan.nextApplicationBySign,
      voidOfCourse: !contactScan.nextApplication,
      voidOfCourseBySign: !contactScan.nextApplicationBySign,
      moonSignRemaining,
      hasApplyingWithinOrb: contactScan.hasApplyingWithinOrb,
    };
  }

  function readPlaceFieldValues() {
    return {
      placeValue: $("#birthPlace").value.trim(),
      latField: $("#latitude").value,
      lonField: $("#longitude").value,
      timeZoneField: $("#timeZone").value.trim(),
      manualOffset: $("#manualOffset").value.trim(),
    };
  }

  function placeCoordinatesFromFields(fields, city) {
    return {
      latitude: fields.latField !== "" ? Number(fields.latField) : city?.lat,
      longitude: fields.lonField !== "" ? Number(fields.lonField) : city?.lon,
    };
  }

  function placeZoneReliability(timeZone) {
    const zoneReliability = state.selectedPersonZoneReliability || (timeZone ? "iana" : state.selectedZoneSource ? "historical" : "manual");
    return zoneReliability;
  }

  function readPlaceInputFromFields() {
    const fields = readPlaceFieldValues();
    const city = findCity(fields.placeValue);
    const { latitude, longitude } = placeCoordinatesFromFields(fields, city);
    const timeZone = fields.timeZoneField || city?.tz || "";
    return {
      place: city ? formatCity(city) : fields.placeValue,
      city,
      latitude,
      longitude,
      timeZone,
      manualOffset: fields.manualOffset,
      zoneSource: state.selectedZoneSource,
      zoneReliability: placeZoneReliability(timeZone),
    };
  }

  function selectedLotValues() {
    return $$('input[name="lots"]:checked').map((item) => item.value);
  }

  function readTechniqueFieldValues() {
    return {
      calendar: $("#calendar").value,
      zodiac: $("#zodiac").value,
      aspectMode: $("#aspectMode").value,
      orbField: $("#orb").value,
      techniqueMode: $("#techniqueMode").value,
      includeModernChecked: $("#includeModern").checked,
      selectedLots: selectedLotValues(),
    };
  }

  function normalizedTechniqueOptions(fields) {
    return {
      calendar: fields.calendar,
      zodiac: fields.zodiac,
      aspectMode: fields.aspectMode,
      orb: Number(fields.orbField || 3),
      techniqueMode: fields.techniqueMode,
      includeModern: fields.includeModernChecked || fields.techniqueMode === "mixed",
      selectedLots: fields.selectedLots,
    };
  }

  function readTechniqueInputFromFields() {
    return normalizedTechniqueOptions(readTechniqueFieldValues());
  }

  function readBirthInputFromFields() {
    return {
      date: $("#birthDate").value,
      time: $("#birthTime").value,
      gender: $("#gender").value,
    };
  }

  function selectedPersonInputContext() {
    return {
      personName: state.selectedPersonName,
      auditStatus: state.selectedPersonAuditStatus,
      timeConfidence: state.selectedPersonTimeConfidence,
    };
  }

  function readInput() {
    return {
      ...readBirthInputFromFields(),
      ...selectedPersonInputContext(),
      ...readPlaceInputFromFields(),
      ...readTechniqueInputFromFields(),
    };
  }

  function calculateChartPositions(time, input) {
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
    return {
      rawPositions,
      positions,
      planetKeys: input.includeModern ? [...VISIBLE_KEYS, ...MODERN_KEYS] : [...VISIBLE_KEYS],
    };
  }

  function enrichChartPositions(positions, planetKeys, ascSign, isDay) {
    planetKeys.forEach((key) => {
      positions[key].house = houseFromSign(signOf(positions[key].lon), ascSign);
      positions[key].angularity = placeQuality(positions[key].house);
      positions[key].dignities = dignityFor(key, positions[key].lon, isDay);
      positions[key].majorDignities = majorDignities(key, positions[key].lon);
      positions[key].phase = solarPhaseFor(key, positions);
    });
    return positions;
  }

  function calculateChartLots(input, positions, angles, isDay, ascSign) {
    return judgmentLotKeys(input.selectedLots).map((key) => {
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
  }

  function sectContext(isDay) {
    return {
      sectLight: isDay ? "sun" : "moon",
      beneficOfSect: isDay ? "jupiter" : "venus",
      maleficOfSect: isDay ? "saturn" : "mars",
      maleficContrarySect: isDay ? "mars" : "saturn",
    };
  }

  function validateChartInput(input) {
    if (!input.place && (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude))) throw new Error(t("missingPlace"));
    if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) throw new Error(t("missingCoords"));
  }

  function chartInputWarningText(input, chart = null) {
    const warnings = [];
    if (chart?.timeWarningCode) warnings.push(t(chart.timeWarningCode));
    if (input.latitude < -66 || input.latitude > 66) {
      warnings.push(state.lang === "es"
        ? "Las latitudes extremas vuelven muy sensibles los ángulos al horizonte. Revisa cartas críticas con especial cuidado."
        : "Extreme latitudes make horizon angles highly sensitive. Review critical charts with special care.");
    }
    return warnings.join(" ");
  }

  function computeChart(input) {
    validateChartInput(input);
    const time = jdFromForm(input);
    const { rawPositions, positions, planetKeys } = calculateChartPositions(time, input);
    const angles = calculateAngles(time.jd, input.latitude, input.longitude, input.zodiac);
    const sunAlt = altitudeFromLon(rawPositions.sun.lon, input.latitude, angles.lst, angles.eps);
    const isDay = sunAlt >= 0;
    const ascSign = signOf(angles.asc);
    const mcHouse = houseFromSign(signOf(angles.mc), ascSign);
    const icHouse = houseFromSign(signOf(angles.ic), ascSign);
    enrichChartPositions(positions, planetKeys, ascSign, isDay);
    const lots = calculateChartLots(input, positions, angles, isDay, ascSign);
    const sect = sectContext(isDay);

    const chart = {
      input,
      jd: time.jd,
      zoneLabel: time.zoneLabel,
      offset: time.offset,
      timeWarningCode: time.warningCode || "",
      ephemerisEngine: state.ephemerisEngine,
      positions,
      planetKeys,
      angles,
      ascSign,
      isDay,
      sunAltitude: sunAlt,
      ...sect,
      mcHouse,
      icHouse,
      lots,
    };
    chart.moon = computeMoonCondition(chart);
    return chart;
  }

  function buildChartFrameModel(chart) {
    return {
      title: chart.input.personName
      ? t("chartForPerson", { name: chart.input.personName })
      : t("anonymousChart"),
      meta: chartMetaText(chart.input),
      wheel: buildWheelModel(chart),
    };
  }

  function renderChartFrame(chart) {
    const model = buildChartFrameModel(chart);
    $("#results").hidden = false;
    $("#chartTitle").textContent = model.title;
    $("#chartMeta").textContent = model.meta;
    $("#chartWheel").innerHTML = renderWheelModel(model.wheel);
  }

  function renderChartPanels(chart) {
    renderCoreSummary(chart);
    renderAnglesPanel(chart);
    renderAscLord(chart);
    renderMoon(chart);
    renderInterpretation(chart);
    renderPlanetTable(chart);
    renderHouseTable(chart);
    renderLotTable(chart);
    renderAspectTable(chart);
    renderTechnicalPanel(chart);
  }

  function finalizeRenderedChartText() {
    capitalizeStructuredText($("#results"));
  }

  function scrollChartResultsIntoView() {
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function dispatchChartRenderedEvent(chart) {
    window.dispatchEvent(new CustomEvent("tyche:chart-rendered", { detail: { chart } }));
  }

  function chartRenderCompletionPorts() {
    return {
      finalizeText: finalizeRenderedChartText,
      scrollResults: scrollChartResultsIntoView,
      dispatchRendered: dispatchChartRenderedEvent,
    };
  }

  function finishChartRender(chart, ports = chartRenderCompletionPorts()) {
    ports.finalizeText();
    ports.scrollResults();
    ports.dispatchRendered(chart);
  }

  function renderChartContent(chart) {
    state.lastChart = chart;
    renderChartFrame(chart);
    renderChartPanels(chart);
  }

  function chartRenderPorts() {
    return {
      renderContent: renderChartContent,
      finish: finishChartRender,
    };
  }

  function renderChart(chart, ports = chartRenderPorts()) {
    ports.renderContent(chart);
    ports.finish(chart);
  }

  function prepareChartCalculationUi() {
    $("#formStatus").textContent = "";
    updatePlaceFields();
    hidePlaceSuggestions();
  }

  function renderChartCalculationWarning(warningText) {
    $("#formStatus").textContent = warningText;
  }

  function currentChartCalculationPorts() {
    return {
      readInput,
      computeChart,
      warningText: chartInputWarningText,
      renderWarningText: renderChartCalculationWarning,
      renderChart,
    };
  }

  function buildCurrentChartCalculation(ports = currentChartCalculationPorts()) {
    const input = ports.readInput();
    const chart = ports.computeChart(input);
    return {
      chart,
      warningText: ports.warningText(input, chart),
    };
  }

  function renderCurrentChartCalculation(model, ports = currentChartCalculationPorts()) {
    ports.renderWarningText(model.warningText);
    ports.renderChart(model.chart);
  }

  function runCurrentChartCalculation(ports = currentChartCalculationPorts()) {
    renderCurrentChartCalculation(buildCurrentChartCalculation(ports), ports);
  }

  function calculateCurrentChart(ports = currentChartCalculationPorts()) {
    prepareChartCalculationUi();
    runCurrentChartCalculation(ports);
  }

  function renderMetricItems(items) {
    return items.map((item) => metric(item.label, item.value, item.valueClass || "", item.labelGlossary || "", item.valueGlossary || "")).join("");
  }

  function metricPanelTitleHtml(model) {
    return model.titleGlossary ? glossaryTerm(model.title, model.titleGlossary) : escapeHtml(model.title);
  }

  function renderMetricPanel(model, gridClass = "metric-grid") {
    return `
      <h3>${metricPanelTitleHtml(model)}</h3>
      <div class="${escapeHtml(gridClass)}">
        ${renderMetricItems(model.metrics)}
      </div>
    `;
  }

  function buildCoreSummaryModel(chart) {
    return {
      title: t("sect"),
      titleGlossary: "sect",
      metrics: [
        { label: t("chartType"), value: chartSectLabel(chart), labelGlossary: "sect" },
        { label: t("sectLight"), value: `${PLANETS[chart.sectLight].symbol} ${planetName(chart.sectLight)}`, labelGlossary: "sectLight" },
        { label: t("beneficSect"), value: `${PLANETS[chart.beneficOfSect].symbol} ${planetName(chart.beneficOfSect)}`, labelGlossary: "beneficSect" },
        { label: t("maleficSect"), value: `${PLANETS[chart.maleficOfSect].symbol} ${planetName(chart.maleficOfSect)}`, labelGlossary: "maleficSect" },
        { label: t("maleficContrarySect"), value: `${PLANETS[chart.maleficContrarySect].symbol} ${planetName(chart.maleficContrarySect)}`, labelGlossary: "maleficContrarySect" },
      ],
      notes: [sectSensitivityNote(chart), sectDependencyCaution(chart)].filter(Boolean),
      alternateLots: buildAlternateSectLotsModel(chart),
    };
  }

  function renderCoreSummary(chart) {
    const model = buildCoreSummaryModel(chart);
    const html = `
      ${renderMetricPanel(model)}
      ${model.notes.map((note) => `<p class="text-note">${escapeHtml(note)}</p>`).join("")}
      ${renderAlternateSectLotsModel(model.alternateLots)}
    `;
    $("#coreSummary").innerHTML = html;
  }

  function buildAnglesPanelModel(chart) {
    return {
      title: t("anglesZoneTitle"),
      metrics: [
        { label: t("ascendant"), value: `${formatDegree(chart.angles.asc)} · ${t("tableHouse")} 1`, labelGlossary: "ascendant" },
        { label: t("descendant"), value: `${formatDegree(chart.angles.desc)} · ${t("tableHouse")} 7`, labelGlossary: "descendant" },
        { label: t("mc"), value: `${formatDegree(chart.angles.mc)} · ${t("tableHouse")} ${chart.mcHouse}`, labelGlossary: "mc" },
        { label: t("ic"), value: `${formatDegree(chart.angles.ic)} · ${t("tableHouse")} ${chart.icHouse}`, labelGlossary: "ic" },
        { label: t("timezoneUsed"), value: chart.zoneLabel, labelGlossary: "timezoneUsed" },
      ],
    };
  }

  function renderAnglesPanel(chart) {
    const model = buildAnglesPanelModel(chart);
    $("#anglesPanel").innerHTML = renderMetricPanel(model);
  }

  function buildAscLordModel(chart) {
    const ascSign = SIGNS[chart.ascSign];
    const lord = ascSign.ruler;
    const p = chart.positions[lord];
    const groups = dignityGroups(p.dignities);
    return {
      title: t("ascLordTitle"),
      titleGlossary: "ascLord",
      note: t("ascLordText", {
        lord: `${PLANETS[lord].symbol} ${planetName(lord)}`,
        ascSign: `${ascSign.symbol} ${ascSign[state.lang]}`,
        lordPosition: formatDegree(p.lon),
        house: p.house,
        topics: houseReadingTopics(p.house, "double"),
        angularity: t(p.angularity),
      }),
      conditionGroups: [
        { label: t("dignityMajor"), glossary: "dignityMajor", values: groups.major },
        { label: t("dignityTriplicity"), glossary: "dignityTriplicity", values: groups.triplicity },
        { label: t("dignityMinor"), glossary: "dignityMinor", values: groups.minor },
        { label: t("dignityAdministration"), glossary: "dignityAdministration", values: groups.administration },
        { label: t("weaknesses"), glossary: "weaknesses", values: groups.weakness },
      ],
    };
  }

  function renderConditionGroup(item, chart) {
    return `<p><strong>${glossaryTerm(item.label, item.glossary)}:</strong> ${dignityGroupText(item.values, chart)}.</p>`;
  }

  function renderAscLord(chart) {
    const model = buildAscLordModel(chart);
    $("#ascLordPanel").innerHTML = `
      <h3>${glossaryTerm(model.title, model.titleGlossary)}</h3>
      <p class="text-note">${escapeHtml(model.note)}</p>
      <div class="condition-list">
        ${model.conditionGroups.map((item) => renderConditionGroup(item, chart)).join("")}
      </div>
    `;
  }

  function moonStatusText(chart) {
    if (chart.moon.voidOfCourse) return t("moonStatusVoid30");
    if (chart.moon.voidOfCourseBySign) return t("moonStatusVoidSign");
    if (!chart.moon.hasApplyingWithinOrb) return t("moonStatusNoClose");
    return t("moonStatusActive");
  }

  function buildMoonPanelModel(chart) {
    const phaseDistance = chart.moon.elongation > 180 ? 360 - chart.moon.elongation : chart.moon.elongation;
    const phaseContext = t(chart.moon.elongation > 180 ? "moonBeforeNew" : "moonAfterNew", {
      degrees: `${formatDecimal(phaseDistance, 1)}°`,
    });
    const lastSeparation = lunarContactLabel(chart.moon.lastSeparation, "separating") || t("moonNoSeparation");
    const nextApplication = lunarContactLabel(chart.moon.nextApplication, "applying") || t("moonNoApplication");
    return {
      title: t("moonTitle"),
      titleGlossary: "lunarCondition",
      metrics: [
        { label: t("moonStatus"), value: moonStatusText(chart), valueClass: "capitalize-first", labelGlossary: "moonStatus" },
        { label: t("moonPhase"), value: `${chart.moon.phase} · ${phaseContext}`, valueClass: "capitalize-first", labelGlossary: "moonPhase", valueGlossary: "moonPhase" },
        { label: t("moonElongation"), value: `${formatDecimal(chart.moon.elongation, 1)}°`, labelGlossary: "moonElongation" },
        { label: t("moonLastSeparation"), value: lastSeparation, labelGlossary: "moonLastSeparation" },
        { label: t("moonNextApplication"), value: nextApplication, labelGlossary: "moonNextApplication" },
        { label: t("moonVoc30"), value: chart.moon.voidOfCourse ? t("yesVoc") : t("notVoc"), labelGlossary: "moonVoc30" },
        { label: t("moonVocSign"), value: chart.moon.voidOfCourseBySign ? t("yesVocSign") : t("notVocSign"), labelGlossary: "moonVocSign" },
        { label: t("moonNoApplyingWithinOrb"), value: chart.moon.hasApplyingWithinOrb ? t("no") : t("yes"), labelGlossary: "moonNoApplyingWithinOrb" },
      ],
    };
  }

  function renderMoon(chart) {
    const model = buildMoonPanelModel(chart);
    $("#moonPanel").innerHTML = renderMetricPanel(model);
  }

  function ephemerisEngineLabel(chart) {
    return chart.ephemerisEngine === "astronomy" ? t("astronomyEngine") : t("fallbackEngine");
  }

  function aspectModeLabel(input) {
    if (input.aspectMode === "both") return t("signAndDegree");
    return input.aspectMode === "degree" ? t("byDegree") : t("bySign");
  }

  function calendarModeLabel(input) {
    return input.calendar === "julian"
      ? `${t(input.calendar)} · ${t("calendarJulianWarning")}`
      : t(input.calendar);
  }

  function zodiacModeLabel(input) {
    return input.zodiac === "sidereal"
      ? `${t(input.zodiac)} · ${t("zodiacBaseWarning")}`
      : t(input.zodiac);
  }

  function buildTechnicalAstronomyMetrics(chart) {
    return [
      { label: t("localDateTime"), value: `${formatDateLabel(chart.input.date)} · ${chart.input.time || "—"}` },
      { label: t("utcDateTime"), value: formatUtcDateTime(chart.jd) },
      { label: t("timezoneUsed"), value: chart.zoneLabel, labelGlossary: "timezoneUsed" },
      { label: t("coordinates"), value: `${formatDecimal(chart.input.latitude, 4)}, ${formatDecimal(chart.input.longitude, 4)}` },
      { label: t("calendar"), value: calendarModeLabel(chart.input) },
      { label: t("zodiac"), value: zodiacModeLabel(chart.input), labelGlossary: "zodiac" },
      { label: t("sectCalculation"), value: t("sectCalculationValue", { altitude: formatSignedAngle(chart.sunAltitude) }), labelGlossary: "sect" },
      { label: t("ephemerisEngine"), value: ephemerisEngineLabel(chart), labelGlossary: "ephemeris" },
    ];
  }

  function buildTechnicalJudgmentMetrics(chart) {
    return [
      { label: t("houses"), value: t("wholeSign"), labelGlossary: "wholeSign" },
      { label: t("aspectTableMode"), value: aspectModeLabel(chart.input), labelGlossary: "aspects" },
      { label: t("judgmentFrame"), value: t("judgmentFrameSign"), labelGlossary: "aspects" },
      { label: t("solarThresholds"), value: t("solarThresholdValues"), labelGlossary: "solarPhase" },
      { label: t("moonVoidDefinitions"), value: t("moonVoidDefinitionsValues"), labelGlossary: "moonVoc" },
      { label: t("techniqueMode"), value: t(chart.input.techniqueMode === "mixed" ? "mixed" : "strict"), labelGlossary: "technique" },
      { label: t("modernDisplayed"), value: chart.input.includeModern ? t("yes") : t("no"), labelGlossary: "modernPlanets" },
      { label: t("modernWeightedBase"), value: t("modernNotWeighted"), labelGlossary: "modernPlanets" },
    ];
  }

  function buildTechnicalPanelModel(chart) {
    return {
      title: t("technicalTitle"),
      notes: [t("technicalLimitsCompact"), t("technicalMcIcNote")],
      astronomyTitle: t("technicalAstronomyTitle"),
      astronomyMetrics: buildTechnicalAstronomyMetrics(chart),
      judgmentTitle: t("technicalJudgmentTitle"),
      judgmentMetrics: buildTechnicalJudgmentMetrics(chart),
      boundary: boundaryWarnings(chart),
    };
  }

  function renderTechnicalNotes(notes) {
    return `
      <div class="technical-notes">
        ${notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
      </div>
    `;
  }

  function renderTechnicalMetricSection(title, metrics, extraHtml = "") {
    return `
      <section class="technical-section">
        <h4>${escapeHtml(title)}</h4>
        <div class="technical-grid">
          ${renderMetricItems(metrics)}
          ${extraHtml}
        </div>
      </section>
    `;
  }

  function renderTechnicalPanel(chart) {
    const model = buildTechnicalPanelModel(chart);
    $("#technicalPanel").innerHTML = `
      <details>
        <summary><h3>${escapeHtml(model.title)}</h3></summary>
        ${renderTechnicalNotes(model.notes)}
        ${renderTechnicalMetricSection(model.astronomyTitle, model.astronomyMetrics)}
        ${renderTechnicalMetricSection(model.judgmentTitle, model.judgmentMetrics, renderBoundaryAudit(model.boundary))}
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
    const onlyAdministration = !groups.major.length && !groups.triplicity.length && !groups.minor.length && !groups.weakness.length && groups.administration.length;
    if (onlyAdministration) parts.push(capitalizeText(t("noMajorDignity")));
    if (groups.major.length) parts.push(`${t("dignityMajor")}: ${list(groups.major)}`);
    if (groups.triplicity.length) parts.push(`${t("dignityTriplicity")}: ${list(groups.triplicity)}`);
    if (groups.minor.length) parts.push(`${t("dignityMinor")}: ${list(groups.minor)}`);
    if (groups.administration.length) parts.push(`${t("dignityAdministration")}: ${list(groups.administration)}`);
    if (groups.weakness.length) parts.push(`${t("weaknesses")}: ${list(groups.weakness)}`);
    return parts.length ? parts.join("; ") : capitalizeText(t("noMajorDignity"));
  }

  function angularityWeight(angularity) {
    if (angularity === "angular") return t("testimonyStrong");
    if (angularity === "succedent") return t("testimonyMedium");
    return t("testimonyLow");
  }

  const ANGULARITY_READING_TEXT = Object.freeze({
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
  });

  function angularityReading(angularity) {
    return ANGULARITY_READING_TEXT[state.lang]?.[angularity] || ANGULARITY_READING_TEXT.es[angularity] || angularity;
  }

  const PLAIN_HOUSE_TOPICS = Object.freeze({
    es: {
      1: "cuerpo, salud, apariencia, constitución y presencia personal",
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
      1: "body, health, appearance, constitution, and personal presence",
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
  });

  function plainHouseTopics(house) {
    return PLAIN_HOUSE_TOPICS[state.lang]?.[house] || houseTopics(house);
  }

  function isDifficultHouse(house) {
    return [6, 8, 12].includes(Number(house));
  }

  function houseReadingTopics(house, mode = "plain") {
    if (mode === "technical") return houseTopics(house);
    if (mode === "double" && isDifficultHouse(house)) {
      return state.lang === "es"
        ? `tópicos tradicionales: ${houseTopics(house)}; lectura práctica: ${plainHouseTopics(house)}`
        : `traditional topics: ${houseTopics(house)}; practical reading: ${plainHouseTopics(house)}`;
    }
    return plainHouseTopics(house);
  }

  function difficultHouseCaution() {
    return state.lang === "es"
      ? "No debe leerse como predicción literal por sí sola: depende del regente del lugar, su condición, configuraciones, secta y activación temporal."
      : "It should not be read as a literal prediction by itself: it depends on the place ruler, its condition, configurations, sect, and timing activation.";
  }

  const SIGN_STYLE_TEXT = Object.freeze({
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
  });

  function signStyleReading(sign) {
    const styleText = SIGN_STYLE_TEXT[state.lang]?.[sign.key] || sign[state.lang];
    return state.lang === "es"
      ? `${sign[state.lang]} da a este planeta una manera de actuar ${styleText}.`
      : `${sign[state.lang]} gives this planet a ${styleText} way of acting.`;
  }

  const PLANET_PLAIN_MEANINGS = Object.freeze({
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
  });

  function planetPlainMeaning(key) {
    return PLANET_PLAIN_MEANINGS[state.lang]?.[key] || planetName(key);
  }

  function essentialConditionLabels(position, chart = null) {
    const groups = dignityGroups(position.dignities || []);
    return {
      major: groups.major.map((item) => dignityDisplayLabel(item, chart)),
      triplicity: groups.triplicity.map((item) => dignityDisplayLabel(item, chart)),
      minor: groups.minor.map((item) => dignityDisplayLabel(item, chart)),
      administration: groups.administration.map((item) => dignityDisplayLabel(item, chart)),
      weakness: groups.weakness.map((item) => dignityDisplayLabel(item, chart)),
    };
  }

  function essentialConditionProfile(labels) {
    if (labels.major.length && labels.weakness.length) return "majorWithWeakness";
    if (labels.major.length) return "major";
    if (labels.triplicity.length && labels.weakness.length) return "triplicityWithWeakness";
    if (labels.triplicity.length) return "triplicity";
    if (labels.weakness.length) return "weakness";
    if (labels.minor.length) return "minor";
    if (labels.administration.length) return "administration";
    return "unmarked";
  }

  function essentialConditionText(profile, labels) {
    const { major, triplicity, minor, administration, weakness } = labels;
    if (state.lang === "es") {
      if (profile === "majorWithWeakness") {
        return `Tiene recursos propios (${major.join(", ")}), pero también una dificultad de fondo (${weakness.join(", ")}).`;
      }
      if (profile === "major") return `Tiene recursos propios (${major.join(", ")}), así que puede actuar con más coherencia.`;
      if (profile === "triplicityWithWeakness") {
        return `Tiene soporte por triplicidad (${triplicity.join(", ")}), pero también una dificultad de fondo (${weakness.join(", ")}). Esa ayuda no equivale a domicilio o exaltación, aunque sí da sostén real.`;
      }
      if (profile === "triplicity") return `Tiene soporte por triplicidad (${triplicity.join(", ")}): ayuda real por secta o elemento, aunque no equivale a domicilio o exaltación.`;
      if (profile === "weakness") {
        const minorText = minor.length ? `, aunque conserva dignidad menor propia por ${minor.join(", ")}` : "";
        return `Trabaja con una dificultad de fondo (${weakness.join(", ")})${minorText}; no significa fracaso, sino más necesidad de ajuste.`;
      }
      if (profile === "minor") return `No tiene domicilio ni exaltación, pero conserva dignidad menor propia por ${minor.join(", ")}.`;
      if (profile === "administration") return `No tiene una dignidad mayor clara; ${administration.join(", ")} describe quién administra el grado, no un apoyo propio automático.`;
      return `No tiene una dignidad mayor clara; su importancia viene sobre todo de su lugar en la carta y de sus conexiones.`;
    }
    if (profile === "majorWithWeakness") {
      return `It has resources of its own (${major.join(", ")}), but also a background difficulty (${weakness.join(", ")}).`;
    }
    if (profile === "major") return `It has resources of its own (${major.join(", ")}), so it can act with more coherence.`;
    if (profile === "triplicityWithWeakness") {
      return `It has triplicity support (${triplicity.join(", ")}), but also a background difficulty (${weakness.join(", ")}). That support is not the same as domicile or exaltation, though it is a real stabilizer.`;
    }
    if (profile === "triplicity") return `It has triplicity support (${triplicity.join(", ")}): a real sect or elemental support, though not the same as domicile or exaltation.`;
    if (profile === "weakness") {
      const minorText = minor.length ? `, though it keeps own minor dignity through ${minor.join(", ")}` : "";
      return `It works with a background difficulty (${weakness.join(", ")})${minorText}; this does not mean failure, but more need for adjustment.`;
    }
    if (profile === "minor") return `It has no domicile or exaltation, but keeps own minor dignity through ${minor.join(", ")}.`;
    if (profile === "administration") return `It has no clear major dignity; ${administration.join(", ")} describes who administers the degree, not automatic support of its own.`;
    return `It has no clear major dignity; its importance comes mostly from its place in the chart and from its connections.`;
  }

  function essentialConditionReading(position, chart = null) {
    const labels = essentialConditionLabels(position, chart);
    return essentialConditionText(essentialConditionProfile(labels), labels);
  }

  function focusLabel(focus) {
    return state.lang === "es"
      ? `Casa ${focus.house}: ${houseReadingTopics(focus.house, "double")}`
      : `House ${focus.house}: ${houseReadingTopics(focus.house, "double")}`;
  }

  function wholeSignHouseSign(chart, house) {
    return (chart.ascSign + house - 1) % 12;
  }

  function wholeSignHouseRuler(chart, house) {
    return SIGNS[wholeSignHouseSign(chart, house)].ruler;
  }

  function focusTextList(focuses) {
    return focuses.map(focusLabel).join("; ");
  }

  function focusRulerEvidence(focuses, chart) {
    if (!focuses?.length) return "";
    const entries = focuses.slice(0, 3).map((focus) => {
      const ruler = wholeSignHouseRuler(chart, focus.house);
      const position = chart.positions[ruler];
      const planetsInside = VISIBLE_KEYS.filter((key) => chart.positions[key]?.house === focus.house);
      const occupancy = planetsInside.length
        ? (state.lang === "es"
          ? `con planetas visibles: ${naturalList(planetsInside.map(planetLabel))}`
          : `with visible planets: ${naturalList(planetsInside.map(planetLabel))}`)
        : (state.lang === "es" ? "sin planetas visibles dentro" : "with no visible planets inside");
      return state.lang === "es"
        ? `casa ${focus.house}: regente ${planetLabel(ruler)} en casa ${position.house} (${occupancy})`
        : `house ${focus.house}: ruler ${planetLabel(ruler)} in house ${position.house} (${occupancy})`;
    });
    return state.lang === "es"
      ? `Regentes de focos: ${entries.join("; ")}. Una casa vacía sigue activa por su regente.`
      : `Focus rulers: ${entries.join("; ")}. An empty house remains active through its ruler.`;
  }

  function focusReasonsText(focus) {
    return [...new Set(focus.reasons)].join(", ");
  }

  function scoreNumber(value) {
    const fixed = Number(value).toFixed(2).replace(/\.?0+$/, "");
    return state.lang === "es" ? fixed.replace(".", ",") : fixed;
  }

  function focusScoreBreakdown(focus) {
    const houseWord = state.lang === "es" ? "Casa" : "House";
    const pointsWord = state.lang === "es" ? "puntos" : "points";
    const parts = (focus.scoreItems || []).map((item) => `+${scoreNumber(item.points)} ${item.reason}`);
    return `${houseWord} ${focus.house} — ${scoreNumber(focus.score)} ${pointsWord}${parts.length ? ` (${parts.join("; ")})` : ""}`;
  }

  function isConnectedWithFocus(position, focuses, ascLordPosition) {
    return connectionStrength(position, focuses, ascLordPosition) !== "none";
  }

  function connectionStrength(position, focuses, ascLordPosition) {
    if (!position) return "none";
    const mainHouses = focuses.map((focus) => focus.house);
    if (ascLordPosition && position.house === ascLordPosition.house) return "strong";
    if (position.angularity === "angular") return "strong";
    if (mainHouses.includes(position.house)) return "medium";
    if (ascLordPosition && signAspectType(signOf(position.lon), signOf(ascLordPosition.lon))) return "weak";
    return "none";
  }

  function connectionReading(position, focuses, ascLordPosition, role) {
    const connection = connectionStrength(position, focuses, ascLordPosition);
    if (state.lang === "es") {
      if (role === "support") {
        if (connection === "strong") return "Al tocar una zona central de la carta, esa ayuda se vuelve visible y utilizable.";
        if (connection === "medium") return "También toca uno de los focos principales, así que no queda como una promesa secundaria.";
        if (connection === "weak") return "Tiene una conexión de fondo con la dirección vital; conviene no exagerarla sin señales adicionales.";
        return "No parece organizar la carta entera; funciona mejor como recurso secundario, aunque real.";
      }
      if (connection === "strong") return "Al tocar una zona central de la carta, esta presión pesa mucho y pide manejo consciente.";
      if (connection === "medium") return "Como toca uno de los focos principales, esta presión se nota más en la vida práctica.";
      if (connection === "weak") return "Hay una conexión amplia con la dirección vital, pero por sí sola no vuelve dominante esta presión.";
      return "Parece una fricción secundaria: conviene tenerla presente, pero no domina la estructura principal.";
    }
    if (role === "support") {
      if (connection === "strong") return "Because it touches a central part of the chart, that help becomes visible and usable.";
      if (connection === "medium") return "It also touches one of the main focuses, so it is not merely a secondary promise.";
      if (connection === "weak") return "It has a background connection with life direction; do not overstate it without additional signals.";
      return "It does not seem to organize the whole chart; it works better as a secondary but real resource.";
    }
    if (connection === "strong") return "Because it touches a central part of the chart, this pressure carries weight and asks for conscious handling.";
    if (connection === "medium") return "Because it touches one of the main focuses, this pressure is more noticeable in practical life.";
    if (connection === "weak") return "There is a broad connection with life direction, but by itself it does not make this pressure dominant.";
    return "It looks like secondary friction: worth noting, but not dominant in the overall structure.";
  }

  function focusLeadProfile(focuses) {
    const dominant = focuses[0];
    return {
      house: dominant?.house || 1,
      hasPublicFocus: focuses.some((focus) => focus.house === 10),
    };
  }

  function focusLeadReading(focuses) {
    return focusLeadText(focusLeadProfile(focuses));
  }

  function focusLeadText(profile) {
    const { house, hasPublicFocus } = profile;
    if (state.lang === "es") {
      if (house === 4) {
        return `El motor de la carta nace en temas de raíz: ${houseReadingTopics(4)}. ${hasPublicFocus ? "Esto no impide visibilidad pública; más bien muestra desde dónde se alimenta la proyección exterior." : "Esto muestra desde dónde se alimenta la dirección vital."}`;
      }
      if (house === 2) {
        return `La carta pone énfasis en recursos: ${houseReadingTopics(2)}. No habla solo de dinero, sino de herramientas, valor y medios concretos para sostener la vida.`;
      }
      if (house === 6 || house === 8 || house === 12) {
        return `Una parte importante de la carta se concentra en temas exigentes de casa ${house}. ${houseReadingTopics(house, "double")}. ${difficultHouseCaution()}`;
      }
      if (house === 7) {
        return `La carta se entiende muy bien desde la relación con otros: ${houseReadingTopics(7)}. No habla solo de pareja, sino también de interlocutores, audiencias, acuerdos y confrontación.`;
      }
      return `Esta carta se entiende sobre todo desde ${houseReadingTopics(house, "double")}. Ese foco aparece reforzado por varias piezas, no por una sola posición.`;
    }
    if (house === 4) {
      return `The chart's engine starts in root matters: ${houseReadingTopics(4)}. ${hasPublicFocus ? "This does not prevent public visibility; it shows where outward projection is fed from." : "This shows where life direction is fed from."}`;
    }
    if (house === 2) {
      return `The chart emphasizes resources: ${houseReadingTopics(2)}. This is not only money, but tools, value, and concrete means for sustaining life.`;
    }
    if (house === 6 || house === 8 || house === 12) {
      return `A major part of the chart gathers around demanding house ${house} themes. ${houseReadingTopics(house, "double")}. ${difficultHouseCaution()}`;
    }
    if (house === 7) {
      return `The chart is strongly understood through relation with others: ${houseReadingTopics(7)}. This is not only partnership, but interlocutors, audiences, agreements, and confrontation.`;
    }
    return `This chart is best understood through ${houseReadingTopics(house, "double")}. That focus is reinforced by several pieces, not by one isolated placement.`;
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
    const majorStrong = groups.major.some((item) => ["domicile", "exaltation"].includes(glossaryKeyForText(item)));
    const triplicityStrong = role === "active";
    const ownMinor = groups.minor.length > 0;
    const contextualTriplicity = role === "cooperating" || role === "contrary";
    const medium = triplicityStrong || ownMinor;
    return {
      strong: majorStrong,
      majorStrong,
      triplicityStrong,
      ownMinor,
      contextualTriplicity,
      medium,
      weak: groups.weakness.length > 0,
      role,
      groups,
    };
  }

  function conditionPlainTone(planet, position, chart) {
    const strength = dignityStrength(planet, position, chart);
    if (state.lang === "es") {
      if (strength.strong && strength.weak) return "Tiene recursos reales, aunque también necesita ajustes para usarlos sin fricción.";
      if (strength.strong) return "Cuenta con recursos propios y puede actuar con más coherencia.";
      if (strength.weak && strength.medium) return "Tiene apoyo parcial, pero lo expresa con esfuerzo o negociación.";
      if (strength.weak) return "Trabaja con fricción de fondo y necesita más mediación.";
      if (strength.medium) return "Tiene apoyo parcial; no es una fuerza plena, pero sí un sostén aprovechable.";
      return "No muestra recursos propios fuertes; su peso depende más del lugar que ocupa y de sus conexiones.";
    }
    if (strength.strong && strength.weak) return "It has real resources, though it also needs adjustment to use them without friction.";
    if (strength.strong) return "It has resources of its own and can act with more coherence.";
    if (strength.weak && strength.medium) return "It has partial support, but expresses it through effort or negotiation.";
    if (strength.weak) return "It works with background friction and needs more mediation.";
    if (strength.medium) return "It has partial support; not full strength, but usable backing.";
    return "It shows no strong resources of its own; its weight depends more on placement and connections.";
  }

  function placementVisibilityTone(position) {
    if (state.lang === "es") {
      if (position.angularity === "angular") return "se vuelve visible y difícil de ignorar";
      if (position.angularity === "succedent") return "se sostiene con el tiempo y gana peso por acumulación";
      return "opera de forma más indirecta, discreta o dependiente del contexto";
    }
    if (position.angularity === "angular") return "becomes visible and hard to ignore";
    if (position.angularity === "succedent") return "builds over time and gains weight by accumulation";
    return "operates more indirectly, quietly, or through context";
  }

  function planetJudgmentScore(planet, position, chart, options = {}) {
    const strength = dignityStrength(planet, position, chart);
    let score = 0;
    if (position.angularity === "angular") score += 1.5;
    else if (position.angularity === "succedent") score += 0.5;
    else score -= 0.5;
    if (strength.strong) score += 1.75;
    if (strength.medium) score += 0.75;
    if (strength.weak) score -= 1.75;
    if (isDifficultHouse(position.house)) score -= 1.25;
    if (planet === chart.beneficOfSect) score += 1.25;
    if (planet === chart.maleficContrarySect) score -= 1.25;
    if (planet === chart.maleficOfSect) score -= 0.5;
    if (isSolarObscuredWithoutChariot(planet, chart)) score -= 1;
    if (options.supportConnected) score += 0.75;
    if (options.pressureConnected) score -= 0.75;
    return score;
  }

  function judgmentPolarity(score) {
    if (score >= 2.5) return "supportive";
    if (score <= -2) return "demanding";
    return "mixed";
  }

  function planetRoleInSectText(planet, chart) {
    if (planet === chart.beneficOfSect) return state.lang === "es"
      ? "Además, ese mismo planeta es el principal apoyo de la carta."
      : "Also, this same planet is the chart's main support.";
    if (planet === chart.maleficContrarySect) return state.lang === "es"
      ? "Además, ese mismo planeta es la presión principal de la carta."
      : "Also, this same planet is the chart's main pressure.";
    if (planet === chart.maleficOfSect) return state.lang === "es"
      ? "Ese planeta puede marcar trabajo, esfuerzo o sobriedad, aunque no sea la presión más aguda de la carta."
      : "This planet can mark work, effort, or sobriety, though it is not the chart's sharpest pressure.";
    return "";
  }

  function coreTopicPhrase(planet, house) {
    const planetTopic = planetPlainMeaning(planet);
    const houseTopic = houseReadingTopics(house, "double");
    return state.lang === "es"
      ? `${planetTopic}, expresado en ${houseTopic}`
      : `${planetTopic}, expressed through ${houseTopic}`;
  }

  function lifeDirectionProfile(ascLord, ascLordPosition, chart) {
    const score = planetJudgmentScore(ascLord, ascLordPosition, chart);
    const polarity = judgmentPolarity(score);
    const roleText = planetRoleInSectText(ascLord, chart);
    const hidden = isSolarObscuredWithoutChariot(ascLord, chart)
      ? (state.lang === "es"
        ? " Parte del rumbo puede necesitar protección, reserva o tiempo antes de mostrarse con claridad."
        : " Part of the direction may need protection, privacy, or time before it shows clearly.")
      : "";
    const topic = coreTopicPhrase(ascLord, ascLordPosition.house);
    return { score, polarity, roleText, hidden, topic };
  }

  function lifeDirectionConclusion(ascLord, ascLordPosition, chart) {
    return lifeDirectionConclusionText(lifeDirectionProfile(ascLord, ascLordPosition, chart));
  }

  function lifeDirectionConclusionText(profile) {
    const { polarity, roleText, hidden, topic } = profile;
    if (state.lang === "es") {
      if (polarity === "supportive") {
        return `El tópico central de la dirección vital es ${topic}. La carta da recursos suficientes para que esa dirección se vuelva visible o eficaz; no significa ausencia de problemas, sino capacidad real para construir camino desde ahí. ${roleText}${hidden}`.trim();
      }
      if (polarity === "demanding") {
        return `El tópico central de la dirección vital es ${topic}. Este rumbo arrostra dificultad: puede exigir defensa, adaptación, servicio, paciencia o trabajo sostenido antes de sentirse propio. ${roleText}${hidden}`.trim();
      }
      return `El tópico central de la dirección vital es ${topic}. El juicio es mixto: hay recursos aprovechables, pero también condiciones que piden mediación, aprendizaje o estrategia. ${roleText}${hidden}`.trim();
    }
    if (polarity === "supportive") {
      return `The central life-direction topic is ${topic}. The chart gives enough resources for that direction to become visible or effective; this does not mean no problems, but real capacity to build a path from there. ${roleText}${hidden}`.trim();
    }
    if (polarity === "demanding") {
      return `The central life-direction topic is ${topic}. This path carries difficulty: it may require defense, adaptation, service, patience, or sustained work before it feels fully one's own. ${roleText}${hidden}`.trim();
    }
    return `The central life-direction topic is ${topic}. The judgment is mixed: usable resources are present, but so are conditions that ask for mediation, learning, or strategy. ${roleText}${hidden}`.trim();
  }

  function publicProjectionScore(chart, planetsInTenth, tenthRuler, tenthRulerPosition) {
    const rulerStrength = dignityStrength(tenthRuler, tenthRulerPosition, chart);
    const rulerObscured = isSolarObscuredWithoutChariot(tenthRuler, chart);
    let score = 0;
    if (chart.mcHouse === 10) score += 2;
    else if (placeQuality(chart.mcHouse) === "angular") score += 1;
    else if (placeQuality(chart.mcHouse) === "succedent") score += 0.5;
    else score -= 0.5;
    if (planetsInTenth.length) score += 1;
    if (tenthRulerPosition.angularity === "angular") score += 1.25;
    else if (tenthRulerPosition.angularity === "succedent") score += 0.5;
    else score -= 0.5;
    if (rulerStrength.strong) score += 1;
    if (rulerStrength.weak) score -= 1;
    if (rulerObscured) score -= 0.75;
    if (isDifficultHouse(tenthRulerPosition.house)) score -= 0.5;
    return score;
  }

  function publicProjectionLevel(score) {
    if (score >= 3) return "strong";
    if (score <= 0) return "reduced";
    return "mediated";
  }

  function publicProjectionChannelText(tenthRulerPosition) {
    return state.lang === "es"
      ? `La reputación tiende a construirse a través de la casa ${tenthRulerPosition.house}: ${houseReadingTopics(tenthRulerPosition.house, "double")}.`
      : `Reputation tends to be built through house ${tenthRulerPosition.house}: ${houseReadingTopics(tenthRulerPosition.house, "double")}.`;
  }

  function publicProjectionRelationshipNote(tenthRulerPosition) {
    if (![7, 11].includes(tenthRulerPosition.house)) return "";
    return state.lang === "es"
      ? "Al pasar por una casa de vínculos, la visibilidad puede depender mucho de alianzas, audiencias, pactos o redes; a veces eso comparte el foco con otras personas."
      : "Because this runs through a relational house, visibility can depend strongly on alliances, audiences, agreements, or networks; at times the spotlight is shared with others.";
  }

  function publicProjectionHiddenNote(tenthRuler, chart) {
    if (!isSolarObscuredWithoutChariot(tenthRuler, chart)) return "";
    return state.lang === "es"
      ? "El regente de la casa 10 está oculto por el Sol, así que una parte del reconocimiento puede ser menos directa, más privada o más difícil de leer desde fuera."
      : "The 10th-house ruler is hidden by the Sun, so part of the recognition can be less direct, more private, or harder to read from the outside.";
  }

  function publicProjectionConclusionText(level, notes) {
    const { channel, relationshipNote, hiddenNote } = notes;
    if (state.lang === "es") {
      if (level === "strong") {
        return `La proyección pública no parece marginal; tiende a pedir presencia, responsabilidad o reconocimiento visible. ${channel} ${relationshipNote} ${hiddenNote}`.trim();
      }
      if (level === "reduced") {
        return `La vida pública no desaparece, pero se muestra más indirecta, reducida o mediada; puede requerir tiempo, protección o trabajo detrás de escena antes de volverse reconocible. ${channel} ${relationshipNote} ${hiddenNote}`.trim();
      }
      return `Hay proyección pública, pero no funciona como simple exposición constante; se gana forma por el área que administra el regente de la casa 10. ${channel} ${relationshipNote} ${hiddenNote}`.trim();
    }
    if (level === "strong") {
      return `Public projection does not look marginal; it tends to ask for presence, responsibility, or visible recognition. ${channel} ${relationshipNote} ${hiddenNote}`.trim();
    }
    if (level === "reduced") {
      return `Public life does not disappear, but it looks more indirect, reduced, or mediated; it may need time, protection, or behind-the-scenes work before becoming recognizable. ${channel} ${relationshipNote} ${hiddenNote}`.trim();
    }
    return `Public projection is present, but not as constant exposure; it takes shape through the area managed by the 10th-house ruler. ${channel} ${relationshipNote} ${hiddenNote}`.trim();
  }

  function publicProjectionConclusion(chart, planetsInTenth, tenthRuler, tenthRulerPosition) {
    const score = publicProjectionScore(chart, planetsInTenth, tenthRuler, tenthRulerPosition);
    return publicProjectionConclusionText(publicProjectionLevel(score), {
      channel: publicProjectionChannelText(tenthRulerPosition),
      relationshipNote: publicProjectionRelationshipNote(tenthRulerPosition),
      hiddenNote: publicProjectionHiddenNote(tenthRuler, chart),
    });
  }

  function supportLevel(position, focuses, ascLordPosition, planet = "", chart = null) {
    const strength = dignityStrength(planet, position, chart);
    const connected = connectionStrength(position, focuses, ascLordPosition);
    let level = "secondaryLevel";
    if (connected === "strong" && strength.strong) level = "strongLevel";
    else if (["strong", "medium"].includes(connected)) level = "moderateLevel";
    else if (connected === "weak" && (strength.strong || strength.medium)) level = "moderateLevel";
    if (isSolarObscuredWithoutChariot(planet, chart)) return lowerSupportLevel(level);
    return level;
  }

  function supportConclusion(planet, position, focuses, ascLordPosition, chart) {
    const level = supportLevel(position, focuses, ascLordPosition, planet, chart);
    if (state.lang === "es") {
      if (level === "strongLevel") return "Este apoyo es central y utilizable; puede traducirse en protección, oportunidades, mediadores favorables o crecimiento real en esa zona.";
      if (level === "moderateLevel") return "Hay ayuda real, pero conviene cultivarla; no actúa como garantía automática, sino como una puerta que se abre mejor cuando se trabaja ese tema.";
      return "El apoyo existe más como recurso de fondo que como motor principal; suma alivio, pero no organiza toda la lectura.";
    }
    if (level === "strongLevel") return "This support is central and usable; it can show as protection, opportunity, helpful mediators, or real growth in that area.";
    if (level === "moderateLevel") return "There is real help, but it needs cultivation; it is not an automatic guarantee, but a door that opens better when the topic is worked.";
    return "The support exists more as a background resource than as the main engine; it adds relief, but does not organize the whole reading.";
  }

  function tensionLevel(position, focuses, ascLordPosition, planet = "", chart = null) {
    const strength = dignityStrength(planet, position, chart);
    const connected = connectionStrength(position, focuses, ascLordPosition);
    if (["strong", "medium"].includes(connected) && strength.weak) return "highLevel";
    if (["strong", "medium"].includes(connected)) return "mediumLevel";
    return "lowLevel";
  }

  function tensionConclusion(planet, position, focuses, ascLordPosition, chart) {
    const level = tensionLevel(position, focuses, ascLordPosition, planet, chart);
    if (state.lang === "es") {
      if (level === "highLevel") return "Esta zona no conviene ignorarla; pide límites claros, paciencia y decisiones prácticas para que la presión no gobierne el resto de la carta.";
      if (level === "mediumLevel") return "La presión es relevante pero manejable; puede convertirse en disciplina, resistencia o madurez si no se deja actuar de forma automática.";
      return "Es una fricción secundaria; merece atención, pero no parece opacar por sí sola la dirección principal de la vida.";
    }
    if (level === "highLevel") return "This area should not be ignored; it asks for clear limits, patience, and practical decisions so the pressure does not run the rest of the chart.";
    if (level === "mediumLevel") return "The pressure is relevant but manageable; it can become discipline, endurance, or maturity when it is not left to act automatically.";
    return "This is secondary friction; it deserves attention, but does not by itself seem to overshadow the main life direction.";
  }

  function prominenceLevel(position) {
    if (position.angularity === "angular") return "highLevel";
    if (position.angularity === "succedent") return "mediumLevel";
    return "lowLevel";
  }

  function lowerSupportLevel(level) {
    if (level === "strongLevel") return "moderateLevel";
    if (level === "moderateLevel") return "secondaryLevel";
    return level;
  }

  function isSolarObscuredWithoutChariot(planet, chart) {
    if (!planet || !chart || planet === "sun" || planet === "moon") return false;
    const solar = solarPhaseState(planet, chart);
    return ["combust", "underBeams"].includes(solar.category) && !solar.chariot;
  }

  function buildMaleficMitigationContext(maleficPosition, beneficPosition, chart) {
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
    const reception = beneficContact ? receptionBetween(beneficKey, maleficKey, chart) : null;
    const receptionScore = reception?.effectiveScore ?? reception?.strongest ?? 0;
    return {
      maleficStrength,
      beneficStrength,
      beneficAngularity: beneficPosition.angularity,
      beneficAspect,
      beneficContact,
      closeContact,
      beneficObscured,
      receptionScore,
    };
  }

  function maleficMitigationFlags(context) {
    const {
      maleficStrength,
      beneficStrength,
      beneficAngularity,
      beneficAspect,
      beneficContact,
      closeContact,
      beneficObscured,
      receptionScore,
    } = context;
    const strongReception = receptionScore >= 3;
    const mediumReception = receptionScore >= 2;
    const favorableAspect = ["sextile", "trine"].includes(beneficAspect) || (beneficAspect === "copresence" && closeContact);
    const hardAspect = ["square", "opposition"].includes(beneficAspect);
    const regulatedHardSupport = beneficContact && hardAspect && mediumReception;
    const beneficHasWeight = beneficStrength.strong || beneficAngularity === "angular";
    const beneficHasSomeWeight = beneficHasWeight || beneficStrength.triplicityStrong || beneficStrength.ownMinor || beneficAngularity === "succedent";
    const maleficHasOwnResources = maleficStrength.strong || maleficStrength.triplicityStrong || maleficStrength.ownMinor;
    const strongMitigation = beneficContact && !beneficObscured && (favorableAspect || strongReception) && beneficHasWeight && (maleficHasOwnResources || closeContact || strongReception);
    const mediumMitigation = (
      beneficContact
      && !beneficObscured
      && !hardAspect
      && (beneficHasSomeWeight || mediumReception || closeContact)
    ) || mediumReception || maleficStrength.strong || maleficStrength.triplicityStrong || (maleficStrength.ownMinor && beneficContact && !beneficObscured);
    const weakMitigation = beneficContact || maleficStrength.ownMinor || maleficStrength.triplicityStrong || mediumReception;
    return {
      regulatedHardSupport,
      beneficObscured,
      maleficWeak: maleficStrength.weak,
      strongMitigation,
      mediumMitigation,
      weakMitigation,
    };
  }

  function maleficMitigationLevel(flags) {
    if (flags.strongMitigation) return flags.regulatedHardSupport ? "strongRegulated" : "strongDirect";
    if (flags.mediumMitigation) return flags.regulatedHardSupport ? "mediumRegulated" : "medium";
    if (flags.weakMitigation) return flags.beneficObscured ? "weakObscured" : "weak";
    if (flags.maleficWeak) return "raw";
    return "unmarked";
  }

  const MALEFIC_MITIGATION_TEXT = Object.freeze({
    es: {
      strongRegulated: "Hay una salida fuerte pero negociada: el contacto no es suave, pero existe un canal claro para que el planeta de apoyo intervenga.",
      strongDirect: "Hay una salida fuerte y directa: el planeta de apoyo puede intervenir con claridad, por cercanía, relación favorable o fuerza propia.",
      mediumRegulated: "Hay un manejo intermedio y regulado: la presión no desaparece, pero el contacto difícil tiene una vía más tratable. La lectura debe mantener ambas señales.",
      medium: "Hay un manejo intermedio: la presión no desaparece, pero aparecen recursos, ayuda o fuerza propia suficientes para trabajarla. La lectura debe mantener ambas señales.",
      weakObscured: "La ayuda es débil o dudosa: existe contacto con el planeta de apoyo, pero está oculto por el Sol sin protección clara.",
      weak: "La ayuda es débil: aparece algún recurso, pero de forma indirecta o poco dominante.",
      raw: "Al no verse claramente compensada, esta tensión puede sentirse más cruda o menos integrada.",
      unmarked: "No aparece una salida fuerte, pero tampoco una debilidad mayor clara; conviene leerla por su casa y por sus relaciones.",
    },
    en: {
      strongRegulated: "There is a strong but negotiated outlet: the contact is not smooth, but there is a clear channel for the support planet to intervene.",
      strongDirect: "There is a strong and direct outlet: the support planet can intervene clearly through closeness, a favorable relationship, or its own strength.",
      mediumRegulated: "There is moderate, regulated handling: the pressure does not disappear, but the difficult contact has a more workable route. Keep both signals in the reading.",
      medium: "There is moderate handling: the pressure does not disappear, but enough resources, help, or strength of its own appear to work with it. Keep both signals in the reading.",
      weakObscured: "Help is weak or uncertain: contact with the support planet exists, but that planet is hidden by the Sun without clear protection.",
      weak: "Help is weak: some resource appears, but indirectly or without dominance.",
      raw: "Without clear compensation, this tension can feel rawer or less integrated.",
      unmarked: "No strong outlet appears, but no clear major weakness appears either; read it through its house and relationships.",
    },
  });

  function maleficMitigationText(level) {
    return MALEFIC_MITIGATION_TEXT[state.lang === "es" ? "es" : "en"][level];
  }

  function maleficMitigationReading(maleficPosition, beneficPosition, chart) {
    const context = buildMaleficMitigationContext(maleficPosition, beneficPosition, chart);
    const flags = maleficMitigationFlags(context);
    return maleficMitigationText(maleficMitigationLevel(flags));
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

  function solarChariotText(planet, position) {
    if (!VISIBLE_KEYS.includes(planet) || planet === "sun" || planet === "moon") return "";
    const signIndex = signOf(position.lon);
    const major = [];
    if (SIGNS[signIndex].ruler === planet) major.push(t("domicile"));
    if (EXALTATIONS[planet] === signIndex) major.push(t("exaltation"));
    if (major.length) return t("chariotBy", { condition: naturalList(major) });
    if (boundLordFor(position.lon) === planet) {
      return t("chariotMitigationBy", { condition: t("bound", { planet: planetName(planet) }) });
    }
    return "";
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

  function solarPhaseTableText(planet, chart) {
    const stateInfo = solarPhaseState(planet, chart);
    const phase = chart.positions[planet]?.phase || "—";
    if (!["cazimi", "combust", "underBeams"].includes(stateInfo.category)) return phase;
    const parts = [phase, `${formatAngle(stateInfo.distance)} ${t("fromSun")}`];
    if (["combust", "underBeams"].includes(stateInfo.category)) {
      parts.push(stateInfo.chariot
        ? solarChariotText(planet, chart.positions[planet])
        : t("noChariot"));
    }
    return parts.join(" · ");
  }

  function mercuryPhaseQualifier(planet, stateInfo) {
    if (planet !== "mercury" || !stateInfo?.side) return "";
    const quality = stateInfo.side === "morning"
      ? (state.lang === "es" ? "diurna, activa y exteriorizada" : "diurnal, active, and outward")
      : (state.lang === "es" ? "nocturna, receptiva y mediada" : "nocturnal, receptive, and mediated");
    return state.lang === "es"
      ? ` En Mercurio, esta fase inclina su naturaleza común y variable hacia una cualidad más ${quality}.`
      : ` For Mercury, this phase tilts its common and variable nature toward a more ${quality} quality.`;
  }

  function solarPhasePlainProfile(planet, chart) {
    const stateInfo = solarPhaseState(planet, chart);
    if (stateInfo.category === "luminary") return null;
    const name = planetLabel(planet);
    const mercuryText = mercuryPhaseQualifier(planet, stateInfo);
    const sideText = stateInfo.side === "morning"
      ? (state.lang === "es" ? "matutino/oriental" : "morning/oriental")
      : (state.lang === "es" ? "vespertino/occidental" : "evening/occidental");
    return { planet, stateInfo, name, mercuryText, sideText };
  }

  function solarPhasePlainText(planet, chart) {
    const profile = solarPhasePlainProfile(planet, chart);
    return profile ? solarPhasePlainTextFromProfile(profile) : "";
  }

  function solarPhasePlainTextFromProfile(profile) {
    const { stateInfo, name, mercuryText, sideText } = profile;
    if (state.lang === "es") {
      if (stateInfo.category === "cazimi") {
        return `${name} está en el corazón del Sol: su significación se concentra y queda muy unida a visibilidad, autoridad o foco solar.${mercuryText}`;
      }
      if (stateInfo.category === "combust") {
        return `${name} está combusto: actúa con más presión, menor independencia y más ocultación zodiacal. ${stateInfo.chariot ? "La condición se mitiga porque el planeta conserva recursos propios por signo o término." : "Conviene leer sus temas como menos legibles técnicamente o más difíciles de expresar directamente."}${mercuryText}`;
      }
      if (stateInfo.category === "underBeams") {
        return `${name} está bajo los rayos: sus temas tienden a operar con menor legibilidad zodiacal, de forma más interna o más privada. ${stateInfo.chariot ? "La ocultación queda mitigada por recursos propios del planeta." : "Esto reduce claridad técnica o manifestación simbólica, aunque no elimina su importancia."}${mercuryText}`;
      }
      return `${name} es ${sideText}: tiende a manifestar sus temas de forma ${stateInfo.side === "morning" ? "más activa, temprana o exteriorizada" : "más receptiva, tardía o mediada por el contexto"}.${mercuryText}`;
    }
    if (stateInfo.category === "cazimi") {
      return `${name} is in the heart of the Sun: its signification is concentrated and tightly bound to visibility, authority, or solar focus.${mercuryText}`;
    }
    if (stateInfo.category === "combust") {
      return `${name} is combust: it acts under more pressure, with less independence and more zodiacal concealment. ${stateInfo.chariot ? "This is mitigated because the planet keeps resources of its own by sign or bound." : "Read its topics as less technically legible or harder to express directly."}${mercuryText}`;
    }
    if (stateInfo.category === "underBeams") {
      return `${name} is under the beams: its topics tend to operate with lower zodiacal legibility, more internally, or more privately. ${stateInfo.chariot ? "The concealment is mitigated by the planet's own resources." : "This reduces technical clarity or symbolic manifestation, though it does not erase importance."}${mercuryText}`;
    }
    return `${name} is ${sideText}: it tends to manifest its topics in a ${stateInfo.side === "morning" ? "more active, earlier, or outward" : "more receptive, later, or context-mediated"} way.${mercuryText}`;
  }

  function keyPlanetList(chart) {
    const ascLord = SIGNS[chart.ascSign].ruler;
    const trip = sectTriplicityRulers(chart);
    const lots = ["fortune", "spirit"].map((key) => lotByKey(chart, key)?.lord).filter(Boolean);
    return [...new Set([ascLord, chart.beneficOfSect, chart.maleficContrarySect, trip.primary, trip.secondary, trip.cooperating, ...lots])]
      .filter((key) => VISIBLE_KEYS.includes(key));
  }

  function keyPlanetSolarItems(chart) {
    return keyPlanetList(chart)
      .map((key) => ({ key, stateInfo: solarPhaseState(key, chart) }))
      .filter((item) => item.stateInfo.category !== "luminary");
  }

  function visibilityReadingProfile(chart) {
    const priority = keyPlanetSolarItems(chart);
    const hidden = priority.filter((item) => ["cazimi", "combust", "underBeams"].includes(item.stateInfo.category));
    let selected = (hidden.length ? hidden : priority.slice(0, 2)).slice(0, 3);
    const mercury = priority.find((item) => item.key === "mercury");
    if (mercury && !selected.some((item) => item.key === "mercury")) {
      selected = [...selected.slice(0, 2), mercury].slice(0, 3);
    }
    return { priority, hidden, selected };
  }

  function visibilityReading(chart) {
    return visibilityReadingText(visibilityReadingProfile(chart), chart);
  }

  function visibilityReadingText(profile, chart) {
    const sentences = profile.selected.map((item) => solarPhasePlainText(item.key, chart)).filter(Boolean);
    if (sentences.length) return sentences.join(" ");
    return state.lang === "es"
      ? "Los planetas clave no están bajo una ocultación solar fuerte; sus temas pueden leerse principalmente por casa, condición esencial, secta y configuraciones."
      : "The key planets are not under strong solar concealment; read their topics mainly through house, essential condition, sect, and configurations.";
  }

  function visibilityConclusionProfile(chart) {
    const priority = keyPlanetSolarItems(chart);
    return {
      priority,
      hidden: priority.filter((item) => ["combust", "underBeams"].includes(item.stateInfo.category) && !item.stateInfo.chariot),
      protectedHidden: priority.filter((item) => ["combust", "underBeams"].includes(item.stateInfo.category) && item.stateInfo.chariot),
      cazimi: priority.filter((item) => item.stateInfo.category === "cazimi"),
    };
  }

  function visibilityConclusion(chart) {
    return visibilityConclusionText(visibilityConclusionProfile(chart));
  }

  function visibilityConclusionText(profile) {
    const { hidden, protectedHidden, cazimi } = profile;
    if (state.lang === "es") {
      if (cazimi.length) return `${naturalList(cazimi.map((item) => planetLabel(item.key)))} concentra su tema de forma intensa; puede dar foco, notoriedad o dependencia fuerte de una figura solar, según la casa implicada.`;
      if (hidden.length) return `${naturalList(hidden.map((item) => planetLabel(item.key)))} opera con menor exposición: sus temas no desaparecen, pero tienden a expresarse con reserva, demora, trabajo interno o mediadores.`;
      if (protectedHidden.length) return `${naturalList(protectedHidden.map((item) => planetLabel(item.key)))} está cerca del Sol pero conserva recursos propios; el tema puede estar reservado sin quedar inutilizado.`;
      return "La visibilidad de los planetas clave es relativamente limpia; el juicio depende más de casas, regentes, secta y relaciones que de ocultación solar.";
    }
    if (cazimi.length) return `${naturalList(cazimi.map((item) => planetLabel(item.key)))} concentrates its topic intensely; this can bring focus, notoriety, or strong dependence on a solar figure, depending on the house involved.`;
    if (hidden.length) return `${naturalList(hidden.map((item) => planetLabel(item.key)))} operates with less exposure: its topics do not disappear, but tend to express through privacy, delay, internal work, or mediators.`;
    if (protectedHidden.length) return `${naturalList(protectedHidden.map((item) => planetLabel(item.key)))} is close to the Sun but keeps resources of its own; the topic can be reserved without being disabled.`;
    return "The visibility of the key planets is relatively clean; the judgment depends more on houses, rulers, sect, and relationships than on solar concealment.";
  }

  function relationIntensity(actor, target, chart, role, signType, degree, actorSuperior, targetSuperior, reception) {
    const actorPos = chart.positions[actor];
    const actorStrength = dignityStrength(actor, actorPos, chart);
    const actorSolar = solarPhaseState(actor, chart);
    const actorObscured = ["combust", "underBeams"].includes(actorSolar.category) && !actorSolar.chariot;
    const acute = degree && degree.delta <= 3;
    const friendly = ["copresence", "sextile", "trine"].includes(signType);
    const harsh = ["copresence", "square", "opposition"].includes(signType);

    if (role === "support") {
      if (!actorObscured && (acute || actorSuperior || friendly) && (actorStrength.strong || actorPos.angularity === "angular")) {
        return adjustIntensityForReception("strongLevel", role, reception);
      }
      if (!actorObscured && (friendly || acute || actorStrength.medium || actorPos.angularity === "succedent")) {
        return adjustIntensityForReception("mediumLevel", role, reception);
      }
      return adjustIntensityForReception("lowLevel", role, reception);
    }

    if ((acute || actorSuperior || harsh) && !targetSuperior && (actorStrength.strong || actorPos.angularity === "angular")) {
      return adjustIntensityForReception("highLevel", role, reception);
    }
    if (actorSuperior || acute || harsh || actorStrength.medium) {
      return adjustIntensityForReception("mediumLevel", role, reception);
    }
    return adjustIntensityForReception("lowLevel", role, reception);
  }

  function buildPlanetRelationContext(target, actor, chart, role) {
    if (target === actor) return "";
    if (!VISIBLE_KEYS.includes(target) || !VISIBLE_KEYS.includes(actor)) return "";
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
    const reception = receptionBetween(actor, target, chart);
    const intensity = relationIntensity(actor, target, chart, role, signType, degree, actorSuperior, targetSuperior, reception);
    const rawIntensity = relationIntensity(actor, target, chart, role, signType, degree, actorSuperior, targetSuperior, null);
    return {
      target,
      actor,
      role,
      signType,
      degree,
      acute,
      actorSuperior,
      targetSuperior,
      relation,
      targetName,
      actorName,
      reception,
      intensity,
      rawIntensity,
    };
  }

  function relationCopresenceText(signType) {
    if (signType !== "copresence") return "";
    return state.lang === "es"
      ? " Al compartir el mismo Lugar/Casa, ambos temas conviven de forma intensa; el resultado depende de la condición de los planetas."
      : " Because both share the same Place/House, the topics live together intensely; the result depends on the planets' condition.";
  }

  function relationSuperiorityText(context) {
    const { role, actorSuperior, targetSuperior } = context;
    if (state.lang === "es") {
      if (role === "support") {
        if (actorSuperior) return " Ese apoyo llega con ventaja y puede imponerse más fácilmente.";
        return targetSuperior ? " El tema principal conserva ventaja mientras recibe ayuda." : "";
      }
      if (actorSuperior) return ", y llega con ventaja sobre ese tema";
      return targetSuperior ? ", aunque el tema principal conserva ventaja frente a esa presión" : "";
    }
    if (role === "support") {
      if (actorSuperior) return " The support comes with leverage and can assert itself more easily.";
      return targetSuperior ? " The main topic keeps leverage while receiving help." : "";
    }
    if (actorSuperior) return ", and comes with leverage over that topic";
    return targetSuperior ? ", though the main topic keeps leverage against that pressure" : "";
  }

  function planetRelationJudgmentText(context) {
    const { target, actor, role, signType, acute, relation, targetName, actorName, reception, intensity } = context;
    const receptionText = receptionNote(target, actor, reception, role);
    const copresenceText = relationCopresenceText(signType);
    const superiority = relationSuperiorityText(context);
    if (state.lang === "es") {
      if (role === "support") {
        return `${actorName} ayuda a ${targetName} mediante una relación de ${relation}${acute ? " muy cercana por grado" : " por signo"}; la ayuda es de intensidad ${t(intensity)}.${superiority}${receptionText}${copresenceText}`;
      }
      return `${actorName} presiona a ${targetName} mediante una relación de ${relation}${acute ? " muy cercana por grado" : " por signo"}${superiority}; la presión es de intensidad ${t(intensity)}.${receptionText}${copresenceText}`;
    }
    if (role === "support") {
      return `${actorName} helps ${targetName} through a ${relation} relationship${acute ? " very close by degree" : " by sign"}; the help is ${t(intensity)}.${superiority}${receptionText}${copresenceText}`;
    }
    return `${actorName} presses ${targetName} through a ${relation} relationship${acute ? " very close by degree" : " by sign"}${superiority}; the pressure is ${t(intensity)}.${receptionText}${copresenceText}`;
  }

  function planetRelationJudgment(target, actor, chart, role) {
    const context = buildPlanetRelationContext(target, actor, chart, role);
    return context ? planetRelationJudgmentText(context) : "";
  }

  function primaryRelationTargets(chart) {
    const ascLord = SIGNS[chart.ascSign].ruler;
    return [...new Set([ascLord, chart.sectLight, lotByKey(chart, "fortune")?.lord, lotByKey(chart, "spirit")?.lord])]
      .filter(Boolean);
  }

  function primaryRelationActors(chart) {
    return [
      { key: chart.beneficOfSect, role: "support" },
      { key: chart.maleficContrarySect, role: "tension" },
    ];
  }

  function configuredRelationItems(chart) {
    const items = [];
    primaryRelationTargets(chart).forEach((target) => {
      primaryRelationActors(chart).forEach(({ key: actor, role }) => {
        const context = buildPlanetRelationContext(target, actor, chart, role);
        if (context) items.push(context);
      });
    });
    return items;
  }

  function configurationsReading(chart, focuses, ascLordPosition) {
    const judgments = configuredRelationItems(chart)
      .map(planetRelationJudgmentText)
      .filter(Boolean);
    if (judgments.length) return [...new Set(judgments)].slice(0, 4).join(" ");
    const angular = visibleAngularPlanets(chart).filter((key) => isConnectedWithFocus(chart.positions[key], focuses, ascLordPosition));
    if (angular.length) {
      return state.lang === "es"
        ? `No destaca una ayuda o presión planetaria dominante sobre los puntos principales. La lectura descansa más en qué lugares están muy visibles, especialmente ${naturalList(angular.map(planetLabel))}.`
        : `No dominant planetary help or pressure stands out on the main points. The reading rests more on which places are highly visible, especially ${naturalList(angular.map(planetLabel))}.`;
    }
    return state.lang === "es"
      ? "No aparece una relación planetaria dominante sobre los puntos principales; por eso la lectura se apoya más en regentes, casas, secta y condición esencial."
      : "No dominant planetary relationship appears on the main points; the reading therefore leans more on rulers, houses, sect, and essential condition.";
  }

  function configurationsConclusionProfile(chart) {
    const items = configuredRelationItems(chart);
    const supportItems = items.filter((item) => item.role === "support");
    const pressureItems = items.filter((item) => item.role === "tension");
    const supportRank = levelRank(strongestLevel(supportItems, "intensity"));
    const pressureRank = levelRank(strongestLevel(pressureItems, "intensity"));
    const regulatedPressure = pressureItems.some((item) => item.reception?.hasReception && item.intensity !== item.rawIntensity);
    const hardPressure = pressureItems.some((item) => levelRank(item.intensity) >= 3 || item.actorSuperior || ["square", "opposition"].includes(item.signType));
    const directSupport = supportItems.some((item) => levelRank(item.intensity) >= 2 || item.actorSuperior || ["trine", "sextile"].includes(item.signType));
    return { items, supportItems, pressureItems, supportRank, pressureRank, regulatedPressure, hardPressure, directSupport };
  }

  function configurationsConclusion(chart) {
    return configurationsConclusionText(configurationsConclusionProfile(chart));
  }

  function configurationsConclusionText(profile) {
    const { items, supportRank, pressureRank, regulatedPressure, hardPressure, directSupport, pressureItems } = profile;
    if (state.lang === "es") {
      if (!items.length) return "No hay una configuración dominante que decida todo el juicio; la carta se lee mejor por regentes, casas y secta, sin forzar un único drama planetario.";
      if (supportRank > pressureRank) return "La ayuda pesa más que la fricción en los significadores principales; esto no vuelve fácil toda la carta, pero sí da vías reales para resolver, negociar o crecer.";
      if (pressureRank > supportRank && hardPressure) return `La presión tiene más autoridad que la ayuda inmediata; conviene leerla como una carta que exige estrategia, límites y respuesta consciente.${regulatedPressure ? " La recepción abre una vía de regulación, pero no borra la dificultad." : ""}`;
      if (supportRank === pressureRank && directSupport && pressureItems.length) return "El juicio es mixto: hay ayuda y presión tocando puntos centrales. La diferencia la marca cómo se administre la relación entre esas fuerzas, no una promesa simple de facilidad o bloqueo.";
      return "Las relaciones planetarias aportan matiz más que una sentencia cerrada; el peso principal queda en la condición de los regentes y en los lugares que ocupan.";
    }
    if (!items.length) return "No dominant configuration decides the whole judgment; the chart is better read through rulers, houses, and sect without forcing one planetary drama.";
    if (supportRank > pressureRank) return "Help carries more weight than friction on the main significators; this does not make the whole chart easy, but it gives real routes for resolution, negotiation, or growth.";
    if (pressureRank > supportRank && hardPressure) return `Pressure has more authority than immediate help; read this as a chart that asks for strategy, boundaries, and conscious response.${regulatedPressure ? " Reception opens a regulating route, but does not erase the difficulty." : ""}`;
    if (supportRank === pressureRank && directSupport && pressureItems.length) return "The judgment is mixed: help and pressure both touch central points. The difference lies in how those forces are managed, not in a simple promise of ease or blockage.";
    return "The planetary relationships add nuance rather than a closed verdict; the main weight remains with the condition of the rulers and the places they occupy.";
  }

  function receptionEvidenceContexts(chart) {
    const items = [];
    primaryRelationTargets(chart).forEach((target) => {
      primaryRelationActors(chart).forEach(({ key: actor, role }) => {
        const context = buildPlanetRelationContext(target, actor, chart, role);
        if (context?.reception?.hasReception) items.push(context);
      });
    });
    return items;
  }

  function receptionEvidenceItemText(context) {
    const { target, actor, reception, role } = context;
    const phrase = receptionPhrase(target, actor, reception);
    const strength = receptionStrengthLabel(reception);
    return state.lang === "es"
      ? `${reception.isMutual ? "Recepción mutua" : "Recepción"} ${strength} (${role === "support" ? "apoyo" : "mitigación"}): ${phrase}.`
      : `${capitalizeText(strength)} ${reception.isMutual ? "mutual reception" : "reception"} (${role === "support" ? "support" : "mitigation"}): ${phrase}.`;
  }

  function receptionEvidenceItems(chart) {
    return [...new Set(receptionEvidenceContexts(chart).map(receptionEvidenceItemText))].slice(0, 4);
  }

  function triplicityRulerSupportScore(key, chart) {
    const position = chart.positions[key];
    const strength = dignityStrength(key, position, chart);
    let score = 0;
    if (position.angularity === "angular") score += 1.25;
    else if (position.angularity === "succedent") score += 0.5;
    else score -= 0.25;
    if (strength.strong) score += 1;
    if (strength.medium) score += 0.5;
    if (strength.weak) score -= 1;
    if (isSolarObscuredWithoutChariot(key, chart)) score -= 0.75;
    return score;
  }

  function triplicityRulerPlainText(key, role, chart) {
    const position = chart.positions[key];
    const topic = houseReadingTopics(position.house, "double");
    const visibility = placementVisibilityTone(position);
    const condition = conditionPlainTone(key, position, chart);
    return state.lang === "es"
      ? `${planetLabel(key)} lleva el sostén ${role} desde casa ${position.house}: ${topic}; allí ${visibility}. ${condition}`
      : `${planetLabel(key)} carries the ${role} support from house ${position.house}: ${topic}; there it ${visibility}. ${condition}`;
  }

  function triplicityFoundationEntries(chart) {
    const trip = sectTriplicityRulers(chart);
    return [
      [trip.primary, state.lang === "es" ? "principal" : "main"],
      [trip.secondary, state.lang === "es" ? "secundario" : "secondary"],
      [trip.cooperating, state.lang === "es" ? "cooperante" : "cooperating"],
    ];
  }

  function triplicityFoundationProfile(chart, entries = triplicityFoundationEntries(chart)) {
    const scores = entries.map(([key]) => triplicityRulerSupportScore(key, chart));
    const primaryScore = scores[0] || 0;
    const average = scores.reduce((sum, value) => sum + value, 0) / Math.max(scores.length, 1);
    const compensation = scores.slice(1).some((score) => score > primaryScore + 0.75);
    return { scores, primaryScore, average, compensation };
  }

  function triplicityFoundationConclusion(chart, entries = triplicityFoundationEntries(chart)) {
    return triplicityFoundationConclusionText(triplicityFoundationProfile(chart, entries));
  }

  function triplicityFoundationConclusionText(profile) {
    const { primaryScore, average, compensation } = profile;
    if (state.lang === "es") {
      if (primaryScore >= 1.5 && average >= 0.75) {
        return "La base de sostén es bastante amplia; no elimina los problemas, pero da continuidad, personas o circunstancias que ayudan a recomponer el rumbo.";
      }
      if (primaryScore <= 0 && average <= 0.25) {
        return "La estabilidad no parece venir dada de entrada; se construye con paciencia, apoyos concretos y ajustes repetidos.";
      }
      if (compensation) {
        return "La base es desigual: el sostén principal no lo lleva todo solo, y una ayuda secundaria puede compensar o estabilizar etapas importantes.";
      }
      return "La estabilidad existe, pero por capas; unas zonas sostienen y otras piden más trabajo antes de dar seguridad.";
    }
    if (primaryScore >= 1.5 && average >= 0.75) {
      return "The base of support is fairly broad; it does not erase problems, but it gives continuity, people, or circumstances that help restore direction.";
    }
    if (primaryScore <= 0 && average <= 0.25) {
      return "Stability does not seem simply given at the start; it is built through patience, concrete support, and repeated adjustments.";
    }
    if (compensation) {
      return "The base is uneven: the main support does not carry everything alone, and a secondary support can compensate or stabilize important stages.";
    }
    return "Stability exists in layers; some areas support, while others need more work before they feel secure.";
  }

  function triplicityFoundationReading(chart) {
    const trip = sectTriplicityRulers(chart);
    const entries = triplicityFoundationEntries(chart);
    const parts = entries.map(([key, role]) => triplicityRulerPlainText(key, role, chart));
    if (state.lang === "es") {
      return `Esta sección mira el sostén de fondo: qué ayuda a que la vida no dependa solo del empuje del Ascendente. La luminaria de la secta está en ${trip.sign.es}. ${parts.join(" ")}`;
    }
    return `This section looks at background support: what helps life not depend only on the Ascendant's push. The sect light is in ${trip.sign.en}. ${parts.join(" ")}`;
  }

  function lotPlanetRoleText(key, chart) {
    if (key === chart.beneficOfSect) return state.lang === "es" ? "benéfico de la secta" : "benefic of sect";
    if (key === (chart.isDay ? "venus" : "jupiter")) return state.lang === "es" ? "benéfico contrario a la secta" : "benefic contrary to sect";
    if (key === chart.maleficContrarySect) return state.lang === "es" ? "maléfico contrario a la secta" : "malefic contrary to sect";
    if (key === chart.maleficOfSect) return state.lang === "es" ? "maléfico de la secta" : "malefic of sect";
    return "";
  }

  function lotLordRoleText(lot, chart) {
    if (!lot) return "";
    const role = lotPlanetRoleText(lot.lord, chart);
    if (!role) {
      return state.lang === "es"
        ? `${planetLabel(lot.lord)} administra ${lotName(lot.key)} como señor del signo del lote.`
        : `${planetLabel(lot.lord)} administers ${lotName(lot.key)} as lord of the lot's sign.`;
    }
    return state.lang === "es"
      ? `${planetLabel(lot.lord)} administra ${lotName(lot.key)} y es ${role}.`
      : `${planetLabel(lot.lord)} administers ${lotName(lot.key)} and is the ${role}.`;
  }

  function directLotAdministrationText(lot, chart) {
    const role = lotPlanetRoleText(lot.lord, chart);
    const lordText = state.lang === "es"
      ? `Señor de ${lotName(lot.key)}: ${planetLabel(lot.lord)}`
      : `Lord of ${lotName(lot.key)}: ${planetLabel(lot.lord)}`;
    return role ? `${lordText}, ${role}.` : `${lordText}.`;
  }

  function lotTensionRawLevel(key, chart, signType, degree, planetSuperior) {
    const position = chart.positions[key];
    const acute = degree && degree.delta <= 3;
    const harsh = ["copresence", "square", "opposition"].includes(signType);
    return key === chart.maleficContrarySect && (acute || planetSuperior || position.angularity === "angular")
      ? "highLevel"
      : (key === chart.maleficOfSect || planetSuperior || acute || harsh || position.angularity === "angular") ? "mediumLevel" : "lowLevel";
  }

  function lotTestimonyLevel(lot, key, chart, role, signType, degree, planetSuperior, reception = null) {
    const position = chart.positions[key];
    const solar = solarPhaseState(key, chart);
    const obscured = ["combust", "underBeams"].includes(solar.category) && !solar.chariot;
    const acute = degree && degree.delta <= 3;
    const friendly = ["copresence", "sextile", "trine"].includes(signType);
    if (role === "support") {
      if (reception?.effectiveScore >= 3 && !obscured && ["square", "opposition"].includes(signType)) return "mediumLevel";
      if (key === chart.beneficOfSect && !obscured && (acute || planetSuperior || position.angularity === "angular")) return "strongLevel";
      if (!obscured && (friendly || acute || ["angular", "succedent"].includes(position.angularity))) return "mediumLevel";
      return "lowLevel";
    }
    const baseLevel = lotTensionRawLevel(key, chart, signType, degree, planetSuperior);
    return adjustIntensityForReception(baseLevel, "tension", reception);
  }

  function lotTestimonyItems(lot, planetKeys, chart, role) {
    const lotSign = signOf(lot.lon);
    return planetKeys
      .filter((key) => VISIBLE_KEYS.includes(key))
      .map((key) => buildLotTestimonyItem(lot, key, chart, role, lotSign))
      .filter(Boolean);
  }

  function buildLotTestimonyItem(lot, key, chart, role, lotSign = signOf(lot.lon)) {
    const position = chart.positions[key];
    const signType = signAspectType(lotSign, signOf(position.lon));
    if (!signType) return null;
    const degree = degreeAspect(lot.lon, position.lon, Math.max(3, chart.input.orb || 3));
    const planetSuperior = superiorPlanet("lot", key, lot.lon, position.lon) === key;
    const lordPosition = chart.positions[lot.lord];
    const hasLordConfiguration = key !== lot.lord && signAspectType(signOf(position.lon), signOf(lordPosition.lon));
    const reception = hasLordConfiguration ? receptionBetween(key, lot.lord, chart) : null;
    const solar = solarPhaseState(key, chart);
    const solarText = ["combust", "underBeams"].includes(solar.category)
      ? solarPhaseTableText(key, chart)
      : "";
    return {
      lotKey: lot.key,
      lotLord: lot.lord,
      key,
      signType,
      degree,
      planetSuperior,
      solarText,
      reception,
      roleText: lotPlanetRoleText(key, chart),
      isBeneficOfSect: key === chart.beneficOfSect,
      rawLevel: role === "tension" ? lotTensionRawLevel(key, chart, signType, degree, planetSuperior) : "",
      angularity: position.angularity,
      house: position.house,
      level: lotTestimonyLevel(lot, key, chart, role, signType, degree, planetSuperior, reception),
    };
  }

  function lotTestimonyNature(item, role) {
    if (role === "support") {
      if (["square", "opposition"].includes(item.signType) && item.reception?.effectiveScore >= 3) return t("negotiatedSupport");
      if (["square", "opposition"].includes(item.signType)
        && item.reception?.effectiveScore >= 2
        && (item.isBeneficOfSect || item.angularity === "angular" || item.degree?.delta <= 3)) return t("regulatedBeneficFriction");
      if (["trine", "sextile"].includes(item.signType)) return state.lang === "es" ? "apoyo fluido" : "flowing support";
      if (["square", "opposition"].includes(item.signType)) return state.lang === "es" ? "testimonio benéfico con fricción" : "benefic testimony with friction";
      return state.lang === "es" ? "apoyo por copresencia" : "support by copresence";
    }
    if (item.reception?.hasReception) return t("regulatedPressure");
    if (["square", "opposition"].includes(item.signType)) return state.lang === "es" ? "presión directa" : "direct pressure";
    if (["trine", "sextile"].includes(item.signType)) return state.lang === "es" ? "presión configurada" : "configured pressure";
    return state.lang === "es" ? "presión por copresencia" : "pressure by copresence";
  }

  function emptyLotTestimonyText(role) {
    return role === "support"
      ? (state.lang === "es" ? "ningún benéfico claro" : "no clear benefic")
      : (state.lang === "es" ? "ningún maléfico claro" : "no clear malefic");
  }

  function lotTestimonyReceptionText(item, lotKey, lotLord) {
    if (!item.reception?.hasReception) return "";
    const lotLabel = lotKey ? lotName(lotKey) : (state.lang === "es" ? "el lote" : "the lot");
    const lordLabel = lotLord ? planetLabel(lotLord) : (state.lang === "es" ? "su señor" : "its lord");
    return state.lang === "es"
      ? `${planetLabel(item.key)} testimonia a ${lotLabel} y está en recepción con ${lordLabel}, señor de ${lotLabel}: ${receptionStrengthLabel(item.reception)}`
      : `${planetLabel(item.key)} testifies to ${lotLabel} and is in reception with ${lordLabel}, lord of ${lotLabel}: ${receptionStrengthLabel(item.reception)}`;
  }

  function lotTestimonyIntensityText(item, role) {
    if (role === "tension" && item.rawLevel && item.rawLevel !== item.level) {
      return state.lang === "es"
        ? `intensidad bruta ${t(item.rawLevel)}, regulada a ${t(item.level)}`
        : `raw intensity ${t(item.rawLevel)}, regulated to ${t(item.level)}`;
    }
    return `${state.lang === "es" ? "intensidad" : "intensity"} ${t(item.level)}`;
  }

  function lotTestimonyItemText(item, role, lot = null) {
    const lotKey = lot?.key || item.lotKey;
    const lotLord = lot?.lord || item.lotLord;
    const details = [
      `${planetLabel(item.key)} (${t(item.signType)}, ${lotTestimonyIntensityText(item, role)})`,
      lotTestimonyNature(item, role),
      item.roleText,
      lotTestimonyReceptionText(item, lotKey, lotLord),
      state.lang === "es" ? `casa ${item.house} · ${t(item.angularity)}` : `house ${item.house} · ${t(item.angularity)}`,
      item.planetSuperior ? (state.lang === "es" ? "en posición superior" : "in superior position") : "",
      item.degree ? (state.lang === "es" ? `cercano por grado: ${formatAngle(item.degree.delta)}` : `degree-close: ${formatAngle(item.degree.delta)}`) : "",
      item.solarText ? (state.lang === "es" ? `fase solar: ${item.solarText}` : `solar phase: ${item.solarText}`) : "",
    ].filter(Boolean);
    return details.join(", ");
  }

  function lotTestimonyText(items, role, lot = null) {
    if (!items.length) {
      return emptyLotTestimonyText(role);
    }
    return naturalList(items.map((item) => lotTestimonyItemText(item, role, lot)));
  }

  function levelRank(level) {
    return { lowLevel: 1, mediumLevel: 2, highLevel: 3, strongLevel: 3, moderateLevel: 2, secondaryLevel: 1 }[level] || 0;
  }

  function strongestLevel(items, field) {
    return items
      .map((item) => item[field])
      .filter(Boolean)
      .sort((a, b) => levelRank(b) - levelRank(a))[0] || "";
  }

  function lotPressureAuditParts(items, lot) {
    if (!items.length) {
      return [
        { label: t("lotAuditRawPressure"), value: lotTestimonyText(items, "tension", lot) },
        { label: t("lotAuditRegulation"), value: state.lang === "es" ? "sin recepción reguladora clara" : "no clear regulating reception" },
      ];
    }
    const raw = strongestLevel(items, "rawLevel");
    const regulated = strongestLevel(items, "level");
    const regulationItems = items.filter((item) => item.reception?.hasReception);
    const regulation = regulationItems.length
      ? naturalList(regulationItems.map((item) => `${planetLabel(item.key)} / ${planetLabel(lot.lord)} (${receptionStrengthLabel(item.reception)})`))
      : (state.lang === "es" ? "sin recepción reguladora clara" : "no clear regulating reception");
    const regulatedText = raw && regulated && raw !== regulated
      ? (state.lang === "es" ? `${t(regulated)} por ${regulation}` : `${t(regulated)} through ${regulation}`)
      : regulation;
    return [
      { label: t("lotAuditRawPressure"), value: t(raw || regulated) },
      { label: t("lotAuditRegulation"), value: regulatedText },
      { label: t("lotAuditReading"), value: lotTestimonyText(items, "tension", lot) },
    ];
  }

  function lotPressureAuditText(items, lot) {
    return lotPressureAuditParts(items, lot)
      .map((item) => `${item.label}: ${item.value}.`)
      .join(" ");
  }

  function renderLotPressureAudit(parts) {
    return `
      <ul class="lot-pressure-lines">
        ${parts.map((item) => `<li><b>${escapeHtml(item.label)}:</b> ${escapeHtml(item.value)}</li>`).join("")}
      </ul>
    `;
  }

  const LOT_PLAIN_MEANINGS = Object.freeze({
    es: {
      fortune: "lo que llega por cuerpo, circunstancias, entorno y sucesos que no se controlan del todo",
      spirit: "lo que la persona intenta dirigir con intención, decisión y acción consciente",
      eros: "atracción, deseo, vínculo y aquello que mueve el corazón hacia algo",
      necessity: "obligaciones, presiones inevitables y condiciones que estrechan el margen de elección",
      courage: "respuesta ante el riesgo, defensa, impulso y capacidad de afrontar",
      victory: "ayudas para vencer obstáculos, ganar favor o salir adelante",
      nemesis: "límites, corrección, pérdida de exceso y consecuencias de lo no resuelto",
    },
    en: {
      fortune: "what arrives through body, circumstances, surroundings, and events not fully under control",
      spirit: "what the person tries to direct through intention, decision, and conscious action",
      eros: "attraction, desire, bonding, and what moves the heart toward something",
      necessity: "obligations, unavoidable pressures, and conditions that narrow choice",
      courage: "response to risk, defense, drive, and the capacity to face things",
      victory: "help in overcoming obstacles, gaining favor, or moving ahead",
      nemesis: "limits, correction, loss of excess, and consequences of what remains unresolved",
    },
  });

  function lotPlainMeaning(key) {
    return LOT_PLAIN_MEANINGS[state.lang]?.[key] || lotName(key).toLocaleLowerCase(activeLocale());
  }

  function lotTestimonyPlainProfile(items, role) {
    if (!items.length) {
      return {
        role,
        empty: true,
        level: "",
        names: "",
        hardSupport: false,
        regulatedPressure: false,
      };
    }
    const level = strongestLevel(items, "level");
    const names = naturalList([...new Set(items
      .filter((item) => item.level === level || levelRank(item.level) === levelRank(level))
      .slice(0, 2)
      .map((item) => planetLabel(item.key)))]);
    return {
      role,
      empty: false,
      level,
      names,
      hardSupport: role === "support" && items.some((item) => ["square", "opposition"].includes(item.signType)),
      regulatedPressure: role === "tension" && items.some((item) => item.reception?.hasReception && item.rawLevel !== item.level),
    };
  }

  function lotTestimonyPlainSummary(items, role) {
    return lotTestimonyPlainSummaryText(lotTestimonyPlainProfile(items, role));
  }

  function lotTestimonyPlainSummaryText(profile) {
    const { role, empty, level, names, hardSupport, regulatedPressure } = profile;
    if (empty) {
      return role === "support"
        ? (state.lang === "es" ? "No aparece una ayuda planetaria clara sobre este lote." : "No clear planetary help appears for this lot.")
        : (state.lang === "es" ? "No aparece una presión planetaria clara sobre este lote." : "No clear planetary pressure appears for this lot.");
    }
    if (state.lang === "es") {
      if (role === "support") {
        if (level === "strongLevel") return `Hay ayuda clara de ${names}; puede abrir protección, mediación o crecimiento.${hardSupport ? " No es una ayuda completamente suave: llega con fricción que hay que negociar." : ""}`;
        if (level === "mediumLevel") return `Hay ayuda moderada de ${names}; sirve, pero necesita contexto, relación o trabajo para rendir.`;
        return `Hay ayuda leve de ${names}; suma, aunque no domina el tema.`;
      }
      if (level === "highLevel") return `Hay presión fuerte de ${names}; este tema pide cuidado, límites y manejo activo.${regulatedPressure ? " Parte de esa presión tiene una vía de regulación." : ""}`;
      if (level === "mediumLevel") return `Hay presión moderada de ${names}; no bloquea por sí sola, pero obliga a tomar el tema en serio.${regulatedPressure ? " Parte de esa presión tiene una vía de regulación." : ""}`;
      return `Hay presión leve de ${names}; conviene observarla, pero no parece llevar todo el peso.`;
    }
    if (role === "support") {
      if (level === "strongLevel") return `There is clear help from ${names}; it can open protection, mediation, or growth.${hardSupport ? " This is not completely smooth help: it arrives with friction that must be negotiated." : ""}`;
      if (level === "mediumLevel") return `There is moderate help from ${names}; it works, but needs context, relationship, or effort to deliver.`;
      return `There is light help from ${names}; it adds something, though it does not dominate the topic.`;
    }
    if (level === "highLevel") return `There is strong pressure from ${names}; this topic asks for care, limits, and active handling.${regulatedPressure ? " Part of that pressure has a regulating route." : ""}`;
    if (level === "mediumLevel") return `There is moderate pressure from ${names}; it does not block by itself, but it makes the topic serious.${regulatedPressure ? " Part of that pressure has a regulating route." : ""}`;
    return `There is light pressure from ${names}; it should be observed, but does not seem to carry the whole weight.`;
  }

  function lotJudgmentProfile(lot, chart) {
    if (!lot) return { lot, score: 0, supportRank: 0, pressureRank: 0, demanding: false, hidden: false };
    const lordPosition = chart.positions[lot.lord];
    const beneficItems = lotTestimonyItems(lot, ["jupiter", "venus"], chart, "support");
    const maleficItems = lotTestimonyItems(lot, ["mars", "saturn"], chart, "tension");
    const supportRank = levelRank(strongestLevel(beneficItems, "level"));
    const pressureRank = levelRank(strongestLevel(maleficItems, "level"));
    const demanding = isDifficultHouse(lot.house) || isDifficultHouse(lordPosition.house);
    const hidden = isSolarObscuredWithoutChariot(lot.lord, chart);
    let score = supportRank - pressureRank;
    if (demanding) score -= 0.75;
    if (hidden) score -= 0.5;
    score += planetJudgmentScore(lot.lord, lordPosition, chart) / 5;
    return { lot, score, supportRank, pressureRank, demanding, hidden };
  }

  function lotsConclusionProfile(fortune, spirit, chart) {
    const fortuneProfile = lotJudgmentProfile(fortune, chart);
    const spiritProfile = lotJudgmentProfile(spirit, chart);
    return {
      fortuneProfile,
      spiritProfile,
      fortuneGood: fortuneProfile.score >= 0.75,
      fortuneHard: fortuneProfile.score <= -0.75,
      spiritGood: spiritProfile.score >= 0.75,
      spiritHard: spiritProfile.score <= -0.75,
    };
  }

  function lotsConclusion(fortune, spirit, chart) {
    return lotsConclusionText(lotsConclusionProfile(fortune, spirit, chart));
  }

  function lotsConclusionText(profile) {
    const { fortuneGood, fortuneHard, spiritGood, spiritHard } = profile;
    if (state.lang === "es") {
      if (fortuneGood && spiritGood) return "Circunstancia e intención colaboran mejor de lo habitual: la vida trae materiales aprovechables y la persona tiene margen para dirigirlos.";
      if (fortuneHard && spiritGood) return "Las circunstancias pueden pesar más al comienzo, pero Espíritu conserva margen de respuesta; la lectura no es de bloqueo, sino de voluntad que aprende a organizar lo recibido.";
      if (fortuneGood && spiritHard) return "El entorno puede ofrecer aperturas, pero la intención requiere disciplina: no basta con que lleguen oportunidades, hay que sostener decisiones y dirección.";
      if (fortuneHard && spiritHard) return "Los dos planos piden trabajo: circunstancias e intención pueden sentirse condicionadas, así que conviene leer los lotes como una zona de maduración lenta, apoyo externo y manejo consciente.";
      return "Fortuna y Espíritu no dan una sentencia simple; muestran planos desiguales, con partes disponibles y partes condicionadas que deben leerse por sus casas y regentes.";
    }
    if (fortuneGood && spiritGood) return "Circumstance and intention cooperate better than usual: life brings usable material and the person has room to direct it.";
    if (fortuneHard && spiritGood) return "Circumstances may weigh more at the beginning, but Spirit keeps room to respond; this is not blockage, but will learning how to organize what is received.";
    if (fortuneGood && spiritHard) return "The environment can offer openings, but intention requires discipline: opportunity arriving is not enough; decisions and direction must be sustained.";
    if (fortuneHard && spiritHard) return "Both planes ask for work: circumstance and intention can feel conditioned, so read the lots as an area of slow maturation, outside support, and conscious handling.";
    return "Fortune and Spirit do not give a simple verdict; they show uneven planes, with some parts available and other parts conditioned, to be read through their houses and rulers.";
  }

  function lotPlaceTone(lot, lordPosition) {
    if ([6, 8, 12].includes(lot.house)) {
      return state.lang === "es" ? "un campo que pide cuidado práctico" : "a field that asks for practical care";
    }
    if (lordPosition?.angularity === "angular") {
      return state.lang === "es" ? "un tema visible o activo" : "a visible or active topic";
    }
    return state.lang === "es" ? "un tema más indirecto" : "a more indirect topic";
  }

  function lotConditionProfile(lot, chart) {
    if (!lot) return "";
    const lordPosition = chart.positions[lot.lord];
    const beneficItems = lotTestimonyItems(lot, ["jupiter", "venus"], chart, "support");
    const maleficItems = lotTestimonyItems(lot, ["mars", "saturn"], chart, "tension");
    const solar = solarPhaseState(lot.lord, chart);
    const solarConcern = ["combust", "underBeams"].includes(solar.category);
    return {
      lot,
      lordPosition,
      solar,
      solarConcern,
      placeTone: lotPlaceTone(lot, lordPosition),
      support: lotTestimonyPlainSummary(beneficItems, "support"),
      pressure: lotTestimonyPlainSummary(maleficItems, "tension"),
    };
  }

  function lotIdentityText(lot) {
    if (state.lang === "es") {
      return `${lotName(lot.key)} describe ${lotPlainMeaning(lot.key)}. Cae en casa ${lot.house}: ${houseReadingTopics(lot.house, "double")}.`;
    }
    return `${lotName(lot.key)} describes ${lotPlainMeaning(lot.key)}. It falls in house ${lot.house}: ${houseReadingTopics(lot.house, "double")}.`;
  }

  function lotRulerConditionText(profile, chart) {
    const { lot, lordPosition, placeTone } = profile;
    if (state.lang === "es") {
      return `Su regente, ${planetLabel(lot.lord)}, lleva ese asunto a casa ${lordPosition.house}: ${houseReadingTopics(lordPosition.house, "double")}; allí ${placementVisibilityTone(lordPosition)}. ${conditionPlainTone(lot.lord, lordPosition, chart)} Esto vuelve el lote ${placeTone}.`;
    }
    return `Its ruler, ${planetLabel(lot.lord)}, carries that matter into house ${lordPosition.house}: ${houseReadingTopics(lordPosition.house, "double")}; there it ${placementVisibilityTone(lordPosition)}. ${conditionPlainTone(lot.lord, lordPosition, chart)} This makes the lot ${placeTone}.`;
  }

  function lotSolarConcernText(profile) {
    if (!profile.solarConcern) return "";
    return state.lang === "es"
      ? `El regente del lote está ${profile.solar.category === "combust" ? "combusto" : "bajo los rayos"}, así que parte del tema puede operar con menor claridad pública.`
      : `The lot ruler is ${profile.solar.category === "combust" ? "combust" : "under the beams"}, so part of the topic may operate with less public clarity.`;
  }

  function lotConditionReading(lot, chart) {
    const profile = lotConditionProfile(lot, chart);
    if (!profile) return "";
    return [
      lotIdentityText(profile.lot),
      lotRulerConditionText(profile, chart),
      profile.support,
      profile.pressure,
      lotSolarConcernText(profile),
    ].filter(Boolean).join(" ");
  }

  function moonNextRole(chart) {
    const next = chart.moon.nextApplication;
    if (next?.planet === chart.beneficOfSect) return "support";
    if (next?.planet === chart.maleficContrarySect) return "tension";
    return "neutral";
  }

  function moonConclusionProfile(chart) {
    return {
      nextRole: moonNextRole(chart),
      voidOfCourse: chart.moon.voidOfCourse,
    };
  }

  function moonConclusion(chart) {
    return moonConclusionText(moonConclusionProfile(chart));
  }

  function moonConclusionText(profile) {
    const { nextRole, voidOfCourse } = profile;
    if (state.lang === "es") {
      if (voidOfCourse) return "El flujo lunar no empuja con dirección fuerte; conviene leerlo como un ritmo de apertura, dispersión o espera más que como avance inmediato.";
      if (nextRole === "support") return "La Luna conserva movimiento y tiende a buscar una salida más favorable, con más capacidad de continuidad o alivio.";
      if (nextRole === "tension") return "La Luna conserva movimiento, pero lo lleva hacia una zona que pide trabajo, paciencia o resolución.";
      return "La Luna conserva movimiento, pero el tono final depende del planeta al que se dirige y de su condición.";
    }
    if (voidOfCourse) return "The lunar flow does not push with strong direction; read it as opening, dispersal, or waiting rather than immediate forward motion.";
    if (nextRole === "support") return "The Moon keeps moving and tends to seek a more favorable outlet, with more capacity for continuity or relief.";
    if (nextRole === "tension") return "The Moon keeps moving, but it carries the matter toward an area that asks for work, patience, or resolution.";
    return "The Moon keeps moving, but the final tone depends on the planet it approaches and that planet's condition.";
  }

  const MOON_CONTACT_FALLBACK_TEXT = Object.freeze({
    es: {
      next: "ningún planeta en los próximos 30°",
      last: "ningún planeta en los últimos 30°",
      sign: "ningún planeta antes de salir del signo",
    },
    en: {
      next: "no planet in the next 30°",
      last: "no planet in the last 30°",
      sign: "no planet before sign exit",
    },
  });

  function moonContactFallbackText(kind) {
    return MOON_CONTACT_FALLBACK_TEXT[state.lang === "es" ? "es" : "en"][kind];
  }

  function moonContactText(contact, motion, fallbackKind) {
    return contact ? lunarContactLabel(contact, motion) : moonContactFallbackText(fallbackKind);
  }

  function moonRoleJudgmentText(nextRole) {
    if (state.lang === "es") {
      if (nextRole === "support") return "El próximo contacto va hacia el planeta de apoyo, así que el ritmo inmediato puede encontrar ayuda, conciliación o una salida más amable.";
      if (nextRole === "tension") return "El próximo contacto va hacia el planeta de presión, así que el ritmo inmediato puede traer más fricción, demora o necesidad de resolver algo incómodo.";
      return "El próximo contacto no va al principal planeta de apoyo ni al principal planeta de presión; se lee por la naturaleza concreta del planeta implicado.";
    }
    if (nextRole === "support") return "The next contact goes to the support planet, so the immediate rhythm can find help, reconciliation, or a gentler outlet.";
    if (nextRole === "tension") return "The next contact goes to the pressure planet, so the immediate rhythm can bring more friction, delay, or the need to resolve something uncomfortable.";
    return "The next contact goes neither to the main support planet nor to the main pressure planet; read it through the concrete nature of the planet involved.";
  }

  function moonSignExitJudgmentText(chart, bySignText) {
    if (state.lang === "es") {
      return chart.moon.voidOfCourseBySign
        ? "Antes de abandonar el signo tampoco completa un contacto mayor; eso deja el desarrollo más abierto o menos rematado."
        : `Antes de abandonar el signo todavía completa un contacto con ${bySignText}; eso da más continuidad al proceso.`;
    }
    return chart.moon.voidOfCourseBySign
      ? "Before leaving the sign it also completes no major contact; that leaves the development more open or less resolved."
      : `Before leaving the sign it still completes a contact with ${bySignText}; that gives the process more continuity.`;
  }

  function moonCloseApplicationText(chart) {
    if (state.lang === "es") {
      return chart.moon.hasApplyingWithinOrb
        ? "Además hay aplicación cercana dentro de 12°, por lo que el asunto se vuelve más concreto y reconocible."
        : "No hay aplicación cercana dentro de 12°, así que el asunto se siente más amplio, difuso o dependiente del contexto.";
    }
    return chart.moon.hasApplyingWithinOrb
      ? "There is also a close application within 12°, making the matter more concrete and recognizable."
      : "There is no close application within 12°, so the matter feels broader, more diffuse, or more dependent on context.";
  }

  function moonVoidJudgmentText() {
    return state.lang === "es"
      ? "Según la regla helenística amplia de 30°, está vacía de curso: la acción inmediata se dispersa o queda menos encaminada."
      : "By the broad Hellenistic 30° rule it is void of course: immediate action disperses or is less directed.";
  }

  function moonJudgmentProfile(chart) {
    const nextText = moonContactText(chart.moon.nextApplication, "applying", "next");
    const lastText = moonContactText(chart.moon.lastSeparation, "separating", "last");
    const bySignText = moonContactText(chart.moon.nextApplicationBySign, "applying", "sign");
    const nextRole = moonNextRole(chart);
    return {
      phase: chart.moon.phase,
      nextText,
      lastText,
      bySignText,
      nextRole,
      immediateText: chart.moon.voidOfCourse ? moonVoidJudgmentText() : moonRoleJudgmentText(nextRole),
      signVocText: moonSignExitJudgmentText(chart, bySignText),
      closeText: moonCloseApplicationText(chart),
    };
  }

  function moonJudgmentReading(chart) {
    return moonJudgmentText(moonJudgmentProfile(chart));
  }

  function moonJudgmentText(profile) {
    const { phase, lastText, nextText, immediateText, signVocText, closeText } = profile;
    if (state.lang === "es") {
      return `La Luna muestra el ritmo de los acontecimientos, el cuerpo y la continuidad cotidiana. Está en fase ${phase}. Viene de ${lastText} y se dirige a ${nextText}. ${immediateText} ${signVocText} ${closeText}`;
    }
    return `The Moon shows the rhythm of events, the body, and daily continuity. It is in ${phase} phase. It comes from ${lastText} and moves toward ${nextText}. ${immediateText} ${signVocText} ${closeText}`;
  }

  function visibleAngularPlanets(chart) {
    return VISIBLE_KEYS.filter((key) => chart.positions[key]?.angularity === "angular");
  }

  function angleDisplayName(angleKey) {
    if (angleKey === "asc") return t("ascendant");
    if (angleKey === "desc") return t("descendant");
    if (angleKey === "mc") return t("mc");
    if (angleKey === "ic") return t("ic");
    return angleKey.toUpperCase();
  }

  function visiblePlanetsNearAngles(chart, orb = 5) {
    const angles = ["asc", "desc", "mc", "ic"];
    return VISIBLE_KEYS
      .map((key) => {
        const position = chart.positions[key];
        const closest = angles
          .map((angleKey) => ({
            key,
            angleKey,
            delta: angleDistance(position.lon, chart.angles[angleKey]),
          }))
          .sort((a, b) => a.delta - b.delta)[0];
        return closest && closest.delta <= orb ? closest : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.delta - b.delta);
  }

  function exactAngleListText(items) {
    return naturalList(items.map((item) => (
      state.lang === "es"
        ? `${planetLabel(item.key)} a ${formatAngle(item.delta)} de ${angleDisplayName(item.angleKey)}`
        : `${planetLabel(item.key)} within ${formatAngle(item.delta)} of ${angleDisplayName(item.angleKey)}`
    )));
  }

  function distanceToSignBoundary(lon) {
    const degree = degreeInSign(lon);
    return Math.min(degree, 30 - degree);
  }

  function distanceToBoundBoundary(lon) {
    const sign = SIGNS[signOf(lon)];
    const degree = degreeInSign(lon);
    const internalBoundaries = BOUNDS[sign.key]
      .map((entry) => entry[1])
      .filter((boundary) => boundary > 0 && boundary < 30);
    if (!internalBoundaries.length) return Infinity;
    return Math.min(...internalBoundaries.map((boundary) => Math.abs(degree - boundary)));
  }

  function timeContextSensitivity(input) {
    const reasons = [];
    const auditedStatus = ["audited", "partial", "pending"].includes(input.auditStatus);
    const timeConfidence = normalizedTimeConfidence(input.timeConfidence || "");
    const zoneReliability = normalizedZoneReliability(input.zoneReliability || (input.timeZone ? "iana" : "unknown"));
    if (input.calendar === "julian") reasons.push("sensitiveJulian");
    if (input.auditStatus === "pending") reasons.push("sensitiveAuditPending");
    if ((timeConfidence && timeConfidence !== "exact")
      || (!timeConfidence && auditedStatus && input.auditStatus !== "audited")) {
      reasons.push("sensitiveTimeConfidence");
    }
    if (zoneReliability !== "iana") reasons.push("sensitiveManualOffset");
    if (!input.timeZone) reasons.push("sensitiveNoIana");
    return [...new Set(reasons)];
  }

  function normalizedTimeConfidence(value) {
    return TIME_CONFIDENCE_VALUES.includes(value) ? value : "";
  }

  function normalizedZoneReliability(value) {
    return ZONE_RELIABILITY_VALUES.includes(value) ? value : "unknown";
  }

  function sensitivityReasonLabels(reasonCodes) {
    return (reasonCodes || []).map((code) => t(code));
  }

  function sectBoundaryThresholdInfo(chart) {
    const reasons = timeContextSensitivity(chart.input);
    const sensitive = reasons.length > 0;
    return {
      threshold: sensitive ? 2.5 : 1,
      sensitive,
      reasons,
    };
  }

  function boundaryNotice(key, typeCode, distance, changeCodes, actionCode, extra = {}) {
    return {
      key,
      code: key,
      typeCode,
      distance,
      changeCodes,
      actionCode,
      ...extra,
    };
  }

  function sectBoundaryModel(chart) {
    const sunHorizonDistance = Math.abs(chart.sunAltitude);
    const sectThreshold = sectBoundaryThresholdInfo(chart);
    if (sunHorizonDistance > sectThreshold.threshold) return null;
    return {
      distance: sunHorizonDistance,
      threshold: sectThreshold.threshold,
      sensitiveThreshold: sectThreshold.sensitive,
      thresholdReasonCodes: sectThreshold.reasons,
    };
  }

  function sectBoundaryNotice(model) {
    return boundaryNotice(
      "sect-boundary",
      "sect",
      model.distance,
      ["sect", "sect-light", "benefic-malefic-of-sect", "contrary-malefic", "fortune-spirit-formulas", "general-judgment"],
      "verify-time-coordinates-zone-rectification",
      {
        threshold: model.threshold,
        sensitiveThreshold: model.sensitiveThreshold,
        thresholdReasonCodes: model.thresholdReasonCodes,
      }
    );
  }

  function sectBoundaryWarnings(chart) {
    const model = sectBoundaryModel(chart);
    return model ? [sectBoundaryNotice(model)] : [];
  }

  function ascBoundaryModel(chart) {
    const ascDistance = distanceToSignBoundary(chart.angles.asc);
    return ascDistance <= 1 ? { distance: ascDistance } : null;
  }

  function ascBoundaryNotice(model) {
    return boundaryNotice(
      "asc-sign-boundary",
      "asc",
      model.distance,
      ["ascendant-lord", "whole-sign-houses", "lots", "main-focuses"],
      "review-time-source-rectification"
    );
  }

  function ascBoundaryWarnings(chart) {
    const model = ascBoundaryModel(chart);
    return model ? [ascBoundaryNotice(model)] : [];
  }

  function angleBoundaryModel(angle, chart) {
    const distance = distanceToSignBoundary(angle.lon);
    if (distance > 1) return null;
    const currentSign = signOf(angle.lon);
    const degree = degreeInSign(angle.lon);
    const possibleSign = degree < 1 ? (currentSign + 11) % 12 : (currentSign + 1) % 12;
    return {
      key: angle.key,
      distance,
      boundarySideCode: degree < 1 ? "previous" : "next",
      currentSign,
      possibleSign,
      currentHouse: houseFromSign(currentSign, chart.ascSign),
      possibleHouse: houseFromSign(possibleSign, chart.ascSign),
    };
  }

  function angleBoundaryNotice(model) {
    return boundaryNotice(
      `${model.key}-sign-boundary`,
      model.key,
      model.distance,
      [`${model.key}-whole-sign-house`, "chart-projection-foundation", "secondary-focuses"],
      "verify-time-coordinates-zone",
      {
        boundarySideCode: model.boundarySideCode,
        currentSign: model.currentSign,
        possibleSign: model.possibleSign,
        currentHouse: model.currentHouse,
        possibleHouse: model.possibleHouse,
      }
    );
  }

  function angleBoundaryWarnings(chart) {
    return [
      { key: "mc", lon: chart.angles.mc },
      { key: "ic", lon: chart.angles.ic },
    ].map((angle) => angleBoundaryModel(angle, chart))
      .filter(Boolean)
      .map(angleBoundaryNotice);
  }

  function lotBoundaryModel(lot) {
    const distance = distanceToSignBoundary(lot.lon);
    return distance <= 1 ? { lotKey: lot.key, distance } : null;
  }

  function lotBoundaryNotice(model) {
    return boundaryNotice(
      `lot-boundary:${model.lotKey}`,
      "lot",
      model.distance,
      ["lot-house", "lot-lord", "topic-reading"],
      "review-time-coordinates",
      {
        lotKey: model.lotKey,
      }
    );
  }

  function lotBoundaryWarnings(chart) {
    return chart.lots.map(lotBoundaryModel).filter(Boolean).map(lotBoundaryNotice);
  }

  function planetBoundBoundaryModel(key, chart) {
    const position = chart.positions[key];
    const distance = distanceToBoundBoundary(position.lon);
    return distance <= 0.5 ? { planetKey: key, distance } : null;
  }

  function planetBoundBoundaryNotice(model) {
    return boundaryNotice(
      `planet-bound-boundary:${model.planetKey}`,
      "planet-bound",
      model.distance,
      ["degree-administration", "own-minor-dignity", "bound-reception"],
      "review-birth-time-minutes-planetary-precision",
      {
        planetKey: model.planetKey,
      }
    );
  }

  function planetBoundBoundaryWarnings(chart) {
    return VISIBLE_KEYS.map((key) => planetBoundBoundaryModel(key, chart)).filter(Boolean).map(planetBoundBoundaryNotice);
  }

  function boundaryWarnings(chart) {
    return [
      ...sectBoundaryWarnings(chart),
      ...ascBoundaryWarnings(chart),
      ...angleBoundaryWarnings(chart),
      ...lotBoundaryWarnings(chart),
      ...planetBoundBoundaryWarnings(chart),
    ];
  }

  const BOUNDARY_CHANGE_LABEL_KEYS = Object.freeze({
    "sect": "boundaryChangeSect",
    "sect-light": "boundaryChangeSectLight",
    "benefic-malefic-of-sect": "boundaryChangeBeneficMaleficSect",
    "contrary-malefic": "boundaryChangeContraryMalefic",
    "fortune-spirit-formulas": "boundaryChangeFortuneSpirit",
    "general-judgment": "boundaryChangeGeneralJudgment",
    "ascendant-lord": "boundaryChangeAscLord",
    "whole-sign-houses": "boundaryChangeWholeSignHouses",
    "lots": "boundaryChangeLots",
    "main-focuses": "boundaryChangeMainFocuses",
    "mc-whole-sign-house": "boundaryChangeMcHouse",
    "ic-whole-sign-house": "boundaryChangeIcHouse",
    "chart-projection-foundation": "boundaryChangeChartProjection",
    "secondary-focuses": "boundaryChangeSecondaryFocuses",
    "lot-house": "boundaryChangeLotHouse",
    "lot-lord": "boundaryChangeLotLord",
    "topic-reading": "boundaryChangeTopicReading",
    "degree-administration": "boundaryChangeDegreeAdministration",
    "own-minor-dignity": "boundaryChangeOwnMinorDignity",
    "bound-reception": "boundaryChangeBoundReception",
  });

  const BOUNDARY_ACTION_LABEL_KEYS = Object.freeze({
    "verify-time-coordinates-zone-rectification": "boundaryActionVerifyRectification",
    "review-time-source-rectification": "boundaryActionReviewTimeSource",
    "verify-time-coordinates-zone": "boundaryActionVerifyZone",
    "review-time-coordinates": "boundaryActionReviewTimeCoordinates",
    "review-birth-time-minutes-planetary-precision": "boundaryActionReviewPlanetaryPrecision",
  });

  function boundaryTypeLabel(warning) {
    if (warning.typeCode === "sect") return t("boundaryTypeSect");
    if (warning.typeCode === "asc") return t("boundaryTypeAsc");
    if (warning.typeCode === "mc") return t("boundaryTypeMc");
    if (warning.typeCode === "ic") return t("boundaryTypeIc");
    if (warning.typeCode === "lot") return t("boundaryTypeLot", { lot: lotName(warning.lotKey) });
    if (warning.typeCode === "planet-bound") return t("boundaryTypePlanetBound", { planet: planetLabel(warning.planetKey) });
    return warning.typeCode || warning.key;
  }

  function boundaryActionLabel(warning) {
    return t(BOUNDARY_ACTION_LABEL_KEYS[warning.actionCode] || warning.actionCode || "none");
  }

  function boundaryShiftLabel(warning) {
    if (!Number.isFinite(warning.currentSign) || !Number.isFinite(warning.possibleSign)) return "";
    return t("boundaryShiftText", {
      angle: angleDisplayName(warning.typeCode),
      distance: formatAngle(warning.distance),
      side: t(warning.boundarySideCode === "previous" ? "boundarySidePrevious" : "boundarySideNext"),
      currentSign: signLabel(warning.currentSign),
      currentHouse: warning.currentHouse,
      possibleSign: signLabel(warning.possibleSign),
      possibleHouse: warning.possibleHouse,
    });
  }

  function boundaryChangeLabels(warning) {
    const labels = (warning.changeCodes || []).map((code) => capitalizeText(t(BOUNDARY_CHANGE_LABEL_KEYS[code] || code)));
    const shift = boundaryShiftLabel(warning);
    return shift ? [...labels, capitalizeText(shift)] : labels;
  }

  function boundaryWarningText(warning) {
    if (!warning) return "";
    const thresholdText = boundaryThresholdText(warning);
    const changes = boundaryChangeLabels(warning);
    const type = boundaryTypeLabel(warning);
    const action = boundaryActionLabel(warning);
    return state.lang === "es"
      ? `Tipo: ${type}. Distancia: ${formatAngle(warning.distance)}.${thresholdText ? ` ${t("boundaryThreshold")}: ${thresholdText}.` : ""} Puede cambiar: ${changes.join(", ")}. Acción recomendada: ${action}.`
      : `Type: ${type}. Distance: ${formatAngle(warning.distance)}.${thresholdText ? ` ${t("boundaryThreshold")}: ${thresholdText}.` : ""} May change: ${changes.join(", ")}. Recommended action: ${action}.`;
  }

  function boundaryThresholdText(warning) {
    if (!Number.isFinite(warning.threshold)) return "";
    return warning.sensitiveThreshold
      ? t("boundaryThresholdSensitive", { threshold: formatAngle(warning.threshold), reasons: sensitivityReasonLabels(warning.thresholdReasonCodes).join(", ") })
      : t("boundaryThresholdNormal", { threshold: formatAngle(warning.threshold) });
  }

  function boundaryAuditFieldLabels() {
    return state.lang === "es"
      ? {
        type: "Tipo",
        distance: "Distancia",
        mayChange: "Puede cambiar",
        action: "Acción",
      }
      : {
        type: "Type",
        distance: "Distance",
        mayChange: "May change",
        action: "Action",
      };
  }

  function buildBoundaryAuditModel(warnings) {
    const fieldLabels = boundaryAuditFieldLabels();
    return {
      title: t("boundaryAudit"),
      emptyText: t("noBoundaryNotices"),
      warnings: warnings.map((warning) => {
        const thresholdText = boundaryThresholdText(warning);
        return {
          code: warning.code,
          key: warning.key,
          fields: [
            { label: fieldLabels.type, value: boundaryTypeLabel(warning) },
            { label: fieldLabels.distance, value: formatAngle(warning.distance) },
            ...(thresholdText ? [{ label: t("boundaryThreshold"), value: thresholdText }] : []),
            { label: fieldLabels.mayChange, items: boundaryChangeLabels(warning) },
            { label: fieldLabels.action, value: capitalizeText(boundaryActionLabel(warning)) },
          ],
        };
      }),
    };
  }

  function renderBoundaryAuditField(field) {
    const content = field.items
      ? `<ul>${field.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : escapeHtml(field.value || "");
    return `
      <div>
        <dt>${escapeHtml(field.label)}</dt>
        <dd>${content}</dd>
      </div>
    `;
  }

  function renderBoundaryAuditWarning(warning) {
    return `
      <article data-test="boundary-warning" data-code="${escapeHtml(warning.code)}" data-key="${escapeHtml(warning.key)}">
        <dl>
          ${warning.fields.map(renderBoundaryAuditField).join("")}
        </dl>
      </article>
    `;
  }

  function renderBoundaryAudit(warnings) {
    const model = buildBoundaryAuditModel(warnings);
    if (!model.warnings.length) return metric(model.title, model.emptyText);
    return `
      <section class="metric boundary-audit-list" data-test="boundary-audit">
        <b>${escapeHtml(model.title)}</b>
        <div>
          ${model.warnings.map(renderBoundaryAuditWarning).join("")}
        </div>
      </section>
    `;
  }

  function lotByKey(chart, key) {
    return chart.lots.find((lot) => lot.key === key);
  }

  function createTopicScoreRows() {
    return Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      score: 0,
      reasons: [],
      scoreItems: [],
    }));
  }

  function addTopicScore(houses, house, points, reason, category = "scoreCategoryLifeAxis", reasonCode = "") {
    if (!house) return;
    const target = houses[house - 1];
    target.score += points;
    target.reasons.push(reason);
    target.scoreItems.push({ points, reason, category, reasonCode: reasonCode || category });
  }

  function createTopicScoreAdder(houses) {
    return (house, points, reason, category = "scoreCategoryLifeAxis", reasonCode = "") => addTopicScore(houses, house, points, reason, category, reasonCode);
  }

  function sortTopicScoreRows(houses) {
    return houses.sort((a, b) => b.score - a.score || a.house - b.house);
  }

  function addBaseTopicScores(add, chart) {
    const ascLord = SIGNS[chart.ascSign].ruler;
    const tenthRuler = wholeSignHouseRuler(chart, 10);
    add(chart.positions[ascLord]?.house, 5, `${t("ascLordTitle")}: ${planetLabel(ascLord)}`, "scoreCategoryLifeAxis", `asc-lord:${ascLord}`);
    add(chart.positions[chart.sectLight]?.house, 2, `${t("sectLight")}: ${planetLabel(chart.sectLight)}`, "scoreCategorySect", `sect-light:${chart.sectLight}`);
    add(chart.mcHouse, 2, t("mc"), "scoreCategoryPublic", "mc-house");
    add(chart.positions[tenthRuler]?.house, 1.0, state.lang === "es" ? `Regente de casa 10: ${planetLabel(tenthRuler)}` : `10th-house ruler: ${planetLabel(tenthRuler)}`, "scoreCategoryPublic", `tenth-ruler:${tenthRuler}`);
  }

  function addAngularTopicScores(add, chart) {
    visibleAngularPlanets(chart).forEach((key) => add(chart.positions[key].house, 1.5, `${planetLabel(key)} ${t("angular")}`, "scoreCategoryAngular", `angular-planet:${key}`));
    visiblePlanetsNearAngles(chart).forEach((item) => {
      add(chart.positions[item.key].house, 0.75, `${planetLabel(item.key)} ${state.lang === "es" ? "cerca de" : "near"} ${angleDisplayName(item.angleKey)}`, "scoreCategoryAngular", `near-angle:${item.key}:${item.angleKey}`);
    });
  }

  function addLotTopicScores(add, chart) {
    add(lotByKey(chart, "fortune")?.house, 1.25, t("fortune"), "scoreCategoryLots", "lot:fortune");
    add(lotByKey(chart, "spirit")?.house, 1.25, t("spirit"), "scoreCategoryLots", "lot:spirit");
    ["fortune", "spirit"].forEach((key) => {
      const lot = lotByKey(chart, key);
      add(chart.positions[lot?.lord]?.house, 0.75, `${lot ? lotName(key) : key} ${t("tableRuler")}`, "scoreCategoryLots", `lot-lord:${key}:${lot?.lord || "none"}`);
    });
  }

  function triplicityScoreReason(key) {
    return `${t("sectLight")} ${planetLabel(key)} · ${t("scoreCategoryTriplicity")}`;
  }

  function addTriplicityTopicScores(add, chart) {
    const trip = sectTriplicityRulers(chart);
    add(chart.positions[trip.primary]?.house, 1.0, triplicityScoreReason(trip.primary), "scoreCategoryTriplicity", `triplicity:active:${trip.primary}`);
    add(chart.positions[trip.secondary]?.house, 0.6, triplicityScoreReason(trip.secondary), "scoreCategoryTriplicity", `triplicity:out-of-sect:${trip.secondary}`);
    add(chart.positions[trip.cooperating]?.house, 0.4, triplicityScoreReason(trip.cooperating), "scoreCategoryTriplicity", `triplicity:cooperating:${trip.cooperating}`);
  }

  function scoreChartTopics(chart) {
    const houses = createTopicScoreRows();
    const add = createTopicScoreAdder(houses);
    addBaseTopicScores(add, chart);
    addAngularTopicScores(add, chart);
    addLotTopicScores(add, chart);
    addTriplicityTopicScores(add, chart);
    return sortTopicScoreRows(houses);
  }

  function publicProjectionReadingModel(chart) {
    const tenthSignIndex = wholeSignHouseSign(chart, 10);
    const tenthRuler = wholeSignHouseRuler(chart, 10);
    const tenthRulerPosition = chart.positions[tenthRuler];
    const planetsInTenth = VISIBLE_KEYS.filter((key) => chart.positions[key]?.house === 10);
    return { chart, tenthSignIndex, tenthRuler, tenthRulerPosition, planetsInTenth };
  }

  function publicProjectionIntroText() {
    return state.lang === "es"
      ? "La proyección pública describe cómo una persona se vuelve visible: oficio, reputación, responsabilidades, reconocimiento y papel ante otros."
      : "Public projection describes how a person becomes visible: craft, reputation, responsibility, recognition, and role before others.";
  }

  function publicProjectionMcText(model) {
    return state.lang === "es"
      ? `El MC cae en casa ${model.chart.mcHouse}: ${houseReadingTopics(model.chart.mcHouse, "double")}.`
      : `The MC falls in house ${model.chart.mcHouse}: ${houseReadingTopics(model.chart.mcHouse, "double")}.`;
  }

  function publicProjectionRulerText(model) {
    return state.lang === "es"
      ? `La casa 10 está en ${signLabel(model.tenthSignIndex)} y su regente, ${planetLabel(model.tenthRuler)}, cae en casa ${model.tenthRulerPosition.house}: ${houseReadingTopics(model.tenthRulerPosition.house, "double")}.`
      : `The 10th house is in ${signLabel(model.tenthSignIndex)} and its ruler, ${planetLabel(model.tenthRuler)}, falls in house ${model.tenthRulerPosition.house}: ${houseReadingTopics(model.tenthRulerPosition.house, "double")}.`;
  }

  function publicProjectionTenthHouseText(model) {
    if (model.planetsInTenth.length) {
      return state.lang === "es"
        ? `La casa 10 contiene ${naturalList(model.planetsInTenth.map(planetLabel))}; esos planetas colorean directamente la forma de mostrarse, trabajar, ganar rango o asumir visibilidad.`
        : `The 10th house contains ${naturalList(model.planetsInTenth.map(planetLabel))}; those planets directly color how the person shows up, works, gains rank, or becomes visible.`;
    }
    return state.lang === "es"
      ? "La casa 10 no contiene planetas visibles. Eso no borra la vida pública: significa que el peso de la interpretación pasa al regente de la casa 10 y al MC."
      : "The 10th house contains no visible planet. That does not erase public life: it means the interpretation leans on the 10th-house ruler and the MC.";
  }

  function publicProjectionReading(chart) {
    const model = publicProjectionReadingModel(chart);
    return [
      publicProjectionIntroText(),
      publicProjectionMcText(model),
      publicProjectionRulerText(model),
      publicProjectionTenthHouseText(model),
    ].filter(Boolean).join(" ");
  }

  function buildNatalAnchorContext(chart) {
    const ascSign = SIGNS[chart.ascSign];
    const ascLord = ascSign.ruler;
    const ascLordPosition = chart.positions[ascLord];
    const ascLordSign = SIGNS[signOf(ascLordPosition.lon)];
    const tenthRuler = wholeSignHouseRuler(chart, 10);
    const tenthRulerPosition = chart.positions[tenthRuler];
    const planetsInTenth = VISIBLE_KEYS.filter((key) => chart.positions[key]?.house === 10);
    return {
      ascSign,
      ascLord,
      ascLordPosition,
      ascLordSign,
      tenthRuler,
      tenthRulerPosition,
      planetsInTenth,
    };
  }

  function buildNatalFocusContext(chart, ascLordPosition) {
    const focuses = scoreChartTopics(chart).filter((focus) => focus.score > 0).slice(0, 3);
    const dominant = focuses[0] || { house: ascLordPosition.house, score: 0, reasons: [] };
    return {
      focuses,
      dominant,
      secondaryFocuses: focuses.slice(1),
    };
  }

  function buildNatalSectContext(chart) {
    const sectLight = chart.sectLight;
    const benefic = chart.beneficOfSect;
    const malefic = chart.maleficContrarySect;
    const beneficPosition = chart.positions[benefic];
    const maleficPosition = chart.positions[malefic];
    const sectLabel = chart.isDay ? t("dayChart") : t("nightChart");
    const sectContext = sectLabel.toLocaleLowerCase(activeLocale());
    const sectDescription = state.lang === "es" ? `una ${sectContext}` : `a ${sectContext}`;
    const sectConfidenceNotice = sectSensitivityState(chart) === "stable" ? "" : t("sectLowConfidenceJudgment");
    return {
      sectLight,
      benefic,
      malefic,
      beneficPosition,
      maleficPosition,
      sectContext,
      sectDescription,
      sectConfidenceNotice,
    };
  }

  function buildNatalProminenceContext(chart) {
    return {
      angularPlanets: visibleAngularPlanets(chart),
      exactAnglePlanets: visiblePlanetsNearAngles(chart),
      receptionEvidence: receptionEvidenceItems(chart),
      boundaryEvidence: boundaryWarnings(chart),
    };
  }

  function buildNatalLotContext(chart) {
    const fortune = lotByKey(chart, "fortune");
    const spirit = lotByKey(chart, "spirit");
    const lotConditionTexts = [lotConditionReading(fortune, chart), lotConditionReading(spirit, chart)].filter(Boolean);
    return {
      fortune,
      spirit,
      lotConditionTexts,
    };
  }

  function buildNatalDerivedReadingsContext(chart, focuses, ascLordPosition) {
    return {
      visibility: visibilityReading(chart),
      configurations: configurationsReading(chart, focuses, ascLordPosition),
      moonJudgment: moonJudgmentReading(chart),
      foundations: triplicityFoundationReading(chart),
      publicProjection: publicProjectionReading(chart),
    };
  }

  function beneficSolarCautionText(benefic, chart) {
    if (!isSolarObscuredWithoutChariot(benefic, chart)) return "";
    return state.lang === "es"
      ? `Su apoyo existe, pero puede verse menos, depender de mediadores o tardar más porque está ${solarPhaseTableText(benefic, chart)}.`
      : `Its support exists, but may be less visible, more mediated, or slower because it is ${solarPhaseTableText(benefic, chart)}.`;
  }

  function createNatalReadingContext(chart) {
    const anchors = buildNatalAnchorContext(chart);
    const focus = buildNatalFocusContext(chart, anchors.ascLordPosition);
    const sect = buildNatalSectContext(chart);
    const prominence = buildNatalProminenceContext(chart);
    const lots = buildNatalLotContext(chart);
    const derived = buildNatalDerivedReadingsContext(chart, focus.focuses, anchors.ascLordPosition);
    return {
      chart,
      ...anchors,
      ...focus,
      ...sect,
      ...prominence,
      ...lots,
      ...derived,
      beneficSolarCaution: beneficSolarCautionText(sect.benefic, chart),
    };
  }

  function dominantFocusSummaryText(dominant) {
    return state.lang === "es"
      ? `La carta pone mucho peso en la casa ${dominant.house}. ${capitalizeText(houseReadingTopics(dominant.house, "double"))}.`
      : `The chart puts a great deal of weight on house ${dominant.house}: ${houseReadingTopics(dominant.house, "double")}.`;
  }

  function secondaryFocusSummaryText(secondaryFocuses) {
    if (!secondaryFocuses.length) return "";
    return state.lang === "es"
      ? `También conviene mirar ${naturalList(secondaryFocuses.map((focus) => `casa ${focus.house}`))}, porque completan el dibujo general.`
      : `It is also worth reading ${naturalList(secondaryFocuses.map((focus) => `house ${focus.house}`))}, because they complete the general pattern.`;
  }

  function ascLordSummaryText(ascLord, ascLordPosition) {
    return state.lang === "es"
      ? `El hilo rector sigue siendo ${planetLabel(ascLord)}, regente del Ascendente, situado en casa ${ascLordPosition.house}; por eso la lectura parte de la dirección vital y no de una posición aislada.`
      : `The guiding thread remains ${planetLabel(ascLord)}, lord of the Ascendant / Hour-Marker, placed in house ${ascLordPosition.house}; this is why the reading begins from life direction rather than from an isolated placement.`;
  }

  function natalSummaryBaseText(context) {
    return [
      dominantFocusSummaryText(context.dominant),
      secondaryFocusSummaryText(context.secondaryFocuses),
      ascLordSummaryText(context.ascLord, context.ascLordPosition),
    ].filter(Boolean).join(" ");
  }

  function buildNatalReadingSummary(context) {
    return [natalSummaryBaseText(context), context.sectConfidenceNotice].filter(Boolean).join(" ");
  }

  function lifeDirectionIntroText(context) {
    const { chart, ascLord } = context;
    return state.lang === "es"
      ? `El Ascendente está en ${signLabel(chart.ascSign)}, por lo que ${planetLabel(ascLord)} lleva la dirección general de la carta.`
      : `The Ascendant / Hour-Marker is in ${signLabel(chart.ascSign)}, so ${planetLabel(ascLord)} carries the chart's general direction.`;
  }

  function lifeDirectionTopicText(context) {
    const { ascLord, ascLordPosition } = context;
    return state.lang === "es"
      ? `${planetLabel(ascLord)} habla de ${planetPlainMeaning(ascLord)}. Al caer en ${signLabel(signOf(ascLordPosition.lon))}, casa ${ascLordPosition.house}, esas capacidades se vinculan con ${houseReadingTopics(ascLordPosition.house, "double")}.`
      : `${planetLabel(ascLord)} speaks of ${planetPlainMeaning(ascLord)}. Placed in ${signLabel(signOf(ascLordPosition.lon))}, house ${ascLordPosition.house}, those capacities connect with ${houseReadingTopics(ascLordPosition.house, "double")}.`;
  }

  function lifeDirectionPlacementText(context) {
    const { ascLordPosition, ascLordSign } = context;
    return state.lang === "es"
      ? `${signStyleReading(ascLordSign)} Al estar en una casa ${t(ascLordPosition.angularity)}, este tema se muestra ${angularityReading(ascLordPosition.angularity)}.`
      : `${signStyleReading(ascLordSign)} Being in a ${t(ascLordPosition.angularity)} house, this topic shows itself ${angularityReading(ascLordPosition.angularity)}.`;
  }

  function lifeDirectionConditionText(context) {
    const { chart, ascLordPosition } = context;
    return essentialConditionReading(ascLordPosition, chart);
  }

  function buildLifeDirectionText(context) {
    return [
      lifeDirectionIntroText(context),
      lifeDirectionTopicText(context),
      lifeDirectionPlacementText(context),
      lifeDirectionConditionText(context),
    ].filter(Boolean).join(" ");
  }

  function supportIntroText() {
    return state.lang === "es"
      ? "Esta sección muestra de dónde puede venir ayuda real: protección, mediadores favorables, crecimiento, conciliación o margen para respirar."
      : "This section shows where real help can come from: protection, favorable mediators, growth, reconciliation, or room to breathe.";
  }

  function supportActorText(context) {
    const { sectContext, benefic } = context;
    return state.lang === "es"
      ? `En esta ${sectContext}, ${planetLabel(benefic)} es el principal planeta de apoyo.`
      : `In this ${sectContext}, ${planetLabel(benefic)} is the main support planet.`;
  }

  function supportTopicText(context) {
    const { beneficPosition } = context;
    return state.lang === "es"
      ? `Está en casa ${beneficPosition.house}: ${houseReadingTopics(beneficPosition.house, "double")}. Ahí facilita que el tema crezca, encuentre respaldo o abra oportunidades concretas.`
      : `It is in house ${beneficPosition.house}: ${houseReadingTopics(beneficPosition.house, "double")}. There it helps the topic grow, find backing, or open concrete opportunities.`;
  }

  function supportConnectionText(context) {
    return connectionReading(context.beneficPosition, context.focuses, context.ascLordPosition, "support");
  }

  function buildSupportText(context) {
    return [
      supportIntroText(),
      supportActorText(context),
      supportTopicText(context),
      supportConnectionText(context),
      context.beneficSolarCaution,
    ].filter(Boolean).join(" ");
  }

  function tensionActorText(context) {
    return state.lang === "es"
      ? `${planetLabel(context.malefic)} señala la presión que más cuidado pide en esta carta.`
      : `${planetLabel(context.malefic)} marks the pressure that asks for the most care in this chart.`;
  }

  function tensionTopicText(context) {
    const { maleficPosition } = context;
    return state.lang === "es"
      ? `Está en casa ${maleficPosition.house}: ${houseReadingTopics(maleficPosition.house, "double")}.`
      : `It is in house ${maleficPosition.house}: ${houseReadingTopics(maleficPosition.house, "double")}.`;
  }

  function tensionPracticalText() {
    return state.lang === "es"
      ? "En la vida real puede sentirse como límites, conflicto, desgaste, demoras, separación o condiciones que obligan a actuar con más estrategia."
      : "In real life this can feel like limits, conflict, strain, delays, separation, or conditions that require more strategy.";
  }

  function tensionManagementText(context) {
    const { chart, maleficPosition, beneficPosition, focuses, ascLordPosition } = context;
    return [
      connectionReading(maleficPosition, focuses, ascLordPosition, "tension"),
      maleficMitigationReading(maleficPosition, beneficPosition, chart),
    ].filter(Boolean).join(" ");
  }

  function buildTensionText(context) {
    return [
      tensionActorText(context),
      tensionTopicText(context),
      tensionPracticalText(),
      tensionManagementText(context),
    ].filter(Boolean).join(" ");
  }

  function lotReadingIntroText() {
    return state.lang === "es"
      ? "Los lotes principales separan dos planos: Fortuna muestra lo que llega y condiciona; Espíritu muestra lo que la persona intenta orientar."
      : "The principal lots separate two planes: Fortune shows what arrives and conditions life; Spirit shows what the person tries to direct.";
  }

  function lotReadingConditionText(context) {
    return context.lotConditionTexts.join(" ");
  }

  function buildLotReadingText(context) {
    return [lotReadingIntroText(), lotReadingConditionText(context)].filter(Boolean).join(" ");
  }

  function buildFocusAscEvidence(context) {
    const { chart, focuses, ascLordPosition } = context;
    return [
      t("evidenceFocuses", {
        focuses: focusTextList(focuses),
      }),
      focusRulerEvidence(focuses, chart),
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
    ];
  }

  function buildSectEvidence(context) {
    const { sectLight, benefic, malefic, sectDescription, sectConfidenceNotice } = context;
    return [
      t("evidenceSect", {
        sect: sectDescription,
        sectLight: planetLabel(sectLight),
        benefic: planetLabel(benefic),
        malefic: planetLabel(malefic),
      }),
      ...(sectConfidenceNotice ? [sectConfidenceNotice] : []),
    ];
  }

  function tenthRulerEvidenceText(tenthRuler, tenthRulerPosition) {
    return state.lang === "es"
      ? `Regente de casa 10: ${planetLabel(tenthRuler)} en casa ${tenthRulerPosition.house}.`
      : `10th-house ruler: ${planetLabel(tenthRuler)} in house ${tenthRulerPosition.house}.`;
  }

  function exactAngleEvidenceText(exactAnglePlanets) {
    const planets = exactAnglePlanets.length ? exactAngleListText(exactAnglePlanets) : capitalizeText(t("none"));
    return state.lang === "es"
      ? `Planetas visibles cerca de ángulos exactos: ${planets}.`
      : `Visible planets near exact angles: ${planets}.`;
  }

  function buildPublicProminenceEvidence(context) {
    const { chart, tenthRuler, tenthRulerPosition, angularPlanets, exactAnglePlanets } = context;
    return [
      t("evidenceMcHouse", {
        house: chart.mcHouse,
        topics: houseTopics(chart.mcHouse),
      }),
      tenthRulerEvidenceText(tenthRuler, tenthRulerPosition),
      t("evidenceAngularPlanets", {
        planets: angularPlanets.length ? naturalList(angularPlanets.map(planetLabel)) : capitalizeText(t("none")),
      }),
      exactAngleEvidenceText(exactAnglePlanets),
    ];
  }

  function receptionEvidenceTextItems(receptionEvidence) {
    return receptionEvidence.length
      ? receptionEvidence
      : [state.lang === "es"
        ? "Recepción: no destaca entre los significadores principales configurados."
        : "Reception: none stands out among the configured main significators."];
  }

  function boundaryEvidenceTextItem(boundaryEvidence) {
    if (!boundaryEvidence.length) return "";
    const text = boundaryEvidence.map(boundaryWarningText).join(" ");
    return state.lang === "es"
      ? `Avisos de frontera: ${text}`
      : `Boundary notices: ${text}`;
  }

  function buildReceptionBoundaryEvidence(context) {
    return [
      ...receptionEvidenceTextItems(context.receptionEvidence),
      boundaryEvidenceTextItem(context.boundaryEvidence),
    ].filter(Boolean);
  }

  function buildLotEvidence(context) {
    const { fortune, spirit } = context;
    return [
      t("evidenceLots", { fortuneHouse: fortune.house, spiritHouse: spirit.house }),
      t("evidenceLotsAlwaysWeighted"),
    ];
  }

  function solarPhaseEvidenceText(chart) {
    const keyPlanetText = keyPlanetList(chart).map((key) => {
      const phase = solarPhaseState(key, chart).category === "luminary"
        ? (state.lang === "es" ? "luminaria" : "luminary")
        : solarPhaseTableText(key, chart);
      return `${planetLabel(key)}: ${phase}`;
    }).join("; ");
    return state.lang === "es"
      ? `Fase solar aplicada a planetas clave: ${keyPlanetText}.`
      : `Solar phase applied to key planets: ${keyPlanetText}.`;
  }

  function moonEvidenceText(chart) {
    const nextContact = chart.moon.nextApplication
      ? lunarContactLabel(chart.moon.nextApplication)
      : (state.lang === "es" ? "ninguno en 30°" : "none within 30°");
    const method = chart.moon.nextApplication?.method
      ? `; ${state.lang === "es" ? "método" : "method"}: ${t(chart.moon.nextApplication.method === "iterative" ? "lunarMethodIterative" : "lunarMethodFallback")}`
      : "";
    return state.lang === "es"
      ? `Luna: fase ${chart.moon.phase}; próximo contacto ${nextContact}${method}; vacía de curso por 30°: ${chart.moon.voidOfCourse ? t("yes") : t("no")}; vacía antes de salir del signo: ${chart.moon.voidOfCourseBySign ? t("yes") : t("no")}.`
      : `Moon: ${chart.moon.phase} phase; next contact ${nextContact}${method}; void of course by 30°: ${chart.moon.voidOfCourse ? t("yes") : t("no")}; void before sign exit: ${chart.moon.voidOfCourseBySign ? t("yes") : t("no")}.`;
  }

  function triplicityEvidenceText(chart) {
    const rulers = sectTriplicityRulers(chart);
    const rulerText = naturalList([rulers.primary, rulers.secondary, rulers.cooperating].map(planetLabel));
    return state.lang === "es"
      ? `Triplicidad de la luminaria de la secta: ${rulerText}.`
      : `Sect-light triplicity rulers: ${rulerText}.`;
  }

  function buildNatalReadingEvidence(context) {
    return [
      ...buildFocusAscEvidence(context),
      ...buildSectEvidence(context),
      ...buildPublicProminenceEvidence(context),
      ...buildReceptionBoundaryEvidence(context),
      ...buildLotEvidence(context),
      solarPhaseEvidenceText(context.chart),
      moonEvidenceText(context.chart),
      triplicityEvidenceText(context.chart),
    ];
  }

  function ascLordHierarchyLine(context) {
    const { ascLord, ascLordPosition } = context;
    return state.lang === "es"
      ? `${t("ascLordTitle")}: ${planetLabel(ascLord)} en casa ${ascLordPosition.house} -> dirección vital.`
      : `${t("ascLordTitle")}: ${planetLabel(ascLord)} in house ${ascLordPosition.house} -> life direction.`;
  }

  function mcHierarchyLine(context) {
    return state.lang === "es"
      ? `${t("mc")}: casa ${context.chart.mcHouse} -> proyección pública y acción visible.`
      : `${t("mc")}: house ${context.chart.mcHouse} -> public projection and visible action.`;
  }

  function tenthRulerHierarchyLine(context) {
    const { tenthRuler, tenthRulerPosition } = context;
    return state.lang === "es"
      ? `Regente de casa 10: ${planetLabel(tenthRuler)} en casa ${tenthRulerPosition.house} -> administración de la reputación y el oficio.`
      : `10th-house ruler: ${planetLabel(tenthRuler)} in house ${tenthRulerPosition.house} -> administration of reputation and craft.`;
  }

  function angularPlanetsHierarchyLine(context) {
    const angularPlanetsText = context.angularPlanets.length ? naturalList(context.angularPlanets.map(planetLabel)) : capitalizeText(t("none"));
    return state.lang === "es"
      ? `Planetas visibles angulares: ${angularPlanetsText} -> lo que más se nota.`
      : `Angular visible planets: ${angularPlanetsText} -> what stands out most.`;
  }

  function exactAngleHierarchyLine(context) {
    if (!context.exactAnglePlanets.length) return "";
    return state.lang === "es"
      ? `Cercanía a ángulos exactos: ${exactAngleListText(context.exactAnglePlanets)} -> prominencia adicional.`
      : `Near exact angles: ${exactAngleListText(context.exactAnglePlanets)} -> additional prominence.`;
  }

  function lotsHierarchyLine(context) {
    const { fortune, spirit } = context;
    if (!fortune || !spirit) return "";
    return state.lang === "es"
      ? `${t("fortune")}/${t("spirit")}: casas ${fortune.house}/${spirit.house} -> circunstancias e intención.`
      : `${t("fortune")}/${t("spirit")}: houses ${fortune.house}/${spirit.house} -> circumstance and intention.`;
  }

  const NATAL_HIERARCHY_LINE_BUILDERS = Object.freeze([
    ascLordHierarchyLine,
    mcHierarchyLine,
    tenthRulerHierarchyLine,
    angularPlanetsHierarchyLine,
    exactAngleHierarchyLine,
    lotsHierarchyLine,
  ]);

  function buildNatalReadingHierarchy(context) {
    return NATAL_HIERARCHY_LINE_BUILDERS.map((builder) => builder(context)).filter(Boolean);
  }

  function prominenceQuality(context) {
    return { label: t("prominenceLabel"), value: t(prominenceLevel(context.ascLordPosition)) };
  }

  function easeQuality(context) {
    return { label: t("easeLabel"), value: t(essentialEaseLevel(context.ascLordPosition, context.ascLord, context.chart)) };
  }

  function tensionQuality(context) {
    return { label: t("tensionLabel"), value: t(tensionLevel(context.maleficPosition, context.focuses, context.ascLordPosition, context.malefic, context.chart)) };
  }

  function supportQuality(context) {
    return { label: t("supportLabel"), value: t(supportLevel(context.beneficPosition, context.focuses, context.ascLordPosition, context.benefic, context.chart)) };
  }

  const NATAL_QUALITY_BUILDERS = Object.freeze([
    prominenceQuality,
    easeQuality,
    tensionQuality,
    supportQuality,
  ]);

  function buildNatalReadingQualities(context) {
    return NATAL_QUALITY_BUILDERS.map((builder) => builder(context));
  }

  function buildLifeDirectionBlock(context) {
    return { title: t("lifeDirectionTitle"), text: buildLifeDirectionText(context), conclusion: lifeDirectionConclusion(context.ascLord, context.ascLordPosition, context.chart) };
  }

  function buildPublicProjectionBlock(context) {
    return { title: t("publicProjectionTitle"), text: context.publicProjection, conclusion: publicProjectionConclusion(context.chart, context.planetsInTenth, context.tenthRuler, context.tenthRulerPosition) };
  }

  function buildVisibilityBlock(context) {
    return { title: t("visibilityTitle"), text: context.visibility, conclusion: visibilityConclusion(context.chart) };
  }

  function buildSupportBlock(context) {
    return { title: t("resourcesTitle"), text: buildSupportText(context), conclusion: supportConclusion(context.benefic, context.beneficPosition, context.focuses, context.ascLordPosition, context.chart) };
  }

  function buildTensionBlock(context) {
    return { title: t("tensionsTitle"), text: buildTensionText(context), conclusion: tensionConclusion(context.malefic, context.maleficPosition, context.focuses, context.ascLordPosition, context.chart) };
  }

  function buildConfigurationsBlock(context) {
    return { title: t("configurationsTitle"), text: context.configurations, conclusion: configurationsConclusion(context.chart) };
  }

  function buildMoonJudgmentBlock(context) {
    return { title: t("moonJudgmentTitle"), text: context.moonJudgment, conclusion: moonConclusion(context.chart) };
  }

  function buildFoundationsBlock(context) {
    return { title: t("foundationsTitle"), text: context.foundations, conclusion: triplicityFoundationConclusion(context.chart) };
  }

  function buildLotsBlock(context) {
    return { title: t("lots"), text: buildLotReadingText(context), conclusion: lotsConclusion(context.fortune, context.spirit, context.chart) };
  }

  const NATAL_READING_BLOCK_BUILDERS = Object.freeze([
    buildLifeDirectionBlock,
    buildPublicProjectionBlock,
    buildVisibilityBlock,
    buildSupportBlock,
    buildTensionBlock,
    buildConfigurationsBlock,
    buildMoonJudgmentBlock,
    buildFoundationsBlock,
    buildLotsBlock,
  ]);

  function buildNatalReadingBlocks(context) {
    return NATAL_READING_BLOCK_BUILDERS.map((builder) => builder(context));
  }

  function interpretChart(chart) {
    const context = createNatalReadingContext(chart);

    return {
      lead: focusLeadReading(context.focuses),
      summary: buildNatalReadingSummary(context),
      focuses: context.focuses,
      hierarchy: buildNatalReadingHierarchy(context),
      qualities: buildNatalReadingQualities(context),
      scoreBreakdown: context.focuses,
      blocks: buildNatalReadingBlocks(context),
      evidence: buildNatalReadingEvidence(context),
    };
  }

  const SCORE_BREAKDOWN_CATEGORY_ORDER = Object.freeze([
    "scoreCategoryLifeAxis",
    "scoreCategoryPublic",
    "scoreCategoryAngular",
    "scoreCategoryLots",
    "scoreCategoryTriplicity",
    "scoreCategorySect",
  ]);

  function scoreFocusTypeLabel(items = []) {
    const totals = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.points;
      return acc;
    }, {});
    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const labels = Object.entries(totals)
      .filter(([, value]) => !total || value / total >= 0.3)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => {
        if (category === "scoreCategoryLifeAxis") return t("focusTypeVital");
        if (category === "scoreCategoryPublic" || category === "scoreCategoryAngular") return t("focusTypePublic");
        if (category === "scoreCategoryLots") return t("focusTypeCircumstantial");
        return t("focusTypeSupport");
      });
    return naturalList([...new Set(labels)]);
  }

  function buildScoreBreakdownGroups(items = []) {
    const groups = new Map();
    items.forEach((item) => {
      const key = item.category || "scoreCategoryLifeAxis";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({
        points: scoreNumber(item.points),
        reason: item.reason,
      });
    });
    return SCORE_BREAKDOWN_CATEGORY_ORDER
      .filter((key) => groups.has(key))
      .map((key) => ({
        label: t(key),
        items: groups.get(key),
      }));
  }

  function buildScoreBreakdownModel(focuses = []) {
    return focuses.map((focus) => ({
      label: focusLabel(focus),
      total: scoreNumber(focus.score),
      type: scoreFocusTypeLabel(focus.scoreItems),
      groups: buildScoreBreakdownGroups(focus.scoreItems),
    }));
  }

  function renderScoreBreakdownGroup(group) {
    return `
      <div class="score-breakdown-group">
        <p>${escapeHtml(group.label)}</p>
        <ul>
          ${group.items.map((item) => `
            <li><strong>+${escapeHtml(item.points)}</strong> ${escapeHtml(item.reason)}</li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  function renderScoreBreakdown(focuses) {
    const model = buildScoreBreakdownModel(focuses);
    if (!model.length) return "";
    return `
      <div class="score-breakdown" data-test="score-breakdown">
        <p class="score-breakdown-title">${escapeHtml(t("scoreBreakdownTitle"))}</p>
        <p class="score-breakdown-caution">${escapeHtml(t("scoreBreakdownCaution"))}</p>
        ${model.map((focus) => `
          <section class="score-breakdown-item">
            <h5>${escapeHtml(focus.label)} · ${escapeHtml(t("scoreTotalLabel"))}: ${escapeHtml(focus.total)} ${escapeHtml(t("scorePointsLabel"))}</h5>
            <p class="score-focus-type">${escapeHtml(t("scoreFocusType"))}: ${escapeHtml(focus.type)}</p>
            ${focus.groups.map(renderScoreBreakdownGroup).join("")}
          </section>
        `).join("")}
      </div>
    `;
  }

  function lotLordSolarPhaseText(lot, chart) {
    return solarPhaseState(lot.lord, chart).category === "luminary"
      ? (state.lang === "es" ? "luminaria" : "luminary")
      : solarPhaseTableText(lot.lord, chart);
  }

  function mainLotPositionFields(lot, lord) {
    const lordLabel = planetLabel(lot.lord);
    return [
      { label: t("lotAuditPosition"), value: `${formatDegree(lot.lon)} · ${t("tableHouse")} ${lot.house}` },
      { label: t("lotAuditLord"), value: `${lordLabel} · ${t("tableHouse")} ${lord?.house || "—"}` },
    ];
  }

  function mainLotAdministrationFields(lot, lord, chart) {
    return [
      {
        label: t("lotAuditDirectAdministration"),
        value: directLotAdministrationText(lot, chart),
        valueClass: "lot-audit-role lot-direct-administration",
        dataTest: `main-lot-${lot.key}-direct-administration`,
      },
      { label: t("lotAuditLordRole"), value: lotLordRoleText(lot, chart), valueClass: "lot-audit-role" },
      { label: t("lotAuditLordCondition"), value: plainDignityText(lord?.dignities || [], chart) },
      { label: t("lotAuditLordAngularity"), value: lord?.angularity ? t(lord.angularity) : "—" },
      { label: t("lotAuditLordSolarPhase"), value: lotLordSolarPhaseText(lot, chart) },
      { label: t("lotAuditFormula"), value: lotFormulaText(lot.key, chart.isDay) },
    ];
  }

  function mainLotTestimonyFields(lot, chart) {
    const pressureItems = lotTestimonyItems(lot, ["mars", "saturn"], chart, "tension");
    return [
      { label: t("lotAuditBeneficTestimony"), value: lotTestimonyText(lotTestimonyItems(lot, ["jupiter", "venus"], chart, "support"), "support", lot) },
      { label: t("lotAuditMaleficPressure"), pressureParts: lotPressureAuditParts(pressureItems, lot) },
    ];
  }

  function buildMainLotAuditRow(lot, chart) {
    const lord = chart.positions[lot.lord];
    return {
      key: lot.key,
      name: lotName(lot.key),
      fields: [
        ...mainLotPositionFields(lot, lord),
        ...mainLotAdministrationFields(lot, lord, chart),
        ...mainLotTestimonyFields(lot, chart),
      ],
    };
  }

  function buildMainLotsAuditModel(chart) {
    const rows = ["fortune", "spirit"]
      .map((key) => lotByKey(chart, key))
      .filter(Boolean)
      .map((lot) => buildMainLotAuditRow(lot, chart));
    return {
      title: t("mainLotsAuditTitle"),
      rows,
      note: t("lotTableDisplayNote"),
    };
  }

  function renderAuditField(field) {
    const attrs = [
      field.valueClass ? `class="${escapeHtml(field.valueClass)}"` : "",
      field.dataTest ? `data-test="${escapeHtml(field.dataTest)}"` : "",
    ].filter(Boolean).join(" ");
    const value = field.pressureParts ? renderLotPressureAudit(field.pressureParts) : escapeHtml(field.value ?? "");
    return `
      <dt>${escapeHtml(field.label)}</dt>
      <dd${attrs ? ` ${attrs}` : ""}>${value}</dd>
    `;
  }

  function renderMainLotAuditRow(row) {
    return `
      <li data-test="main-lot-${escapeHtml(row.key)}">
        <strong>${escapeHtml(row.name)}</strong>
        <dl class="lot-audit-lines">
          ${row.fields.map(renderAuditField).join("")}
        </dl>
      </li>
    `;
  }

  function renderMainLotsAudit(chart) {
    const model = buildMainLotsAuditModel(chart);
    const rows = model.rows.map(renderMainLotAuditRow);
    if (!rows.length) return "";
    return `
      <section class="main-lots-audit" data-test="main-lots-audit">
        <h5>${escapeHtml(model.title)}</h5>
        <ul>${rows.join("")}</ul>
        <p>${escapeHtml(model.note)}</p>
      </section>
    `;
  }

  function renderInterpretationBlock(block) {
    const paragraphs = Array.isArray(block.paragraphs)
      ? block.paragraphs.filter(Boolean)
      : [block.text].filter(Boolean);
    const conclusion = block.conclusion || "";
    return `
      <section class="interpretation-block">
        <h5>${escapeHtml(block.title)}</h5>
        ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        ${conclusion ? `<p class="interpretation-conclusion"><strong>${escapeHtml(t("conclusionLabel"))}:</strong> ${escapeHtml(conclusion)}</p>` : ""}
      </section>
    `;
  }

  function renderInterpretationHeading() {
    return `
      <div class="interpretation-heading">
        <h3>${escapeHtml(t("interpretationTitle"))}</h3>
        <p>${escapeHtml(t("interpretationWhy"))}</p>
      </div>
    `;
  }

  function renderInterpretationLead(interpretation) {
    return `
      <section class="interpretation-lead">
        <h4>${escapeHtml(t("interpretationLeadTitle"))}</h4>
        <p>${escapeHtml(interpretation.lead)}</p>
      </section>
    `;
  }

  function renderQualityBadges(qualities) {
    return `
      <div class="quality-badges" aria-label="${escapeHtml(t("qualityTitle"))}">
        ${qualities.map((item) => `
          <span><b>${escapeHtml(item.label)}</b>${escapeHtml(capitalizeText(item.value))}</span>
        `).join("")}
      </div>
    `;
  }

  function renderFocusList(focuses) {
    return `
      <p class="focus-list-title">${escapeHtml(t("mainFocusTitle"))}</p>
      <ul class="focus-list">
        ${focuses.map((focus) => `
          <li>
            <strong>${escapeHtml(focusLabel(focus))}</strong>
            <span>${escapeHtml(t("signalsLabel"))}: ${escapeHtml(focusReasonsText(focus))}</span>
          </li>
        `).join("")}
      </ul>
    `;
  }

  function renderInterpretationSummary(interpretation) {
    return `
      <section class="interpretation-summary">
        <h4>${escapeHtml(t("interpretationSummary"))}</h4>
        <p>${escapeHtml(interpretation.summary)}</p>
        ${renderQualityBadges(interpretation.qualities)}
        ${renderFocusList(interpretation.focuses)}
      </section>
    `;
  }

  function renderInterpretationHierarchy(interpretation) {
    return `
      <section class="interpretation-hierarchy">
        <h4>${escapeHtml(t("hierarchyTitle"))}</h4>
        <ol>
          ${interpretation.hierarchy.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </section>
    `;
  }

  function renderInterpretationReading(interpretation) {
    return `
      <section class="interpretation-reading">
        <h4>${escapeHtml(t("interpretationReading"))}</h4>
        <div class="interpretation-reading-grid">
          ${interpretation.blocks.map(renderInterpretationBlock).join("")}
        </div>
      </section>
    `;
  }

  function renderInterpretationGrid(interpretation) {
    return `
      <div class="interpretation-grid">
        ${renderInterpretationLead(interpretation)}
        ${renderInterpretationSummary(interpretation)}
        ${renderInterpretationHierarchy(interpretation)}
        ${renderInterpretationReading(interpretation)}
      </div>
    `;
  }

  function renderEvidenceScoreSection(interpretation) {
    return `
      <section class="evidence-section" data-test="evidence-score">
        <h5>${escapeHtml(t("evidenceFocusSection"))}</h5>
        ${renderScoreBreakdown(interpretation.scoreBreakdown)}
      </section>
    `;
  }

  function renderEvidenceMainLotsSection(chart) {
    return `
      <section class="evidence-section" data-test="evidence-main-lots">
        <h5>${escapeHtml(t("evidenceLotsSection"))}</h5>
        ${renderMainLotsAudit(chart)}
      </section>
    `;
  }

  function renderEvidenceGeneralSection(interpretation) {
    return `
      <section class="evidence-section" data-test="evidence-general">
        <h5>${escapeHtml(t("evidenceGeneralSection"))}</h5>
        <ol>
          ${interpretation.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </section>
    `;
  }

  function renderInterpretationEvidence(interpretation, chart) {
    return `
      <details class="interpretation-evidence">
        <summary>${escapeHtml(t("interpretationEvidence"))}</summary>
        ${renderEvidenceScoreSection(interpretation)}
        ${renderEvidenceMainLotsSection(chart)}
        ${renderEvidenceGeneralSection(interpretation)}
      </details>
    `;
  }

  function renderInterpretationTimingNote() {
    return `
      <p class="text-note interpretation-timing"><strong>${escapeHtml(t("interpretationTimingNote"))}:</strong> ${escapeHtml(t("interpretationTimingText"))}</p>
    `;
  }

  function buildInterpretationHtml(interpretation, chart) {
    return [
      renderInterpretationHeading(),
      renderInterpretationGrid(interpretation),
      renderInterpretationEvidence(interpretation, chart),
      renderInterpretationTimingNote(),
    ].join("");
  }

  function applyInterpretationHtml(html) {
    $("#interpretationPanel").innerHTML = html;
  }

  function interpretationRenderPorts() {
    return {
      interpret: interpretChart,
      buildHtml: buildInterpretationHtml,
      writeHtml: applyInterpretationHtml,
    };
  }

  function renderInterpretation(chart, ports = interpretationRenderPorts()) {
    const interpretation = ports.interpret(chart);
    ports.writeHtml(ports.buildHtml(interpretation, chart));
  }

  function planetTableHeaders() {
    return [
      tableHead(t("tablePlanet"), "planet"),
      tableHead(t("tableLongitude"), "longitude"),
      tableHead(t("tableHouse"), "house"),
      tableHead(t("tableCondition"), "essentialCondition"),
      tableHead(t("tableAngularity"), "angularity"),
      tableHead(t("tablePhase"), "solarPhase"),
    ];
  }

  function planetTableRow(chart, key) {
    const p = chart.positions[key];
    const condition = p.dignities?.length ? glossaryList(p.dignities, chart) : "—";
    return [
      `<span class="glyph">${PLANETS[key].symbol}</span> ${escapeHtml(planetName(key))}`,
      escapeHtml(formatDegree(p.lon)),
      escapeHtml(String(p.house)),
      condition,
      glossaryMaybe(capitalizeText(t(p.angularity)), p.angularity, "capitalize-first"),
      glossaryParts(solarPhaseTableText(key, chart)),
    ];
  }

  function planetTableRows(chart, keys) {
    return keys.map((key) => planetTableRow(chart, key));
  }

  function renderTableSection(section) {
    return `
      <section class="table-section"${section.test ? ` data-test="${escapeHtml(section.test)}"` : ""}>
        ${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ""}
        ${makeTable(section.headers, section.rows)}
      </section>
    `;
  }

  function renderTextNote(contentHtml) {
    return `<p class="text-note">${contentHtml}</p>`;
  }

  function renderEscapedTextNote(text) {
    return renderTextNote(escapeHtml(text));
  }

  function renderTableModelHtml(model) {
    if (model.emptyText) return renderEscapedTextNote(model.emptyText);
    const tableHtml = makeTable(model.headers, model.rows);
    return model.noteHtml ? `${tableHtml}${renderTextNote(model.noteHtml)}` : tableHtml;
  }

  function buildPlanetTableModel(chart) {
    const headers = planetTableHeaders();
    const traditionalKeys = chart.planetKeys.filter((key) => VISIBLE_KEYS.includes(key));
    const modernKeys = chart.planetKeys.filter((key) => MODERN_KEYS.includes(key));
    if (modernKeys.length) {
      return {
        sections: [
          { title: t("traditionalPlanetsTitle"), test: "traditional-planets-section", headers, rows: planetTableRows(chart, traditionalKeys) },
          { title: t("modernPlanetsTitle"), test: "modern-planets-section", headers, rows: planetTableRows(chart, modernKeys) },
        ],
      };
    }
    return {
      sections: [
        { title: "", test: "", headers, rows: planetTableRows(chart, chart.planetKeys) },
      ],
    };
  }

  function renderPlanetTable(chart) {
    const model = buildPlanetTableModel(chart);
    $("#tab-planets").innerHTML = model.sections.length === 1 && !model.sections[0].title
      ? makeTable(model.sections[0].headers, model.sections[0].rows)
      : model.sections.map(renderTableSection).join("");
  }

  function houseTableHeaders() {
    return [
      tableHead(t("tablePlace"), "place"),
      tableHead(t("tableSign"), "sign"),
      tableHead(t("tableRuler"), "ruler"),
      tableHead(t("tablePlanets"), "planets"),
      tableHead(t("tableTopics"), "topics"),
    ];
  }

  function houseTableRows(chart) {
    return Array.from({ length: 12 }, (_, i) => {
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
  }

  function buildHouseTableModel(chart) {
    return {
      headers: houseTableHeaders(),
      rows: houseTableRows(chart),
    };
  }

  function renderHouseTable(chart) {
    const model = buildHouseTableModel(chart);
    $("#tab-houses").innerHTML = makeTable(model.headers, model.rows);
  }

  function lotTableHeaders() {
    return [
      tableHead(t("tableLot"), "lots"),
      tableHead(t("tableLongitude"), "longitude"),
      tableHead(t("tableHouse"), "house"),
      tableHead(t("tableLord"), "lotLord"),
      tableHead(t("tableLordHouse"), "lotLordHouse"),
      tableHead(t("tableFormula"), "lots"),
    ];
  }

  function lotTableRows(lots, chart) {
    return lots.map((lot) => [
      glossaryTerm(capitalizeText(lotName(lot.key)), lotGlossaryKey(lot.key), "capitalize-first"),
      escapeHtml(formatDegree(lot.lon)),
      escapeHtml(String(lot.house)),
      escapeHtml(`${PLANETS[lot.lord].symbol} ${planetName(lot.lord)}`),
      escapeHtml(String(lot.lordHouse || "—")),
      escapeHtml(lotFormulaText(lot.key, chart.isDay)),
    ]);
  }

  function lotFormulaNote() {
    return state.lang === "es"
      ? `Sistema de fórmulas: ${glossaryTerm(t("fortune"), "lotFortune")} y ${glossaryTerm(t("spirit"), "lotSpirit")} se invierten por ${glossaryTerm(t("sect"), "sect")}; ${glossaryTerm("Eros", "lotEros")} y ${glossaryTerm(t("necessity"), "lotNecessity")} usan la tradición basada en ${glossaryTerm(t("fortune"), "lotFortune")} y ${glossaryTerm(t("spirit"), "lotSpirit")}; ${glossaryTerm(t("courage"), "lotCourage")}, ${glossaryTerm(t("victory"), "lotVictory")} y ${glossaryTerm("Némesis", "lotNemesis")} usan fórmulas planetarias herméticas.`
      : `Formula system: ${glossaryTerm(t("fortune"), "lotFortune")} and ${glossaryTerm(t("spirit"), "lotSpirit")} reverse by ${glossaryTerm(t("sect"), "sect")}; ${glossaryTerm("Eros", "lotEros")} and ${glossaryTerm(t("necessity"), "lotNecessity")} use the ${glossaryTerm(t("fortune"), "lotFortune")}/${glossaryTerm(t("spirit"), "lotSpirit")}-based tradition; ${glossaryTerm(t("courage"), "lotCourage")}, ${glossaryTerm(t("victory"), "lotVictory")}, and ${glossaryTerm("Nemesis", "lotNemesis")} use hermetic planetary formulas.`;
  }

  function buildLotTableModel(chart) {
    const lots = visibleLots(chart);
    if (!lots.length) {
      return { emptyText: t("noLots"), headers: [], rows: [], noteHtml: "" };
    }
    return {
      emptyText: "",
      headers: lotTableHeaders(),
      rows: lotTableRows(lots, chart),
      noteHtml: lotFormulaNote(),
    };
  }

  function renderLotTable(chart) {
    $("#tab-lots").innerHTML = renderTableModelHtml(buildLotTableModel(chart));
  }

  function aspectTableHeaders() {
    return [
      tableHead(t("tablePair"), "aspectPair"),
      tableHead(t("tableAspect"), "configurations"),
      tableHead(t("tableMode"), "mode"),
      tableHead(t("tableOrb"), "orb"),
    ];
  }

  function aspectPairLabel(a, b) {
    return escapeHtml(`${PLANETS[a].symbol} ${planetName(a)} / ${PLANETS[b].symbol} ${planetName(b)}`);
  }

  function aspectTablePlanetKeys(chart) {
    return chart.planetKeys.filter((key) => VISIBLE_KEYS.includes(key) || chart.input.includeModern);
  }

  function aspectDisplayModes(input) {
    return {
      showSign: input.aspectMode === "sign" || input.aspectMode === "both",
      showDegree: input.aspectMode === "degree" || input.aspectMode === "both",
    };
  }

  function signAspectTableRow(a, b, chart, signType) {
    const dominance = overcomingLabel(a, b, chart.positions[a].lon, chart.positions[b].lon) || "—";
    return [
      aspectPairLabel(a, b),
      glossaryMaybe(capitalizeText(t(signType)), signType, "capitalize-first"),
      glossaryMaybe(capitalizeText(t("signBased")), "aspects", "capitalize-first"),
      glossaryMaybe(capitalizeText(dominance), glossaryKeyForText(dominance), "capitalize-first"),
    ];
  }

  function degreeAspectTableRow(a, b, degree) {
    return [
      aspectPairLabel(a, b),
      glossaryMaybe(capitalizeText(t(degree.type)), degree.type, "capitalize-first"),
      glossaryMaybe(capitalizeText(t("degreeBased")), "aspects", "capitalize-first"),
      escapeHtml(`${round(degree.delta, 2)}°`),
    ];
  }

  function aspectRowsForPair(a, b, chart, modes) {
    const signType = signAspectType(signOf(chart.positions[a].lon), signOf(chart.positions[b].lon));
    const degree = degreeAspect(chart.positions[a].lon, chart.positions[b].lon, chart.input.orb);
    return [
      modes.showSign && signType ? signAspectTableRow(a, b, chart, signType) : null,
      modes.showDegree && degree ? degreeAspectTableRow(a, b, degree) : null,
    ].filter(Boolean);
  }

  function aspectTableRows(chart) {
    const rows = [];
    const keys = aspectTablePlanetKeys(chart);
    const modes = aspectDisplayModes(chart.input);
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        rows.push(...aspectRowsForPair(keys[i], keys[j], chart, modes));
      }
    }
    return rows;
  }

  function buildAspectTableModel(chart) {
    const rows = aspectTableRows(chart);
    if (!rows.length) return { emptyText: t("noAspects"), headers: [], rows: [] };
    return {
      emptyText: "",
      headers: aspectTableHeaders(),
      rows,
    };
  }

  function renderAspectTable(chart) {
    $("#tab-aspects").innerHTML = renderTableModelHtml(buildAspectTableModel(chart));
  }

  function polar(cx, cy, r, lon, asc) {
    const angle = (180 + norm180(lon - asc)) * DEG;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function wheelGeometry() {
    return {
      cx: 180,
      cy: 180,
      outer: 158,
      signR: 144,
      planetR: 110,
      aspectR: 82,
    };
  }

  function buildWheelHouseParts(chart, geometry) {
    const { cx, cy, outer, signR } = geometry;
    const lines = [];
    const labels = [];
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
    return { lines, labels };
  }

  function buildWheelAngleParts(chart, geometry) {
    const { cx, cy, outer } = geometry;
    const lines = [];
    const labels = [];
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
    return { lines, labels };
  }

  function buildWheelAspectParts(chart, geometry) {
    const { cx, cy, aspectR } = geometry;
    const aspects = [];
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
    return aspects;
  }

  function buildWheelPlanetLabels(chart, geometry) {
    const { cx, cy, planetR } = geometry;
    const labels = [];
    chart.planetKeys.forEach((key, index) => {
      const radius = planetR - (index % 3) * 9;
      const [x, y] = polar(cx, cy, radius, chart.positions[key].lon, chart.angles.asc);
      labels.push(`<text class="wheel-planet" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${PLANETS[key].symbol}</text>`);
    });
    return labels;
  }

  function buildWheelModel(chart) {
    const geometry = wheelGeometry();
    const houses = buildWheelHouseParts(chart, geometry);
    const angles = buildWheelAngleParts(chart, geometry);
    return {
      ...geometry,
      lines: [...houses.lines, ...angles.lines],
      labels: [...houses.labels, ...angles.labels, ...buildWheelPlanetLabels(chart, geometry)],
      aspects: buildWheelAspectParts(chart, geometry),
      sectLabel: state.lang === "es" ? (chart.isDay ? "DÍA" : "NOCHE") : (chart.isDay ? "DAY" : "NIGHT"),
    };
  }

  function renderWheelModel(model) {
    return `
      <svg viewBox="0 0 360 360" role="img" aria-label="Hellenistic chart wheel">
        <circle cx="${model.cx}" cy="${model.cy}" r="${model.outer}" fill="none" stroke="currentColor" opacity="0.16" stroke-width="1.4"></circle>
        <circle cx="${model.cx}" cy="${model.cy}" r="126" fill="none" stroke="currentColor" opacity="0.12"></circle>
        <circle cx="${model.cx}" cy="${model.cy}" r="92" fill="none" stroke="currentColor" opacity="0.14"></circle>
        <circle cx="${model.cx}" cy="${model.cy}" r="42" fill="none" stroke="currentColor" opacity="0.2"></circle>
        ${model.lines.join("")}
        ${model.aspects.join("")}
        ${model.labels.join("")}
        <text x="${model.cx}" y="${model.cy - 5}" text-anchor="middle" class="wheel-sign">Tyche</text>
        <text x="${model.cx}" y="${model.cy + 12}" text-anchor="middle" class="wheel-label">${model.sectLabel}</text>
      </svg>
    `;
  }

  function renderWheel(chart) {
    return renderWheelModel(buildWheelModel(chart));
  }

  function translateStaticNodes() {
    $$("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $$("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
  }

  function localizedPlaceStatePorts() {
    return {
      readPlaceValue: () => $("#birthPlace").value,
      findCity,
      writeSelectedCity: setSelectedCityState,
      formatCity,
      writePlaceValue: (value) => { $("#birthPlace").value = value; },
      updateClearButton: updateClearPlaceButton,
      hideSuggestions: hidePlaceSuggestions,
    };
  }

  function refreshLocalizedPlaceState(ports = localizedPlaceStatePorts()) {
    const city = ports.findCity(ports.readPlaceValue());
    if (city) {
      ports.writeSelectedCity(city);
      ports.writePlaceValue(ports.formatCity(city));
    }
    ports.updateClearButton();
    ports.hideSuggestions();
  }

  function localizedLastChartPorts() {
    return {
      readChart: () => state.lastChart,
      formatCity,
      renderContent: renderChartContent,
      finalizeText: finalizeRenderedChartText,
    };
  }

  function refreshLocalizedLastChart(ports = localizedLastChartPorts()) {
    const chart = ports.readChart();
    if (!chart) return;
    if (chart.input?.city) chart.input.place = ports.formatCity(chart.input.city);
    ports.renderContent(chart);
    ports.finalizeText();
  }

  function refreshLocalizedDynamicContent() {
    populateLists();
    refreshLocalizedPlaceState();
    renderHistoricalPeople();
    refreshLocalizedLastChart();
    updateOptionWarnings();
  }

  function applyDocumentI18n() {
    document.documentElement.lang = state.lang;
    document.title = state.lang === "es" ? "Tyche · Carta natal helenística" : "Tyche · Hellenistic Natal Chart";
    $("meta[name='description']")?.setAttribute(
      "content",
      state.lang === "es"
        ? "Tyche calcula cartas natales helenísticas con Ascendente, casas de signos enteros, secta, condición esencial y lotes, procesadas localmente en el navegador."
        : "Tyche calculates Hellenistic natal charts with the Hour-Marker, Whole Sign Houses, sect, essential condition, and lots, processed locally in the browser."
    );
  }

  function updateShellControlLabels() {
    $(".toolbar").setAttribute("aria-label", state.lang === "es" ? "Preferencias" : "Preferences");
    $("#chartWheel").setAttribute("aria-label", state.lang === "es" ? "Rueda de carta natal" : "Natal chart wheel");
    $(".tabs").setAttribute("aria-label", state.lang === "es" ? "Detalles de la carta" : "Chart details");
  }

  function updatePreferenceControlLabels() {
    $("#languageToggle span").textContent = state.lang.toUpperCase();
    $("#languageToggle").setAttribute("aria-label", state.lang === "es" ? "Cambiar idioma" : "Change language");
    $("#languageToggle").title = state.lang === "es" ? "Cambiar idioma" : "Change language";
    $("#themeToggle").setAttribute("aria-label", state.lang === "es" ? "Cambiar tema" : "Change theme");
    $("#themeToggle").title = state.lang === "es" ? "Cambiar tema" : "Change theme";
  }

  function updatePeopleControlLabels() {
    $("#peopleToggle").setAttribute("aria-label", t("peopleButton"));
    $("#peopleToggle").title = t("peopleButton");
    $("#peopleClose").setAttribute("aria-label", t("close"));
    $("#peopleClose").title = t("close");
  }

  function updatePlaceControlLabels() {
    $("#birthPlace").placeholder = state.lang === "es" ? "Madrid, España" : "Madrid, Spain";
    $("#clearPlace").setAttribute("aria-label", t("clearPlace"));
    $("#clearPlace").title = t("clearPlace");
  }

  function updateLocalizedControlLabels() {
    updateShellControlLabels();
    updatePreferenceControlLabels();
    updatePeopleControlLabels();
    updatePlaceControlLabels();
  }

  function applyI18n() {
    applyDocumentI18n();
    translateStaticNodes();
    updateLocalizedControlLabels();
    refreshLocalizedDynamicContent();
    decorateGlossaryTriggers();
  }

  function applyTheme() {
    document.body.classList.toggle("night", state.theme === "night");
    $("#themeToggle span").textContent = state.theme === "night" ? "☉" : "☾";
  }

  function populateLists() {
    $("#timezoneList").innerHTML = TIME_ZONES.map((zone) => `<option value="${escapeHtml(zone)}"></option>`).join("");
  }

  function placeFieldUpdatePorts() {
    return {
      readPlaceValue: () => $("#birthPlace").value,
      findCity,
      readActiveCityKey: () => state.activeCityKey,
      cityKey,
      applyCity: applyCityToFields,
      clearSelectedCity: () => setSelectedCityState(null),
    };
  }

  function updatePlaceFields(ports = placeFieldUpdatePorts()) {
    const city = ports.findCity(ports.readPlaceValue());
    if (!city) {
      ports.clearSelectedCity();
      return;
    }
    const nextCityKey = ports.cityKey(city);
    const cityChanged = ports.readActiveCityKey() !== nextCityKey;
    ports.applyCity(city, cityChanged);
  }

  function readOptionWarningFields() {
    return {
      calendar: $("#calendar").value,
      zodiac: $("#zodiac").value,
      techniqueMode: $("#techniqueMode").value,
      includeModern: $("#includeModern").checked,
    };
  }

  function optionWarningTexts() {
    return {
      mixed: t("mixedInlineWarning"),
      modernStrict: t("modernStrictInlineWarning"),
    };
  }

  function buildOptionWarningsModel(fields = readOptionWarningFields(), texts = optionWarningTexts()) {
    const strictWithModern = fields.techniqueMode === "strict" && fields.includeModern;
    return {
      calendarHidden: fields.calendar !== "julian",
      zodiacHidden: fields.zodiac !== "sidereal",
      technique: {
        text: strictWithModern ? texts.modernStrict : texts.mixed,
        test: strictWithModern ? "modern-strict-warning" : "modern-mixed-warning",
        hidden: fields.techniqueMode !== "mixed" && !fields.includeModern,
      },
    };
  }

  function applyOptionWarningsModel(model) {
    const calendarWarning = $("#calendarWarning");
    const zodiacWarning = $("#zodiacWarning");
    const techniqueWarning = $("#techniqueWarning");
    if (calendarWarning) calendarWarning.hidden = model.calendarHidden;
    if (zodiacWarning) zodiacWarning.hidden = model.zodiacHidden;
    if (techniqueWarning) {
      techniqueWarning.textContent = model.technique.text;
      techniqueWarning.dataset.test = model.technique.test;
      techniqueWarning.hidden = model.technique.hidden;
    }
  }

  function optionWarningPorts() {
    return {
      readFields: readOptionWarningFields,
      warningTexts: optionWarningTexts,
      applyModel: applyOptionWarningsModel,
    };
  }

  function updateOptionWarnings(ports = optionWarningPorts()) {
    ports.applyModel(buildOptionWarningsModel(ports.readFields(), ports.warningTexts()));
  }

  function activateTab(button) {
    $$(".tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab === button);
      tab.setAttribute("aria-selected", String(tab === button));
    });
    $$(".tab-panel").forEach((panel) => {
      panel.hidden = panel.id !== `tab-${button.dataset.tab}`;
    });
  }

  function bindTabs() {
    $$(".tab").forEach((button) => {
      button.addEventListener("click", () => activateTab(button));
    });
  }

  function nextLanguage(lang) {
    return lang === "es" ? "en" : "es";
  }

  function nextTheme(theme) {
    return theme === "night" ? "day" : "night";
  }

  function preferencePorts() {
    return {
      readLanguage: () => state.lang,
      writeLanguage: (lang) => { state.lang = lang; },
      readTheme: () => state.theme,
      writeTheme: (theme) => { state.theme = theme; },
      save: (key, value) => localStorage.setItem(key, value),
      applyLanguage: applyI18n,
      applyTheme,
    };
  }

  function toggleLanguagePreference(ports = preferencePorts()) {
    const lang = nextLanguage(ports.readLanguage());
    ports.writeLanguage(lang);
    ports.save("tyche-lang", lang);
    ports.applyLanguage();
  }

  function toggleThemePreference(ports = preferencePorts()) {
    const theme = nextTheme(ports.readTheme());
    ports.writeTheme(theme);
    ports.save("tyche-theme", theme);
    ports.applyTheme();
  }

  function handleLanguageToggle() {
    toggleLanguagePreference();
  }

  function handleThemeToggle() {
    toggleThemePreference();
  }

  function bindPreferenceEvents() {
    $("#languageToggle").addEventListener("click", handleLanguageToggle);
    $("#themeToggle").addEventListener("click", handleThemeToggle);
  }

  function handlePeopleModalBackdropClick(event) {
    if (event.target === $("#peopleModal")) closePeopleModal();
  }

  function handlePeopleGridClick(event) {
    const dataTrigger = event.target.closest("[data-person-source-id]");
    if (dataTrigger) {
      event.preventDefault();
      event.stopPropagation();
      openPersonData(dataTrigger.dataset.personSourceId, dataTrigger);
      return;
    }
    const button = event.target.closest("[data-person-id]");
    if (button) loadHistoricalPerson(button.dataset.personId);
  }

  function bindPeopleModalEvents() {
    $("#peopleToggle").addEventListener("click", openPeopleModal);
    $("#peopleClose").addEventListener("click", closePeopleModal);
    $("#peopleModal").addEventListener("click", handlePeopleModalBackdropClick);
    $("#peopleGrid").addEventListener("click", handlePeopleGridClick);
  }

  function handleDocumentPopoverClick(event) {
    const trigger = event.target.closest("[data-glossary]");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      openGlossary(trigger.dataset.glossary, trigger);
      return;
    }
    if (!event.target.closest("#glossaryPopover")) closeGlossary();
    if (!event.target.closest("#personDataPopover") && !event.target.closest("[data-person-source-id]")) closePersonData();
  }

  function handleDocumentPopoverKeydown(event) {
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
      if (!$("#personDataPopover").hidden) {
        closePersonData({ restoreFocus: true });
        return;
      }
      if (!$("#peopleModal").hidden) closePeopleModal();
    }
  }

  function handleGlossaryCloseClick() {
    closeGlossary({ restoreFocus: true });
  }

  function handlePersonDataCloseClick() {
    closePersonData({ restoreFocus: true });
  }

  function repositionFloatingPopovers() {
    positionGlossary(state.glossaryReturnFocus);
    positionPersonData(state.personDataReturnFocus);
  }

  function bindFloatingPopoverEvents() {
    document.addEventListener("click", handleDocumentPopoverClick);
    document.addEventListener("keydown", handleDocumentPopoverKeydown);
    $("#glossaryClose").addEventListener("click", handleGlossaryCloseClick);
    $("#personDataClose").addEventListener("click", handlePersonDataCloseClick);
    window.addEventListener("resize", repositionFloatingPopovers);
    window.addEventListener("scroll", repositionFloatingPopovers, true);
  }

  function handleBirthPlaceFocus(birthPlace) {
    if (state.selectedCity && normalizeText(birthPlace.value) === normalizeText(formatCity(state.selectedCity))) {
      birthPlace.select();
    }
    queuePlaceSearch();
  }

  function handleBirthPlaceInput() {
    clearHistoricalSelection();
    setSelectedCityState(null);
    queuePlaceSearch();
  }

  function handleBirthPlaceArrowDown(event) {
    event.preventDefault();
    if ($("#placeSuggestions").hidden) queuePlaceSearch();
    moveActivePlace(1);
  }

  function handleBirthPlaceArrowUp(event) {
    event.preventDefault();
    moveActivePlace(-1);
  }

  function handleBirthPlaceEnter(event) {
    if (!state.placeSuggestions.length) return;
    event.preventDefault();
    selectPlaceSuggestion(state.activePlaceIndex >= 0 ? state.activePlaceIndex : 0);
  }

  function handleBirthPlaceEscape() {
    hidePlaceSuggestions();
  }

  const BIRTH_PLACE_KEY_HANDLERS = Object.freeze({
    ArrowDown: handleBirthPlaceArrowDown,
    ArrowUp: handleBirthPlaceArrowUp,
    Enter: handleBirthPlaceEnter,
    Escape: handleBirthPlaceEscape,
  });

  function handleBirthPlaceKeydown(event) {
    BIRTH_PLACE_KEY_HANDLERS[event.key]?.(event);
  }

  function handleBirthPlaceBlur() {
    window.setTimeout(() => {
      updatePlaceFields();
      hidePlaceSuggestions();
    }, 120);
  }

  function clearBirthPlaceFieldValues(birthPlace) {
    birthPlace.value = "";
    $("#latitude").value = "";
    $("#longitude").value = "";
    $("#timeZone").value = "";
  }

  function birthPlaceClearPorts(birthPlace) {
    return {
      clearHistorical: clearHistoricalSelection,
      clearSelectedCity: () => setSelectedCityState(null),
      clearFields: () => clearBirthPlaceFieldValues(birthPlace),
      updateClearButton: updateClearPlaceButton,
      hideSuggestions: hidePlaceSuggestions,
      focus: () => birthPlace.focus(),
    };
  }

  function clearBirthPlaceFields(birthPlace, ports = birthPlaceClearPorts(birthPlace)) {
    ports.clearHistorical();
    ports.clearSelectedCity();
    ports.clearFields();
    ports.updateClearButton();
    ports.hideSuggestions();
    ports.focus();
  }

  function handlePlaceSuggestionClick(event) {
    const button = event.target.closest("[data-place-index]");
    if (button) selectPlaceSuggestion(Number(button.dataset.placeIndex));
  }

  function handlePlaceSuggestionMousedown(event) {
    event.preventDefault();
  }

  function handleDocumentPlacePointerdown(event) {
    if (!event.target.closest(".place-field")) hidePlaceSuggestions();
  }

  function bindBirthPlaceEvents() {
    const birthPlace = $("#birthPlace");
    birthPlace.addEventListener("focus", () => handleBirthPlaceFocus(birthPlace));
    birthPlace.addEventListener("input", handleBirthPlaceInput);
    birthPlace.addEventListener("keydown", handleBirthPlaceKeydown);
    birthPlace.addEventListener("blur", handleBirthPlaceBlur);
    $("#clearPlace").addEventListener("click", () => clearBirthPlaceFields(birthPlace));
    $("#placeSuggestions").addEventListener("mousedown", handlePlaceSuggestionMousedown);
    $("#placeSuggestions").addEventListener("click", handlePlaceSuggestionClick);
    document.addEventListener("pointerdown", handleDocumentPlacePointerdown);
  }

  function handleDateTimeFieldChange() {
    clearHistoricalSelection();
    updatePlaceFields();
  }

  function chartErrorMessage(error) {
    return error.message || String(error);
  }

  function renderChartError(message) {
    $("#formStatus").textContent = message;
  }

  function dispatchChartErrorEvent(message) {
    window.dispatchEvent(new CustomEvent("tyche:chart-error", {
      detail: { message },
    }));
  }

  function chartSubmitPorts() {
    return {
      calculate: calculateCurrentChart,
      errorMessage: chartErrorMessage,
      renderError: renderChartError,
      dispatchError: dispatchChartErrorEvent,
    };
  }

  function handleChartSubmitError(error, ports = chartSubmitPorts()) {
    const message = ports.errorMessage(error);
    ports.renderError(message);
    ports.dispatchError(message);
  }

  function submitChartForm(event, ports = chartSubmitPorts()) {
    event.preventDefault();
    try {
      ports.calculate();
    } catch (error) {
      handleChartSubmitError(error, ports);
    }
  }

  const OPTION_WARNING_FIELD_IDS = ["calendar", "zodiac", "techniqueMode", "includeModern"];

  function handleOptionWarningFieldChange() {
    updateOptionWarnings();
  }

  function bindBirthDataFieldEvents() {
    $("#birthDate").addEventListener("change", handleDateTimeFieldChange);
    $("#birthTime").addEventListener("change", handleDateTimeFieldChange);
    $("#gender").addEventListener("change", clearHistoricalSelection);
  }

  function bindOptionWarningEvents() {
    OPTION_WARNING_FIELD_IDS.forEach((id) => {
      $(`#${id}`).addEventListener("change", handleOptionWarningFieldChange);
    });
  }

  function bindFormEvents() {
    bindBirthDataFieldEvents();
    bindOptionWarningEvents();
    $("#chart-form").addEventListener("submit", submitChartForm);
  }

  function bindEvents() {
    bindPreferenceEvents();
    bindPeopleModalEvents();
    bindFloatingPopoverEvents();
    bindBirthPlaceEvents();
    bindFormEvents();
  }

  function defaultRegressionBirthInput() {
    return {
      date: "1980-01-01",
      time: "12:00",
      personName: "",
      gender: "",
    };
  }

  function defaultRegressionPlaceInput() {
    return {
      place: "Regression Test",
      city: null,
      latitude: 40.4168,
      longitude: -3.7038,
      timeZone: "Europe/Madrid",
      manualOffset: "+01:00",
      zoneSource: "",
      zoneReliability: "iana",
    };
  }

  function defaultRegressionTechniqueInput() {
    return {
      calendar: "gregorian",
      zodiac: "tropical",
      aspectMode: "both",
      orb: 3,
      techniqueMode: "strict",
      includeModern: false,
      selectedLots: [],
    };
  }

  function defaultRegressionInput() {
    return {
      ...defaultRegressionBirthInput(),
      ...defaultRegressionPlaceInput(),
      ...defaultRegressionTechniqueInput(),
    };
  }

  function buildRegressionCalculationApi(defaultInput) {
    return {
      calculateChart(overrides = {}) {
        return computeChart({ ...defaultInput, ...overrides });
      },
      boundaryWarnings,
      sectBoundaryThresholdInfo,
      sectSensitivityState,
      timeContextSensitivity,
      computeMoonCondition,
      scoreChartTopics,
      angleDistance,
      signOf,
      degreeInSign,
      houseFromSign,
      boundLordFor,
      solarPhaseState,
      visibleAngularPlanets,
      linearLunarAspectCandidates,
      lunarAspectCandidatesIterative,
      lunarAspectCandidates,
      VISIBLE_KEYS: [...VISIBLE_KEYS],
    };
  }

  function buildRegressionHistoricalApi() {
    return {
      historicalAuditRecords,
    };
  }

  function buildRegressionSectLotApi() {
    return {
      lotSnapshotForSect,
      lotTestimonyItems,
      lotTestimonyLevel,
      lotConditionReading,
      lotByKey,
      lotFormulaText,
    };
  }

  function buildRegressionRenderApi() {
    return {
      renderBoundaryAudit,
      renderAlternateSectLots,
      renderMainLotsAudit,
    };
  }

  function buildRegressionJudgmentApi() {
    return {
      dignityFor,
      dignityGroups,
      receptionBetween,
      receptionByBoundOnly,
      adjustIntensityForReception,
      interpretChart,
      maleficMitigationReading,
      planetRelationJudgment,
    };
  }

  function buildRegressionTestApi(defaultInput) {
    return Object.freeze({
      schemaVersion: TYCHE_TEST_SCHEMA_VERSION,
      buildHash: TYCHE_BUILD_HASH,
      ...buildRegressionCalculationApi(defaultInput),
      ...buildRegressionHistoricalApi(),
      ...buildRegressionSectLotApi(),
      ...buildRegressionRenderApi(),
      ...buildRegressionJudgmentApi(),
    });
  }

  function installTestApi() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("test") !== "regression") return;
    window.TycheTest = buildRegressionTestApi(defaultRegressionInput());
    console.info("Tyche regression test API enabled.");
  }

  function appStartupPorts() {
    return {
      populateLists,
      applyTheme,
      applyI18n,
      bindTabs,
      bindEvents,
      installTestApi,
      markReady: () => { window.__TYCHE_READY__ = true; },
    };
  }

  function init(ports = appStartupPorts()) {
    ports.populateLists();
    ports.applyTheme();
    ports.applyI18n();
    ports.bindTabs();
    ports.bindEvents();
    ports.installTestApi();
    ports.markReady();
  }

  init();
})();
