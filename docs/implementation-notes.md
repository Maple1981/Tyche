# Implementation Notes

## Static Architecture

The project is intentionally small:

- `index.html` for structure.
- `styles.css` for responsive visual design.
- `app.js` for calculations, translations, rendering, and UI state.
- `assets/fonts` for local font files.
- `assets/vendor/astronomy.browser.min.js` for local ephemeris calculations.
- `docs` for synthesized domain notes.

No backend, bundler, package manager, or build pipeline is required.

## Internal Application Layers

Because Tyche is a static browser app, architecture should improve separation inside the existing files before introducing new loading mechanics. Prefer small internal boundaries that keep the runtime simple:

- Domain/calculation helpers: pure chart math, dignities, lots, sect, lunar condition, boundaries, and testimony scoring.
- Use-case builders: functions that collect chart context and produce interpretation models, evidence, hierarchy, qualities, and blocks.
- Renderers: functions that turn prepared view models into HTML.
- UI shell: form state, event binding, tabs, modals, language/theme toggles, and persistence.

For chart calculation, `computeChart()` should stay an orchestration function. Input validation, position calculation, house/condition enrichment, lot construction, and sect context should remain in dedicated helpers so later changes to one rule do not require editing the whole chart builder.

Current chart calculation from the form should keep UI preparation, chart construction, and rendering as separate steps. `calculateCurrentChart()` should coordinate those calls rather than reading fields, clearing UI state, and rendering panels directly.

Date/time conversion should keep validation, manual UTC offset handling, Julian-calendar conversion, IANA time-zone conversion, and manual fallback in separate helpers. `jdFromForm()` should coordinate those paths and return the final Julian Date, offset, and displayed zone label.

Lunar condition should keep the contact scan separate from the final condition object. The scan owns last separation, next application, sign-exit application, and close applying contact; `computeMoonCondition()` should assemble phase, void flags, and summary fields from that scan.

For the natal interpretation panel, `interpretChart()` should remain an orchestrator. It should collect a context, call dedicated builders for summary, evidence, hierarchy, qualities, and reading blocks, and return a view model. It should not render HTML directly or own all prose-building responsibility in one long function.

Topic scoring should keep score-row setup, score mutation, accumulator creation, testimony families, and final sorting in helpers. New scoring rules should avoid reimplementing the house row shape or direct mutation details inline.

For chart rendering, keep frame setup, panel rendering, and completion side effects separate: the shell prepares title/meta/wheel, the panel renderer owns panel order, and the completion step handles capitalization, scrolling, and chart-rendered events.

The chart frame itself should use a small model for title, metadata, and wheel HTML before touching DOM nodes. This keeps shell rendering consistent with panel rendering.

Where a renderer needs calculated or audited data, prefer a small view model builder before HTML generation. For example, the main lots audit should build row/field data first, then render that model. Boundary audits should translate neutral warning codes into labeled fields before the renderer writes definition-list markup. Score breakdowns should likewise group and label score data before rendering HTML. Historical example cards should prepare natal-source, audit-status, localized label, and group data before the card renderer writes markup. This keeps testimony extraction and provenance handling separate from HTML details.

Boundary warning calculation should stay split by testimony family. Sect, Ascendant sign, MC/IC sign, lot sign, and Egyptian-bound proximity warnings should live in dedicated detector helpers, with `boundaryWarnings()` only concatenating their neutral notices.

Historical example loading should also keep responsibilities apart: update selection/audit state, build form-field values, apply those values to the DOM, then calculate the chart. Do not hide all of that work inside one click handler.

Sect-sensitive alternate lot displays should follow the same model-first rule. Build current/alternate role text and Fortune/Spirit snapshots first, then render the disclosure block.

Large panel renderers should be decomposed into subrenderers for their stable regions. The interpretation panel is the reference pattern: heading, lead, summary, hierarchy, reading blocks, evidence, and timing note are separate rendering functions.

Top chart panels should also prefer view models where labels and values are prepared before rendering. The core summary, angle panel, Ascendant lord panel, Moon panel, and technical notes panel should stay as small model builders plus focused renderers rather than large mixed UI functions.

Table panels should keep row construction separate from final DOM assignment. Use dedicated table models, plus header/row builders for planet, house, lot, and aspect tables, so calculation changes and markup changes remain independent. When a table can split into sections, such as traditional and modern planets, build a section model before rendering.

SVG renderers should follow the same rule. The chart wheel should build a geometry/parts model for houses, angles, aspects, and planets before composing the final SVG shell.

UI event binding should stay grouped by responsibility. Keep preference toggles, historical-people modal behavior, floating popovers, birthplace search, and form/options submission in separate binding functions, with `bindEvents()` acting only as an orchestration point.

Within each binding group, prefer named handlers for non-trivial behavior. Tab activation, preference toggles, modal clicks, popover document interactions, birthplace keyboard navigation, clearing place fields, date/time changes, and chart-form submission should live in named functions so event binding remains easy to scan.

Language switching should separate document metadata, static node translation, localized control labels, and dynamic content refresh. `applyI18n()` should coordinate those steps and then redecorate glossary triggers after translated content is in place.

Floating popovers should resolve a small model before writing DOM. Glossary entries, person-data details, and similar overlays should keep lookup/formatting separate from the code that opens and positions the popover; historical source popovers should expose that split through dedicated model and render helpers.

Search/autocomplete surfaces should keep URL construction, response parsing, result merging, row-model preparation, and DOM writes separate. Birthplace suggestions should build row models with localized labels and metadata, then render those rows through dedicated suggestion renderers.

Birthplace selection should also keep field modeling separate from DOM mutation. Build the place/coordinate/time-zone field model and calculate automatic UTC-offset updates through helper functions before applying the result to form controls.

Form input reading should normalize coherent groups before chart calculation. Keep place/zone fields and technique/options fields in dedicated readers, with `readInput()` acting as the single chart-input assembler.

Inline option warnings should build a small visibility/text model first, then apply it to DOM nodes. This keeps option state rules testable without depending on translated prose in event handlers.

Regression-only APIs should be built through dedicated helpers. Keep the default regression input and the exposed `window.TycheTest` helper map separate from the installer that checks `?test=regression`.

When extracting architecture, keep changes incremental and covered by static contracts. Do not add a module loader, bundler, framework, backend, or runtime dependency unless the project deliberately changes its static-app constraint.

## Astronomical Precision

The browser engine uses vendored Astronomy Engine 2.1.19 for Sun, Moon, and planetary positions. It is MIT-licensed, runs locally in the browser, and declares approximate +/-1 arcminute accuracy. This is a major improvement over the previous compact orbital fallback, but still not a replacement for professional ephemerides in critical work.

`app.js` keeps the older compact formulas as a fallback in case the local vendor file fails to load. Normal production calculations should use Astronomy Engine.

Risk areas:

- Ancient dates and calendar conversions are not fully supported.
- Time zone accuracy depends on browser IANA data or manual offset.
- Place lookup is limited to the embedded gazetteer unless coordinates are entered manually.
- Manual offsets for historical examples must be treated as source-specific historical data, not as guaranteed civil time-zone records.

## Supported Defaults

Defaults should remain:

- Tropical zodiac.
- Whole Sign Houses.
- Sign-based aspects.
- Seven visible planets.
- Egyptian bounds.
- Traditional Hellenistic mode, internally equivalent to strict Hellenistic mode.

## Privacy

The app does not send birth date, time, or chart data anywhere. Chart and ephemeris calculations are performed in the browser.

Place search may contact an external geocoding service with the typed place query in order to obtain coordinates. Historical example portraits load from Wikimedia Commons. Language and theme preferences are kept in localStorage on the user's device. Do not describe the whole app as completely anonymous.

No personal examples, private data, source attachments, OCR dumps, or spreadsheets should be committed.

## Public Transcript Handling

Podcast transcripts are treated as review aids, not repository content. Keep only paraphrased doctrine, implementation rules, and public URLs in `docs/public-transcript-synthesis.md`.

The priority transcript list in that file is the first pass for interpretation changes: basic reading order, Whole Sign Houses, place meanings, sect, essential condition, mitigation/reception, solar phase, Fortune/Spirit, and future annual profections. Secondary transcript material can enrich the docs, but should not override the priority layer unless the calculation or interpretation rules are updated explicitly.

## Historical Examples

The historical figure modal should only include public figures whose birth date, clock time, birthplace, and sex are documented with enough precision for an example chart.

When using rated birth-data collections, prefer AA/A/B-level records. Leave out C, DD, X, rectified, speculative, or time-unknown records unless the user explicitly approves them.

The current historical archive is externally audited as of 2026-06-10. Keep the enforceable per-person audit metadata in `HISTORICAL_AUDIT_ROWS`, not as scattered prose. A new character must update both `HISTORICAL_PEOPLE` and `HISTORICAL_AUDIT_ROWS`; the static contract test should fail if those lists drift apart.

Prefer Gregorian examples from periods and jurisdictions after calendar reform. If a future example uses a Julian-calendar birth date, the entry must store that calendar explicitly and its visible label must make the calendar clear. Do not silently convert between Julian and Gregorian dates.

Each historical example should carry coordinates and a deliberate time offset or IANA time zone so selecting it produces a reproducible chart.

Each visible person card may display a source line and, when audited, a birth-data rating or time-source note. Do not invent or infer ratings. If a rating or exact time source has not been checked, leave the rating field empty rather than implying documentary certainty.

If a future historical example has not yet been individually audited for Rodden rating or time-source wording, the UI should say so explicitly and the character should not be merged into the public archive unless that pending status was deliberately approved. A visible pending-audit note is preferable to silent omission or a guessed rating.

The person card itself should also show a visible pending-audit badge when source, rating, or time-source metadata is missing, so audited and non-audited examples are not visually indistinguishable.

Keep natal-data provenance separate from interpretive-reference provenance. `dataSource` should identify the source of the birth data, while an optional Brennan/source-reference field may record whether the chart was treated in a secondary interpretive source. Do not imply that a chart example source is the source of the recorded birth time unless that has been checked directly.

If a historical example lacks an audited individual source label, the fallback should say that the source is pending individual audit. Do not use a generic combined source label in a way that implies the person's exact birth time has already been verified against every named source.
