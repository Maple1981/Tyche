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

Current chart calculation from the form should keep UI preparation, chart construction, warnings, and rendering as separate steps. `calculateCurrentChart()` should coordinate those calls rather than reading fields, clearing UI state, and rendering panels directly. Input warnings that write to `#formStatus` belong to the form use case, not to `computeChart()`, and should use shared DOM writer helpers. The current-chart use case should expose a small ports object for input reading, chart computation, warning construction, warning rendering, and chart rendering so tests and future UI flows can inject dependencies without touching calculation code.

Date/time conversion should keep validation, manual UTC offset handling, Julian-calendar conversion, IANA time-zone conversion, and manual fallback in separate helpers. `jdFromForm()` should coordinate those paths and return the final Julian Date, offset, and displayed zone label.

Date/time conversion helpers should not write DOM status. If IANA time-zone conversion fails and the manual offset fallback is used, return a structured warning code and let the chart-calculation renderer display it.

Lunar condition should keep the contact scan separate from the final condition object. The scan owns last separation, next application, sign-exit application, and close applying contact; `computeMoonCondition()` should assemble phase, void flags, and summary fields from that scan. Candidate generation, nearest-past/future selection, and within-orb contact classification should remain separate helpers inside the scan layer.

Lunar judgment prose should keep contact fallback labels, next-contact role, sign-exit void judgment, close-orb application, and the 30-degree void rule in separate helpers. This keeps both lunar void criteria explicit in the visible reading.

The final lunar visible reading should build a profile from those lunar fragments before composing the localized paragraph.

For the natal interpretation panel, `interpretChart()` should remain an orchestrator. It should collect a context, call dedicated builders for summary, evidence, hierarchy, qualities, and reading blocks, and return a view model. It should not render HTML directly or own all prose-building responsibility in one long function.

The natal reading context should be composed from focused context builders: anchors, topic focus, sect actors, prominence/evidence, lots, and derived reading fragments. Keep `createNatalReadingContext()` as a merger of those pieces so future interpretive factors can be added without turning context assembly into a hidden use case.

Visible natal reading sections should be built through one helper per section and collected through an ordered builder list. Adding or reordering a section should not require editing every block object in one large array.

The prose inside each visible section should also be assembled from focused fragment helpers. Life direction, support, tension, and lots should each separate intro/topic/condition or management fragments before joining the final paragraph.

Natal reading hierarchy and summary qualities should follow the same ordered-builder pattern. Each priority line or quality badge should have one helper, with the public builder only mapping and filtering those helpers.

The natal reading summary should keep dominant focus, secondary focus, and Ascendant-lord guidance in separate text helpers before joining them with any sect-confidence notice.

Natal reading evidence should be assembled from testimony-family helpers: focus/Ascendant, sect, public prominence, reception/boundaries, lots, solar phase, Moon, and triplicity support. New evidence should enter through the smallest relevant family helper rather than extending one monolithic evidence array.

Reception and boundary evidence should keep fallback reception text and boundary-notice formatting in separate helpers before joining the evidence family.

Complex interpretive judgments should keep testimony extraction, level/flag decisions, and localized prose separate. The malefic-mitigation reading is the reference pattern: collect factors, derive mitigation flags and level, then choose copy from that level.

High-level visible readings should expose profile helpers before final prose. Lead focus, life direction, solar phase, triplicity foundations, and lot testimony summaries should calculate their interpretive profile separately from the localized sentence.

Visible conclusions should use the same profile/text split when they contain branching judgment. Visibility, lots, and Moon conclusions should expose a profile helper and a final localized text helper.

Visibility readings should share one key-planet solar item builder between the visible reading and the conclusion, then select and verbalize the profile separately.

Essential-condition readings should keep dignity labels, judgment profile, and localized prose separate. This prevents changes to dignity grouping from being tangled with the final interpretive wording.

Stable plain-language maps for house topics, sign style, angularity wording, planet meanings, lot meanings, lunar fallback labels, and mitigation copy should live as shared data constants. Lookup functions should format from those constants rather than rebuilding text maps on every call.

Public-projection conclusions should keep score calculation, level selection, contextual notes, and final localized text separate. This makes it easier to refine real-world judgments about visibility, reduction, mediation, and shared spotlight without rewriting the whole section.

Public-projection reading prose should likewise build a small model for MC, 10th sign, ruler, ruler house, and planets in the 10th before composing intro, MC, ruler, and 10th-house fragments.

Planetary relation judgments should build one reusable relation context for target, actor, role, aspect, superiority, reception, raw intensity, and regulated intensity. Visible judgment prose and technical relation item lists should consume that same context instead of recalculating relation geometry separately.

Configuration readings should turn relation contexts directly into prose and should split conclusion profile from conclusion text.

Primary relation targets and actors should be shared by configuration and reception-evidence helpers. Reception evidence should filter relation contexts with reception rather than doing its own sign-aspect and reception calculations.

Reception notes should keep channel noun, caution, and role-specific prose in separate helpers so reception strength changes do not require rewriting the final relationship sentence.

Lot testimony should build item models before prose. Keep lot testimony geometry, reception, raw/regulating intensity, and final item text in separate helpers so Fortune/Spirit evidence can be expanded without rebuilding every audit row.

Lot condition readings should build a profile for lord placement, lot place tone, support testimony, pressure testimony, and solar concern before composing the visible sentence fragments.

Topic scoring should keep score-row setup, score mutation, accumulator creation, testimony families, and final sorting in helpers. New scoring rules should avoid reimplementing the house row shape or direct mutation details inline.

For chart rendering, keep frame setup, panel rendering, and completion side effects separate: the shell prepares title/meta/wheel, the panel renderer owns panel order, and the completion step handles capitalization, scrolling, and chart-rendered events through injectable ports. The chart panel order should live as renderer data so it can be tested or overridden without editing the panel loop. Persisting the last rendered chart should happen through a writer helper in the render-content step.

The chart frame itself should use a small model for title, metadata, and wheel HTML before touching DOM nodes. This keeps shell rendering consistent with panel rendering. Final text and HTML writes should go through the shared DOM writer helpers.

Interpretation rendering should keep the reading use case, HTML composition, and DOM write behind explicit render ports. `renderInterpretation()` should coordinate those dependencies rather than calling interpretation logic and writing `innerHTML` in the same block.

Where a renderer needs calculated or audited data, prefer a small view model builder before HTML generation. For example, the main lots audit should build each lot row and its fields first, then render that model. Boundary audits should translate neutral warning codes into labeled fields before the renderer writes definition-list markup. Score breakdowns should likewise group and label score data before rendering HTML. Historical example cards should prepare natal-source, audit-status, localized label, and group data before the card renderer writes markup. This keeps testimony extraction and provenance handling separate from HTML details.

Main lot audit rows should group position, lord administration, and benefic/malefic testimony fields in dedicated helpers before composing the final row model.

Boundary warning calculation should stay split by testimony family. Sect, Ascendant sign, MC/IC sign, lot sign, and Egyptian-bound proximity warnings should live in dedicated detector helpers, with `boundaryWarnings()` only concatenating their neutral notices. Each warning family should build a boundary model before converting it into a neutral notice.

Historical example loading should also keep responsibilities apart: update selection/audit state, build form-field values, apply those values to the DOM, then calculate the chart. Do not hide all of that work inside one click handler. Historical person cards should keep header/link, natal data list, audit badge, and action rendering in focused subrenderers.

Sect-sensitive alternate lot displays should follow the same model-first rule. Build current/alternate role text and Fortune/Spirit snapshots first, then render the disclosure block.

Large panel renderers should be decomposed into subrenderers for their stable regions. The interpretation panel is the reference pattern: heading, lead, summary, hierarchy, reading blocks, evidence, and timing note are separate rendering functions.

Within the interpretation renderer, summary badges, focus lists, and each evidence subsection should remain separate subrenderers rather than inline HTML inside the parent section.

Top chart panels should also prefer view models where labels and values are prepared before rendering. The core summary, angle panel, Ascendant lord panel, Moon panel, and technical notes panel should stay as small model builders plus focused renderers rather than large mixed UI functions. Technical notes should keep astronomy metrics and judgment/settings metrics in separate helper builders. Final panel assignment should use the shared HTML writer, not ad hoc `innerHTML` calls.

Table panels should keep row construction separate from final DOM assignment. Use dedicated table models, plus header/row builders for planet, house, lot, and aspect tables, so calculation changes and markup changes remain independent. When a table can split into sections, such as traditional and modern planets, build a section model before rendering.

Aspect tables should keep planet-key selection, display-mode selection, pair analysis, and sign/degree row construction in separate helpers.

Aspect geometry lookup tables should also live as constants: sign-aspect distance maps, degree-aspect targets, and lunar within-orb exact angles should not be recreated inside calculation helpers.

SVG renderers should follow the same rule. The chart wheel should build a geometry/parts model for houses, angles, aspects, and planets before composing the final SVG shell.

UI event binding should stay grouped by responsibility. Keep preference toggles, historical-people modal behavior, floating popovers, birthplace search, and form/options submission in separate binding functions, with `bindEvents()` acting only as an orchestration point.

Within each binding group, prefer named handlers for non-trivial behavior. Tab activation, preference toggles, modal clicks, popover document interactions, birthplace keyboard navigation, clearing place fields, date/time changes, and chart-form submission should live in named functions so event binding remains easy to scan. Avoid inline event lambdas when a behavior is reused or has branching logic.

Historical-people modal open/close should route render, modal visibility, body class, person-data popover closing, and focus restoration through ports. The modal binder should only attach events; it should not absorb modal state rules.

Language switching should separate document metadata, static node translation, localized control labels, and dynamic content refresh. `applyI18n()` should coordinate those steps and then redecorate glossary triggers after translated content is in place. Localized control labels should be split by UI responsibility: shell landmarks, preference toggles, historical-people controls, and birthplace controls. Dynamic refresh should keep place-state refresh, historical example rendering, last-chart rerendering, and option-warning refresh as separate steps. Place-state and last-chart rerendering should use refresh ports; last-chart rerendering must not call the full chart completion path, so language changes do not trigger chart scroll or chart-rendered events.

Preference state should enter through a small initializer rather than direct `localStorage` reads inside the global state literal. Preference toggles should separate next-state selection, state write, persistence, and view application. Keep language/theme storage and render application behind small ports so preference handlers remain event adapters rather than business logic. Static translation, preference labels, and option warnings should write text or HTML through the shared DOM helpers.

Floating popovers should resolve a small model before writing DOM. Glossary entries, person-data details, and similar overlays should keep lookup/formatting separate from the code that opens and positions the popover; historical source popovers should expose that split through dedicated model and render helpers. Opening/closing popovers should route render, focus-return, animation-frame positioning, and popover lookup through ports rather than mutating focus state inline. Final title/body writes should use the shared text and HTML writer helpers.

Glossary text lookup should use a static matcher table and a small lookup function. Do not rebuild matcher arrays inside render paths.

Search/autocomplete surfaces should keep URL construction, response parsing, result merging, row-model preparation, and DOM writes separate. Birthplace suggestions should build row models with localized labels and metadata, then render those rows through dedicated suggestion renderers and shared DOM writer helpers. The birthplace search use case should receive its transport, abort controller lifecycle, timer scheduling, fallback lookup, translation labels, merge strategy, and renderer through a small ports object so external geocoding remains an adapter, not core UI logic. Keep suggestion-list replacement and active-index reset in one state helper, keep active-index navigation math separate from state writes, and route Enter-key suggestion selection through ports.

Birthplace selection should also keep field modeling separate from DOM mutation. Build the place/coordinate/time-zone field model and calculate automatic UTC-offset updates through helper functions before applying the result to form controls. Field-to-city refresh should read field state, resolve the city, compare the active key, and apply or clear through ports. Suggestion selection should read the selected suggestion, clear historical context, apply the city, hide suggestions, and blur through ports. Clearing the birthplace should separate field-value clearing from historical-selection reset, selected-city reset, suggestion hiding, and focus. Keep selected-city and active-city-key mutation in one helper so manual input, suggestion selection, localized refresh, and historical examples stay consistent.

Historical-person selection should keep selected-person metadata in a small helper layer. Clearing a manual edit and loading an archived figure should both pass through the same metadata applier instead of writing audit, time-confidence, and zone-source fields independently. Loading an archived figure should be a use case with ports for lookup, selected state, field model/application, place UI cleanup, modal closing, and chart calculation.

Historical data popovers should carry row/link data in their model, not pre-rendered row HTML. Render anchor tags only in the popover renderer.

Form input reading should normalize coherent groups before chart calculation. Keep birth fields, selected-person context, place/zone fields, and technique/options fields in dedicated readers, with `readInput()` acting as the single chart-input assembler. Place input reading should separate raw DOM field reads, city fallback coordinates, and zone-reliability selection. Technique input reading should separate raw option fields, selected lot collection, and normalized rules such as mixed mode forcing modern planets.

Inline option warnings should read form state, resolve localized warning text, build a small visibility/text model, and then apply it to DOM nodes through a dedicated model applier. Keep those dependencies behind ports so option state rules stay testable without depending on translated prose or event objects.

Form event binding should group listeners by intent. Birth-data changes, option-warning refreshes, and submit handling should stay in dedicated binding helpers so adding a new field does not make the main form binder absorb unrelated rules.

Chart submit handling should coordinate calculation and error reporting through ports. Keep message extraction, warning render, and error event dispatch injectable so the submit handler is not tied to one DOM surface or test harness.

Application startup should be a composition root. `init()` should receive startup ports for list population, theme/i18n application, binding, regression API installation, and readiness marking, while preserving the explicit startup order.

Table renderers should build table models first and share generic empty-note/table-note HTML helpers. Individual domain renderers should decide rows and explanatory notes, not repeat paragraph wrappers, fallback table markup, or final panel HTML assignment.

Metric panels should share the same heading-and-grid renderer once a panel has a `{ title, titleGlossary, metrics }` model. Domain panels may append notes or audits after that shared metric block.

Panel view models should not store pre-rendered HTML when a nested model is enough. For example, the core sect summary should carry the alternate-sect lot model and let the renderer turn it into markup.

Lot pressure audit fields should carry structured pressure parts rather than pre-rendered list HTML. Render the `<ul>` only from the audit-field renderer.

The chart frame should carry the wheel model, not a pre-rendered SVG string. Keep `renderWheel(chart)` as a compatibility wrapper when tests need direct SVG output, but frame rendering should call `renderWheelModel(model.wheel)`.

Technical panel rendering should keep notes and metric sections in dedicated helpers. The panel renderer should compose the model, not duplicate section wrappers for astronomy and judgment details.

Chart render completion should keep final text cleanup, viewport scrolling, and rendered-event dispatch in named helpers. Preserve their order, but avoid hiding all post-render side effects in one mixed block.

Chart content rendering should be callable without completion side effects. Use full `renderChart()` for a new calculation, and content-only rendering plus text cleanup for language/theme refresh paths that should not scroll the viewport or emit calculation events.

Chart submission errors should pass through a small error flow: derive a display message, render it, then dispatch the regression-friendly error event. Keep that out of the form submit catch block.

Regression-only APIs should be built through dedicated helpers. Keep the default regression input and the exposed `window.TycheTest` helper map separate from the installer that checks `?test=regression`, and group exposed helpers by calculation, historical data, lots/sect, rendering, and judgment responsibilities. The default regression input should mirror production input assembly by composing birth, place, and technique defaults.

Locale-sensitive formatting should use shared locale helpers. Capitalization, lowercasing, sorting, and date formatting should call `activeLocale()` or `activeSortLocale()` instead of repeating language ternaries.

When extracting architecture, keep changes incremental and covered by static contracts. Do not add a module loader, bundler, framework, backend, or runtime dependency unless the project deliberately changes its static-app constraint.

## Astronomical Precision

The browser engine uses vendored Astronomy Engine 2.1.19 for Sun, Moon, and planetary positions. It is MIT-licensed, runs locally in the browser, and declares approximate +/-1 arcminute accuracy. This is a major improvement over the previous compact orbital fallback, but still not a replacement for professional ephemerides in critical work.

`app.js` keeps the older compact formulas as a fallback in case the local vendor file fails to load. Normal production calculations should use Astronomy Engine.

The ephemeris-engine label should be set through a small writer helper rather than direct state mutation inside calculation branches. This keeps fallback reporting testable and avoids scattering calculation-engine state writes.

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
