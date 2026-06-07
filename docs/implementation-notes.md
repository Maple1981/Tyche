# Implementation Notes

## Static Architecture

The project is intentionally small:

- `index.html` for structure.
- `styles.css` for responsive visual design.
- `app.js` for calculations, translations, rendering, and UI state.
- `assets/fonts` for local font files.
- `docs` for synthesized domain notes.

No backend, bundler, package manager, or build pipeline is required.

## Astronomical Precision

The browser engine uses compact approximate formulas so it can run offline. This is enough for a learning and exploratory chart tool, but not a replacement for professional ephemerides. The UI should disclose this near the results.

Risk areas:

- Moon position can drift more than slow planets.
- Ancient dates and calendar conversions are not fully supported.
- Time zone accuracy depends on browser IANA data or manual offset.
- Place lookup is limited to the embedded gazetteer unless coordinates are entered manually.

## Supported Defaults

Defaults should remain:

- Tropical zodiac.
- Whole Sign Houses.
- Sign-based aspects.
- Seven visible planets.
- Egyptian bounds.
- Strict Hellenistic mode.

## Privacy

The app does not send birth data anywhere. All calculations are in the browser.

No personal examples, private data, source attachments, OCR dumps, or spreadsheets should be committed.

## Historical Examples

The historical figure modal should only include public figures whose birth date, clock time, birthplace, and sex are documented with enough precision for an example chart.

When using rated birth-data collections, prefer AA/A/B-level records. Leave out C, DD, X, rectified, speculative, or time-unknown records unless the user explicitly approves them.

Prefer Gregorian examples from periods and jurisdictions after calendar reform. If a future example uses a Julian-calendar birth date, the entry must store that calendar explicitly and its visible label must make the calendar clear. Do not silently convert between Julian and Gregorian dates.

Each historical example should carry coordinates and a deliberate time offset or IANA time zone so selecting it produces a reproducible chart.
