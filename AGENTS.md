# Tyche Agent Notes

## Project Scope

Tyche is a static, frontend-only web application for strict Hellenistic natal chart work. Keep it pure `html + css + js` with no backend, no build step, and no copied source attachments.

The default practice model is traditional:

- Tropical zodiac by default.
- Whole Sign Houses by default.
- Seven visible planets as the base set: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
- Modern planets may be displayed only as optional mixed-mode additions.
- Traditional domicile rulers only: Aries/Scorpio Mars, Taurus/Libra Venus, Gemini/Virgo Mercury, Cancer Moon, Leo Sun, Sagittarius/Pisces Jupiter, Capricorn/Aquarius Saturn.
- The Hour-Marker/Ascendant and its domicile lord are central. Always surface the house and condition of the Ascendant ruler prominently.

## Calculation Priorities

Core derived data:

- Ascendant/Hour-Marker, MC, IC, Descendant.
- Whole sign houses from the rising sign.
- MC/IC sign and their whole sign house.
- Sect by solar altitude: diurnal if the Sun is above the horizon, nocturnal if below.
- Benefic/malefic of the sect: Jupiter/Saturn for day, Venus/Mars for night.
- Also show the malefic contrary to sect: Mars in day charts and Saturn in night charts.
- Essential condition: domicile, exaltation, triplicity, Egyptian bounds, decans, detriment, fall.
- Angularity by whole sign: angular 1/4/7/10, succedent 2/5/8/11, cadent 3/6/9/12.
- Lots: Fortune, Spirit, Eros, Necessity, Courage, Victory, Nemesis.
- Solar phase states: morning/evening, under beams, combustion, cazimi.
- Lunar condition: synodic phase, last separation, next application, Hellenistic 30-degree void-of-course, and a separate no-application-within-orb indicator.
- Also show whether the Moon perfects a major contact before leaving its current sign, separately from the Hellenistic 30-degree void-of-course rule.
- Superior/right-sided configurations must preserve direction: who overcomes whom matters for judgment.
- Triplicity dignities should be labeled by role when shown: active by sect, out of sect, or cooperating.
- Bounds and decans should distinguish own minor dignity from another planet's administration of the degree.

This app uses vendored Astronomy Engine for browser-side ephemerides, with the older compact formulas kept only as fallback. Make the approximate +/-1 arcminute limitation visible in the UI and documentation; do not present the results as professional ephemeris-grade.

## Interpretive Guardrails

PDF-derived doctrine in `docs/*.md` is the primary source layer. Public podcast/transcript synthesis is secondary: use it to refine reading order, weighting, wording, and future-module planning, but do not let it override the primary PDF synthesis when the two conflict.

Avoid modern conflations:

- Do not equate Aries with the first house, Taurus with the second, etc.
- Do not make Uranus, Neptune, or Pluto part of the strict base reading.
- Do not use modern sign rulers.
- Do not make psychological sun-sign text the center of the reading.

Preferred reading order:

1. Determine sect.
2. Inspect the Hour-Marker and domicile lord of the Hour-Marker.
3. Inspect angularity and condition of the seven visible planets.
4. Inspect benefic and malefic of sect by house and relation.
5. Inspect Fortune, Spirit, their rulers, and derived context.
6. Use triplicity rulers of the sect light for broad support/stability.

Interpretation output:

- Generate judgments from accumulated testimonies, not isolated planet-in-sign keywords.
- In the visible interpretation panel, use plain language first and keep technical vocabulary in the evidence/glossary layer.
- Show the three strongest topical focuses when possible instead of forcing the whole chart into one dominant house.
- Use `Lugares/Casas` or `Lugar/Casa` in UI labels when space allows, so the traditional term remains visible.
- Do not remove difficult traditional topics from technical surfaces; contextualize them in the reading instead of censoring words such as illness, death, enemies, or loss.
- Keep natal interpretation separate from prediction/timing unless a timing technique module supplies activated houses, planets, or periods.
- Show the technical evidence behind the reading so the user can see why Tyche reached that judgment.
- Treat angularity as prominence, not automatic ease or benefit.
- Use cautious educational language: describe tendencies, pressures, supports, and dominant topics; do not state fatalistic certainties.
- Keep `docs/judgment-matrix.md` aligned with the interpretation code. Solar phase, configurations, lot lords, lunar condition, and triplicity rulers should enter the judgment when their underlying data is calculated.
- Evidence should include both lunar void-of-course criteria when both are calculated.
- Do not score active triplicity as equivalent to domicile or exaltation. It is real support, but major essential strength should remain domicile/exaltation.
- Do not count every bound/decan label as minor dignity. Only own bound or own decan is minor dignity for the planet; another planet ruling the bound/decan is degree administration and should not automatically improve ease or mitigation.
- Label broad reception by dignity by strength: domicile/exaltation strong, bound or active triplicity medium, out-of-sect/cooperating triplicity weak.
- Label mutual reception when both planets receive one another; grade it by the dignity actually involved and treat it as reciprocal channel, not as automatic cancellation of pressure.

## UI Direction

The interface should feel mobile-first, calm, scholarly, and usable:

- White or pearl-gray background in day mode.
- Deep blue Greek-key/frieze ornamentation.
- Serif display/body type with a readable Google Font stored locally.
- Standard zodiac and planetary glyphs.
- Day/night theme toggle.
- English/Spanish language toggle.
- Visible limits section in the calculated chart, covering educational scope, approximate precision, angle sensitivity, and external services used for place search/images.
- First-screen form fields: birth date, birth time, birthplace, and advanced options button.
- Advanced options: optional sex metadata, zodiac, house system, orb, lots, terms system, modern planets, strict vs mixed mode.

## Repository Hygiene

- Keep all synthesized doctrine in `docs/*.md`.
- Do not add source PDFs, spreadsheets, extracts, OCR dumps, or attachment-derived scratch files to the repository.
- Do not include personal chart examples or personal data in docs.
- Do not mention external source names in doctrine notes, except for explicitly requested technical dependency documentation, licenses, and footer attributions.
- Podcast/transcript material may be used only as paraphrased synthesis and source URLs. Never commit transcript dumps, long verbatim excerpts, OCR, or attachment-derived scratch files.
- Keep the public transcript source map in `docs/public-transcript-synthesis.md`, and treat the priority episode list there as the first review layer for interpretation changes.
- Hard rule: do not run `git push`, publish, deploy, or update GitHub Pages unless the user explicitly asks for that exact action in the current turn.

## Historical Examples

- Use only public historical figures with a documented exact date, clock time, birthplace, and sex.
- When using rated birth-data collections, prefer AA/A/B-level records and leave out C, DD, X, rectified, speculative, or time-unknown records unless the user explicitly approves them.
- Prefer post-calendar-reform Gregorian examples. If adding a figure from a place or period using the Julian calendar, encode the calendar explicitly and make the display label unambiguous; never silently convert or mix Julian and Gregorian dates.
- Historical example places should include coordinates and a deliberate time offset or IANA zone so charts do not depend on browser guesses.
- Show source/rating metadata for historical examples when it has been audited. Never invent Rodden ratings or exact time-source notes.
- Keep the natal-data source separate from any note that a chart was discussed in a secondary interpretive source. Do not imply that an example discussion is the source of the birth time unless verified.
