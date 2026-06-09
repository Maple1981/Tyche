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

## Historical Examples

The historical figure modal should only include public figures whose birth date, clock time, birthplace, and sex are documented with enough precision for an example chart.

When using rated birth-data collections, prefer AA/A/B-level records. Leave out C, DD, X, rectified, speculative, or time-unknown records unless the user explicitly approves them.

Prefer Gregorian examples from periods and jurisdictions after calendar reform. If a future example uses a Julian-calendar birth date, the entry must store that calendar explicitly and its visible label must make the calendar clear. Do not silently convert between Julian and Gregorian dates.

Each historical example should carry coordinates and a deliberate time offset or IANA time zone so selecting it produces a reproducible chart.
