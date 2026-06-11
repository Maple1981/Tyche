const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const app = read("app.js");
const index = read("index.html");
const regression = read("tests/regression.html");
const browserRunner = read("tests/browser-regression-runner.js");
const docs = fs
  .readdirSync(path.join(root, "docs"))
  .filter((name) => name.endsWith(".md"))
  .map((name) => [name, read(path.join("docs", name))]);

const failures = [];
function assert(label, condition) {
  if (!condition) failures.push(label);
}

function sectionBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) return "";
  return source.slice(startIndex, endIndex);
}

const historicalBlock = sectionBetween(app, "const HISTORICAL_PEOPLE = [", "\n  ];\n\n  // Every current historical example");
const personCount = (historicalBlock.match(/\n    \{\n      id:/g) || []).length;
const historicalIds = [...historicalBlock.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
const auditRowsBlock = sectionBetween(app, "const HISTORICAL_AUDIT_ROWS = Object.freeze([", "\n  ]);\n\n  const HISTORICAL_AUDIT");
const auditIds = [...auditRowsBlock.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
const completeAuditRows = [...auditRowsBlock.matchAll(/\{ id: "[^"]+", rating: "(AA|A|B)", source: "[^"]+", url: "https:\/\/www\.astro\.com\/astro-databank\/[^"]+", zoneReliability: "(iana|manual|lmt|historical|unknown)"/g)];
const glossaryKeys = [...index.matchAll(/data-glossary="([^"]+)"/g)].map((match) => match[1]);
const uniqueGlossaryKeys = [...new Set(glossaryKeys)];

assert("index loads Astronomy Engine before app.js", index.indexOf("assets/vendor/astronomy.browser.min.js") < index.indexOf("app.js"));
assert("index propagates cache-buster to versioned assets", index.includes("styles.css${suffix}") && index.includes("astronomy.browser.min.js${suffix}") && index.includes("app.js${suffix}"));
assert("TycheTest schema version exists", app.includes("const TYCHE_TEST_SCHEMA_VERSION = 2"));
assert("TycheTest build hash exists", app.includes("const TYCHE_BUILD_HASH"));
assert("TycheTest exposes schemaVersion", app.includes("schemaVersion: TYCHE_TEST_SCHEMA_VERSION"));
assert("TycheTest exposes buildHash", app.includes("buildHash: TYCHE_BUILD_HASH"));
assert("TycheTest exposes alternate sect renderer", app.includes("renderAlternateSectLots"));
assert("TycheTest exposes historical audit records", app.includes("historicalAuditRecords"));
assert("TycheTest exposes angular distance helper", app.includes("angleDistance"));
assert("TycheTest exposes linear lunar helper", app.includes("linearLunarAspectCandidates"));
assert("TycheTest exposes visible angular helper", app.includes("visibleAngularPlanets"));
assert("Browser regression runner starts a temporary server", browserRunner.includes("createServer") && browserRunner.includes("__TYCHE_REGRESSION_DONE__"));
assert("Regression page emits completion state", regression.includes("__TYCHE_REGRESSION_DONE__") && regression.includes("tyche:regression-complete"));
assert("Regression iframe is assigned after listeners", regression.includes('<iframe id="appFrame"></iframe>') && regression.indexOf("frame.addEventListener") < regression.indexOf("frame.src ="));
assert("Regression iframe propagates cache-buster", regression.includes("test=regression&v=") && regression.includes("sameBuild(testApi.buildHash, version)"));
assert("Regression page shows final build and schema summary", regression.includes('id="summary"') && regression.includes("Resultado:") && regression.includes("Build cargado") && regression.includes("Build esperado") && regression.includes("schemaVersion: loadedSchemaVersion"));
assert("Historical cards expose natal data popover", index.includes("personDataPopover") && app.includes("data-person-source-id") && app.includes("openPersonData"));
assert("Historical visible card omits repeated quality rows", !sectionBetween(app, "function historicalPersonCard(person)", "function renderHistoricalPeople").includes("historicalQualityRows(person)"));
assert("Historical Wikipedia links follow active UI language", app.includes("function localizeWikipediaUrl") && sectionBetween(app, "function personWikipediaUrl(person)", "function capitalizeText").includes("localizeWikipediaUrl") && regression.includes("Wikipedia historica usa enlace ingles en interfaz EN"));
assert("Sect and angle panels are separated", index.includes('id="anglesPanel"') && app.includes("function renderAnglesPanel") && !sectionBetween(app, "function renderCoreSummary(chart)", "function renderAnglesPanel(chart)").includes('t("ascendant")'));
assert("Ascendant and descendant display whole-sign houses", sectionBetween(app, "function renderAnglesPanel(chart)", "function renderAscLord(chart)").includes('t("tableHouse")} 1') && sectionBetween(app, "function renderAnglesPanel(chart)", "function renderAscLord(chart)").includes('t("tableHouse")} 7'));
const ascLordRenderBlock = sectionBetween(app, "function renderAscLord(chart)", "function renderMoon(chart)");
assert("Ascendant lord condition labels use specific glossary keys", ["dignityMajor", "dignityTriplicity", "dignityMinor", "dignityAdministration", "weaknesses"].every((key) => ascLordRenderBlock.includes(`\"${key}\"`)) && !ascLordRenderBlock.includes('\"essentialCondition\"'));
assert("Specific dignity glossary entries exist", ["dignityMajor", "dignityTriplicity", "dignityMinor", "dignityAdministration", "weaknesses"].every((key) => app.includes(`${key}: {`)));
const moonRenderBlock = sectionBetween(app, "function renderMoon(chart)", "function renderTechnicalPanel(chart)");
const moonGlossaryKeys = ["moonStatus", "moonPhase", "moonElongation", "moonLastSeparation", "moonNextApplication", "moonVoc30", "moonVocSign", "moonNoApplyingWithinOrb"];
assert("Lunar condition labels use specific glossary keys", moonGlossaryKeys.every((key) => moonRenderBlock.includes(`\"${key}\"`)) && !moonRenderBlock.includes('\"applications\"') && !moonRenderBlock.includes('\"moonVoc\"'));
assert("Specific lunar glossary entries exist", moonGlossaryKeys.every((key) => app.includes(`${key}: {`)));
assert("Lunar panel starts with a status summary", app.includes("function moonStatusText") && moonRenderBlock.includes('t("moonStatus")') && moonRenderBlock.includes("moonStatusText(chart)"));
assert("Dominant focus sentence avoids double colon before house topics", app.includes("La carta pone mucho peso en la casa ${dominant.house}. ${capitalizeText(houseReadingTopics(dominant.house, \"double\"))}") && !app.includes("La carta pone mucho peso en la casa ${dominant.house}: ${houseReadingTopics"));
const renderChartBlock = sectionBetween(app, "function renderChart(chart)", "function calculateCurrentChart()");
assert("Technical notes and limits sit after chart tables", index.indexOf('id="tab-aspects"') < index.indexOf('id="technicalPanel"') && app.includes("technicalLimitsCompact") && app.includes("technical-notes") && renderChartBlock.indexOf("renderAspectTable(chart)") < renderChartBlock.indexOf("renderTechnicalPanel(chart)"));
assert("Technical notes use semantic summary heading", app.includes('<summary><h3>${escapeHtml(t("technicalTitle"))}</h3></summary>') && !sectionBetween(app, "function renderTechnicalPanel(chart)", "function planetLabel(key)").includes("technicalUsePrivacyCompact"));
assert("Chart header omits unused sex metadata", app.includes('chartMeta: "Fecha: {date} · Hora: {time} · Lugar de nacimiento: {place}"') && app.includes('chartMeta: "Date: {date} · Time: {time} · Birthplace: {place}"') && !app.includes("Sexo: {sex}") && !app.includes("Sex: {sex}"));
assert("First house plain topics stay physical and bilingual", app.includes('1: "cuerpo, salud, apariencia, constitución y presencia personal"') && app.includes('1: "body, health, appearance, constitution, and personal presence"'));
assert("Life direction language stays formal", app.includes('lifeDirectionTitle: "Dirección vital"') && app.includes('lifeDirectionTitle: "Life Direction"') && !app.includes("Hacia dónde tira la carta") && !app.includes("Where the chart pulls"));
assert("Structured lists and definitions are normalized to initial caps", app.includes("function capitalizeStructuredText") && app.includes("\"dl dt, dl dd, ul li, ol li\"") && app.includes("capitalizeStructuredText($(\"#results\"))"));
assert("Boundary audit list labels are capitalized before rendering", sectionBetween(app, "function boundaryChangeLabels(warning)", "function boundaryWarningText").includes("capitalizeText"));
const boundaryRenderBlock = sectionBetween(app, "function renderBoundaryAudit(warnings)", "function lotByKey(chart, key)");
assert("Boundary audit renders scan-friendly definition cards", boundaryRenderBlock.includes("fieldLabels") && boundaryRenderBlock.includes("<dl>") && boundaryRenderBlock.includes('data-test="boundary-warning"'));
assert("Zone used display omits source suffix", app.includes("const manualZoneLabel = `UTC${formatOffset(manualOffset)}`") && !app.includes("const manualZoneLabel = `UTC${formatOffset(manualOffset)} ·"));
assert("Zone used help explains historical source", app.includes("datos natales auditados del personaje") && regression.includes("Ayuda de Zona usada explica procedencia historica"));

assert("parseDate BCE support is explicit opt-in", app.includes("function parseDate(value, { allowBce = false } = {})") && app.includes("allowBce ? /^(-?\\d{1,6})-"));
assert("BCE limitation is documented", docs.some(([, content]) => content.includes("BCE dates are blocked")));
assert("Year zero is covered by regression tests", regression.includes("0000-01-01") && regression.includes("fechas BCE ambiguas"));

const boundaryWarningsBlock = sectionBetween(app, "function boundaryWarnings(chart)", "const BOUNDARY_CHANGE_LABEL_KEYS");
assert("Boundary warnings carry neutral typeCode", boundaryWarningsBlock.includes("typeCode"));
assert("Boundary warnings carry changeCodes", boundaryWarningsBlock.includes("changeCodes"));
assert("Boundary warnings carry actionCode", boundaryWarningsBlock.includes("actionCode"));
assert("Boundary warning calculation does not translate copy", !boundaryWarningsBlock.includes("state.lang"));
assert("MC/IC warnings carry boundarySideCode", app.includes("boundarySideCode"));
assert("Score items carry reasonCode", app.includes("reasonCode: reasonCode || category"));
assert("Score focus type can show mixed categories", app.includes("value / total >= 0.3") && app.includes("naturalList([...new Set(labels)])"));
assert("10th-house ruler contributes a public focus signal", app.includes("tenth-ruler:"));
assert("Focus evidence uses house rulers", app.includes("function focusRulerEvidence") && app.includes("An empty house remains active through its ruler"));
assert("Mercury solar phase qualifier is explicit", app.includes("function mercuryPhaseQualifier") && app.includes("common and variable nature"));
assert("Technical evidence sections have stable hooks", app.includes('data-test="evidence-score"') && app.includes('data-test="evidence-main-lots"') && app.includes('data-test="evidence-general"'));
assert("Main lots expose direct administration hook", app.includes("lotAuditDirectAdministration") && app.includes("direct-administration") && app.includes("lot-direct-administration"));
assert("Lot pressure audit preserves raw and regulated pressure", app.includes("function lotPressureAuditText") && app.includes("function lotPressureAuditHtml") && app.includes("lot-pressure-lines") && app.includes("Presión bruta") && app.includes("Raw pressure"));
assert("Sensitive sect judgment notice is visible", app.includes("sectLowConfidenceJudgment") && app.includes("sectConfidenceNotice"));
assert("Sensitive sect card names the lower-confidence testimonies", app.includes("sectDependencyCaution") && app.includes("sectDependencyCaution(chart)"));
assert("Modern planets are blocked from judgment helpers", app.includes("!VISIBLE_KEYS.includes(target) || !VISIBLE_KEYS.includes(actor)") && app.includes(".filter((key) => VISIBLE_KEYS.includes(key))"));
const planetRenderBlock = sectionBetween(app, "function renderPlanetTable(chart)", "function renderHouseTable(chart)");
assert("Modern planets are visually separated from traditional visible planets", planetRenderBlock.includes("traditional-planets-section") && planetRenderBlock.includes("modern-planets-section") && app.includes("traditionalPlanetsTitle") && app.includes("modernPlanetsTitle"));

assert("Historical archive has substantial example coverage", personCount >= 35);
assert("Historical archive is fully externally audited", personCount === auditIds.length && historicalIds.every((id) => auditIds.includes(id)));
assert("Historical audit rows include required external-source fields", completeAuditRows.length === auditIds.length);
assert("Historical normalized audit metadata includes ISO audit date and time source", app.includes('externalAuditDate: "2026-06-10"') && app.includes("timeSource: {") && app.includes("Astro-Databank Source Notes"));
assert("Historical time confidence is normalized", app.includes("function historicalTimeConfidence"));
assert("Historical zone reliability is normalized", app.includes("function historicalZoneReliability"));
assert("Historical natal source is separated from interpretive references", app.includes("function historicalNatalSource") && app.includes("function historicalInterpretiveReferences"));
assert("Historical audited status is explicit-only", !app.includes("person.roddenRating && person.dataSource && person.timeSource"));
const personAuditStatusBlock = sectionBetween(app, "function personAuditStatus(person)", "function historicalTimeConfidence");
assert("Audit status does not infer status from normalized natal source", !personAuditStatusBlock.includes("historicalNatalSource(person)"));
assert("Audit status uses external audit metadata", personAuditStatusBlock.includes("audit.auditStatus"));
assert("Missing explicit historical audit status stays pending", personAuditStatusBlock.includes('return "pending"') && !personAuditStatusBlock.includes('return "partial"'));
assert("Interpretive references do not drive audit status", !personAuditStatusBlock.includes("brennanReference") && !personAuditStatusBlock.includes("interpretiveReferences"));
assert("Historical audit records expose source separation", app.includes("hasNatalSource") && app.includes("hasInterpretiveReference") && app.includes("externalAuditDate"));

assert("Judgment codebook documents reasonCode", read("docs/judgment-codebook.md").includes("Score Reason Codes"));
assert("Judgment codebook documents timeConfidence meanings", read("docs/judgment-codebook.md").includes("reported") && read("docs/judgment-codebook.md").includes("sensitive near the horizon"));
assert("Judgment factor matrix exists", read("docs/judgment-factor-matrix.md").includes("Judgment Factor Matrix"));
assert("Transcript-derived interpretation refinements are documented", read("docs/public-transcript-synthesis.md").includes("10th-place ruler") && read("docs/judgment-factor-matrix.md").includes("Mercury morning/evening phase"));
assert("Precision limits doc exists", read("docs/precision-limits.md").includes("Precision and Reliability Limits"));
assert("Historical audit doc exists", read("docs/historical-data-audit.md").includes("Normalized Reliability"));
assert("Historical audit doc states strict public archive policy", read("docs/historical-data-audit.md").includes("strict production policy") && read("docs/historical-data-audit.md").includes("audited records only"));
assert("Historical character audit doc prepares future additions", read("docs/historical-character-audit.md").includes("Future Addition Checklist"));
assert("Glossary coverage doc exists", read("docs/glossary-coverage.md").includes("Required Coverage"));
assert("Future techniques roadmap exists", read("docs/future-techniques-roadmap.md").includes("Future Techniques Roadmap"));
assert("Glossary coverage has human audit checklist", read("docs/glossary-coverage.md").includes("Human Audit Checklist"));
assert("Historical audit docs separate natal and interpretive sources", read("docs/historical-data-audit.md").includes("Natal-data source and interpretive-reference source are separate"));

assert("Docs no longer say Fortune and Spirit only when selected", !docs.some(([, content]) => /Fortune and Spirit,\s*when selected/i.test(content)));

uniqueGlossaryKeys.forEach((key) => {
  const pattern = new RegExp(`\\b${key}: \\{`);
  assert(`Glossary key ${key} is defined`, pattern.test(app));
});

if (failures.length) {
  console.error("Static contract tests failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Static contract tests passed (${personCount} historical examples, ${uniqueGlossaryKeys.length} glossary keys).`);
