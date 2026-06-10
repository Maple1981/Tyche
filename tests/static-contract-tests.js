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
assert("TycheTest schema version exists", app.includes("const TYCHE_TEST_SCHEMA_VERSION = 2"));
assert("TycheTest exposes schemaVersion", app.includes("schemaVersion: TYCHE_TEST_SCHEMA_VERSION"));
assert("TycheTest exposes alternate sect renderer", app.includes("renderAlternateSectLots"));
assert("TycheTest exposes historical audit records", app.includes("historicalAuditRecords"));
assert("TycheTest exposes angular distance helper", app.includes("angleDistance"));
assert("TycheTest exposes linear lunar helper", app.includes("linearLunarAspectCandidates"));
assert("Browser regression runner starts a temporary server", browserRunner.includes("createServer") && browserRunner.includes("__TYCHE_REGRESSION_DONE__"));
assert("Regression page emits completion state", regression.includes("__TYCHE_REGRESSION_DONE__") && regression.includes("tyche:regression-complete"));

assert("parseDate does not accept negative years", /function parseDate\(value\) \{\s+const match = \/\^\(\\d\{1,6\}\)-/.test(app));
assert("BCE limitation is documented", docs.some(([, content]) => content.includes("BCE dates are blocked")));
assert("Year zero is covered by regression tests", regression.includes("0000-01-01") && regression.includes("fechas BCE ambiguas"));

assert("Boundary warnings carry changeCodes", app.includes("changeCodes: []"));
assert("Boundary warnings carry actionCode", app.includes("actionCode: \"\""));
assert("MC/IC warnings carry boundarySideCode", app.includes("boundarySideCode"));
assert("Score items carry reasonCode", app.includes("reasonCode: reasonCode || category"));
assert("10th-house ruler contributes a public focus signal", app.includes("tenth-ruler:"));
assert("Focus evidence uses house rulers", app.includes("function focusRulerEvidence") && app.includes("An empty house remains active through its ruler"));
assert("Mercury solar phase qualifier is explicit", app.includes("function mercuryPhaseQualifier") && app.includes("common and variable nature"));
assert("Technical evidence sections have stable hooks", app.includes('data-test="evidence-score"') && app.includes('data-test="evidence-main-lots"') && app.includes('data-test="evidence-general"'));

assert("Historical archive has substantial example coverage", personCount >= 35);
assert("Historical archive is fully externally audited", personCount === auditIds.length && historicalIds.every((id) => auditIds.includes(id)));
assert("Historical audit rows include required external-source fields", completeAuditRows.length === auditIds.length);
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
